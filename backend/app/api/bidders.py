from fastapi import APIRouter, Query, HTTPException
from typing import Optional
from app.database.db import get_db_connection
import pandas as pd
import json

router = APIRouter(prefix="/api/bidders", tags=["Bidders"])

@router.get("")
def list_bidders(
    risk_level: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    search: Optional[str] = Query(None)
):
    conn = get_db_connection()
    query = "SELECT * FROM bidders WHERE 1=1"
    params = []

    if risk_level and risk_level != "All":
        query += " AND risk_level = ?"
        params.append(risk_level)

    if category and category != "All":
        query += " AND category = ?"
        params.append(category)

    if search:
        query += " AND (bidder_id LIKE ? OR name LIKE ?)"
        wildcard = f"%{search}%"
        params.extend([wildcard, wildcard])

    query += " ORDER BY risk_score DESC, total_won_value DESC"

    rows = conn.execute(query, params).fetchall()
    bidders = []
    for r in rows:
        item = dict(r)
        try:
            item["suspicious_flags"] = json.loads(item["suspicious_flags"]) if item["suspicious_flags"] else []
        except Exception:
            item["suspicious_flags"] = []
        bidders.append(item)

    conn.close()
    return {"bidders": bidders}

@router.get("/{bidder_id}")
def get_bidder_detail(bidder_id: str):
    conn = get_db_connection()
    b_row = conn.execute("SELECT * FROM bidders WHERE bidder_id = ?", (bidder_id,)).fetchone()
    if not b_row:
        conn.close()
        raise HTTPException(status_code=404, detail="Bidder not found")

    bidder = dict(b_row)
    try:
        bidder["suspicious_flags"] = json.loads(bidder["suspicious_flags"]) if bidder["suspicious_flags"] else []
    except Exception:
        bidder["suspicious_flags"] = []

    # Get tender history
    tenders_history = conn.execute("""
        SELECT t.tender_id, t.title, t.category, t.estimated_value, t.tender_date,
               b.bid_amount, b.bid_to_estimate_ratio, b.is_winner, t.risk_score, t.risk_level
        FROM bids b
        JOIN tenders t ON b.tender_id = t.tender_id
        WHERE b.bidder_id = ?
        ORDER BY t.tender_date DESC
    """, (bidder_id,)).fetchall()

    # Frequent co-participating partners
    co_bidders = conn.execute("""
        SELECT b2.bidder_id, b2.bidder_name, COUNT(DISTINCT b2.tender_id) as shared_tenders
        FROM bids b1
        JOIN bids b2 ON b1.tender_id = b2.tender_id AND b1.bidder_id != b2.bidder_id
        WHERE b1.bidder_id = ?
        GROUP BY b2.bidder_id, b2.bidder_name
        ORDER BY shared_tenders DESC
        LIMIT 6
    """, (bidder_id,)).fetchall()

    conn.close()

    return {
        "bidder": bidder,
        "history": [dict(t) for t in tenders_history],
        "co_bidders": [dict(c) for c in co_bidders]
    }
