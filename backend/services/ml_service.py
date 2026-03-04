"""
InequalityLens — ML Service
Models:
  1. Gini predictor     — Random Forest regression (Gini from socioeconomic features)
  2. Country clustering — KMeans on normalised features
  3. Trend forecasting  — Linear regression on Gini time series per country
  4. SHAP explainability — feature importance for the Gini predictor
"""

import logging
import numpy as np
import pandas as pd
from pathlib import Path
from typing import Optional

from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.linear_model import LinearRegression, Ridge
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import cross_val_score, train_test_split
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.pipeline import Pipeline
import joblib

log = logging.getLogger(__name__)

PROCESSED_DIR = Path(__file__).parent.parent.parent / "data" / "processed"
MODELS_DIR = Path(__file__).parent.parent.parent / "data" / "models"
MODELS_DIR.mkdir(exist_ok=True)

# ──────────────────────────────────────────────
# 1. GINI PREDICTOR (Random Forest)
# ──────────────────────────────────────────────
GINI_FEATURES = ["gdp_per_capita", "life_expectancy", "adult_literacy", "health_expenditure_pc", "poverty_rate"]

def train_gini_predictor(df: pd.DataFrame) -> dict:
    """Train RF to predict Gini index from socioeconomic features."""
    subset = df[GINI_FEATURES + ["gini_index"]].dropna()
    if len(subset) < 10:
        log.warning("Too few rows for Gini predictor — generating synthetic data")
        subset = _synthetic_training_data()

    X = subset[GINI_FEATURES]
    y = subset["gini_index"]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    rf = RandomForestRegressor(n_estimators=200, max_depth=6, random_state=42, n_jobs=-1)
    rf.fit(X_train, y_train)

    y_pred = rf.predict(X_test)
    mae = mean_absolute_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)
    cv_scores = cross_val_score(rf, X, y, cv=5, scoring="r2")

    # Feature importances
    importances = dict(zip(GINI_FEATURES, rf.feature_importances_.tolist()))

    # Save model
    joblib.dump(rf, MODELS_DIR / "gini_predictor.pkl")
    log.info(f"  Gini predictor — MAE: {mae:.2f}, R²: {r2:.3f}, CV R²: {cv_scores.mean():.3f}")

    return {
        "model": rf,
        "mae": round(mae, 3),
        "r2": round(r2, 3),
        "cv_r2_mean": round(cv_scores.mean(), 3),
        "cv_r2_std": round(cv_scores.std(), 3),
        "feature_importances": {k: round(v, 4) for k, v in importances.items()},
        "n_train": len(X_train),
        "n_test": len(X_test),
    }

def predict_gini(features: dict) -> dict:
    """Predict Gini for a single country's features."""
    try:
        rf = joblib.load(MODELS_DIR / "gini_predictor.pkl")
    except FileNotFoundError:
        return {"error": "Model not trained yet. Run /api/train first."}

    row = pd.DataFrame([{f: features.get(f, np.nan) for f in GINI_FEATURES}])
    pred = rf.predict(row)[0]

    # SHAP-style manual permutation importance for this prediction
    baseline = pred
    contributions = {}
    for feat in GINI_FEATURES:
        perturbed = row.copy()
        perturbed[feat] = row[feat].mean() if not np.isnan(row[feat].values[0]) else 0
        contributions[feat] = round(float(baseline - rf.predict(perturbed)[0]), 3)

    return {
        "predicted_gini": round(float(pred), 2),
        "contributions": contributions,
    }

# ──────────────────────────────────────────────
# 2. COUNTRY CLUSTERING (KMeans)
# ──────────────────────────────────────────────
CLUSTER_FEATURES = ["gini_index", "gdp_per_capita", "life_expectancy", "poverty_rate"]
CLUSTER_LABELS = {
    0: "High inequality, low development",
    1: "Low inequality, high development",
    2: "Middle income, moderate inequality",
    3: "Emerging, high poverty",
}

def cluster_countries(df: pd.DataFrame, n_clusters: int = 4) -> pd.DataFrame:
    """KMeans clustering of countries by development + inequality profile."""
    subset = df[["country_code", "country_name"] + CLUSTER_FEATURES].dropna()
    if len(subset) < n_clusters * 3:
        log.warning("Too few rows for clustering — using synthetic")
        subset = _synthetic_cluster_data()

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(subset[CLUSTER_FEATURES])

    km = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
    subset = subset.copy()
    subset["cluster"] = km.fit_predict(X_scaled)
    subset["cluster_label"] = subset["cluster"].map(CLUSTER_LABELS)

    # Reorder clusters by mean Gini so label 0 = highest inequality
    cluster_gini = subset.groupby("cluster")["gini_index"].mean().sort_values(ascending=False)
    rank_map = {old: new for new, old in enumerate(cluster_gini.index)}
    subset["cluster"] = subset["cluster"].map(rank_map)
    subset["cluster_label"] = subset["cluster"].map(CLUSTER_LABELS)

    joblib.dump({"model": km, "scaler": scaler}, MODELS_DIR / "country_clusters.pkl")
    log.info(f"  Clustering: {n_clusters} clusters over {len(subset)} countries")
    return subset

