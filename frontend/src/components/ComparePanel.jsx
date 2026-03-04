import { useState } from "react";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { useAPI } from "../hooks/useAPI";
import { api } from "../utils/api";

const COLORS = ["#6366f1","#10b981","#f59e0b","#ef4444"];

const COUNTRIES = [
  "United States","Germany","Brazil","Sweden","South Africa",
  "India","China","Japan","United Kingdom","Australia",
  "Canada","France","Norway","Finland","Greece",
];

const METRICS = [
  { key: "gini_index",           label: "Gini index",        invert: true  },
  { key: "gdp_per_capita",       label: "GDP per capita",    invert: false },
  { key: "life_expectancy",      label: "Life expectancy",   invert: false },
  { key: "adult_literacy",       label: "Adult literacy",    invert: false },
  { key: "health_expenditure_pc",label: "Health spend",      invert: false },
  { key: "poverty_rate",         label: "Poverty rate",      invert: true  },
];

function normalize(value, min, max, invert) {
  if (max === min) return 50;
  const norm = ((value - min) / (max - min)) * 100;
  return invert ? 100 - norm : norm;
}

export default function ComparePanel() {
  const { data: worldData } = useAPI(api.choropleth);
  const [selected, setSelected] = useState(["United States","Germany","Brazil","Sweden"]);

  const toggleCountry = (c) => {
    if (selected.includes(c)) {
      if (selected.length > 2) setSelected(selected.filter(x => x !== c));
    } else {
      if (selected.length < 4) setSelected([...selected, c]);
    }
  };

  const radarData = METRICS.map(m => {
    const point = { metric: m.label };
    const allVals = (worldData || []).map(d => d[m.key]).filter(v => v != null);
    const min = Math.min(...allVals);
    const max = Math.max(...allVals);
    selected.forEach(country => {
      const row = (worldData || []).find(d => d.country_name === country);
      const val = row?.[m.key];
      point[country] = val != null ? +normalize(val, min, max, m.invert).toFixed(1) : 0;
    });
    return point;
  });

  const rawData = selected.map(country => {
    const row = (worldData || []).find(d => d.country_name === country);
    return { country, ...row };
  });

  return (
    <div className="panel">
      <div className="panel-header">
        <h2>Country comparison</h2>
        <span className="ai-badge">Select 2–4 countries</span>
      </div>
      <p className="panel-desc">
        Compare countries across 6 dimensions. All metrics normalised to 0–100 (higher = better).
        Gini index and poverty rate are inverted so higher = more equal / less poverty.
      </p>

      <div className="country-chips">
        {COUNTRIES.map((c, i) => (
          <button
            key={c}
            className={`chip ${selected.includes(c) ? "chip-active" : ""}`}
            style={selected.includes(c) ? {
              background: COLORS[selected.indexOf(c)] + "22",
              borderColor: COLORS[selected.indexOf(c)],
              color: COLORS[selected.indexOf(c)],
            } : {}}
            onClick={() => toggleCountry(c)}
          >
            {c}
          </button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={420}>
        <RadarChart data={radarData} margin={{ top: 20, right: 60, bottom: 20, left: 60 }}>
          <PolarGrid stroke="var(--border)" />
          <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12, fill: "var(--text2)" }} />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10, fill: "var(--text3)" }} />
          <Tooltip
            contentStyle={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
            formatter={(v, name) => [`${v}/100`, name]}
          />
          <Legend />
          {selected.map((c, i) => (
            <Radar key={c} name={c} dataKey={c}
              stroke={COLORS[i]} fill={COLORS[i]} fillOpacity={0.12} strokeWidth={2} />
          ))}
        </RadarChart>
      </ResponsiveContainer>

      <div className="compare-table">
        <table>
          <thead>
            <tr>
              <th>Country</th>
              <th>Gini</th>
              <th>GDP/capita</th>
              <th>Life exp.</th>
              <th>Literacy</th>
              <th>Poverty %</th>
            </tr>
          </thead>
          <tbody>
            {rawData.map((row, i) => (
              <tr key={row.country}>
                <td style={{ color: COLORS[i], fontWeight: 600 }}>{row.country}</td>
                <td>{row.gini_index?.toFixed(1) ?? "—"}</td>
                <td>${row.gdp_per_capita?.toLocaleString() ?? "—"}</td>
                <td>{row.life_expectancy?.toFixed(1) ?? "—"}</td>
                <td>{row.adult_literacy?.toFixed(1) ?? "—"}%</td>
                <td>{row.poverty_rate?.toFixed(1) ?? "—"}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
