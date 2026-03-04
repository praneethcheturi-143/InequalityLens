import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from "recharts";
import { api } from "../utils/api";

const COUNTRIES = [
  {code:"USA",name:"United States"},{code:"DEU",name:"Germany"},
  {code:"BRA",name:"Brazil"},{code:"SWE",name:"Sweden"},
  {code:"ZAF",name:"South Africa"},{code:"CHN",name:"China"},
  {code:"IND",name:"India"},{code:"GBR",name:"United Kingdom"},
];

export default function TrendPanel() {
  const [code, setCode] = useState("USA");
  const [horizon, setHorizon] = useState(5);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchForecast = async (c, h) => {
    setLoading(true);
    try {
      const data = await api.forecast(c, h);
      // Merge historical + forecast
      const hist = data.historical.map(r => ({ year: r.year, gini: r.gini }));
      const forecastLine = data.forecast.map(r => ({ year: r.year, forecast: r.gini_forecast }));
      const lastHistYear = hist[hist.length - 1]?.year;
      const lastHistGini = hist[hist.length - 1]?.gini;
      forecastLine.unshift({ year: lastHistYear, forecast: lastHistGini });
      setResult({ ...data, chartData: hist, forecastData: forecastLine });
    } catch (e) {
      setResult({ error: e.message });
    } finally { setLoading(false); }
  };

  useState(() => fetchForecast(code, horizon), []);

  return (
    <div className="panel">
      <div className="panel-header">
        <h2>Gini trend + forecasting</h2>
        <div className="controls-row">
          <select value={code} className="select" onChange={e => { setCode(e.target.value); fetchForecast(e.target.value, horizon); }}>
            {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
          </select>
          <label className="slider-label">
            Forecast {horizon}yr
            <input type="range" min={1} max={15} value={horizon} className="slider"
              onChange={e => { setHorizon(+e.target.value); fetchForecast(code, +e.target.value); }} />
          </label>
        </div>
      </div>

      {loading && <div className="loading-msg">Running Ridge regression forecast…</div>}
      {result?.error && <div className="error-msg">{result.error}</div>}

      {result && !result.error && (
        <>
          <div className="stats-row">
            <div className="stat-card">
              <span className="stat-val">{result.trend_direction === "improving" ? "↓ Improving" : "↑ Worsening"}</span>
              <span className="stat-label">Trend direction</span>
            </div>
            <div className="stat-card">
              <span className="stat-val">{result.trend_slope > 0 ? "+" : ""}{result.trend_slope?.toFixed(4)}</span>
              <span className="stat-label">Slope (Gini/year)</span>
            </div>
            <div className="stat-card">
              <span className="stat-val">{result.r2?.toFixed(3)}</span>
              <span className="stat-label">R² fit</span>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={380}>
            <LineChart>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="year" type="number" domain={["auto","auto"]} />
              <YAxis label={{ value: "Gini index", angle: -90, position: "insideLeft" }} />
              <Tooltip />
              <Legend />
              <Line data={result.chartData} type="monotone" dataKey="gini"
                stroke="#6366f1" strokeWidth={2} dot={false} name="Historical Gini" />
              <Line data={result.forecastData} type="monotone" dataKey="forecast"
                stroke="#f59e0b" strokeWidth={2} strokeDasharray="6 3" dot={false} name="Forecast" />
            </LineChart>
          </ResponsiveContainer>
        </>
      )}
    </div>
  );
}
