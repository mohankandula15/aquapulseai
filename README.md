# AquaPulse AI: ML-Based Intelligent Water Quality Monitoring and Early Warning System

[![Python](https://img.shields.io/badge/Python-3.13-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev/)
[![Scikit-Learn](https://img.shields.io/badge/Scikit--Learn-1.9+-F7931E.svg)](https://scikit-learn.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4+-38B2AC.svg)](https://tailwindcss.com/)

An end-to-end smart web application integrating **Machine Learning**, **Unsupervised Anomaly Detection**, **Autoregressive Time-Series Forecasting**, and **Explainable AI (XAI)** to monitor, evaluate, and provide predictive early warnings for drinking water reservoirs, municipal treatment facilities, river intakes, and industrial effluent waterways.

---

## 🌟 Key System Capabilities

### 1. 📊 Multi-Parameter Water Telemetry Ingestion
Continuously monitors 6 core physical and chemical water parameters according to **WHO & EPA Statutory Standards**:
- **pH Level** (Acidity/Alkalinity, safe range: `6.5 - 8.5`)
- **Turbidity** (Suspended particulates & clarity, standard: `< 5.0 NTU`)
- **Total Dissolved Solids (TDS)** (Inorganic salts & minerals, standard: `< 500 mg/L`)
- **Dissolved Oxygen (DO)** (Aeration & aquatic health, safe threshold: `> 5.0 mg/L`, hypoxia: `< 3.0 mg/L`)
- **Water Temperature** (Affects microbial kinetics & gas solubility, nominal: `15 - 28 °C`)
- **Electrical Conductivity (EC)** (Dissolved ions & salinity indicator, standard: `< 800 µS/cm`)

### 2. 🧠 Machine Learning Potability & Water Quality Index (WQI)
- **Random Forest Classification Model**: Evaluates multi-parameter vectors to classify water as **Potable / Safe (1)** or **Non-Potable / Contaminated (0)** with calibrated confidence probabilities.
- **Weighted Arithmetic WQI Model**: Calculates standardized Water Quality Index (0 to 100) based on weighted relative sub-indices ($WQI = \sum (q_i \cdot w_i) / \sum w_i$):
  - `85 - 100`: **Excellent**
  - `70 - 84`: **Good**
  - `50 - 69`: **Moderate**
  - `35 - 49`: **Poor**
  - `< 35`: **Severe / Unsuitable for Drinking**

### 3. ⚡ Unsupervised Anomaly Detection (Isolation Forest)
- Employs an **Isolation Forest** ensemble model trained on nominal hydrological distributions to detect multi-parameter anomalies, sudden chemical flushes, sensor drift, and illegal effluent dumping.
- Produces normalized anomaly intensity scores (0% to 100%) and logs outlier events with instant operational alerting.

### 4. 📈 Predictive Time-Series Forecasting & Early Warning
- Multi-step autoregressive projection models compute parameter trajectories across **+12h, +24h, and +48h horizons** incorporating diurnal solar-temperature and photosynthetic dissolved-oxygen cycles.
- Features expanding **95% Confidence Interval (CI) bands**.
- **Automated Early Warning Engine**: Scans future forecast trajectories against statutory limits. If a parameter is projected to cross critical limits in the future, the system issues advance warnings hours before contamination arrives at intake points.

### 5. 🔍 Explainable AI (XAI) Feature Attribution
- Demystifies complex ML model inferences through **SHAP-style Feature Attributions**.
- Visualizes how each parameter positively or negatively shifted the prediction away from the global healthy baseline (+65%).
- Provides plain-language diagnostic narratives explaining root cause penalties (e.g. *"Turbidity of 14.2 NTU exceeds safe threshold by 184%, reducing potability probability by -28.4%"*).

### 6. 🚨 Intelligent Early Warning Alert Management Center
- Multi-tiered alerting (`CRITICAL`, `WARNING`, `INFO`).
- Combines parameter threshold breaches, ML anomaly detections, potability degradation alarms, and forward-looking forecast warnings.
- Delivers actionable, **prescriptive remediation instructions** (e.g., buffer dosing, aeration diffuser activation, coagulation adjustments).
- Full operator acknowledgment audit trail with timestamps and duty officer sign-off.

### 7. 📁 Batch CSV Dataset Upload & Analytics Lab
- Bulk evaluation module allowing environmental researchers and field teams to drag & drop or upload multi-row CSV telemetry datasets.
- Automatically validates headers (`ph`, `turbidity`, `tds`, `temperature`, `dissolved_oxygen`, `conductivity`), evaluates ML potability, computes WQI, flags multi-parameter anomalies, identifies key driving factors per sample, and exports enriched CSV reports.
- Includes a 1-click **Download Sample CSV Template** for instant testing.

### 8. 📜 Water Quality Compliance & Environmental Audit Hub
- Generates statutory compliance scorecards benchmarked against **WHO & US EPA** drinking water regulations over customizable audit windows (7, 14, 30, or 60 days).
- Evaluates compliance rates %, violation counts by parameter, and assigns **Compliance Safety Grades** (`A+`, `B`, `C`, `D`, `F`) across all monitoring stations.
- Provides direct CSV telemetry export for municipal reporting and environmental filings.

### 9. 🗺️ Station Geospatial Surveillance & IoT Simulator
- Real-time map displaying distributed hydrological monitoring stations (Reservoir, River Intake, Metro Finishing Treatment Plant, Industrial Outfall Canal, Deep Aquifer Well).
- **Automated Live Streaming Mode**: One-click toggle switch in the UI that continuously generates automated sensor ticks every 6 seconds.
- **Anomaly Injection Sandbox**: Test the system on-demand with realistic scenarios:
  - *Industrial Acid Spill* (pH collapse to 4.2)
  - *Storm Mudslide & Turbidity Surge* (Turbidity spike to 25 NTU)
  - *Heavy Chemical / Electrolyte Dumping* (TDS > 1600 mg/L, conductivity > 2600 µS/cm)
  - *Severe Septic Hypoxia* (DO collapse to < 1.5 mg/L)
  - *Caustic Alkaline Influx* (pH surge to > 10.5)

---

## 🏗️ System Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                        React.js + Tailwind UI                          │
│   Dashboard • Forecasting • XAI Lab • Anomalies • Alerts • Geo Map     │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │ REST API (JSON)
┌────────────────────────────────────▼───────────────────────────────────┐
│                          FastAPI Web Backend                           │
├────────────────────────────────────────────────────────────────────────┤
│ • API Routers: /stations, /readings, /ml, /anomalies, /alerts, /sim   │
│ • Service Layer: Alert Engine, Sensor Simulator, Seed Service         │
│ • ML Core: Random Forest, Isolation Forest, Time-Series Forecaster,    │
│            SHAP-style Explainable AI, Weighted Arithmetic WQI         │
│ • ORM / Data Layer: SQLAlchemy (SQLite / PostgreSQL Support)          │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │
┌────────────────────────────────────▼───────────────────────────────────┐
│                    Relational Storage & Model Cache                    │
│   • SQLite / PostgreSQL Database (Stations, Readings, Alerts)          │
│   • Serialized Models (potability_model.joblib, anomaly_detector.joblib│
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start Guide

### Option A: One-Click Startup (Windows)
Double-click the included batch launcher or run in PowerShell:
```powershell
.\start_system.bat
```
or
```powershell
.\start_system.ps1
```
This automatically starts the FastAPI backend on `http://127.0.0.1:8000` and Vite React frontend on `http://localhost:3000`.

---

### Option B: Manual Startup

#### 1. Backend Setup
```bash
cd backend

# Create and activate virtual environment
python -m venv venv
.\venv\Scripts\activate   # Windows
# source venv/bin/activate # Linux/macOS

# Install dependencies
pip install -r requirements.txt

# Start backend server
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
*The backend will automatically generate realistic training data, train ML models, and seed 5 stations with 14 days of realistic chronological telemetry on its very first run!*

- **Backend API & Swagger Docs**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **Health Check**: [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health)

#### 2. Frontend Setup
In a new terminal window:
```bash
cd frontend

# Install node dependencies
npm install

# Start development server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🗄️ Database Configuration (PostgreSQL Support)

By default, the application runs on a zero-configuration SQLite database (`watermonitor.db`).
To switch to **PostgreSQL**, simply set the `DATABASE_URL` environment variable:
```bash
# In backend/.env or your terminal:
DATABASE_URL=postgresql://username:password@localhost:5432/watermonitor
```
SQLAlchemy will automatically handle database connections, connection pooling, and table creation.

### Option C: Docker & Docker Compose (Containerized Production)
Spin up the entire stack (PostgreSQL 15 + FastAPI Backend + React/Nginx Frontend) in isolated containers:
```bash
docker compose up --build
```
- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend API: [http://localhost:8000/docs](http://localhost:8000/docs)
- PostgreSQL Database: `localhost:5432`

---

## 🧪 Testing the API

Run the comprehensive test script to verify all 10 endpoints:
```bash
cd backend
.\venv\Scripts\python.exe test_api.py
```
This exercises:
1. Health check & model status
2. Station card listings & latest readings
3. ML Potability prediction, WQI computation, and XAI feature attributions
4. Autoregressive Time-series forecasting
5. Anomaly detection queries
6. Early warning alert management
7. IoT telemetry simulation & anomaly injection
8. Sample CSV template download & validation
9. Bulk CSV dataset upload and batch prediction pipeline
10. Environmental compliance audit scorecard aggregation

---

## 📄 REST API Endpoint Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | System health check and model loading state |
| `GET` | `/api/stations` | Station summaries with live WQI and active alert counts |
| `GET` | `/api/readings` | Historical telemetry filterable by station, time, anomalies |
| `POST` | `/api/readings` | Ingest new sensor reading (triggers ML & alert engine) |
| `POST` | `/api/ml/predict` | On-demand ML prediction with SHAP Explainable AI |
| `GET` | `/api/ml/sample-csv` | Download sample water quality CSV template |
| `POST` | `/api/ml/upload-csv` | Upload multi-row CSV dataset for batch evaluation |
| `GET` | `/api/ml/forecast/{id}` | Multi-step predictive forecast with early warning breaches |
| `GET` | `/api/ml/model-info` | Model evaluation metrics, accuracy, feature importances |
| `POST` | `/api/ml/retrain` | Trigger model retraining and hot-reloading |
| `GET` | `/api/anomalies` | Detected telemetry anomalies from Isolation Forest |
| `GET` | `/api/alerts` | Active and historical early warning alerts |
| `POST` | `/api/alerts/{id}/acknowledge` | Sign off and resolve an active alert |
| `GET` | `/api/reports/compliance` | Environmental compliance audit report (7 to 60 days) |
| `GET` | `/api/reports/export-readings-csv` | Export telemetry dataset with ML inferences (CSV) |
| `POST` | `/api/simulator/tick` | Trigger simulated IoT sensor reading |
| `POST` | `/api/simulator/inject-anomaly` | Inject contamination event (Acid, Runoff, Chemical, Hypoxia) |

---

## 🛡️ License & Standards
Developed following **WHO (World Health Organization)** and **US EPA (Environmental Protection Agency)** drinking water safety parameters.
