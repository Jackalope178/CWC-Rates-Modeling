import React, { useState, useMemo, useCallback } from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine, Cell
} from 'recharts';

// ─── DESIGN TOKENS ───
const BLUE    = '#1d4ed8';
const TEAL    = '#0891b2';
const PURPLE  = '#7c3aed';
const GREEN   = '#16a34a';
const RED     = '#ef4444';
const ORANGE  = '#f97316';
const AMBER   = '#f59e0b';
const GRAY50  = '#f9fafb';
const GRAY100 = '#f3f4f6';
const GRAY200 = '#e5e7eb';
const GRAY400 = '#9ca3af';
const GRAY500 = '#6b7280';
const GRAY700 = '#374151';
const GRAY900 = '#111827';

// ─── LICENSE TIERS ───
const TIERS = [
  { label: '1 instructor',   instructors: 1,  fee: 4050  },
  { label: '2 instructors',  instructors: 2,  fee: 6800  },
  { label: '3 instructors',  instructors: 3,  fee: 9000  },
  { label: '4 instructors',  instructors: 4,  fee: 11310 },
  { label: '5 instructors',  instructors: 5,  fee: 13120 },
  { label: '6 instructors',  instructors: 6,  fee: 14940 },
  { label: '10 instructors', instructors: 10, fee: 22750 },
];

// ─── DEFAULTS ───
const defaults = {
  partnerCounts: [5, 0, 0, 0, 0, 0, 0],
  tierFees: [4050, 6800, 9000, 11310, 13120, 14940, 22750],
  costStaff: 20000,
  costLMS: 600,
  costAccreditation: 3000,
  costSystems: 500,
  costOverhead: 2500,
  costPerIPP: 400,
  costPerCohort: 300,
  costPerCert: 10,
  costSalesOutreach: 2000,
  costOnboarding: 500,
  costQACompliance: 1500,
  costSysMaintenance: 1000,
  feeIPP: 2000,
  feeCohort: 350,
  feeCertOverage: 50,
  feeGrant: 0,
  newIPPInstructors: 5,
  pctIPPtoLicense: 60,
  pctLicenseToActive: 75,
  cohortsPerOrg: 1,
  avgParticipants: 12,
  renewalRate: 85,
  dormantRate: 15,
  pilotFee: 2000,
  pilotFullFee: 4050,
  pilotDuration: 1,
  pilotPartners: 3,
  pilotConvertPct: 70,
  consortiumFee: 9000,
  consortiumPartners: 3,
  consortiumCohorts: 1,
  consortiumNewPct: 50,
  sponsoredFee: 0,
  sponsoredListPrice: 4050,
  sponsoredPartners: 2,
  sponsoredGrant: 0,
  sponsoredFunderName: 'Funder',

  // Shared pipeline & retention used by all scenario models (independent of current view)
  model_newIPPInstructors: 5,
  model_feeIPP: 2000,
  model_pctIPPtoLicense: 60,
  model_pctLicenseToActive: 75,
  model_cohortsPerOrg: 1,
  model_avgParticipants: 12,
  model_renewalRate: 85,
  model_dormantRate: 15,
};

// ─── FORMATTERS ───
const fmt = (n) => {
  if (n == null || isNaN(n)) return '$0';
  const abs = Math.abs(Math.round(n));
  const formatted = abs.toLocaleString('en-US');
  return n < 0 ? `-$${formatted}` : `$${formatted}`;
};
const pct = (n) => {
  if (n == null || isNaN(n)) return '0.0%';
  return `${(n * 100).toFixed(1)}%`;
};

// ─── REUSABLE COMPONENTS ───
const SliderField = ({ label, value, min, max, step, onChange, prefix, note, unit }) => {
  const [localVal, setLocalVal] = React.useState(String(value));
  React.useEffect(() => { setLocalVal(String(value)); }, [value]);

  const handleSlider = (e) => onChange(Number(e.target.value));
  const handleInput = (e) => setLocalVal(e.target.value);
  const handleBlur = () => {
    let v = Number(localVal);
    if (isNaN(v)) v = min;
    v = Math.max(min, Math.min(max, v));
    setLocalVal(String(v));
    onChange(v);
  };

  const display = prefix === '$' ? fmt(value) : unit ? `${value}${unit}` : value;

  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: GRAY700 }}>{label}</label>
        <span style={{ fontSize: 16, fontWeight: 700, color: GRAY900 }}>{display}</span>
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          type="range"
          min={min}
          max={max}
          step={step || 1}
          value={value}
          onChange={handleSlider}
          style={{ flex: 1 }}
        />
        <input
          type="number"
          value={localVal}
          onChange={handleInput}
          onBlur={handleBlur}
          style={{
            width: 80,
            padding: '4px 8px',
            border: `1px solid ${GRAY200}`,
            borderRadius: 6,
            fontSize: 13,
            textAlign: 'right',
          }}
        />
      </div>
      {note && <div style={{ fontSize: 11, color: GRAY500, fontStyle: 'italic', marginTop: 2 }}>{note}</div>}
    </div>
  );
};

const StatCard = ({ label, value, sub, color, highlight }) => (
  <div style={{
    flex: '1 1 180px',
    background: highlight
      ? (color === RED ? '#fef2f2' : '#eff6ff')
      : 'white',
    border: `1.5px solid ${GRAY200}`,
    borderRadius: 10,
    padding: '14px 16px',
    minWidth: 160,
  }}>
    <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: GRAY500, marginBottom: 4 }}>
      {label}
    </div>
    <div style={{ fontSize: 24, fontWeight: 700, color: color || GRAY900 }}>
      {value}
    </div>
    {sub && <div style={{ fontSize: 12, color: GRAY500, marginTop: 2 }}>{sub}</div>}
  </div>
);

const SectionDivider = ({ label }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0 16px' }}>
    <div style={{ height: 1, flex: 1, background: GRAY200 }} />
    <span style={{ fontSize: 14, fontWeight: 700, color: GRAY900, whiteSpace: 'nowrap' }}>{label}</span>
    <div style={{ height: 1, flex: 1, background: GRAY200 }} />
  </div>
);

const Badge = ({ type }) => {
  const colors = { INPUT: BLUE, ASSUMPTION: AMBER, OUTPUT: GREEN };
  return (
    <span style={{
      display: 'inline-block',
      fontSize: 10,
      fontWeight: 700,
      padding: '2px 6px',
      borderRadius: 4,
      color: 'white',
      background: colors[type] || GRAY500,
      textTransform: 'uppercase',
      letterSpacing: '0.03em',
    }}>
      {type}
    </span>
  );
};

const Card = ({ children, style }) => (
  <div style={{
    background: 'white',
    border: `1.5px solid ${GRAY200}`,
    borderRadius: 10,
    padding: '16px 20px',
    ...style,
  }}>
    {children}
  </div>
);

const NumberField = ({ label, value, onChange, min, max, step = 1, prefix, unit }) => {
  const [local, setLocal] = React.useState(String(value));
  React.useEffect(() => { setLocal(String(value)); }, [value]);

  const handleBlur = () => {
    let v = Number(local);
    if (isNaN(v)) v = min ?? 0;
    if (min != null) v = Math.max(min, v);
    if (max != null) v = Math.min(max, v);
    setLocal(String(v));
    onChange(v);
  };

  return (
    <div>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: GRAY700, marginBottom: 4 }}>{label}</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, border: `1px solid ${GRAY200}`, borderRadius: 8, padding: '6px 10px', background: 'white' }}>
        {prefix && <span style={{ fontSize: 14, color: GRAY500 }}>{prefix}</span>}
        <input
          type="number"
          value={local}
          step={step}
          onChange={e => setLocal(e.target.value)}
          onBlur={handleBlur}
          style={{ flex: 1, border: 'none', outline: 'none', fontSize: 16, fontWeight: 700, color: GRAY900, textAlign: 'right', background: 'transparent', width: '100%' }}
        />
        {unit && <span style={{ fontSize: 14, color: GRAY500 }}>{unit}</span>}
      </div>
    </div>
  );
};

