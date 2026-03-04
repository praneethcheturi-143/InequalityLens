const BASE = process.env.REACT_APP_API_URL || "http://localhost:8000";

async function get(path) {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`API ${path} → ${res.status}`);
  return res.json();
}

async function post(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API ${path} → ${res.status}`);
  return res.json();
}

export const api = {
  summary:           () => get("/api/summary"),
  choropleth:        () => get("/api/choropleth"),
  topUnequal:        (n = 10) => get(`/api/top-unequal?n=${n}`),
  lorenz:            (country) => get(country ? `/api/lorenz?country=${encodeURIComponent(country)}` : "/api/lorenz"),
  lorenzCountries:   () => get("/api/lorenz/countries"),
  giniTimeseries:    (code) => get(code ? `/api/gini-timeseries?country_code=${code}` : "/api/gini-timeseries"),
  usStates:          () => get("/api/us-states"),
  clusters:          (n = 4) => get(`/api/clusters?n_clusters=${n}`),
  featureImportance: () => get("/api/feature-importance"),
  forecast:          (country_code, horizon = 5) => post("/api/forecast", { country_code, horizon }),
  predictGini:       (features) => post("/api/predict/gini", features),
  train:             () => post("/api/train", {}),
  country:           (code) => get(`/api/country/${code}`),
};
