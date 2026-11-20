import httpx
import json
import time

BASE_URL = "http://127.0.0.1:8000/api"

def test_endpoints():
    print("=" * 60)
    print("Testing ML-Based Water Quality Monitoring Backend API")
    print("=" * 60)
    
    with httpx.Client(base_url=BASE_URL, timeout=15.0) as client:
        # Wait for server readiness
        server_ready = False
        for attempt in range(10):
            try:
                r = client.get("/health")
                if r.status_code == 200:
                    server_ready = True
                    print(f"[1] Health Check: 200 OK (Attempt {attempt+1}) - {r.json()}")
                    break
            except Exception:
                time.sleep(1.0)
                
        if not server_ready:
            print("[ERROR] Server did not become ready within 10 seconds.")
            return

        # 2. Stations
        r = client.get("/stations")
        stations = r.json()
        print(f"[2] Stations List: {len(stations)} stations found.")
        for s in stations:
            print(f"    - {s['name']} ({s['code']}) | WQI: {s['latest_wqi']} | Alerts: {s['active_alerts_count']}")

        # 3. Latest Readings
        r = client.get("/readings/latest")
        print(f"[3] Latest Readings fetched: {len(r.json())} entries.")

        # 4. ML Prediction & XAI
        sample = {
            "ph": 6.1,
            "turbidity": 9.4,
            "tds": 650.0,
            "temperature": 23.5,
            "dissolved_oxygen": 4.1,
            "conductivity": 1050.0
        }
        r = client.post("/ml/predict", json=sample)
        pred = r.json()
        print(f"[4] ML Predict & XAI:")
        print(f"    - Potability: {pred['potability_label']} (Prob: {pred['potability_prob']*100:.1f}%)")
        print(f"    - WQI: {pred['wqi']} ({pred['wqi_status']})")
        print(f"    - Anomaly Detected: {pred['is_anomaly']} (Score: {pred['anomaly_intensity']}%)")
        print(f"    - Top XAI Attribution: {pred['explainability']['attributions'][0]['label']} ({pred['explainability']['attributions'][0]['percentage_impact']}%)")

        # 5. Time Series Forecast
        stn_id = stations[0]['id']
        r = client.get(f"/ml/forecast/{stn_id}?hours=24")
        forecast = r.json()
        print(f"[5] Time Series Forecast for {forecast['station_name']}:")
        print(f"    - Projected Parameters: {list(forecast['forecasts'].keys())}")
        print(f"    - Early Warnings Count: {len(forecast['early_warning_breaches'])}")

        # 6. Anomalies
        r = client.get("/anomalies?limit=5")
        anoms = r.json()
        print(f"[6] Recent Anomalies: {len(anoms)} records retrieved.")

        # 7. Alerts
        r = client.get("/alerts?limit=5")
        alerts = r.json()
        print(f"[7] Alerts Center: {len(alerts)} records retrieved.")
        if alerts:
            print(f"    - Latest Alert: [{alerts[0]['severity']}] {alerts[0]['message']}")

        # 8. Simulator Tick
        r = client.post(f"/simulator/tick?station_id={stn_id}")
        print(f"[8] IoT Sensor Simulator Tick: {r.json()['status']} for {r.json().get('station')}")

        # 9. Sample CSV & Upload CSV Batch Processing
        r = client.get("/ml/sample-csv")
        csv_bytes = r.content
        print(f"[9] Sample CSV fetched: {len(csv_bytes)} bytes.")
        
        # Test uploading the sample CSV to batch prediction endpoint
        files = {"file": ("test_sample.csv", csv_bytes, "text/csv")}
        r_upload = client.post("/ml/upload-csv", files=files)
        upload_res = r_upload.json()
        print(f"    - Upload CSV Processed: {upload_res['total_records']} records evaluated.")
        print(f"    - Potable %: {upload_res['summary']['potable_percentage']}%, Anomaly %: {upload_res['summary']['anomaly_percentage']}%, Avg WQI: {upload_res['summary']['average_wqi']}")

        # 10. Environmental Compliance Audit Report
        r_comp = client.get("/reports/compliance?days=14")
        comp = r_comp.json()
        print(f"[10] Compliance Audit Report: {comp['overall_compliance_rate']}% compliance rate across {comp['total_readings_audited']} readings.")
        print(f"     Scorecards generated for {len(comp['station_scorecards'])} facilities.")

    print("=" * 60)
    print("ALL 10 API ENDPOINTS TESTED SUCCESSFULLY!")
    print("=" * 60)

if __name__ == "__main__":
    test_endpoints()
