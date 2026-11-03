from fastapi import APIRouter, HTTPException
from app.detection.hybrid_engine import run_hybrid_collusion_pipeline
from app.database.db import get_db_connection
import json

router = APIRouter(prefix="/api/detect", tags=["Detection Engine"])

@router.post("")
def trigger_detection():
    try:
        result = run_hybrid_collusion_pipeline()
        return result
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/status")
def get_detection_status():
    conn = get_db_connection()
    meta_rows = conn.execute("SELECT key, value FROM system_meta").fetchall()
    conn.close()

    meta = {r["key"]: r["value"] for r in meta_rows}
    feat_imp = {}
    if "feature_importances" in meta:
        try:
            feat_imp = json.loads(meta["feature_importances"])
        except Exception:
            pass

    return {
        "last_run": meta.get("last_detection_run", "Never"),
        "models_active": [
            {"name": "Random Forest", "type": "Supervised Classifier", "status": "Operational", "weight": "28%"},
            {"name": "XGBoost", "type": "Gradient Boosted Trees", "status": "Operational", "weight": "32%"},
            {"name": "Isolation Forest", "type": "Unsupervised Anomaly Detector", "status": "Operational", "weight": "20%"},
            {"name": "GraphSAGE (PyTorch)", "type": "Graph Neural Network", "status": "Operational", "weight": "20%"}
        ],
        "feature_importances": feat_imp
    }
