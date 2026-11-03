from fastapi import APIRouter, HTTPException
from app.database.db import get_db_connection
from app.detection.hybrid_engine import run_hybrid_collusion_pipeline
from app.services.data_generator import generate_synthetic_dataset
from app.services.report_generator import generate_pdf_investigation_report
import pandas as pd
import json

router = APIRouter(prefix="/api/demo", tags=["Demo Mode"])

@router.get("/scenarios")
def get_demo_scenarios():
    conn = get_db_connection()
    # Find sample tenders corresponding to the 3 scenarios
    normal_t = conn.execute("SELECT * FROM tenders WHERE simulation_scenario = 'Normal Competitive' ORDER BY tender_date DESC LIMIT 1").fetchone()
    rotation_t = conn.execute("SELECT * FROM tenders WHERE simulation_scenario = 'Simulated Bid Rotation' LIMIT 1").fetchone()
    cover_t = conn.execute("SELECT * FROM tenders WHERE simulation_scenario = 'Simulated Cover Bidding' LIMIT 1").fetchone()
    conn.close()

    return {
        "scenarios": [
            {
                "id": "scenario_1",
                "name": "Scenario 1: Normal Competitive Bidding",
                "tag": "Healthy Market Dynamics",
                "tender_id": normal_t["tender_id"] if normal_t else "TND-2025-1040",
                "title": normal_t["title"] if normal_t else "Municipal Roadway Modernization Sector 40",
                "category": normal_t["category"] if normal_t else "Civil Infrastructure & Highway",
                "expected_risk": "Low (< 30)",
                "simulation_label": "Normal Competitive",
                "description": "5 independent contractors submit authentic market bids with standard variance (8% to 15%) across distinct IPs and timestamps. No repetitive cartel cliques exist.",
                "key_signals": [
                    "Wide price dispersion (CV > 6%)",
                    "Independent IP subnets across submissions",
                    "Low historical co-participation Jaccard index (< 0.20)",
                    "Substantial winning margin (> 3.5%)"
                ]
            },
            {
                "id": "scenario_2",
                "name": "Scenario 2: Bid Rotation Ring",
                "tag": "Cartel Ring Alpha",
                "tender_id": rotation_t["tender_id"] if rotation_t else "TND-2025-1002",
                "title": rotation_t["title"] if rotation_t else "Phase 2 Highway Reconstruction",
                "category": rotation_t["category"] if rotation_t else "Civil Infrastructure & Highway",
                "expected_risk": "High (> 80)",
                "simulation_label": "Simulated Bid Rotation",
                "description": "Apex Infra, BuildTech Corp, and Vertex Highway systematically rotate the winning bid across consecutive highway tenders while submitting intentionally non-competitive cover bids.",
                "key_signals": [
                    "Identical 3-supplier combination across multiple contracts",
                    "Winner systematically rotates (alternating L1 awards)",
                    "High Jaccard co-participation similarity (> 0.65)",
                    "Bids submitted within minutes from the same 192.168.42.x subnet"
                ]
            },
            {
                "id": "scenario_3",
                "name": "Scenario 3: Cover Bidding & Bid Pegging",
                "tag": "Cartel Ring Beta",
                "tender_id": cover_t["tender_id"] if cover_t else "TND-2025-1018",
                "title": cover_t["title"] if cover_t else "Specialized Surgical Imaging Systems Batch 3",
                "category": cover_t["category"] if cover_t else "Medical Equipment & Hospital Supplies",
                "expected_risk": "High (> 85)",
                "simulation_label": "Simulated Cover Bidding",
                "description": "MedSupply Global Solutions wins with an artificially inflated quote pegged at 99.2% of government estimate, shielded by phantom cover bids from HealthCare Innovations and BioPharma Direct differing by exact decimal intervals.",
                "key_signals": [
                    "Artificially pegged winning bid (99.2% of estimate)",
                    "Suspicious bid similarity among non-winners (exact 0.8% offset)",
                    "Consistently single winner with persistent token bidders",
                    "Submissions originating from same IP subnet (10.45.88.x) seconds apart"
                ]
            }
        ]
    }

@router.post("/run-full-detection")
def run_live_demo_detection():
    """
    Executes the comprehensive college demo run:
    1. Resets/loads clean dataset
    2. Runs hybrid detection pipeline
    3. Generates sample investigation report for highest-risk tender
    """
    # 1. Reset / ensure dataset
    generate_synthetic_dataset(num_tenders=120)

    # 2. Run detection pipeline
    detection_result = run_hybrid_collusion_pipeline()

    # 3. Find top suspicious tender and generate sample report
    conn = get_db_connection()
    top_tender = conn.execute("SELECT tender_id FROM tenders WHERE risk_level = 'High' ORDER BY risk_score DESC LIMIT 1").fetchone()
    conn.close()

    sample_report_id = None
    if top_tender:
        t_id = top_tender["tender_id"]
        try:
            generate_pdf_investigation_report(tender_id=t_id)
            sample_report_id = f"REP-{t_id}"
        except Exception as e:
            print("Notice generating sample report:", e)

    return {
        "status": "success",
        "message": "Live Collusion Detection Pipeline Executed Successfully!",
        "details": detection_result,
        "sample_report_tender_id": top_tender["tender_id"] if top_tender else None,
        "sample_report_id": sample_report_id
    }
