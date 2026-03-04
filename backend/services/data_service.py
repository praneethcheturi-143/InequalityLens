"""
InequalityLens — Data Service
Loads processed Parquet files and serves clean dicts/DataFrames to the API layer.
Falls back to running the pipeline if files are missing.
"""

import logging
import pandas as pd
from pathlib import Path
from functools import lru_cache

log = logging.getLogger(__name__)
PROCESSED_DIR = Path(__file__).parent.parent.parent / "data" / "processed"


def _load(filename: str) -> pd.DataFrame:
    path = PROCESSED_DIR / filename
    if not path.exists():
        log.warning(f"{filename} not found — running pipeline…")
        import sys
        sys.path.insert(0, str(Path(__file__).parent.parent.parent / "data"))
        from data_pipeline import run_pipeline
        run_pipeline()
    return pd.read_csv(path)


@lru_cache(maxsize=1)
def get_world_data() -> pd.DataFrame:
    return _load("world_inequality.csv")


@lru_cache(maxsize=1)
def get_gini_timeseries() -> pd.DataFrame:
    return _load("gini_timeseries.csv")


@lru_cache(maxsize=1)
def get_us_states() -> pd.DataFrame:
    return _load("us_states.csv")


@lru_cache(maxsize=1)
def get_lorenz_data() -> pd.DataFrame:
    return _load("lorenz_curves.csv")


def get_choropleth_data() -> list[dict]:
    df = get_world_data()
    cols = ["country_code", "country_name", "gini_index", "gdp_per_capita",
            "life_expectancy", "poverty_rate", "adult_literacy"]
    available = [c for c in cols if c in df.columns]
    return df[available].dropna(subset=["gini_index"]).to_dict("records")


def get_country_detail(country_code: str) -> dict:
    world = get_world_data()
    ts = get_gini_timeseries()

    row = world[world["country_code"] == country_code.upper()]
    if row.empty:
        return {"error": f"Country {country_code} not found"}

    country_ts = ts[ts["country_code"] == country_code.upper()].sort_values("year")

    return {
        "profile": row.to_dict("records")[0],
        "gini_history": country_ts[["year", "gini"]].to_dict("records"),
    }


def get_top_unequal(n: int = 10) -> list[dict]:
    df = get_world_data().dropna(subset=["gini_index"])
    return df.nlargest(n, "gini_index")[
        ["country_name", "country_code", "gini_index", "gdp_per_capita", "life_expectancy"]
    ].to_dict("records")


def get_summary_stats() -> dict:
    df = get_world_data().dropna(subset=["gini_index"])
    return {
        "n_countries": int(len(df)),
        "mean_gini": round(float(df["gini_index"].mean()), 2),
        "median_gini": round(float(df["gini_index"].median()), 2),
        "max_gini": round(float(df["gini_index"].max()), 2),
        "min_gini": round(float(df["gini_index"].min()), 2),
        "most_unequal": df.loc[df["gini_index"].idxmax(), "country_name"],
        "most_equal": df.loc[df["gini_index"].idxmin(), "country_name"],
    }