const ModelPipelineRetentionCard = ({ state, set }) => {
  const totalPartners = state.partnerCounts.reduce((a, b) => a + b, 0);
  const effectivePartners = totalPartners * (state.model_renewalRate / 100) * (1 - state.model_dormantRate / 100);
  const activeOrgs = effectivePartners * (state.model_pctLicenseToActive / 100);
  const cohortsPerYr = activeOrgs * state.model_cohortsPerOrg;
  const ippRev = state.model_newIPPInstructors * state.model_feeIPP;

  return (
    <Card style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: GRAY900, marginBottom: 14 }}>Pipeline & Retention</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
        <NumberField label="New IPP instructors/yr" value={state.model_newIPPInstructors} min={0} max={100} onChange={v => set('model_newIPPInstructors', v)} />
        <NumberField label="IPP fee" value={state.model_feeIPP} min={0} max={10000} step={100} prefix="$" onChange={v => set('model_feeIPP', v)} />
        <NumberField label="% IPP to licensed" value={state.model_pctIPPtoLicense} min={0} max={100} unit="%" onChange={v => set('model_pctIPPtoLicense', v)} />
        <NumberField label="% running cohorts" value={state.model_pctLicenseToActive} min={0} max={100} unit="%" onChange={v => set('model_pctLicenseToActive', v)} />
        <NumberField label="Cohorts per org/yr" value={state.model_cohortsPerOrg} min={0} max={10} step={0.25} onChange={v => set('model_cohortsPerOrg', v)} />
        <NumberField label="Avg participants" value={state.model_avgParticipants} min={1} max={15} onChange={v => set('model_avgParticipants', v)} />
        <NumberField label="Renewal rate" value={state.model_renewalRate} min={0} max={100} unit="%" onChange={v => set('model_renewalRate', v)} />
        <NumberField label="Dormant rate" value={state.model_dormantRate} min={0} max={100} unit="%" onChange={v => set('model_dormantRate', v)} />
      </div>
      <div style={{ display: 'flex', gap: 32, paddingTop: 12, borderTop: `1px solid ${GRAY200}` }}>
        <div>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: GRAY500 }}>IPP Revenue</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: GREEN }}>{fmt(ippRev)}</div>
          <div style={{ fontSize: 11, color: GRAY500 }}>{state.model_newIPPInstructors} instructors × {fmt(state.model_feeIPP)}</div>
        </div>
        <div>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: GRAY500 }}>Cohorts/Yr</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: BLUE }}>{cohortsPerYr.toFixed(1)}</div>
          <div style={{ fontSize: 11, color: GRAY500 }}>{activeOrgs.toFixed(1)} active orgs × {state.model_cohortsPerOrg}</div>
        </div>
      </div>
    </Card>
  );
};

// ─── CORE CALC HELPER (used by main view + scenario panels with their own pipeline/retention) ───
const computeCalc = (state, overrides = {}) => {
  const s = state;
  const p = {
    newIPPInstructors: s.newIPPInstructors,
    pctIPPtoLicense: s.pctIPPtoLicense,
    pctLicenseToActive: s.pctLicenseToActive,
    cohortsPerOrg: s.cohortsPerOrg,
    avgParticipants: s.avgParticipants,
    renewalRate: s.renewalRate,
    dormantRate: s.dormantRate,
    feeIPP: s.feeIPP,
    ...overrides,
  };

  const fixedTotal = s.costStaff + s.costLMS + s.costAccreditation + s.costSystems + s.costOverhead;
  const newPartners = Math.round(p.newIPPInstructors * (p.pctIPPtoLicense / 100));
  const hiddenTotal = s.costSalesOutreach + (s.costOnboarding * newPartners) + s.costQACompliance + s.costSysMaintenance;

  const totalPartners = s.partnerCounts.reduce((a, b) => a + b, 0);
  const totalInstructors = s.partnerCounts.reduce((sum, c, i) => sum + c * TIERS[i].instructors, 0);
  const licenseRevenue = s.partnerCounts.reduce((sum, c, i) => sum + c * s.tierFees[i], 0);
  const effectivePartners = totalPartners * (p.renewalRate / 100) * (1 - p.dormantRate / 100);

  const newLicensedOrgs = p.newIPPInstructors * (p.pctIPPtoLicense / 100);
  const activeCohortOrgs = effectivePartners * (p.pctLicenseToActive / 100);
  const totalCohorts = activeCohortOrgs * p.cohortsPerOrg;
  const totalParticipants = totalCohorts * p.avgParticipants;
  const certsIncluded = totalPartners * 15;
  const certsIssued = totalParticipants;
  const certOverages = Math.max(0, certsIssued - certsIncluded);

  const ippRevenue = p.newIPPInstructors * p.feeIPP;
  const cohortRevenue = totalCohorts * s.feeCohort;
  const certOverageRev = certOverages * s.feeCertOverage;
  const grantRevenue = s.feeGrant;
  const totalRevenue = licenseRevenue + ippRevenue + cohortRevenue + certOverageRev + grantRevenue;

  const ippCostTotal = p.newIPPInstructors * s.costPerIPP;
  const cohortCostTotal = totalCohorts * s.costPerCohort;
  const certCostTotal = certsIssued * s.costPerCert;
  const totalCost = fixedTotal + hiddenTotal + ippCostTotal + cohortCostTotal + certCostTotal;

  const netMargin = totalRevenue - totalCost;
  const marginPct = totalRevenue > 0 ? netMargin / totalRevenue : -1;

  const recurringRevenue = licenseRevenue + cohortRevenue;
  const stabilityScore = totalRevenue > 0 ? recurringRevenue / totalRevenue : 0;

  const netPerPartner = s.tierFees[0]
    + TIERS[0].instructors * (p.newIPPInstructors / Math.max(totalPartners, 1)) * p.feeIPP
    - p.cohortsPerOrg * (p.pctLicenseToActive / 100) * s.feeCohort
    - p.cohortsPerOrg * (p.pctLicenseToActive / 100) * s.costPerCohort
    - TIERS[0].instructors * (p.newIPPInstructors / Math.max(totalPartners, 1)) * s.costPerIPP;
  const breakEvenPartners = netPerPartner > 0
    ? Math.ceil((fixedTotal + hiddenTotal) / netPerPartner)
    : null;

  return {
    fixedTotal, hiddenTotal, newPartners,
    totalPartners, totalInstructors, licenseRevenue, effectivePartners,
    newLicensedOrgs, activeCohortOrgs, totalCohorts, totalParticipants,
    certsIncluded, certsIssued, certOverages,
    ippRevenue, cohortRevenue, certOverageRev, grantRevenue, totalRevenue,
    ippCostTotal, cohortCostTotal, certCostTotal, totalCost,
    netMargin, marginPct, recurringRevenue, stabilityScore,
    netPerPartner, breakEvenPartners,
  };
};

// Shared pipeline/retention overrides used by all scenario models
const modelOverrides = (state) => ({
  newIPPInstructors: state.model_newIPPInstructors,
  feeIPP: state.model_feeIPP,
  pctIPPtoLicense: state.model_pctIPPtoLicense,
  pctLicenseToActive: state.model_pctLicenseToActive,
  cohortsPerOrg: state.model_cohortsPerOrg,
  avgParticipants: state.model_avgParticipants,
  renewalRate: state.model_renewalRate,
  dormantRate: state.model_dormantRate,
});

// ─── TABS ───
const TABS = ['Scenarios', 'Overview', 'Partners', 'Pipeline', 'Costs', 'Variable Map', 'Sensitivity'];

