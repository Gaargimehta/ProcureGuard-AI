import pandas as pd
import numpy as np
from typing import Dict, Any, List, Tuple

def extract_tender_features(tenders_df: pd.DataFrame, bids_df: pd.DataFrame, graph_metrics: Dict[str, Any]):
    """
    Extracts statistical, behavioural, and graph-based feature vectors for every tender.
    Returns:
    - feature_matrix (pd.DataFrame with numeric columns)
    - feature_metadata (list of dicts with detailed audit breakdown per tender)
    """
    tender_features = []
    
    # Pre-index bids by tender
    bids_by_tender = bids_df.groupby("tender_id")
    
    # Pre-calculate bidder win counts & total bids
    bidder_stats = bids_df.groupby("bidder_id").agg(
        total_bids=("bid_id", "count"),
        total_wins=("is_winner", "sum")
    ).reset_index()
    bidder_stats["win_rate"] = bidder_stats["total_wins"] / bidder_stats["total_bids"]
    bidder_win_map = dict(zip(bidder_stats["bidder_id"], bidder_stats["win_rate"]))
    
    bidder_metrics = graph_metrics.get("bidder_metrics", {})
    suspicious_pairs = {(p["bidder_a"], p["bidder_b"]): p["jaccard_similarity"] for p in graph_metrics.get("suspicious_pairs", [])}
    # Symmetric lookup
    for p in graph_metrics.get("suspicious_pairs", []):
        suspicious_pairs[(p["bidder_b"], p["bidder_a"])] = p["jaccard_similarity"]

    for _, tender in tenders_df.iterrows():
        t_id = tender["tender_id"]
        est_val = float(tender["estimated_value"])
        category = tender["category"]
        
        if t_id not in bids_by_tender.groups:
            continue
            
        t_bids = bids_by_tender.get_group(t_id).sort_values("bid_amount")
        num_bidders = len(t_bids)
        bid_amounts = t_bids["bid_amount"].values
        bid_ratios = t_bids["bid_to_estimate_ratio"].values
        b_ids = t_bids["bidder_id"].tolist()
        ip_addrs = t_bids["ip_address"].tolist()

        winning_bid = bid_amounts[0]
        winning_ratio = bid_ratios[0]
        winner_id = b_ids[0]

        # 1. Winning margin: spread between 1st and 2nd lowest bid relative to estimate
        if num_bidders >= 2:
            second_bid = bid_amounts[1]
            winning_margin = (second_bid - winning_bid) / est_val
            second_ratio = bid_ratios[1]
            second_spread = second_ratio - winning_ratio
        else:
            winning_margin = 0.10
            second_spread = 0.10

        # 2. Bid Variance & Coefficient of Variation
        mean_bid = np.mean(bid_amounts)
        std_bid = np.std(bid_amounts) if num_bidders > 1 else 0.0
        coef_variation = (std_bid / mean_bid) if mean_bid > 0 else 0.0

        # 3. Minimum bid difference among non-winning bids (cover bidding similarity)
        min_non_win_diff = 1.0
        if num_bidders >= 3:
            diffs = []
            for k in range(1, num_bidders - 1):
                diff = abs(bid_ratios[k+1] - bid_ratios[k])
                diffs.append(diff)
            min_non_win_diff = min(diffs) if diffs else 1.0

        # 4. Bid-to-estimate ratio closeness to 1.0
        # In cartels, winning bid is often artificially pegged just under estimate (0.98 - 0.995)
        ratio_pegging_indicator = 1.0 if 0.980 <= winning_ratio <= 0.998 else 0.0

        # 5. Graph Co-participation & Jaccard index
        # What is the maximum pairwise Jaccard similarity among participating bidders?
        max_pair_jaccard = 0.0
        pair_jaccards = []
        for a_idx in range(len(b_ids)):
            for b_idx in range(a_idx + 1, len(b_ids)):
                pair = (b_ids[a_idx], b_ids[b_idx])
                j_score = suspicious_pairs.get(pair, 0.0)
                pair_jaccards.append(j_score)
                if j_score > max_pair_jaccard:
                    max_pair_jaccard = j_score
        avg_pair_jaccard = np.mean(pair_jaccards) if pair_jaccards else 0.0

        # 6. Winner historical win rate
        winner_win_rate = bidder_win_map.get(winner_id, 0.20)

        # 7. Subnet / IP correlation
        # Check if 2 or more bids share the same /24 IP subnet (e.g., 192.168.42.x or 10.45.88.x)
        subnet_counts = {}
        shared_subnet_flag = 0.0
        for ip in ip_addrs:
            parts = str(ip).split(".")
            if len(parts) >= 3:
                subnet = ".".join(parts[:3])
                subnet_counts[subnet] = subnet_counts.get(subnet, 0) + 1
                if subnet_counts[subnet] >= 2:
                    shared_subnet_flag = 1.0

        # 8. Bidder graph centrality
        winner_centrality = bidder_metrics.get(winner_id, {}).get("degree_centrality", 0.0)
        winner_clustering = bidder_metrics.get(winner_id, {}).get("clustering_coefficient", 0.0)

        # Build feature dictionary
        feat_dict = {
            "tender_id": t_id,
            "winning_ratio": round(winning_ratio, 4),
            "winning_margin": round(winning_margin, 4),
            "second_spread": round(second_spread, 4),
            "coef_variation": round(coef_variation, 4),
            "min_non_win_diff": round(min_non_win_diff, 4),
            "num_bidders": num_bidders,
            "ratio_pegging_indicator": ratio_pegging_indicator,
            "max_pair_jaccard": round(max_pair_jaccard, 4),
            "avg_pair_jaccard": round(avg_pair_jaccard, 4),
            "winner_win_rate": round(winner_win_rate, 4),
            "shared_subnet_flag": shared_subnet_flag,
            "winner_centrality": round(winner_centrality, 4),
            "winner_clustering": round(winner_clustering, 4)
        }
        tender_features.append(feat_dict)

    df_features = pd.DataFrame(tender_features)
    return df_features
