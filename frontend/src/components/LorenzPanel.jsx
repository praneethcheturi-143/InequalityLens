import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine, ResponsiveContainer } from "recharts";
import { useAPI } from "../hooks/useAPI";
import { api } from "../utils/api";

const COLORS = ["#6366f1","#10b981","#f59e0b","#ef4444","#8b5cf6","#06b6d4","#84cc16","#f97316"];

export default function LorenzPanel() {
  const { data: allData } = useAPI(api.lorenzCountries);
  const [selected, setSelected] = useState(["United States","Sweden","Brazil","South Africa"]);
  const [lorenzData, setLorenzData] = useState(null);

  const fetchSelected = async (countries) => {
    const results = await Promise.all(countries.map(c => api.lorenz(c)));
    const byCountry = {};
    results.forEach((rows, i) => { byCountry[countries[i]] = rows; });
    // Merge into chart-friendly format: 101 points each with all countries
    const merged = [];
    for (let i = 0; i <= 100; i++) {
      const point = { population_share: i / 100 };
      countries.forEach(c => {
        const row = byCountry[c]?.[i];
        if (row) point[c] = row.income_share;
      });
      merged.push(point);
    }
    setLorenzData({ chart: merged, ginis: Object.fromEntries(
      results.map((rows, i) => [countries[i], rows[0]?.gini])
    )});
  };

  const toggleCountry = (c) => {
    const next = selected.includes(c) ? selected.filter(x => x !== c) : [...selected, c];
    setSelected(next);
    fetchSelected(next);
  };

  useState(() => { fetchSelected(selected); }, []);

  const equalityLine = [{ population_share: 0, equality: 0 }, { population_share: 1, equality: 1 }];

  return (
    <div className="panel">
      <div className="panel-header">
        <h2>Lorenz curves — income inequality</h2>
      </div>
      <p className="panel-desc">
        The Lorenz curve shows how income is distributed across a population.
        The further the curve bows below the line of perfect equality, the higher the Gini index.
      </p>

      <div className="country-chips">
        {(allData || []).map((row, i) => (
          <button
            key={row.country}
            className={`chip ${selected.includes(row.country) ? "chip-active" : ""}`}
            style={selected.includes(row.country) ? {
              background: COLORS[selected.indexOf(row.country) % COLORS.length] + "22",
              borderColor: COLORS[selected.indexOf(row.country) % COLORS.length],
              color: COLORS[selected.indexOf(row.country) % COLORS.length],
            } : {}}
            onClick={() => toggleCountry(row.country)}
          >
            {row.country} <span className="chip-gini">({row.gini?.toFixed(2)})</span>
          </button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={lorenzData?.chart || []}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="population_share" tickFormatter={v => `${(v*100).toFixed(0)}%`}
            label={{ value: "Population share", position: "insideBottom", offset: -5 }} />
          <YAxis tickFormatter={v => `${(v*100).toFixed(0)}%`}
            label={{ value: "Income share", angle: -90, position: "insideLeft" }} />
          <Tooltip formatter={(v, name) => [`${(v*100).toFixed(1)}%`, name]} />
          <Legend />
          <Line type="monotone" dataKey="equality" data={[{population_share:0,equality:0},{population_share:1,equality:1}]}
            stroke="#ccc" strokeDasharray="5 5" dot={false} name="Perfect equality" />
          {selected.map((c, i) => (
            <Line key={c} type="monotone" dataKey={c}
              stroke={COLORS[i % COLORS.length]} dot={false} strokeWidth={2} />
          ))}
        </LineChart>
      </ResponsiveContainer>

      {lorenzData?.ginis && (
        <div className="gini-badges">
          {selected.map((c, i) => (
            <span key={c} className="gini-badge" style={{ background: COLORS[i % COLORS.length] + "22", color: COLORS[i % COLORS.length], border: `1px solid ${COLORS[i % COLORS.length]}` }}>
              {c}: Gini {lorenzData.ginis[c]?.toFixed(3)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
