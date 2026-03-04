"""FastAPI route definitions for InequalityLens."""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional

from services.data_service import (
    get_choropleth_data, get_country_detail, get_top_unequal,
    get_summary_stats, get_lorenz_data, get_us_states, get_gini_timeseries, get_world_data,
)
from services.ml_service import (
    predict_gini, forecast_gini_trend, cluster_countries,
    compute_feature_importance, train_all,
)
from models.schemas import GiniPredictRequest, ForecastRequest, ClusterRequest

router = APIRouter(prefix="/api", tags=["inequality"])


# ── Data endpoints ──────────────────────────────
@router.get("/summary")
def summary():
    return get_summary_stats()


@router.get("/choropleth")
def choropleth():
    return get_choropleth_data()


@router.get("/country/{code}")
def country_detail(code: str):
    result = get_country_detail(code)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result


@router.get("/top-unequal")
def top_unequal(n: int = Query(default=10, ge=1, le=50)):
    return get_top_unequal(n)


@router.get("/lorenz")
def lorenz(country: Optional[str] = None):
    df = get_lorenz_data()
    if country:
        df = df[df["country"] == country]
        if df.empty:
            raise HTTPException(status_code=404, detail=f"Country '{country}' not in Lorenz dataset")
    return df.to_dict("records")


@router.get("/lorenz/countries")
def lorenz_countries():
    df = get_lorenz_data()
    return df.groupby("country")["gini"].first().reset_index().to_dict("records")


@router.get("/gini-timeseries")
def gini_timeseries(country_code: Optional[str] = None):
    df = get_gini_timeseries()
    if country_code:
        df = df[df["country_code"] == country_code.upper()]
    return df.to_dict("records")


@router.get("/us-states")
def us_states():
    return get_us_states().to_dict("records")


# ── ML endpoints ────────────────────────────────
@router.post("/predict/gini")
def predict(req: GiniPredictRequest):
    return predict_gini(req.model_dump())


@router.post("/forecast")
def forecast(req: ForecastRequest):
    ts = get_gini_timeseries()
    result = forecast_gini_trend(ts, req.country_code, req.horizon)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result


@router.get("/clusters")
def clusters(n_clusters: int = Query(default=4, ge=2, le=8)):
    world = get_world_data()
    return cluster_countries(world, n_clusters).to_dict("records")


@router.get("/feature-importance")
def feature_importance():
    world = get_world_data()
    return compute_feature_importance(world)


@router.post("/train")
def train_models():
    world = get_world_data()
    ts = get_gini_timeseries()
    results = train_all(world, ts)
    # strip non-serialisable model objects
    clean = {k: v for k, v in results.items() if k != "gini_predictor"}
    clean["gini_predictor"] = {
        k: v for k, v in results.get("gini_predictor", {}).items() if k != "model"
    }
    return {"status": "trained", "results": clean}