// ─── MAIN APP ───
export default function App() {
  const [state, setState] = useState({ ...defaults });
  const [activeTab, setActiveTab] = useState('Scenarios');
  const [scenarioMode, setScenarioMode] = useState('pilot');
  const [editTierFees, setEditTierFees] = useState(false);
  const [bothWorldsLens, setBothWorldsLens] = useState(false);
  const [showFormulas, setShowFormulas] = useState(false);
  const [sensitivityOverlay, setSensitivityOverlay] = useState('None');
  const [sensitivityLens, setSensitivityLens] = useState(false);

  const set = useCallback((key, val) => {
    setState(prev => ({ ...prev, [key]: val }));
  }, []);

  const setPartnerCount = useCallback((idx, val) => {
    setState(prev => {
      const next = [...prev.partnerCounts];
      next[idx] = val;
      return { ...prev, partnerCounts: next };
    });
  }, []);

  const setTierFee = useCallback((idx, val) => {
    setState(prev => {
      const next = [...prev.tierFees];
      next[idx] = val;
      return { ...prev, tierFees: next };
    });
  }, []);

  const resetFees = useCallback(() => {
    setState(prev => ({ ...prev, tierFees: TIERS.map(t => t.fee) }));
    setEditTierFees(false);
  }, []);

  // ─── CORE CALCULATIONS (current view — uses global pipeline/retention) ───
  const calc = useMemo(() => computeCalc(state), [state]);

  // ─── SENSITIVITY DATA ───
  const sensitivityData = useMemo(() => {
    const s = state;
    const data = [];
    for (let p = 1; p <= 20; p++) {
      const fixedTotal = s.costStaff + s.costLMS + s.costAccreditation + s.costSystems + s.costOverhead;
      const newPartners = Math.round(s.newIPPInstructors * (s.pctIPPtoLicense / 100));
      const hiddenTotal = s.costSalesOutreach + (s.costOnboarding * newPartners) + s.costQACompliance + s.costSysMaintenance;

      const licRev = p * s.tierFees[0];
      const effP = p * (s.renewalRate / 100) * (1 - s.dormantRate / 100);
      const actOrgs = effP * (s.pctLicenseToActive / 100);
      const coh = actOrgs * s.cohortsPerOrg;
      const parts = coh * s.avgParticipants;
      const overages = Math.max(0, parts - p * 15);

      const rev = licRev + s.newIPPInstructors * s.feeIPP + coh * s.feeCohort + overages * s.feeCertOverage + s.feeGrant;
      const cost = fixedTotal + hiddenTotal + s.newIPPInstructors * s.costPerIPP + coh * s.costPerCohort + parts * s.costPerCert;
      const baseline = rev - cost;

      let pilot = baseline;
      if (sensitivityOverlay === 'Pilot') {
        const pilotRev = (p - s.pilotPartners) * s.tierFees[0]
          + Math.min(s.pilotPartners, p) * s.pilotFee
          + s.newIPPInstructors * s.feeIPP + coh * s.feeCohort + overages * s.feeCertOverage + s.feeGrant;
        pilot = pilotRev - cost;
      } else if (sensitivityOverlay === 'Consortium') {
        const consRev = s.consortiumFee + (Math.max(0, p - s.consortiumPartners)) * s.tierFees[0];
        const consFullRev = consRev + s.newIPPInstructors * s.feeIPP + coh * s.feeCohort + overages * s.feeCertOverage + s.feeGrant;
        pilot = consFullRev - cost;
      } else if (sensitivityOverlay === 'Sponsored') {
        const gap = (s.sponsoredListPrice - s.sponsoredFee) * Math.min(s.sponsoredPartners, p);
        pilot = baseline - gap;
      }

      let lens = null;
      if (sensitivityLens) {
        const lensRev = licRev + 0 + coh * 500 + overages * s.feeCertOverage + 0;
        const lensCost = cost;
        lens = lensRev - lensCost;
      }

      const entry = { partners: p, Baseline: baseline };
      if (sensitivityOverlay !== 'None') entry[sensitivityOverlay] = pilot;
      if (sensitivityLens) entry['Membership-Stable'] = lens;
      data.push(entry);
    }
    return data;
  }, [state, sensitivityOverlay, sensitivityLens]);

  // ─── RENDER ───
  return (
    <div style={{ minHeight: '100vh', background: GRAY100, fontFamily: "'Inter', sans-serif" }}>
      {/* HEADER */}
      <div style={{ background: 'white', borderBottom: `1.5px solid ${GRAY200}`, padding: '16px 24px' }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: GRAY900, margin: 0 }}>CWC Fee Strategy Model</h1>
        <p style={{ fontSize: 12, color: GRAY500, margin: '2px 0 0' }}>Internal planning tool — model pricing, costs, and revenue scenarios</p>
      </div>

      {/* STAT CARDS */}
      <div style={{ display: 'flex', gap: 12, padding: '16px 24px', flexWrap: 'wrap', position: 'sticky', top: 0, zIndex: 10, background: GRAY100 }}>
        <StatCard label="Total Revenue" value={fmt(calc.totalRevenue)} sub={`${[calc.licenseRevenue, calc.ippRevenue, calc.cohortRevenue, calc.certOverageRev, calc.grantRevenue].filter(v => v > 0).length} revenue sources`} color={BLUE} />
        <StatCard label="Total Cost" value={fmt(calc.totalCost)} sub={`Fixed ${fmt(calc.fixedTotal)} + Variable ${fmt(calc.totalCost - calc.fixedTotal - calc.hiddenTotal)} + Hidden ${fmt(calc.hiddenTotal)}`} color={RED} />
        <StatCard label="Net Margin" value={fmt(calc.netMargin)} sub={`${pct(calc.marginPct)} margin`} color={calc.netMargin >= 0 ? GREEN : RED} highlight />
        <StatCard label="Break-Even" value={calc.breakEvenPartners != null ? `${calc.breakEvenPartners} partners` : 'N/A'} sub={calc.breakEvenPartners != null ? '1-instructor tier baseline' : 'N/A — check pricing'} color={calc.breakEvenPartners != null ? PURPLE : RED} />
        <StatCard label="Stability Score" value={pct(calc.stabilityScore)} sub="recurring / total revenue" color={TEAL} />
      </div>

      {/* TAB BAR */}
      <div style={{ display: 'flex', gap: 0, background: 'white', borderBottom: `1.5px solid ${GRAY200}`, padding: '0 24px', overflowX: 'auto' }}>
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '12px 18px',
              fontSize: 13,
              fontWeight: 600,
              color: activeTab === tab ? BLUE : GRAY500,
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab ? `2.5px solid ${BLUE}` : '2.5px solid transparent',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              fontFamily: "'Inter', sans-serif",
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* TAB CONTENT */}
      <div style={{ padding: '20px 24px', maxWidth: 1200, margin: '0 auto' }}>
        {activeTab === 'Scenarios' && <ScenariosTab state={state} set={set} scenarioMode={scenarioMode} setScenarioMode={setScenarioMode} />}
        {activeTab === 'Overview' && <OverviewTab state={state} calc={calc} bothWorldsLens={bothWorldsLens} setBothWorldsLens={setBothWorldsLens} />}
        {activeTab === 'Partners' && <PartnersTab state={state} calc={calc} set={set} setPartnerCount={setPartnerCount} setTierFee={setTierFee} editTierFees={editTierFees} setEditTierFees={setEditTierFees} resetFees={resetFees} />}
        {activeTab === 'Pipeline' && <PipelineTab state={state} calc={calc} set={set} />}
        {activeTab === 'Costs' && <CostsTab state={state} calc={calc} set={set} />}
        {activeTab === 'Variable Map' && <VariableMapTab state={state} calc={calc} showFormulas={showFormulas} setShowFormulas={setShowFormulas} />}
        {activeTab === 'Sensitivity' && <SensitivityTab data={sensitivityData} sensitivityOverlay={sensitivityOverlay} setSensitivityOverlay={setSensitivityOverlay} sensitivityLens={sensitivityLens} setSensitivityLens={setSensitivityLens} />}
      </div>

      {/* FOOTER */}
      <div style={{ textAlign: 'center', padding: '24px 0', fontSize: 11, color: GRAY400 }}>
        CWC Fee Strategy Model &middot; 2025 License Rates &middot; Internal Use Only
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// TAB: SCENARIOS
// ═══════════════════════════════════════════════════════
function ScenariosTab({ state, set, scenarioMode, setScenarioMode }) {
  const modes = [
    { key: 'pilot', label: 'Pilot License' },
    { key: 'consortium', label: 'Consortium' },
    { key: 'sponsored', label: 'Sponsored' },
  ];

  return (
    <div>
      <ModelPipelineRetentionCard state={state} set={set} />

      {/* Segmented control */}
      <div style={{ display: 'flex', gap: 0, background: GRAY100, borderRadius: 8, padding: 3, marginBottom: 20, border: `1px solid ${GRAY200}` }}>
        {modes.map(m => (
          <button key={m.key} onClick={() => setScenarioMode(m.key)} style={{
            flex: 1, padding: '10px 16px', fontSize: 13, fontWeight: 600, borderRadius: 6, border: 'none', cursor: 'pointer',
            background: scenarioMode === m.key ? 'white' : 'transparent',
            color: scenarioMode === m.key ? PURPLE : GRAY500,
            boxShadow: scenarioMode === m.key ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            fontFamily: "'Inter', sans-serif",
          }}>{m.label}</button>
        ))}
      </div>

      {scenarioMode === 'pilot' && <PilotPanel state={state} set={set} />}
      {scenarioMode === 'consortium' && <ConsortiumPanel state={state} set={set} />}
      {scenarioMode === 'sponsored' && <SponsoredPanel state={state} set={set} />}
    </div>
  );
}

