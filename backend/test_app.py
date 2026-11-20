from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_system_full():
    print("\n--- Running AquaPulse AI Full Test Suite ---")
    
    # 1. Health
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    print("[PASS] Health Check:", data)
    assert data["status"] == "healthy"
    assert data["model_loaded"] is True

    # 2. Stations
    res = client.get("/api/stations")
    assert res.status_code == 200
    stations = res.json()
    print(f"[PASS] Stations retrieved: {len(stations)}")
    assert len(stations) >= 5

    # 3. Readings
    stn_id = stations[0]["id"]
    res = client.get(f"/api/readings?station_id={stn_id}&hours=48")
    assert res.status_code == 200
    readings = res.json()
    print(f"[PASS] Historical readings for station {stn_id}: {len(readings)}")
    assert len(readings) > 0

    # 4. ML Prediction & XAI
    sample = {
        "ph": 5.8,
        "turbidity": 12.0,
        "tds": 750.0,
        "temperature": 24.0,
        "dissolved_oxygen": 3.8,
        "conductivity": 1200.0
    }
    res = client.post("/api/ml/predict", json=sample)
    assert res.status_code == 200
    pred = res.json()
    print(f"[PASS] ML Prediction: {pred['potability_label']} | WQI: {pred['wqi']} ({pred['wqi_status']})")
    print(f"       Anomaly: {pred['is_anomaly']} | Top Attribution: {pred['explainability']['attributions'][0]['label']} ({pred['explainability']['attributions'][0]['percentage_impact']}%)")
    assert "potability_pred" in pred
    assert "explainability" in pred
    assert len(pred["explainability"]["attributions"]) == 6

    # 5. Time Series Forecasting
    res = client.get(f"/api/ml/forecast/{stn_id}?hours=24")
    assert res.status_code == 200
    forecast = res.json()
    print(f"[PASS] Forecasting: Horizon {forecast['horizon_hours']}h | Has Warnings: {forecast['has_warnings']}")
    assert "forecasts" in forecast
    assert "early_warning_breaches" in forecast

    # 6. Anomalies
    res = client.get("/api/anomalies?limit=10")
    assert res.status_code == 200
    anoms = res.json()
    print(f"[PASS] Anomalies retrieved: {len(anoms)}")

    # 7. Alerts
    res = client.get("/api/alerts?limit=10")
    assert res.status_code == 200
    alerts = res.json()
    print(f"[PASS] Alerts retrieved: {len(alerts)}")

    # 8. Anomaly Injection Simulation
    res = client.post("/api/simulator/inject-anomaly", json={"station_id": stn_id, "anomaly_type": "ACID_SPILL"})
    assert res.status_code == 200
    inject_res = res.json()
    print(f"[PASS] Anomaly Injected: {inject_res['status']} | Alerts Triggered: {len(inject_res['alerts_triggered'])}")

    print("--- ALL 8 TESTS PASSED SUCCESSFULLY! ---\n")

if __name__ == "__main__":
    test_system_full()
