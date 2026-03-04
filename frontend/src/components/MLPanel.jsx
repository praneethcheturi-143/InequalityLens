import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, ZAxis, Legend } from "recharts";
import { useAPI } from "../hooks/useAPI";
import { api } from "../utils/api";

const CLUSTER_COLORS = ["#ef4444","#6366f1","#f59e0b","#10b981","#8b5cf6","#06b6d4"];
const CLUSTER_LABELS = {
  0: "High inequality", 1: "Low inequality, high dev", 2: "Middle income", 3: "Emerging",
};

export default function MLPanel() {
  const { data: importance } = useAPI(api.featureImportance);
  const { data: clusters } = useAPI(() => api.clusters(4));
  const [prediction, setPrediction] = useState(null);
  const [predLoading, setPredLoading] = useState(false);
  const [form, setForm] = useState({
    gdp_per_capita: 15000, life_expectancy: 72, adult_literacy: 85,
    health_expenditure_pc: 500, poverty_rate: 12,
  });

  const handlePredict = async () => {
    setPredLoading(true);
    try {
      const result = await api.predictGini(form);
      setPrediction(result);
    } catch (e) { setPrediction({ error: e.message }); }
    finally { setPredLoading(false); }
  };

  const importanceData = importance?.rf_importance
    ? Object.entries(importance.rf_importance).map(([k, v]) => ({
        feature: k.replace(/_/g, " "), importance: +(v * 100).toFixed(1),
        permutation: +((importance.permutation_importance?.[k] || 0) * 100).toFixed(1),
      })).sort((a, b) => b.importance - a.importance)
    : [];

  const scatterData = clusters ? CLUSTER_LABELS && Object.entries(CLUSTER_LABELS).map(([cluster, label]) => ({
    name: label,
    data: clusters.filter(c => c.cluster === +cluster)
      .map(c => ({ x: c.gdp_per_capita, y: c.gini_index, z: 60, name: c.country_name })),
  })) : [];

  return (
    <div className="panel">
      <div className="panel-header"><h2>Machine learning models</h2></div>

      <div className="ml-grid">
        {/* Feature importance */}
        <div className="ml-card">
          <h3>Random Forest — feature importance</h3>
          <p className="panel-desc">What drives inequality? RF importance vs permutation importance.</p>
          {importance && <p className="stat-inline">Baseline R²: {importance.baseline_r2}</p>}
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={importanceData} layout="vertical" margin={{ left: 120 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tickFormatter={v => `${v}%`} />
              <YAxis dataKey="feature" type="category" width={110} tick={{ fontSize: 12 }} />
              <Tooltip formatter={v => `${v}%`} />
              <Legend />
              <Bar dataKey="importance" name="RF importance" fill="#6366f1" />
              <Bar dataKey="permutation" name="Permutation" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Gini predictor */}
        <div className="ml-card">
          <h3>Gini predictor</h3>
          <p className="panel-desc">Adjust socioeconomic features to predict a country's Gini index.</p>
          <div className="predict-form">
            {Object.entries(form).map(([k, v]) => (
              <label key={k} className="predict-field">
                <span>{k.replace(/_/g," ")}</span>
                <input type="number" value={v} onChange={e => setForm({...form, [k]: +e.target.value})} />
              </label>
            ))}
            <button className="btn-primary" onClick={handlePredict} disabled={predLoading}>
              {predLoading ? "Predicting…" : "Predict Gini"}
            </button>
          </div>
          {prediction?.predicted_gini && (
            <div className="prediction-result">
              <div className="predicted-gini">{prediction.predicted_gini}</div>
              <div className="predicted-label">Predicted Gini index</div>
              <div className="contributions">
                {Object.entries(prediction.contributions || {}).map(([f, v]) => (
                  <div key={f} className="contrib-row">
                    <span>{f.replace(/_/g," ")}</span>
                    <span className={v > 0 ? "contrib-pos" : "contrib-neg"}>{v > 0 ? "+" : ""}{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {prediction?.error && <div className="error-msg">{prediction.error}</div>}
        </div>
      </div>

      {/* Clustering scatter */}
      <div className="ml-card" style={{ marginTop: 24 }}>
        <h3>Country clusters — KMeans (GDP vs Gini)</h3>
        <p className="panel-desc">Countries grouped by inequality + development profile.</p>
        <ResponsiveContainer width="100%" height={320}>
          <ScatterChart margin={{ top: 10, right: 30, bottom: 30, left: 30 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="x" name="GDP per capita" tickFormatter={v => `$${(v/1000).toFixed(0)}k`}
              label={{ value: "GDP per capita", position: "insideBottom", offset: -10 }} />
            <YAxis dataKey="y" name="Gini index"
              label={{ value: "Gini index", angle: -90, position: "insideLeft" }} />
            <ZAxis dataKey="z" range={[40, 60]} />
            <Tooltip cursor={{ strokeDasharray: "3 3" }}
              content={({ payload }) => payload?.[0] ? (
                <div className="tooltip">
                  <strong>{payload[0].payload.name}</strong>
                  <div>GDP: ${payload[0].payload.x?.toFixed(0)}</div>
                  <div>Gini: {payload[0].payload.y?.toFixed(1)}</div>
                </div>
              ) : null} />
            <Legend />
            {scatterData.map((s, i) => (
              <Scatter key={s.name} name={s.name} data={s.data} fill={CLUSTER_COLORS[i]} opacity={0.75} />
            ))}
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