function PilotPanel({ state, set }) {
  const pcalc = useMemo(() => computeCalc(state, modelOverrides(state)), [state]);

  const pilotYr1Revenue = (pcalc.totalPartners - state.pilotPartners) * state.tierFees[0]
    + state.pilotPartners * state.pilotFee
    + pcalc.ippRevenue + pcalc.cohortRevenue + pcalc.certOverageRev + pcalc.grantRevenue;
  const pilotYr1Margin = pilotYr1Revenue - pcalc.totalCost;
  const pilotYr2Revenue = (pcalc.totalPartners - state.pilotPartners) * state.tierFees[0]
    + state.pilotPartners * (state.pilotConvertPct / 100) * state.pilotFullFee
    + pcalc.ippRevenue + pcalc.cohortRevenue + pcalc.certOverageRev + pcalc.grantRevenue;
  const pilotYr2Margin = pilotYr2Revenue - pcalc.totalCost;
  const pilotDrag = pcalc.totalRevenue - pilotYr1Revenue;

  const convData = useMemo(() => {
    const arr = [];
    for (let c = 0; c <= 100; c += 5) {
      const yr2Rev = (pcalc.totalPartners - state.pilotPartners) * state.tierFees[0]
        + state.pilotPartners * (c / 100) * state.pilotFullFee
        + pcalc.ippRevenue + pcalc.cohortRevenue + pcalc.certOverageRev + pcalc.grantRevenue;
      arr.push({ rate: c, margin: yr2Rev - pcalc.totalCost });
    }
    return arr;
  }, [state, pcalc]);

  return (
    <div>
      <div style={{ background: PURPLE, color: 'white', padding: '12px 16px', borderRadius: '10px 10px 0 0', fontWeight: 700, fontSize: 15 }}>
        Pilot License
        <div style={{ fontSize: 12, fontWeight: 400, opacity: 0.85, marginTop: 2 }}>
          Model year-1 discounted licenses and the revenue drag before partners convert to full rate.
        </div>
      </div>
      <Card style={{ borderRadius: '0 0 10px 10px', borderTop: 'none' }}>
        <SectionDivider label="Inputs" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <SliderField label="Pilot fee ($/yr)" value={state.pilotFee} min={0} max={10000} step={100} onChange={v => set('pilotFee', v)} prefix="$" />
          <SliderField label="Full fee ($/yr)" value={state.pilotFullFee} min={0} max={25000} step={100} onChange={v => set('pilotFullFee', v)} prefix="$" />
          <SliderField label="Pilot duration (yrs)" value={state.pilotDuration} min={1} max={3} onChange={v => set('pilotDuration', v)} />
          <SliderField label="Partners in pilot" value={state.pilotPartners} min={0} max={15} onChange={v => set('pilotPartners', v)} />
        </div>
        <SliderField label="% pilots that convert" value={state.pilotConvertPct} min={0} max={100} onChange={v => set('pilotConvertPct', v)} unit="%" />

        <SectionDivider label="Results" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Card style={{ background: GRAY50 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Year 1 with Pilots</div>
            <div style={{ fontSize: 13 }}>Revenue: <strong>{fmt(pilotYr1Revenue)}</strong></div>
            <div style={{ fontSize: 13 }}>Cost: <strong>{fmt(pcalc.totalCost)}</strong></div>
            <div style={{ fontSize: 13 }}>Margin: <strong style={{ color: pilotYr1Margin >= 0 ? GREEN : RED }}>{fmt(pilotYr1Margin)}</strong></div>
          </Card>
          <Card style={{ background: GRAY50 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Year 2 After Conversion</div>
            <div style={{ fontSize: 13 }}>Revenue: <strong>{fmt(pilotYr2Revenue)}</strong></div>
            <div style={{ fontSize: 13 }}>Cost: <strong>{fmt(pcalc.totalCost)}</strong></div>
            <div style={{ fontSize: 13 }}>Margin: <strong style={{ color: pilotYr2Margin >= 0 ? GREEN : RED }}>{fmt(pilotYr2Margin)}</strong></div>
          </Card>
        </div>
        <div style={{ background: '#faf5ff', border: `1px solid ${PURPLE}33`, borderRadius: 8, padding: '10px 14px', marginTop: 12, fontSize: 13 }}>
          Pilot drag = <strong style={{ color: RED }}>{fmt(pilotDrag)}</strong> vs. full-rate scenario
        </div>

        <SectionDivider label="Conversion Sensitivity" />
        <div style={{ width: '100%', height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={convData} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRAY200} />
              <XAxis dataKey="rate" tickFormatter={v => `${v}%`} fontSize={11} />
              <YAxis tickFormatter={v => fmt(v)} fontSize={11} />
              <Tooltip formatter={v => fmt(v)} labelFormatter={v => `${v}% conversion`} />
              <ReferenceLine y={0} stroke={RED} strokeDasharray="4 4" />
              <Line type="monotone" dataKey="margin" stroke={PURPLE} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}

function ConsortiumPanel({ state, set }) {
  const ccalc = useMemo(() => computeCalc(state, modelOverrides(state)), [state]);

  const consortiumRevenue = state.consortiumFee;
  const consortiumCost = state.consortiumCohorts * state.costPerCohort;
  const consortiumMargin = consortiumRevenue - consortiumCost;
  const equivalentRevenue = state.consortiumPartners * state.tierFees[0];
  const consortiumSaving = (equivalentRevenue - state.consortiumFee) / state.consortiumPartners;
  const equivCohortCost = state.consortiumPartners * state.model_cohortsPerOrg * state.costPerCohort;

  const overallRevenueWithConsortium = ccalc.totalRevenue - equivalentRevenue + consortiumRevenue;
  const overallMarginWithConsortium = overallRevenueWithConsortium - ccalc.totalCost;

  return (
    <div>
      <div style={{ background: PURPLE, color: 'white', padding: '12px 16px', borderRadius: '10px 10px 0 0', fontWeight: 700, fontSize: 15 }}>
        Consortium
        <div style={{ fontSize: 12, fontWeight: 400, opacity: 0.85, marginTop: 2 }}>
          Model a group of organizations sharing one license and pooling cohort delivery.
        </div>
      </div>
      <Card style={{ borderRadius: '0 0 10px 10px', borderTop: 'none' }}>
        <SectionDivider label="Inputs" />
        <SliderField label="Consortium fee" value={state.consortiumFee} min={0} max={30000} step={100} onChange={v => set('consortiumFee', v)} prefix="$" />
        <SliderField label="Partners in consortium" value={state.consortiumPartners} min={2} max={10} onChange={v => set('consortiumPartners', v)} />
        <SliderField label="Cohorts per consortium/yr" value={state.consortiumCohorts} min={1} max={6} onChange={v => set('consortiumCohorts', v)} note="Cost = cohorts × $300, not per partner" />
        <SliderField label="% that are net-new partners" value={state.consortiumNewPct} min={0} max={100} onChange={v => set('consortiumNewPct', v)} unit="%" />

        <SectionDivider label="Results" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Card style={{ background: GRAY50 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Consortium</div>
            <div style={{ fontSize: 13 }}>Total Fee: <strong>{fmt(consortiumRevenue)}</strong></div>
            <div style={{ fontSize: 13 }}>Cohort Cost: <strong>{fmt(consortiumCost)}</strong></div>
            <div style={{ fontSize: 13 }}>Net: <strong style={{ color: consortiumMargin >= 0 ? GREEN : RED }}>{fmt(consortiumMargin)}</strong></div>
            <div style={{ fontSize: 13, marginTop: 4 }}>Per-partner effective: <strong>{fmt(state.consortiumFee / state.consortiumPartners)}</strong></div>
          </Card>
          <Card style={{ background: GRAY50 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Equivalent Individual Licenses</div>
            <div style={{ fontSize: 13 }}>Total: <strong>{fmt(equivalentRevenue)}</strong></div>
            <div style={{ fontSize: 13 }}>Cohort Cost: <strong>{fmt(equivCohortCost)}</strong></div>
            <div style={{ fontSize: 13 }}>Net: <strong style={{ color: equivalentRevenue - equivCohortCost >= 0 ? GREEN : RED }}>{fmt(equivalentRevenue - equivCohortCost)}</strong></div>
          </Card>
        </div>
        <div style={{ background: '#faf5ff', border: `1px solid ${PURPLE}33`, borderRadius: 8, padding: '10px 14px', marginTop: 12, fontSize: 13 }}>
          <strong>{fmt(consortiumSaving)}</strong> saved per partner vs. individual license
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 12 }}>
          <Card style={{ background: GRAY50 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Overall Business w/ Consortium</div>
            <div style={{ fontSize: 13 }}>Revenue: <strong>{fmt(overallRevenueWithConsortium)}</strong></div>
            <div style={{ fontSize: 13 }}>Cost: <strong>{fmt(ccalc.totalCost)}</strong></div>
            <div style={{ fontSize: 13 }}>Margin: <strong style={{ color: overallMarginWithConsortium >= 0 ? GREEN : RED }}>{fmt(overallMarginWithConsortium)}</strong></div>
          </Card>
          <Card style={{ background: GRAY50 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Overall Business w/o Consortium</div>
            <div style={{ fontSize: 13 }}>Revenue: <strong>{fmt(ccalc.totalRevenue)}</strong></div>
            <div style={{ fontSize: 13 }}>Cost: <strong>{fmt(ccalc.totalCost)}</strong></div>
            <div style={{ fontSize: 13 }}>Margin: <strong style={{ color: ccalc.netMargin >= 0 ? GREEN : RED }}>{fmt(ccalc.netMargin)}</strong></div>
          </Card>
        </div>
        <div style={{ fontSize: 12, color: GRAY500, fontStyle: 'italic', marginTop: 8 }}>
          Consortium reduces per-partner cost but may reduce total revenue if group size is small. Overall business figures reflect this model's pipeline &amp; retention assumptions.
        </div>
      </Card>
    </div>
  );
}

function SponsoredPanel({ state, set }) {
  const scalc = useMemo(() => computeCalc(state, modelOverrides(state)), [state]);

  const sponsoredGap = (state.sponsoredListPrice - state.sponsoredFee) * state.sponsoredPartners;
  const sponsoredCWPMargin = scalc.netMargin - sponsoredGap;
  const sponsoredFunderMargin = scalc.netMargin;
  const diff = Math.abs(sponsoredCWPMargin - sponsoredFunderMargin);

  return (
    <div>
      <div style={{ background: PURPLE, color: 'white', padding: '12px 16px', borderRadius: '10px 10px 0 0', fontWeight: 700, fontSize: 15 }}>
        Sponsored
        <div style={{ fontSize: 12, fontWeight: 400, opacity: 0.85, marginTop: 2 }}>
          Model subsidized or zero-cost licenses and who absorbs the fee gap.
        </div>
      </div>
      <Card style={{ borderRadius: '0 0 10px 10px', borderTop: 'none' }}>
        <SectionDivider label="Inputs" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <SliderField label="Sponsored fee" value={state.sponsoredFee} min={0} max={10000} step={100} onChange={v => set('sponsoredFee', v)} prefix="$" />
          <SliderField label="Full list price" value={state.sponsoredListPrice} min={0} max={25000} step={100} onChange={v => set('sponsoredListPrice', v)} prefix="$" />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: GRAY700, display: 'block', marginBottom: 4 }}>Funder name</label>
          <input
            type="text"
            value={state.sponsoredFunderName}
            onChange={e => set('sponsoredFunderName', e.target.value)}
            style={{ padding: '6px 10px', border: `1px solid ${GRAY200}`, borderRadius: 6, fontSize: 13, width: '100%' }}
          />
        </div>
        <SliderField label="Sponsored partners" value={state.sponsoredPartners} min={0} max={10} onChange={v => set('sponsoredPartners', v)} />
        <SliderField label="Grant revenue tied to sponsorship" value={state.sponsoredGrant} min={0} max={100000} step={500} onChange={v => set('sponsoredGrant', v)} prefix="$" />

        <SectionDivider label="Results" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Card style={{ background: GRAY50 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>CWP Absorbs Gap</div>
            <div style={{ fontSize: 13 }}>Gap (subsidy cost): <strong style={{ color: RED }}>{fmt(sponsoredGap)}</strong></div>
            <div style={{ fontSize: 13, marginTop: 4 }}>Net Margin: <strong style={{ color: sponsoredCWPMargin >= 0 ? GREEN : RED }}>{fmt(sponsoredCWPMargin)}</strong></div>
          </Card>
          <Card style={{ background: GRAY50 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>{state.sponsoredFunderName} Covers Gap</div>
            <div style={{ fontSize: 13 }}>Gap as external revenue: <strong style={{ color: GREEN }}>{fmt(sponsoredGap)}</strong></div>
            <div style={{ fontSize: 13, marginTop: 4 }}>Net Margin: <strong style={{ color: sponsoredFunderMargin >= 0 ? GREEN : RED }}>{fmt(sponsoredFunderMargin)}</strong></div>
          </Card>
        </div>
        <div style={{ background: '#faf5ff', border: `1px solid ${PURPLE}33`, borderRadius: 8, padding: '10px 14px', marginTop: 12, fontSize: 13, textAlign: 'center' }}>
          Margin difference between framings: <strong>{fmt(diff)}</strong>
        </div>
        <div style={{ fontSize: 12, color: GRAY500, fontStyle: 'italic', marginTop: 8 }}>
          This is a framing difference, not a financial difference — the cash outcome depends on whether the funder commitment is confirmed.
        </div>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// TAB: OVERVIEW
// ═══════════════════════════════════════════════════════
function OverviewTab({ state, calc, bothWorldsLens, setBothWorldsLens }) {
  const lensCalc = useMemo(() => {
    if (!bothWorldsLens) return null;
    const s = state;
    const effP = calc.totalPartners * (s.renewalRate / 100) * (1 - s.dormantRate / 100);
    const actOrgs = effP * (s.pctLicenseToActive / 100);
    const coh = actOrgs * s.cohortsPerOrg;
    const parts = coh * s.avgParticipants;
    const overages = Math.max(0, parts - calc.totalPartners * 15);
    const ippRev = 0;
    const cohRev = coh * 500;
    const certRev = overages * s.feeCertOverage;
    const grantRev = 0;
    const totalRev = calc.licenseRevenue + ippRev + cohRev + certRev + grantRev;
    return { ippRevenue: ippRev, cohortRevenue: cohRev, certOverageRev: certRev, grantRevenue: grantRev, totalRevenue: totalRev };
  }, [bothWorldsLens, state, calc]);

  const c = bothWorldsLens && lensCalc ? { ...calc, ...lensCalc } : calc;

  const chartData = [
    { name: 'License', value: c.licenseRevenue, color: BLUE },
    { name: 'IPP', value: c.ippRevenue, color: TEAL },
    { name: 'Cohort', value: c.cohortRevenue, color: PURPLE },
    { name: 'Cert Overage', value: c.certOverageRev, color: GREEN },
    { name: 'Grants', value: c.grantRevenue, color: '#4ade80' },
    { name: 'Fixed Costs', value: -calc.fixedTotal, color: RED },
    { name: 'Semi-Variable', value: -(calc.ippCostTotal + calc.cohortCostTotal + calc.certCostTotal), color: ORANGE },
    { name: 'Hidden Costs', value: -calc.hiddenTotal, color: AMBER },
  ];

  const revSources = [
    { label: 'License / Membership', value: c.licenseRevenue, color: BLUE },
    { label: 'IPP Revenue', value: c.ippRevenue, color: TEAL },
    { label: 'Cohort + Cert Revenue', value: c.cohortRevenue + c.certOverageRev, color: PURPLE },
    { label: 'Grants', value: c.grantRevenue, color: GREEN },
  ];
  const totalRev = c.totalRevenue || 1;

  const recurring = c.licenseRevenue + c.cohortRevenue;
  const oneTime = c.ippRevenue + c.grantRevenue;
  const stabTotal = recurring + oneTime || 1;

  return (
    <div>
      {bothWorldsLens && (
        <div style={{ background: '#eff6ff', border: `1px solid ${BLUE}33`, borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, fontWeight: 600, color: BLUE }}>
          Viewing: Membership-Stable Lens (inputs unchanged)
        </div>
      )}

      <Card style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: GRAY900, marginBottom: 16 }}>Revenue vs. Cost</div>
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRAY200} />
              <XAxis dataKey="name" fontSize={11} />
              <YAxis tickFormatter={v => fmt(v)} fontSize={11} />
              <Tooltip formatter={v => fmt(v)} />
              <ReferenceLine y={0} stroke={GRAY900} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, idx) => (
                  <Cell key={idx} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: GRAY900, marginBottom: 16 }}>Revenue Source Breakdown</div>
        {revSources.map(src => {
          const pctVal = totalRev > 0 ? (src.value / totalRev) * 100 : 0;
          return (
            <div key={src.label} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                <span style={{ fontWeight: 600, color: GRAY700 }}>{src.label}</span>
                <span style={{ color: GRAY500 }}>{fmt(src.value)} ({pctVal.toFixed(1)}%)</span>
              </div>
              <div style={{ background: GRAY200, borderRadius: 4, height: 8, overflow: 'hidden' }}>
                <div style={{ width: `${Math.max(0, pctVal)}%`, height: '100%', background: src.color, borderRadius: 4 }} />
              </div>
            </div>
          );
        })}
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: GRAY900, marginBottom: 16 }}>Revenue Stability</div>
        <div style={{ background: GRAY200, borderRadius: 6, height: 24, overflow: 'hidden', display: 'flex' }}>
          <div style={{ width: `${(recurring / stabTotal) * 100}%`, background: BLUE, height: '100%' }} />
          <div style={{ width: `${(oneTime / stabTotal) * 100}%`, background: TEAL, height: '100%' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginTop: 6, color: GRAY500 }}>
          <span><span style={{ display: 'inline-block', width: 10, height: 10, background: BLUE, borderRadius: 2, marginRight: 4, verticalAlign: 'middle' }}></span>Recurring ({fmt(recurring)})</span>
          <span><span style={{ display: 'inline-block', width: 10, height: 10, background: TEAL, borderRadius: 2, marginRight: 4, verticalAlign: 'middle' }}></span>One-time ({fmt(oneTime)})</span>
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, marginTop: 8 }}>Stability Score: {pct(c.totalRevenue > 0 ? recurring / c.totalRevenue : 0)}</div>
      </Card>

      {/* Both Worlds Lens Toggle */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 12, color: GRAY500, fontWeight: 600 }}>IPP-Heavy / Grant-Funded</span>
          <button
            onClick={() => setBothWorldsLens(!bothWorldsLens)}
            style={{
              width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
              background: bothWorldsLens ? BLUE : GRAY200,
              position: 'relative', transition: 'background 0.2s',
            }}
          >
            <span style={{
              position: 'absolute', top: 2, left: bothWorldsLens ? 22 : 2,
              width: 20, height: 20, borderRadius: 10, background: 'white', transition: 'left 0.2s',
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            }} />
          </button>
          <span style={{ fontSize: 12, color: bothWorldsLens ? BLUE : GRAY500, fontWeight: 600 }}>Membership / Cohort-Stable</span>
        </div>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// TAB: PARTNERS
// ═══════════════════════════════════════════════════════
function PartnersTab({ state, calc, set, setPartnerCount, setTierFee, editTierFees, setEditTierFees, resetFees }) {
  const renewCount = Math.round(calc.totalPartners * (state.renewalRate / 100));
  const churnCount = Math.round(calc.totalPartners * (1 - state.renewalRate / 100));

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: GRAY900 }}>License Tier Partners</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setEditTierFees(!editTierFees)} style={{
              padding: '6px 12px', fontSize: 12, fontWeight: 600, borderRadius: 6, border: `1px solid ${GRAY200}`,
              background: editTierFees ? BLUE : 'white', color: editTierFees ? 'white' : GRAY700, cursor: 'pointer',
              fontFamily: "'Inter', sans-serif",
            }}>
              {editTierFees ? 'Done Editing Fees' : 'Edit Tier Fees'}
            </button>
            <button onClick={resetFees} style={{
              padding: '6px 12px', fontSize: 12, fontWeight: 600, borderRadius: 6, border: `1px solid ${GRAY200}`,
              background: 'white', color: GRAY700, cursor: 'pointer', fontFamily: "'Inter', sans-serif",
            }}>
              Reset All Fees
            </button>
          </div>
        </div>

        {TIERS.map((tier, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, padding: '8px 12px', background: GRAY50, borderRadius: 8 }}>
            <div style={{ width: 140, fontSize: 13, fontWeight: 600, color: GRAY700 }}>
              {tier.label}
              <div style={{ fontSize: 12, color: GRAY500 }}>{fmt(state.tierFees[i])}</div>
            </div>
            {editTierFees && (
              <input type="number" value={state.tierFees[i]} onChange={e => setTierFee(i, Number(e.target.value))}
                style={{ width: 90, padding: '4px 8px', border: `1px solid ${GRAY200}`, borderRadius: 6, fontSize: 13, textAlign: 'right' }} />
            )}
            <input type="range" min={0} max={15} value={state.partnerCounts[i]} onChange={e => setPartnerCount(i, Number(e.target.value))}
              style={{ flex: 1 }} />
            <div style={{ width: 40, fontSize: 22, fontWeight: 700, textAlign: 'center', color: BLUE }}>{state.partnerCounts[i]}</div>
            <div style={{ width: 100, fontSize: 12, color: GRAY500, textAlign: 'right' }}>
              {fmt(state.partnerCounts[i] * state.tierFees[i])}
              <br />{state.partnerCounts[i] * tier.instructors} instr.
            </div>
          </div>
        ))}
      </Card>

      {/* Summary Row */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: GRAY500 }}>Total Partners</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: BLUE }}>{calc.totalPartners}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: GRAY500 }}>Total Instructors</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: TEAL }}>{calc.totalInstructors}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: GRAY500 }}>Total License Revenue</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: GREEN }}>{fmt(calc.licenseRevenue)}</div>
          </div>
        </div>
      </Card>

      {/* Renewal Impact */}
      <Card>
        <div style={{ fontSize: 14, fontWeight: 700, color: GRAY900, marginBottom: 12 }}>Renewal Impact</div>
        <div style={{ fontSize: 13, marginBottom: 4 }}>
          Expected to renew next cycle: <strong style={{ color: GREEN }}>{renewCount} partners</strong>
        </div>
        <div style={{ fontSize: 13, marginBottom: 8 }}>
          At risk of churn: <strong style={{ color: RED }}>{churnCount} partners</strong>
        </div>
        <div style={{ background: GRAY200, borderRadius: 6, height: 16, overflow: 'hidden', display: 'flex' }}>
          <div style={{ width: `${calc.totalPartners > 0 ? (renewCount / calc.totalPartners) * 100 : 0}%`, background: GREEN, height: '100%' }} />
          <div style={{ width: `${calc.totalPartners > 0 ? (churnCount / calc.totalPartners) * 100 : 0}%`, background: RED, height: '100%' }} />
        </div>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// TAB: PIPELINE
