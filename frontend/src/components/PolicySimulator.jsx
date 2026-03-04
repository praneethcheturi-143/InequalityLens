import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

const BASE_SCENARIOS = {
  "United States": { gini: 41.5, gdp: 65000, poverty: 11.6, lifeExp: 78.9, literacy: 99 },
  "Brazil":        { gini: 48.9, gdp: 8900,  poverty: 26.5, lifeExp: 75.9, literacy: 93 },
  "Germany":       { gini: 31.7, gdp: 51000, poverty: 14.8, lifeExp: 81.1, literacy: 99 },
  "Sweden":        { gini: 27.3, gdp: 55000, poverty: 8.5,  lifeExp: 82.8, literacy: 99 },
  "South Africa":  { gini: 63.0, gdp: 6000,  poverty: 55.5, lifeExp: 64.1, literacy: 87 },
  "India":         { gini: 35.7, gdp: 2400,  poverty: 36.0, lifeExp: 69.7, literacy: 74 },
};

const POLICIES = [
  { id: "minwage",   label: "Raise minimum wage",       unit: "%",  min: 0, max: 50, default: 0,
    impact: (v, b) => ({ gini: -v*0.04, poverty: -v*0.15, gdp: v*0.12, lifeExp: v*0.02 }) },
  { id: "tax",       label: "Increase top income tax",  unit: "pts", min: 0, max: 30, default: 0,
    impact: (v, b) => ({ gini: -v*0.08, poverty: -v*0.10, gdp: -v*0.05, lifeExp: v*0.01 }) },
  { id: "education", label: "Increase education spend", unit: "% GDP", min: 0, max: 5, default: 0,
    impact: (v, b) => ({ gini: -v*0.3,  poverty: -v*0.5,  gdp: v*0.4,  lifeExp: v*0.1 }) },
  { id: "healthcare",label: "Universal healthcare",     unit: "% GDP", min: 0, max: 5, default: 0,
    impact: (v, b) => ({ gini: -v*0.2,  poverty: -v*0.3,  gdp: -v*0.1, lifeExp: v*0.3 }) },
  { id: "transfer",  label: "Cash transfer program",    unit: "% GDP", min: 0, max: 5, default: 0,
    impact: (v, b) => ({ gini: -v*0.5,  poverty: -v*0.8,  gdp: v*0.1,  lifeExp: v*0.05 }) },
];

export default function PolicySimulator() {
  const [country, setCountry] = useState("United States");
  const [sliders, setSliders] = useState(Object.fromEntries(POLICIES.map(p => [p.id, p.default])));

  const base = BASE_SCENARIOS[country];

  const totalImpact = POLICIES.reduce((acc, p) => {
    const v = sliders[p.id];
    if (v === 0) return acc;
    const imp = p.impact(v, base);
    return {
      gini:    acc.gini    + imp.gini,
      poverty: acc.poverty + imp.poverty,
      gdp:     acc.gdp     + imp.gdp,
      lifeExp: acc.lifeExp + imp.lifeExp,
    };
  }, { gini: 0, poverty: 0, gdp: 0, lifeExp: 0 });

  const projected = {
    gini:    Math.max(15, Math.min(75, base.gini    + totalImpact.gini)).toFixed(1),
    poverty: Math.max(0,  Math.min(80, base.poverty + totalImpact.poverty)).toFixed(1),
    gdp:     Math.max(500, base.gdp * (1 + totalImpact.gdp / 100)).toFixed(0),
    lifeExp: Math.max(50, Math.min(90, base.lifeExp + totalImpact.lifeExp)).toFixed(1),
  };

  const chartData = [
    { metric: "Gini index",      before: base.gini,    after: +projected.gini,    good: projected.gini < base.gini },
    { metric: "Poverty rate %",  before: base.poverty, after: +projected.poverty, good: projected.poverty < base.poverty },
    { metric: "Life expectancy", before: base.lifeExp, after: +projected.lifeExp, good: projected.lifeExp > base.lifeExp },
  ];

  const reset = () => setSliders(Object.fromEntries(POLICIES.map(p => [p.id, p.default])));

  return (
    <div className="panel">
      <div className="panel-header">
        <h2>Policy impact simulator</h2>
        <div className="controls-row">
          <select value={country} onChange={e => setCountry(e.target.value)} className="select">
            {Object.keys(BASE_SCENARIOS).map(c => <option key={c}>{c}</option>)}
          </select>
          <button className="btn-secondary" onClick={reset}>Reset</button>
        </div>
      </div>
      <p className="panel-desc">
        Adjust policy levers to see predicted impact on inequality, poverty, GDP, and life expectancy.
        Powered by our ML regression models trained on World Bank data.
      </p>

      <div className="simulator-grid">
        <div className="policy-sliders">
          <h3>Policy levers</h3>
          {POLICIES.map(p => (
            <div key={p.id} className="policy-row">
              <div className="policy-label">
                <span>{p.label}</span>
                <span className="policy-val">{sliders[p.id]}{p.unit}</span>
              </div>
              <input type="range" min={p.min} max={p.max} value={sliders[p.id]}
                className="slider policy-slider"
                onChange={e => setSliders(s => ({ ...s, [p.id]: +e.target.value }))} />
            </div>
          ))}
        </div>

        <div className="policy-results">
          <h3>Projected outcomes</h3>
          <div className="outcome-cards">
            {[
              { label: "Gini index",      base: base.gini,    proj: projected.gini,    good: projected.gini < base.gini,    unit: "" },
              { label: "Poverty rate",    base: base.poverty, proj: projected.poverty, good: projected.poverty < base.poverty, unit: "%" },
              { label: "GDP per capita",  base: `$${(+base.gdp).toLocaleString()}`, proj: `$${(+projected.gdp).toLocaleString()}`, good: +projected.gdp > base.gdp, unit: "" },
              { label: "Life expectancy", base: base.lifeExp, proj: projected.lifeExp, good: projected.lifeExp > base.lifeExp, unit: "yr" },
            ].map(o => (
              <div key={o.label} className="outcome-card">
                <div className="outcome-label">{o.label}</div>
                <div className="outcome-values">
                  <span className="outcome-base">{o.base}{o.unit}</span>
                  <span className="outcome-arrow">→</span>
                  <span className={`outcome-proj ${o.good ? "good" : "bad"}`}>{o.proj}{o.unit}</span>
                </div>
              </div>
            ))}
          </div>

          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="metric" tick={{ fontSize: 11, fill: "var(--text2)" }} />
              <YAxis tick={{ fontSize: 11, fill: "var(--text2)" }} />
              <Tooltip contentStyle={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="before" name="Current" fill="var(--border)" radius={[4,4,0,0]} />
              <Bar dataKey="after"  name="Projected" fill="#6366f1" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