# ──────────────────────────────────────────────
# 3. TREND FORECASTING
# ──────────────────────────────────────────────
def forecast_gini_trend(gini_ts: pd.DataFrame, country_code: str, horizon: int = 5) -> dict:
    """Forecast Gini for a country using Ridge regression on year."""
    country_df = gini_ts[gini_ts["country_code"] == country_code].sort_values("year")
    if len(country_df) < 5:
        return {"error": f"Insufficient data for {country_code}"}

    X = country_df[["year"]].values
    y = country_df["gini"].values

    model = Ridge(alpha=1.0)
    model.fit(X, y)

    last_year = int(country_df["year"].max())
    future_years = np.arange(last_year + 1, last_year + horizon + 1).reshape(-1, 1)
    forecasts = model.predict(future_years)

    r2 = r2_score(y, model.predict(X))

    return {
        "country_code": country_code,
        "country_name": country_df["country_name"].iloc[0],
        "historical": country_df[["year", "gini"]].to_dict("records"),
        "forecast": [
            {"year": int(yr), "gini_forecast": round(float(gini), 2)}
            for yr, gini in zip(future_years.flatten(), forecasts)
        ],
        "trend_slope": round(float(model.coef_[0]), 4),
        "r2": round(r2, 3),
        "trend_direction": "improving" if model.coef_[0] < 0 else "worsening",
    }

# ──────────────────────────────────────────────
# 4. SHAP-STYLE FEATURE IMPORTANCE
# ──────────────────────────────────────────────
def compute_feature_importance(df: pd.DataFrame) -> dict:
    """Return RF feature importances + permutation importance for the Gini model."""
    subset = df[GINI_FEATURES + ["gini_index"]].dropna()
    if len(subset) < 10:
        subset = _synthetic_training_data()

    X = subset[GINI_FEATURES]
    y = subset["gini_index"]

    rf = RandomForestRegressor(n_estimators=100, random_state=42)
    rf.fit(X, y)

    # Permutation importance (manual)
    baseline_r2 = r2_score(y, rf.predict(X))
    perm_importance = {}
    for feat in GINI_FEATURES:
        X_perm = X.copy()
        X_perm[feat] = np.random.default_rng(0).permutation(X_perm[feat].values)
        perm_r2 = r2_score(y, rf.predict(X_perm))
        perm_importance[feat] = round(baseline_r2 - perm_r2, 4)

    return {
        "rf_importance": {f: round(float(v), 4) for f, v in zip(GINI_FEATURES, rf.feature_importances_)},
        "permutation_importance": perm_importance,
        "baseline_r2": round(baseline_r2, 3),
    }

# ──────────────────────────────────────────────
# 5. SYNTHETIC DATA HELPERS
# ──────────────────────────────────────────────
def _synthetic_training_data() -> pd.DataFrame:
    rng = np.random.default_rng(42)
    n = 80
    gdp = rng.uniform(1000, 70000, n)
    life = rng.uniform(55, 85, n)
    literacy = rng.uniform(50, 99, n)
    health = rng.uniform(50, 12000, n)
    poverty = rng.uniform(0.5, 45, n)
    # Gini negatively correlated with development
    gini = 65 - 0.0003*gdp - 0.3*life + 0.1*(100-literacy) + 0.2*poverty + rng.normal(0, 3, n)
    gini = np.clip(gini, 20, 70)
    return pd.DataFrame({
        "gdp_per_capita": gdp, "life_expectancy": life, "adult_literacy": literacy,
        "health_expenditure_pc": health, "poverty_rate": poverty, "gini_index": gini,
    })

def _synthetic_cluster_data() -> pd.DataFrame:
    rng = np.random.default_rng(10)
    n = 40
    return pd.DataFrame({
        "country_code": [f"C{i:02d}" for i in range(n)],
        "country_name": [f"Country {i}" for i in range(n)],
        "gini_index": rng.uniform(25, 65, n),
        "gdp_per_capita": rng.uniform(500, 60000, n),
        "life_expectancy": rng.uniform(55, 85, n),
        "poverty_rate": rng.uniform(0.5, 40, n),
    })

# ──────────────────────────────────────────────
# 6. TRAIN ALL MODELS
# ──────────────────────────────────────────────
def train_all(world_df: pd.DataFrame, gini_ts: pd.DataFrame) -> dict:
    log.info("Training all ML models…")
    results = {}
    results["gini_predictor"] = train_gini_predictor(world_df)
    results["clustering"] = cluster_countries(world_df).to_dict("records")
    results["feature_importance"] = compute_feature_importance(world_df)

    # Forecast for a few key countries
    for code in ["USA", "DEU", "BRA", "SWE", "ZAF"]:
        results[f"forecast_{code}"] = forecast_gini_trend(gini_ts, code)

    log.info("  ✓ All models trained")
    return results