// ═══════════════════════════════════════════════════════
function PipelineTab({ state, calc, set }) {
  const stages = [
    { label: 'IPP Enrollments', value: state.newIPPInstructors },
    { label: 'Licensed Orgs', value: Math.round(state.newIPPInstructors * (state.pctIPPtoLicense / 100)) },
    { label: 'Active Partners (non-dormant)', value: Math.round(calc.effectivePartners) },
    { label: 'Cohort-Running Partners', value: Math.round(calc.activeCohortOrgs) },
    { label: 'Certificates Issued', value: Math.round(calc.certsIssued) },
  ];

  return (
    <div>
      <div style={{ fontSize: 13, color: GRAY500, marginBottom: 16 }}>
        Model the conversion funnel from prospect to active cohort delivery.
      </div>

      {/* Funnel */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: GRAY900, marginBottom: 16 }}>Conversion Funnel</div>
        <div style={{ maxWidth: 500, margin: '0 auto' }}>
          {stages.map((stage, i) => {
            const widthPct = 100 - (i * 15);
            const colors = [BLUE, '#2563eb', '#6366f1', '#8b5cf6', PURPLE];
            const dropoff = i > 0 && stages[i - 1].value > 0
              ? ((1 - stage.value / stages[i - 1].value) * 100).toFixed(0)
              : null;
            return (
              <div key={i} style={{ marginBottom: 4 }}>
                <div style={{
                  width: `${widthPct}%`,
                  margin: '0 auto',
                  background: colors[i],
                  color: 'white',
                  padding: '10px 16px',
                  borderRadius: 6,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: 13,
                  fontWeight: 600,
                }}>
                  <span>{stage.label}</span>
                  <span style={{ fontSize: 18, fontWeight: 700 }}>{stage.value}</span>
                </div>
                {dropoff !== null && (
                  <div style={{ textAlign: 'center', fontSize: 11, color: GRAY500, margin: '2px 0' }}>
                    ▼ {dropoff}% drop-off
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Pipeline Inputs */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: GRAY900, marginBottom: 16 }}>Pipeline Inputs</div>
        <SliderField label="New IPP instructors this cycle" value={state.newIPPInstructors} min={0} max={30} onChange={v => set('newIPPInstructors', v)} />
        <SliderField label="% IPP → licensed org" value={state.pctIPPtoLicense} min={0} max={100} onChange={v => set('pctIPPtoLicense', v)} unit="%" />
        <SliderField label="% licensed orgs → run ≥1 cohort/yr" value={state.pctLicenseToActive} min={0} max={100} onChange={v => set('pctLicenseToActive', v)} unit="%" />
        <SliderField label="Cohorts per active org/yr" value={state.cohortsPerOrg} min={1} max={6} onChange={v => set('cohortsPerOrg', v)} />
        <div>
          <SliderField label="Avg participants per cohort" value={state.avgParticipants} min={1} max={15} onChange={v => set('avgParticipants', v)} />
          {state.avgParticipants === 15 && (
            <div style={{ fontSize: 12, fontWeight: 600, color: AMBER, marginTop: -8, marginBottom: 8 }}>
              ⚠ At cohort cap (15 participants max)
            </div>
          )}
        </div>
        <SliderField label="Time IPP → first cohort (months)" value={6} min={1} max={18} onChange={() => {}} note="Display only — affects planning notes, not P&L math" />
      </Card>

      {/* Pipeline Revenue Output */}
      <Card>
        <div style={{ fontSize: 14, fontWeight: 700, color: GRAY900, marginBottom: 12 }}>Pipeline Revenue Output</div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: GRAY500 }}>IPP Revenue</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: TEAL }}>{fmt(calc.ippRevenue)}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: GRAY500 }}>Cohort Revenue</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: PURPLE }}>{fmt(calc.cohortRevenue)}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: GRAY500 }}>Certs Issued</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: GRAY900 }}>{Math.round(calc.certsIssued)}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: GRAY500 }}>Cert Overage Rev</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: GREEN }}>{fmt(calc.certOverageRev)}</div>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// TAB: COSTS
