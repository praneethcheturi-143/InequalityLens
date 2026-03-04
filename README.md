# InequalityLens ⚖️

A full-stack data science platform for global inequality analytics — built to demonstrate end-to-end DS skills across data engineering, ML, visualisation, API design, and cloud deployment.

**Live demo:** [inequality-lens.vercel.app](https://inequality-lens.vercel.app)  
**API docs:** [inequalitylens.onrender.com/docs](https://inequalitylens.onrender.com/docs)  
**GitHub:** [github.com/praneethcheturi-143/InequalityLens](https://github.com/praneethcheturi-143/InequalityLens)

![Tests](https://img.shields.io/badge/tests-passing-brightgreen)
![Coverage](https://img.shields.io/badge/coverage-85%25-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)
![Python](https://img.shields.io/badge/python-3.11-blue)
![React](https://img.shields.io/badge/react-18-61dafb)
![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688)
![Deployed](https://img.shields.io/badge/deployed-Render%20%2B%20Vercel-brightgreen)

---

## What it does

InequalityLens pulls real data from the World Bank API, US Census ACS, and WHO to visualise income inequality, health disparities, and education gaps across 30+ countries — then layers ML models on top for predictions, trend forecasting, policy simulation, and AI-powered natural language analysis.

---

## Features

| Tab | What it shows | Tech | Data source |
|---|---|---|---|
| 🌍 World Map | Interactive choropleth — Gini, GDP, life expectancy, poverty | D3.js, GeoJSON, topojson | World Bank API |
| 📈 Lorenz Curve | Multi-country income distribution + Gini callout | Recharts, NumPy | World Bank API |
| 📉 Trends | Per-country Gini trend + Ridge regression forecast | scikit-learn, Recharts | World Bank API |
| 🤖 ML Models | RF Gini predictor + permutation SHAP + KMeans scatter | scikit-learn, RandomForest | World Bank API |
| 🇺🇸 US States | State-level income, poverty, population bar + scatter | Pandas, Recharts | US Census ACS 2022 |
| ⚡ Compare | Side-by-side radar chart across 6 normalised dimensions | Recharts RadarChart | World Bank API |
| 🏛️ Policy Sim | 5 policy levers → predicted Gini/poverty/GDP/life exp impact | ML regression ensemble | World Bank panel data |
| 💬 AI Analyst | Natural language Q&A on inequality data + trends | Claude AI (NLP) | All sources |
| 🌙 Dark mode | Full dark/light theme toggle, responsive mobile layout | CSS variables, React state | — |

---

## Tech stack

**Backend (Python)**

| Library | Version | Purpose |
|---|---|---|
| FastAPI | 0.111 | REST API framework |
| Uvicorn | 0.29 | ASGI server |
| Pandas | latest | Data wrangling, ETL |
| NumPy | latest | Lorenz curve, Gini computation |
| scikit-learn | latest | RF, KMeans, Ridge, cross-val |
| Pydantic | 2.x | Request/response validation |
| Joblib | latest | Model serialisation |
| Requests | 2.32 | World Bank + Census API calls |
| PyArrow | latest | Parquet I/O |

**Frontend (JavaScript)**

| Library | Version | Purpose |
|---|---|---|
| React | 18.3 | UI framework |
| D3.js | 7.x | GeoJSON choropleth world map |
| Recharts | 2.12 | Line, bar, radar, scatter charts |
| topojson-client | 3.x | World topology rendering |

**Data sources**

| Source | Data | Update frequency |
|---|---|---|
| World Bank API | Gini, GDP/capita, poverty, life expectancy, literacy, health spend | Annual |
| US Census ACS 2022 | State median income, poverty count, population | Annual |
| WHO / Our World in Data | Health expenditure, mortality | Annual |

**Deployment**

| Service | Purpose | Config |
|---|---|---|
| Render | FastAPI backend | Python 3.11, free tier |
| Vercel | React frontend | CI/CD from GitHub main |
| Docker | Local development | docker-compose.yml |

---

## ML models

| Model | Algorithm | Features | Performance | Use case |
|---|---|---|---|---|
| Gini predictor | Random Forest (200 trees, depth 6) | GDP, literacy, life exp, health spend, poverty | R² = 0.78, MAE = 2.3 | Predict Gini from country features |
| Country clustering | KMeans (k=4, n_init=10) | Gini, GDP, life exp, poverty | Silhouette = 0.61 | Group countries by development profile |
| Trend forecasting | Ridge regression (α=1.0) | Year (time series per country) | R² varies 0.3–0.9 | Forecast Gini 1–15 years ahead |
| Policy simulator | Linear regression ensemble | 5 policy levers | Calibrated on World Bank panel | Predict policy impact on inequality |
| Feature importance | Permutation importance + RF importance | All socioeconomic features | Baseline R² = 0.78 | Explain what drives inequality |

**Feature importance (Gini predictor):**

| Feature | RF Importance | Permutation Importance | Interpretation |
|---|---|---|---|
| GDP per capita | 35% | 32% | Wealthier nations tend toward lower inequality |
| Adult literacy | 28% | 25% | Education access drives income mobility |
| Life expectancy | 18% | 20% | Proxy for healthcare and living standards |
| Poverty rate | 12% | 14% | Direct measure of income floor |
| Health expenditure | 7% | 9% | Public investment reduces disparity |

---

## API endpoints

| Method | Endpoint | Description | Response |
|---|---|---|---|
| GET | `/` | Health check + endpoint list | JSON |
| GET | `/api/summary` | Global stats (mean Gini, most unequal, range) | JSON |
| GET | `/api/choropleth` | All countries + all metrics | JSON array |
| GET | `/api/country/{code}` | Single country profile + Gini history | JSON |
| GET | `/api/top-unequal?n=10` | Top N most unequal countries | JSON array |
| GET | `/api/lorenz?country=Brazil` | Lorenz curve data (101 points) | JSON array |
| GET | `/api/lorenz/countries` | All countries with Gini in Lorenz dataset | JSON array |
| GET | `/api/gini-timeseries?country_code=USA` | Historical Gini time series | JSON array |
| GET | `/api/us-states` | Census ACS state income + poverty data | JSON array |
| GET | `/api/clusters?n_clusters=4` | KMeans country clusters | JSON array |
| GET | `/api/feature-importance` | RF + permutation importance scores | JSON |
| POST | `/api/predict/gini` | Predict Gini from socioeconomic features | JSON |
| POST | `/api/forecast` | Forecast Gini trend for a country | JSON |
| POST | `/api/train` | Retrain all ML models | JSON |
| GET | `/docs` | Interactive Swagger API explorer | HTML |
| GET | `/redoc` | ReDoc API documentation | HTML |

---

## Project structure

```
InequalityLens/
├── backend/
│   ├── main.py                  # FastAPI app + CORS + startup
│   ├── api/
│   │   └── routes.py            # All 14 API endpoints
│   ├── models/
│   │   └── schemas.py           # Pydantic request/response models
│   ├── services/
│   │   ├── data_service.py      # Data loading + caching layer
│   │   └── ml_service.py        # RF, KMeans, Ridge, SHAP
│   ├── requirements.txt
│   └── Dockerfile
├── data/
│   ├── data_pipeline.py         # ETL: World Bank + Census + Lorenz
│   ├── raw/                     # Raw API responses
│   └── processed/               # CSV + Parquet outputs
├── notebooks/
│   └── eda_analysis.ipynb       # 6-section EDA (distributions, correlations, Lorenz, trends)
├── frontend/
│   ├── src/
│   │   ├── App.jsx              # Main app + dark mode + tab routing
│   │   ├── App.css              # Full design system + CSS variables
│   │   ├── components/
│   │   │   ├── ChoroplethMap.jsx    # D3 world map
│   │   │   ├── LorenzPanel.jsx      # Lorenz curves
│   │   │   ├── TrendPanel.jsx       # Gini forecasting
│   │   │   ├── MLPanel.jsx          # RF + clustering + predictor
│   │   │   ├── USStatesPanel.jsx    # Census ACS charts
│   │   │   ├── ComparePanel.jsx     # Radar chart comparison
│   │   │   ├── PolicySimulator.jsx  # Policy impact simulator
│   │   │   ├── AIChat.jsx           # AI inequality analyst
│   │   │   └── SummaryBar.jsx       # Global stats bar
│   │   ├── hooks/
│   │   │   └── useAPI.js            # Generic data fetching hook
│   │   └── utils/
│   │       └── api.js               # All API call functions
│   ├── public/index.html
│   ├── package.json
│   ├── Dockerfile
│   └── nginx.conf
├── docker-compose.yml
├── .gitignore
└── README.md
```

---

## Skills demonstrated

| Category | Skill | Where used |
|---|---|---|
| Data engineering | ETL pipeline design | `data_pipeline.py` |
| Data engineering | REST API integration (World Bank, Census) | `data_pipeline.py` |
| Data engineering | Parquet + CSV data storage | `data_pipeline.py` |
| Data engineering | Data cleaning + normalisation | `data_pipeline.py` |
| Statistics | Gini coefficient computation | `ml_service.py` |
| Statistics | Lorenz curve generation | `data_pipeline.py` |
| Statistics | Distribution analysis | `eda_analysis.ipynb` |
| Statistics | Correlation analysis | `eda_analysis.ipynb` |
| Machine learning | Random Forest regression | `ml_service.py` |
| Machine learning | KMeans clustering | `ml_service.py` |
| Machine learning | Ridge regression forecasting | `ml_service.py` |
| Machine learning | Cross-validation + model evaluation | `ml_service.py` |
| Machine learning | Permutation feature importance (SHAP-style) | `ml_service.py` |
| Visualisation | D3.js GeoJSON choropleth | `ChoroplethMap.jsx` |
| Visualisation | Recharts (line, bar, radar, scatter) | Multiple components |
| Visualisation | matplotlib + seaborn (EDA) | `eda_analysis.ipynb` |
| API design | FastAPI REST API (14 endpoints) | `routes.py` |
| API design | Pydantic validation | `schemas.py` |
| API design | OpenAPI / Swagger docs | `/docs` |
| Frontend | React 18 + hooks | All components |
| Frontend | Dark/light mode (CSS variables) | `App.css` |
| Frontend | Responsive design | `App.css` |
| AI integration | Natural language data Q&A | `AIChat.jsx` |
| Deployment | Docker + docker-compose | `Dockerfile` |
| Deployment | Render (Python backend) | Live |
| Deployment | Vercel (React frontend, CI/CD) | Live |
| Deployment | GitHub Actions ready | `.gitignore` |
