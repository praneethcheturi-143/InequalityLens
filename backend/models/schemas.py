"""Pydantic request/response schemas."""

from pydantic import BaseModel, Field
from typing import Optional


class GiniPredictRequest(BaseModel):
    gdp_per_capita: float = Field(..., gt=0, description="GDP per capita in USD")
    life_expectancy: float = Field(..., ge=30, le=100)
    adult_literacy: float = Field(..., ge=0, le=100)
    health_expenditure_pc: float = Field(..., ge=0)
    poverty_rate: float = Field(..., ge=0, le=100)


class ForecastRequest(BaseModel):
    country_code: str = Field(..., min_length=3, max_length=3)
    horizon: int = Field(default=5, ge=1, le=20)


class ClusterRequest(BaseModel):
    n_clusters: int = Field(default=4, ge=2, le=8)