// ═══════════════════════════════════════════════════════
function CostsTab({ state, calc, set }) {
  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <SectionDivider label="Fixed Costs (Annual)" />
        <SliderField label="Staff base time" value={state.costStaff} min={0} max={50000} step={500} onChange={v => set('costStaff', v)} prefix="$" />
        <SliderField label="LMS (Thinkific)" value={state.costLMS} min={0} max={5000} step={50} onChange={v => set('costLMS', v)} prefix="$" />
        <SliderField label="Accreditation / ANSI" value={state.costAccreditation} min={0} max={10000} step={100} onChange={v => set('costAccreditation', v)} prefix="$" />
        <SliderField label="Airtable + Systems" value={state.costSystems} min={0} max={5000} step={50} onChange={v => set('costSystems', v)} prefix="$" />
        <SliderField label="Overhead / Indirect" value={state.costOverhead} min={0} max={10000} step={100} onChange={v => set('costOverhead', v)} prefix="$" />
        <div style={{ fontSize: 13, fontWeight: 700, color: GRAY900, textAlign: 'right', marginTop: 8 }}>
          Fixed Total: {fmt(calc.fixedTotal)}
        </div>
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <SectionDivider label="Semi-Variable Costs (Per Event)" />
        <SliderField label="IPP delivery cost" value={state.costPerIPP} min={0} max={2000} step={25} onChange={v => set('costPerIPP', v)} prefix="$" note="per instructor" />
        <SliderField label="Cohort processing cost" value={state.costPerCohort} min={0} max={2000} step={25} onChange={v => set('costPerCohort', v)} prefix="$" note="per cohort" />
        <SliderField label="Cert issuance cost" value={state.costPerCert} min={0} max={50} step={1} onChange={v => set('costPerCert', v)} prefix="$" note="per certificate" />
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <SectionDivider label="Hidden / Often-Missed Costs (Annual)" />
        <SliderField label="Sales & outreach time" value={state.costSalesOutreach} min={0} max={10000} step={100} onChange={v => set('costSalesOutreach', v)} prefix="$" />
        <SliderField label="Partner onboarding" value={state.costOnboarding} min={0} max={2000} step={50} onChange={v => set('costOnboarding', v)} prefix="$" note="× new partner count (from Pipeline)" />
        <SliderField label="QA + compliance" value={state.costQACompliance} min={0} max={5000} step={100} onChange={v => set('costQACompliance', v)} prefix="$" />
        <SliderField label="System maintenance" value={state.costSysMaintenance} min={0} max={5000} step={100} onChange={v => set('costSysMaintenance', v)} prefix="$" />
        <div style={{ fontSize: 13, fontWeight: 700, color: GRAY900, textAlign: 'right', marginTop: 8 }}>
          Hidden Total: {fmt(calc.hiddenTotal)}
        </div>
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <SectionDivider label="Revenue Inputs" />
        <SliderField label="IPP fee" value={state.feeIPP} min={500} max={5000} step={100} onChange={v => set('feeIPP', v)} prefix="$" />
        <SliderField label="Cohort fee" value={state.feeCohort} min={0} max={1000} step={25} onChange={v => set('feeCohort', v)} prefix="$" />
        <SliderField label="Cert overage fee" value={state.feeCertOverage} min={0} max={200} step={5} onChange={v => set('feeCertOverage', v)} prefix="$" />
        <SliderField label="Grant / external revenue" value={state.feeGrant} min={0} max={100000} step={500} onChange={v => set('feeGrant', v)} prefix="$" note="Annual grant or contract revenue" />
      </Card>

      <Card>
        <SectionDivider label="Assumption Inputs" />
        <SliderField label="License renewal rate" value={state.renewalRate} min={0} max={100} onChange={v => set('renewalRate', v)} unit="%" />
        <SliderField label="Dormant partner rate" value={state.dormantRate} min={0} max={100} onChange={v => set('dormantRate', v)} unit="%" note="Partners licensed but not running cohorts" />
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// TAB: VARIABLE MAP
// ═══════════════════════════════════════════════════════
function VariableMapTab({ state, calc, showFormulas, setShowFormulas }) {
  const thStyle = { textAlign: 'left', padding: '8px 10px', fontSize: 12, fontWeight: 700, color: GRAY700, borderBottom: `2px solid ${GRAY200}` };
  const tdStyle = { padding: '6px 10px', fontSize: 12, borderBottom: `1px solid ${GRAY100}`, color: GRAY900 };

  const growthVars = [
    ['New IPP instructors', 'INPUT', state.newIPPInstructors, 'Pipeline tab', 'IPP Revenue, Funnel'],
    ['IPP Fee', 'INPUT', fmt(state.feeIPP), 'Costs tab', 'IPP Revenue'],
    ['IPP delivery cost', 'INPUT', fmt(state.costPerIPP), 'Costs tab', 'Total Cost'],
    ['IPP → License rate', 'ASSUMPTION', `${state.pctIPPtoLicense}%`, 'Pipeline tab', 'Licensed org count'],
    ['Grant revenue', 'INPUT', fmt(state.feeGrant), 'Costs tab', 'Total Revenue, Stability'],
    ['New licensed orgs', 'OUTPUT', calc.newLicensedOrgs.toFixed(1), 'IPP × conv rate', 'License Rev, Cohort vol'],
    ['IPP Revenue', 'OUTPUT', fmt(calc.ippRevenue), 'Instructors × IPP fee', 'Total Revenue'],
    ['IPP Cost', 'OUTPUT', fmt(calc.ippCostTotal), 'Instructors × IPP cost', 'Total Cost'],
  ];

  const revenueVars = [
    ['Active licensed orgs', 'INPUT', calc.totalPartners, 'Partners tab', 'License rev, cohort vol'],
    ['License fee (Tier 1)', 'INPUT', fmt(state.tierFees[0]), 'Partners tab', 'License Revenue'],
    ['Renewal rate', 'ASSUMPTION', `${state.renewalRate}%`, 'Costs tab', 'Retained partners'],
    ['Dormant partner rate', 'ASSUMPTION', `${state.dormantRate}%`, 'Costs tab', 'Effective cohort vol'],
    ['% orgs → cohort', 'ASSUMPTION', `${state.pctLicenseToActive}%`, 'Pipeline tab', 'Cohort count, revenue'],
    ['Cohorts per org/yr', 'INPUT', state.cohortsPerOrg, 'Pipeline tab', 'Cohort rev + cost'],
    ['Cohort fee', 'INPUT', fmt(state.feeCohort), 'Costs tab', 'Cohort Revenue'],
    ['Cohort processing cost', 'INPUT', fmt(state.costPerCohort), 'Costs tab', 'Total Cost'],
    ['Avg participants', 'ASSUMPTION', state.avgParticipants, 'Pipeline tab (cap 15)', 'Certs issued'],
    ['Cert overage fee', 'INPUT', fmt(state.feeCertOverage), 'Costs tab', 'Cert Revenue'],
    ['License Revenue', 'OUTPUT', fmt(calc.licenseRevenue), 'Partners × tier fee', 'Total Rev, Stability'],
    ['Cohort Revenue', 'OUTPUT', fmt(calc.cohortRevenue), 'Cohorts × cohort fee', 'Total Rev, Stability'],
    ['Certs Issued', 'OUTPUT', Math.round(calc.certsIssued), 'Cohorts × avg participants', 'Cert Rev, Cert Cost'],
  ];

  const costVars = [
    ['Staff base time', 'INPUT', fmt(state.costStaff), 'Costs tab', 'Total Cost'],
    ['LMS', 'INPUT', fmt(state.costLMS), 'Costs tab', 'Total Cost'],
    ['Accreditation/ANSI', 'INPUT', fmt(state.costAccreditation), 'Costs tab', 'Total Cost'],
    ['Airtable + Systems', 'INPUT', fmt(state.costSystems), 'Costs tab', 'Total Cost'],
    ['Overhead/Indirect', 'INPUT', fmt(state.costOverhead), 'Costs tab', 'Total Cost'],
    ['Sales & outreach', 'INPUT', fmt(state.costSalesOutreach), 'Costs tab', 'Total Cost'],
    ['Partner onboarding', 'INPUT', fmt(state.costOnboarding), 'Costs tab', 'Total Cost'],
    ['QA + compliance', 'INPUT', fmt(state.costQACompliance), 'Costs tab', 'Total Cost'],
    ['System maintenance', 'INPUT', fmt(state.costSysMaintenance), 'Costs tab', 'Total Cost'],
    ['Fixed Total', 'OUTPUT', fmt(calc.fixedTotal), 'Sum above', 'Net Margin'],
    ['Hidden Total', 'OUTPUT', fmt(calc.hiddenTotal), 'Sum above', 'Net Margin'],
    ['Total Cost', 'OUTPUT', fmt(calc.totalCost), 'All costs', 'Net Margin'],
  ];

  const renderTable = (title, color, rows) => (
    <Card style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 14, fontWeight: 700, color, marginBottom: 12 }}>{title}</div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={thStyle}>Variable</th>
              <th style={thStyle}>Type</th>
              <th style={thStyle}>Current Value</th>
              {showFormulas && <th style={thStyle}>Formula / Source</th>}
              <th style={thStyle}>Drives</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? 'white' : GRAY50 }}>
                <td style={{ ...tdStyle, fontWeight: 600 }}>{row[0]}</td>
                <td style={tdStyle}><Badge type={row[1]} /></td>
                <td style={tdStyle}>{row[2]}</td>
                {showFormulas && <td style={tdStyle}>{row[3]}</td>}
                <td style={tdStyle}>{row[4]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );

  const exportCSV = () => {
    const allRows = [
      ...growthVars.map(r => ['Growth', ...r]),
      ...revenueVars.map(r => ['Revenue', ...r]),
      ...costVars.map(r => ['Cost', ...r]),
    ];
    const header = 'Section,Variable,Type,CurrentValue,Formula,Drives';
    const csv = [header, ...allRows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const date = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `cwc-variable-map-${date}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <button onClick={() => setShowFormulas(!showFormulas)} style={{
          padding: '8px 14px', fontSize: 12, fontWeight: 600, borderRadius: 6, border: `1px solid ${GRAY200}`,
          background: showFormulas ? BLUE : 'white', color: showFormulas ? 'white' : GRAY700, cursor: 'pointer',
          fontFamily: "'Inter', sans-serif",
        }}>
          {showFormulas ? 'Hide Formulas' : 'Show Formulas'}
        </button>
        <button onClick={exportCSV} style={{
          padding: '8px 14px', fontSize: 12, fontWeight: 600, borderRadius: 6, border: `1px solid ${GRAY200}`,
          background: 'white', color: GRAY700, cursor: 'pointer', fontFamily: "'Inter', sans-serif",
        }}>
          Export CSV
        </button>
      </div>

      {renderTable('GROWTH ENGINE · IPP · Grants · New Partners', TEAL, growthVars)}
      {renderTable('REVENUE ENGINE · Membership · Cohort Fees · Certificates', BLUE, revenueVars)}
      {renderTable('FIXED & HIDDEN COSTS', RED, costVars)}

      {/* Summary Bar */}
      <div style={{
        display: 'flex', gap: 12, flexWrap: 'wrap', padding: '16px', background: 'white',
        border: `1.5px solid ${GRAY200}`, borderRadius: 10,
      }}>
        <StatCard label="Total Revenue" value={fmt(calc.totalRevenue)} color={BLUE} />
        <StatCard label="Total Cost" value={fmt(calc.totalCost)} color={RED} />
        <StatCard label="Net Margin" value={fmt(calc.netMargin)} color={calc.netMargin >= 0 ? GREEN : RED} highlight />
        <StatCard label="Break-Even" value={calc.breakEvenPartners != null ? `${calc.breakEvenPartners} partners` : 'N/A'} color={PURPLE} />
        <StatCard label="Stability" value={pct(calc.stabilityScore)} color={TEAL} />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// TAB: SENSITIVITY
// ═══════════════════════════════════════════════════════
function SensitivityTab({ data, sensitivityOverlay, setSensitivityOverlay, sensitivityLens, setSensitivityLens }) {
  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: GRAY900, marginBottom: 16 }}>
          Net Margin Sensitivity — Partner Count
        </div>
        <div style={{ display: 'flex', gap: 16, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: GRAY700, marginRight: 6 }}>Overlay scenario:</label>
            <select value={sensitivityOverlay} onChange={e => setSensitivityOverlay(e.target.value)} style={{
              padding: '4px 8px', fontSize: 12, border: `1px solid ${GRAY200}`, borderRadius: 6,
            }}>
              <option>None</option>
              <option>Pilot</option>
              <option>Consortium</option>
              <option>Sponsored</option>
            </select>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: GRAY700, cursor: 'pointer' }}>
            <input type="checkbox" checked={sensitivityLens} onChange={e => setSensitivityLens(e.target.checked)} />
            Show membership-stable lens
          </label>
        </div>
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRAY200} />
              <XAxis dataKey="partners" label={{ value: '# Partners (1-instructor tier)', position: 'insideBottom', offset: -2, fontSize: 11 }} fontSize={11} />
              <YAxis tickFormatter={v => fmt(v)} label={{ value: 'Net Margin', angle: -90, position: 'insideLeft', fontSize: 11 }} fontSize={11} />
              <Tooltip formatter={v => fmt(v)} labelFormatter={v => `${v} partners`} />
              <Legend />
              <ReferenceLine y={0} stroke={RED} strokeDasharray="4 4" label={{ value: 'Break-Even', position: 'right', fontSize: 11, fill: RED }} />
              <Line type="monotone" dataKey="Baseline" stroke={BLUE} strokeWidth={2} dot={false} />
              {sensitivityOverlay !== 'None' && (
                <Line type="monotone" dataKey={sensitivityOverlay} stroke={PURPLE} strokeWidth={2} dot={false} />
              )}
              {sensitivityLens && (
                <Line type="monotone" dataKey="Membership-Stable" stroke={GREEN} strokeWidth={2} strokeDasharray="6 3" dot={false} />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
      <div style={{ fontSize: 12, color: GRAY500, fontStyle: 'italic' }}>
        Sensitivity uses 1-instructor tier as baseline unit. All Costs tab inputs apply.
      </div>
    </div>
  );
}
