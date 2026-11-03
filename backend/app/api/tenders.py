from fastapi import APIRouter, Query, HTTPException
from typing import Optional, List
from app.database.db import get_db_connection
import pandas as pd
import json

router = APIRouter(prefix="/api/tenders", tags=["Tenders"])

@router.get("")
def list_tenders(
    risk_level: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    location: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    limit: int = 150,
    offset: int = 0
):
    conn = get_db_connection()
    query = "SELECT * FROM tenders WHERE 1=1"
    params = []

    if risk_level and risk_level != "All":
        query += " AND risk_level = ?"
        params.append(risk_level)

    if category and category != "All":
        query += " AND category = ?"
        params.append(category)

    if location and location != "All":
        query += " AND location = ?"
        params.append(location)

    if search:
        query += " AND (tender_id LIKE ? OR title LIKE ? OR winning_supplier_name LIKE ?)"
        wildcard = f"%{search}%"
        params.extend([wildcard, wildcard, wildcard])

    query += " ORDER BY risk_score DESC, tender_date DESC LIMIT ? OFFSET ?"
    params.extend([limit, offset])

    rows = conn.execute(query, params).fetchall()
    
    tenders = []
    for r in rows:
        item = dict(r)
        try:
            item["contributing_indicators"] = json.loads(item["contributing_indicators"]) if item["contributing_indicators"] else []
        except Exception:
            item["contributing_indicators"] = []
        tenders.append(item)

    # Total count
    count_query = "SELECT COUNT(*) FROM tenders"
    total_count = conn.execute(count_query).fetchone()[0]

    # Categories and locations list for dropdown filter
    categories = [r[0] for r in conn.execute("SELECT DISTINCT category FROM tenders ORDER BY category").fetchall()]
    locations = [r[0] for r in conn.execute("SELECT DISTINCT location FROM tenders ORDER BY location").fetchall()]

    conn.close()

    return {
        "total": total_count,
        "count": len(tenders),
        "categories": categories,
        "locations": locations,
        "tenders": tenders
    }

@router.get("/{tender_id}")
def get_tender_detail(tender_id: str):
    conn = get_db_connection()
    t_row = conn.execute("SELECT * FROM tenders WHERE tender_id = ?", (tender_id,)).fetchone()
    if not t_row:
        conn.close()
        raise HTTPException(status_code=404, detail="Tender not found")

    tender = dict(t_row)
    try:
        tender["contributing_indicators"] = json.loads(tender["contributing_indicators"]) if tender["contributing_indicators"] else []
    except Exception:
        tender["contributing_indicators"] = []

    # Get participating bids
    bids_rows = conn.execute("""
        SELECT b.*, bdr.win_rate, bdr.total_wins, bdr.risk_score as bidder_risk_score, bdr.risk_level as bidder_risk_level
        FROM bids b
        LEFT JOIN bidders bdr ON b.bidder_id = bdr.bidder_id
        WHERE b.tender_id = ?
        ORDER BY b.bid_amount ASC
    """, (tender_id,)).fetchall()

    bids = [dict(b) for b in bids_rows]

    # Calculate forensic spreads
    if len(bids) >= 2:
        winning_margin = round(bids[1]["bid_amount"] - bids[0]["bid_amount"], 2)
        winning_margin_pct = round(((bids[1]["bid_amount"] - bids[0]["bid_amount"]) / tender["estimated_value"]) * 100, 2)
    else:
        winning_margin = 0.0
        winning_margin_pct = 0.0

    # Historical participation of these bidders in same category
    bidder_ids = [b["bidder_id"] for b in bids]
    historical_overlap = []
    if bidder_ids:
        placeholders = ",".join("?" for _ in bidder_ids)
        hist_rows = conn.execute(f"""
            SELECT tender_id, winning_supplier_id, winning_supplier_name, tender_date, risk_score
            FROM tenders
            WHERE category = ? AND tender_id != ? AND winning_supplier_id IN ({placeholders})
            ORDER BY tender_date DESC
            LIMIT 8
        """, [tender["category"], tender_id] + bidder_ids).fetchall()
        historical_overlap = [dict(h) for h in hist_rows]

    conn.close()

    return {
        "tender": tender,
        "bids": bids,
        "winning_margin": winning_margin,
        "winning_margin_pct": winning_margin_pct,
        "historical_overlap": historical_overlap
    }
