import { useAPI } from "../hooks/useAPI";
import { api } from "../utils/api";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, ZAxis } from "recharts";
import { useState } from "react";

export default function USStatesPanel() {
  const { data, loading } = useAPI(api.usStates);
  const [sort, setSort] = useState("median_household_income");

  const sorted = data ? [...data].sort((a, b) => b[sort] - a[sort]) : [];

  return (
    <div className="panel">
      <div className="panel-header">
        <h2>US state-level income inequality</h2>
        <select value={sort} onChange={e => setSort(e.target.value)} className="select">
          <option value="median_household_income">Sort by median income</option>
          <option value="poverty_rate_pct">Sort by poverty rate</option>
          <option value="population">Sort by population</option>
        </select>
      </div>

      {loading && <div className="loading-msg">Loading Census ACS data…</div>}

      {!loading && data && (
        <>
          <div className="stats-row">
            <div className="stat-card">
              <span className="stat-val">${Math.max(...data.map(d=>d.median_household_income)).toLocaleString()}</span>
              <span className="stat-label">Highest median income</span>
            </div>
            <div className="stat-card">
              <span className="stat-val">${Math.min(...data.map(d=>d.median_household_income)).toLocaleString()}</span>
              <span className="stat-label">Lowest median income</span>
            </div>
            <div className="stat-card">
              <span className="stat-val">{Math.max(...data.map(d=>d.poverty_rate_pct)).toFixed(1)}%</span>
              <span className="stat-label">Highest poverty rate</span>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={500}>
            <BarChart data={sorted} layout="vertical" margin={{ left: 120, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number"
                tickFormatter={sort === "median_household_income"
                  ? v => `$${(v/1000).toFixed(0)}k`
                  : sort === "poverty_rate_pct" ? v => `${v}%` : v => v.toLocaleString()} />
              <YAxis dataKey="state" type="category" width={110} tick={{ fontSize: 11 }} />
              <Tooltip formatter={v =>
                sort === "median_household_income" ? `$${v.toLocaleString()}`
                : sort === "poverty_rate_pct" ? `${v}%` : v.toLocaleString()} />
              <Bar dataKey={sort}
                fill={sort === "poverty_rate_pct" ? "#ef4444" : sort === "population" ? "#8b5cf6" : "#6366f1"} />
            </BarChart>
          </ResponsiveContainer>

          <h3 style={{marginTop:24}}>Income vs poverty correlation</h3>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart margin={{ top:10, right:30, bottom:30, left:30 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="median_household_income" name="Median income" tickFormatter={v=>`$${(v/1000).toFixed(0)}k`}
                label={{ value:"Median household income", position:"insideBottom", offset:-10 }} />
              <YAxis dataKey="poverty_rate_pct" name="Poverty rate %"
                label={{ value:"Poverty rate %", angle:-90, position:"insideLeft" }} />
              <ZAxis range={[40,40]} />
              <Tooltip content={({payload}) => payload?.[0] ? (
                <div className="tooltip">
                  <strong>{payload[0].payload.state}</strong>
                  <div>Income: ${payload[0].payload.median_household_income?.toLocaleString()}</div>
                  <div>Poverty: {payload[0].payload.poverty_rate_pct?.toFixed(1)}%</div>
                </div>
              ) : null} />
              <Scatter data={data} fill="#6366f1" opacity={0.7} />
            </ScatterChart>
          </ResponsiveContainer>
        </>
      )}
    </div>
  );
}
