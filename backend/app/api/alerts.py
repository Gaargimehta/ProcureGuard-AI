from fastapi import APIRouter, HTTPException, Body
from typing import Optional
from app.database.db import get_db_connection
from pydantic import BaseModel
import json

router = APIRouter(prefix="/api/alerts", tags=["Alerts"])

class AlertStatusUpdate(BaseModel):
    status: str

@router.get("")
def list_alerts(status: Optional[str] = None):
    conn = get_db_connection()
    query = "SELECT * FROM alerts"
    params = []

    if status and status != "All":
        query += " WHERE status = ?"
        params.append(status)

    query += " ORDER BY risk_score DESC, created_at DESC"

    rows = conn.execute(query, params).fetchall()
    alerts = []
    for r in rows:
        item = dict(r)
        try:
            item["indicators"] = json.loads(item["indicators_json"]) if item["indicators_json"] else []
        except Exception:
            item["indicators"] = []
        alerts.append(item)

    conn.close()
    return {"alerts": alerts}

@router.patch("/{alert_id}")
def update_alert_status(alert_id: str, payload: AlertStatusUpdate):
    valid_statuses = ["New", "Under Review", "Escalated", "Closed"]
    if payload.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Choose from: {valid_statuses}")

    conn = get_db_connection()
    cur = conn.execute("UPDATE alerts SET status = ? WHERE alert_id = ?", (payload.status, alert_id))
    if cur.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="Alert not found")

    conn.commit()
    conn.close()
    return {"status": "success", "alert_id": alert_id, "new_status": payload.status}
