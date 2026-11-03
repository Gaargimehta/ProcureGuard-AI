from fastapi import APIRouter
from app.database.db import get_db_connection
import pandas as pd
import json

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

@router.get("")
def get_dashboard_summary():
    conn = get_db_connection()
    
    # 1. KPIs
    tenders_df = pd.read_sql_query("SELECT * FROM tenders", conn)
    bidders_df = pd.read_sql_query("SELECT * FROM bidders", conn)
    alerts_df = pd.read_sql_query("SELECT * FROM alerts", conn)

    if tenders_df.empty:
        conn.close()
        return {
            "total_tenders": 0,
            "total_bidders": 0,
            "suspicious_tenders": 0,
            "high_risk_groups": 0,
            "avg_risk_score": 0.0,
            "affected_contract_value": 0.0,
            "tender_activity": [],
            "risk_distribution": {"Low": 0, "Medium": 0, "High": 0},
            "category_distribution": [],
            "top_suspicious_bidders": [],
            "recent_alerts": [],
            "geographic_activity": []
        }

    total_tenders = len(tenders_df)
    total_bidders = len(bidders_df)
    suspicious_tenders = len(tenders_df[tenders_df["risk_level"].isin(["High", "Medium"])])
    high_risk_groups = len(bidders_df[bidders_df["risk_level"] == "High"])
    avg_risk_score = round(float(tenders_df["risk_score"].mean()), 1)
    
    # Affected contract value for high and medium risk tenders
    affected_value = float(tenders_df[tenders_df["risk_level"].isin(["High", "Medium"])]["winning_bid"].sum())

    # 2. Activity over time (grouped by date)
    tenders_df["month"] = pd.to_datetime(tenders_df["tender_date"]).dt.strftime("%b %d")
    timeline = tenders_df.groupby("month").agg(
        total=("tender_id", "count"),
        suspicious=("risk_level", lambda s: sum(s.isin(["High", "Medium"]))),
        normal=("risk_level", lambda s: sum(s == "Low"))
    ).reset_index().tail(12).to_dict(orient="records")

    # 3. Risk distribution
    risk_counts = tenders_df["risk_level"].value_counts().to_dict()
    risk_distribution = {
        "Low": risk_counts.get("Low", 0),
        "Medium": risk_counts.get("Medium", 0),
        "High": risk_counts.get("High", 0)
    }

    # 4. Procurement Category Breakdown
    cat_df = tenders_df.groupby("category").agg(
        count=("tender_id", "count"),
        avg_risk=("risk_score", "mean"),
        total_value=("estimated_value", "sum")
    ).reset_index()
    cat_df["avg_risk"] = cat_df["avg_risk"].round(1)
    category_distribution = cat_df.to_dict(orient="records")

    # 5. Top Suspicious Bidders
    top_bidders = bidders_df.sort_values(by="risk_score", ascending=False).head(5)[
        ["bidder_id", "name", "category", "risk_score", "risk_level", "total_wins", "win_rate"]
    ].to_dict(orient="records")

    # 6. Recent AI Alerts
    recent_alerts = alerts_df.sort_values(by="created_at", ascending=False).head(6).to_dict(orient="records")

    # 7. Geographic Procurement Activity
    geo_df = tenders_df.groupby("location").agg(
        tenders_count=("tender_id", "count"),
        high_risk_count=("risk_level", lambda s: sum(s == "High")),
        total_value=("estimated_value", "sum")
    ).reset_index()
    geographic_activity = geo_df.to_dict(orient="records")

    conn.close()

    return {
        "total_tenders": total_tenders,
        "total_bidders": total_bidders,
        "suspicious_tenders": suspicious_tenders,
        "high_risk_groups": high_risk_groups,
        "avg_risk_score": avg_risk_score,
        "affected_contract_value": round(affected_value, 2),
        "tender_activity": timeline,
        "risk_distribution": risk_distribution,
        "category_distribution": category_distribution,
        "top_suspicious_bidders": top_bidders,
        "recent_alerts": recent_alerts,
        "geographic_activity": geographic_activity
    }
