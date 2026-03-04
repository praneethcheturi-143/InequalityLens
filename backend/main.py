"""InequalityLens — FastAPI application entry point."""

import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes import router

logging.basicConfig(level=logging.INFO)

app = FastAPI(
    title="InequalityLens API",
    description="Global inequality data, ML predictions, and analytics",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


@app.get("/")
def root():
    return {
        "name": "InequalityLens API",
        "status": "running",
        "docs": "/docs",
        "endpoints": ["/api/summary", "/api/choropleth", "/api/lorenz",
                      "/api/clusters", "/api/feature-importance", "/api/forecast"],
    }


@app.on_event("startup")
async def startup():
    import sys, os
    sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "data"))
    logging.info("InequalityLens API started — visit /docs for interactive API explorer")
