import json
import datetime
import uuid
import pandas as pd
import numpy as np
from app.database.db import get_db_connection
from app.graph.builder import build_procurement_graphs
from app.graph.analysis import analyze_procurement_network
from app.detection.features import extract_tender_features
from app.detection.ml_models import DetectionModels
from app.detection.gnn_model import run_gnn_inference

def run_hybrid_collusion_pipeline():
    """
    Executes the end-to-end detection pipeline:
    1. Loads dataset from DB
    2. Builds bipartite and co-bidding graphs
    3. Runs NetworkX topological graph analysis
    4. Runs PyTorch GraphSAGE GNN inference on bidder nodes
    5. Extracts feature matrix for all tenders
    6. Trains and runs Random Forest, XGBoost and Isolation Forest
    7. Synthesizes a calibrated Hybrid Risk Score (0 - 100)
    8. Generates forensic risk indicators, AI explanations, and alerts
    9. Persists updated scores back to SQLite
    """
    # 1. Build graphs
    B, G_bidder, tenders_df, bids_df, bidders_df = build_procurement_graphs()

    # 2. Network Analysis
    graph_metrics = analyze_procurement_network(B, G_bidder)

    # 3. PyTorch GraphSAGE inference
    bidder_stats_dict = bidders_df.set_index("bidder_id").to_dict(orient="index")
    gnn_bidder_scores = run_gnn_inference(G_bidder, bidder_stats_dict)

    # 4. Extract tender feature matrix
    X_features = extract_tender_features(tenders_df, bids_df, graph_metrics)

    # 5. Train & Run ML models
    ml_engine = DetectionModels()
    feature_importances = ml_engine.fit_models(X_features, tenders_df["simulation_scenario"])
    predictions = ml_engine.predict(X_features)

    rf_probs = predictions["rf_probs"]
    xgb_probs = predictions["xgb_probs"]
    iso_scores = predictions["iso_scores"]

    # 6. Hybrid Risk Scoring
    # Weights:
    # 0.28 RF + 0.32 XGBoost + 0.20 Isolation Forest + 0.20 GraphSAGE/Network
    tenders_updated = []
    alerts_generated = []
    bidder_risk_tracker = {b_id: [] for b_id in bidders_df["bidder_id"]}

    conn = get_db_connection()
    cursor = conn.cursor()

    # Clear old alerts to avoid duplicates upon re-detection
    cursor.execute("DELETE FROM alerts")

    for i, row in tenders_df.iterrows():
        t_id = row["tender_id"]
        feat = X_features[X_features["tender_id"] == t_id].iloc[0]

        # ML model signals
        p_rf = float(rf_probs[i])
        p_xgb = float(xgb_probs[i])
        s_iso = float(iso_scores[i])

        # Graph signal from winning bidder and participating bidders
        winner_id = row["winning_supplier_id"]
        t_bids = bids_df[bids_df["tender_id"] == t_id]
        participating_bidders = t_bids["bidder_id"].tolist()

        gnn_scores_participating = [gnn_bidder_scores.get(b, 0.2) for b in participating_bidders]
        graph_signal = float(np.mean(gnn_scores_participating)) if gnn_scores_participating else 0.2

        # Hybrid ensemble calculation
        raw_composite = (0.28 * p_rf) + (0.32 * p_xgb) + (0.20 * s_iso) + (0.20 * graph_signal)
        
        # High confidence boosters for extreme collusion anomalies
        if feat["shared_subnet_flag"] > 0:
            raw_composite = max(raw_composite, 0.78)
        if feat["max_pair_jaccard"] > 0.65 and feat["ratio_pegging_indicator"] > 0:
            raw_composite = max(raw_composite, 0.85)

        # Scale to 0 - 100
        risk_score = round(float(raw_composite * 100.0), 1)
        risk_score = min(max(risk_score, 5.0), 98.5)

        # Categorize
        if risk_score >= 70.0:
            risk_level = "High"
        elif risk_score >= 35.0:
            risk_level = "Medium"
        else:
            risk_level = "Low"

        # Track for participating bidders
        for b in participating_bidders:
            if b in bidder_risk_tracker:
                bidder_risk_tracker[b].append(risk_score)

        # Determine contributing indicators
        indicators = []
        if feat["winning_margin"] < 0.015:
            indicators.append(f"Razor-thin winning spread ({feat['winning_margin']*100:.1f}%) suggesting complementary bidding")
        if feat["ratio_pegging_indicator"] > 0:
            indicators.append(f"Winning bid pegged unnaturally close to government estimate ({feat['winning_ratio']*100:.1f}%)")
        if feat["max_pair_jaccard"] >= 0.40:
            indicators.append(f"Abnormally high bidder co-participation Jaccard similarity ({feat['max_pair_jaccard']:.2f})")
        if feat["shared_subnet_flag"] > 0:
            indicators.append("Multiple bids submitted from identical network IP subnets within short interval")
        if feat["min_non_win_diff"] < 0.01 and feat["num_bidders"] >= 3:
            indicators.append("Suspiciously parallel cover bids differing by less than 1.0%")
        if graph_signal >= 0.60:
            indicators.append("GraphSAGE structural anomaly: participating nodes belong to dense recurring cartel clique")

        if not indicators:
            indicators.append("Standard competitive dispersion and normal bidding distance observed.")

        # Natural language AI explanation
        if risk_level == "High":
            explanation = (
                f"HIGH COLLUSION ALERT: Tender exhibits systematic coordination markers. "
                f"Participating suppliers show recurring co-bidding patterns (Jaccard {feat['max_pair_jaccard']:.2f}) "
                f"with artificially suppressed price competition. {indicators[0]}."
            )
        elif risk_level == "Medium":
            explanation = (
                f"ELEVATED RISK NOTICE: Moderate probability of coordinated bidding or market allocation detected. "
                f"Winning ratio is {feat['winning_ratio']*100:.1f}% with restricted supplier variance. "
                f"Manual auditor review of bid history is recommended."
            )
        else:
            explanation = (
                f"COMPETITIVE BIDDING: Healthy market dynamics detected. Normal price variance "
                f"({feat['coef_variation']*100:.1f}%) across {feat['num_bidders']} independent bidders with no co-participation anomalies."
            )

        # Update tender row
        cursor.execute("""
            UPDATE tenders
            SET risk_score = ?, risk_level = ?, ai_explanation = ?, contributing_indicators = ?
            WHERE tender_id = ?
        """, (risk_score, risk_level, explanation, json.dumps(indicators), t_id))

        # Generate alert if High or Medium risk
        if risk_level in ["High", "Medium"]:
            alert_id = f"ALT-{1000 + len(alerts_generated) + 1}"
            pattern_type = "Bid Rotation" if feat["max_pair_jaccard"] > 0.55 else ("Cover Bidding" if feat["min_non_win_diff"] < 0.02 else "Anomalous Pricing Coalition")
            bidder_group_names = ", ".join(t_bids["bidder_name"].tolist()[:3])
            
            cursor.execute("""
                INSERT INTO alerts (
                    alert_id, tender_id, bidder_group, risk_score, risk_level,
                    pattern_type, explanation, status, indicators_json, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                alert_id, t_id, bidder_group_names, risk_score, risk_level,
                pattern_type, explanation, "New", json.dumps(indicators),
                datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            ))
            alerts_generated.append(alert_id)

    # 7. Update Bidders' aggregate risk scores
    for b_id, scores in bidder_risk_tracker.items():
        if scores:
            avg_risk = round(float(np.mean(scores)), 1)
            b_level = "High" if avg_risk >= 70 else ("Medium" if avg_risk >= 35 else "Low")
        else:
            avg_risk = 10.0
            b_level = "Low"

        # Check suspicious flags
        b_flags = []
        if gnn_bidder_scores.get(b_id, 0.0) >= 0.5:
            b_flags.append("GraphSAGE Coalition Member")
        if avg_risk >= 65:
            b_flags.append("High Collusion Association")
        
        cursor.execute("""
            UPDATE bidders
            SET risk_score = ?, risk_level = ?, suspicious_flags = ?
            WHERE bidder_id = ?
        """, (avg_risk, b_level, json.dumps(b_flags), b_id))

    # Record system metadata
    cursor.execute("""
        INSERT OR REPLACE INTO system_meta (key, value)
        VALUES ('last_detection_run', ?), ('feature_importances', ?)
    """, (
        datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        json.dumps(feature_importances)
    ))

    conn.commit()
    conn.close()

    return {
        "status": "success",
        "tenders_analyzed": len(tenders_df),
        "alerts_generated": len(alerts_generated),
        "feature_importances": feature_importances,
        "timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }
