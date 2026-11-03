import networkx as nx
from typing import Dict, Any, Tuple, List
import pandas as pd
from app.database.db import get_db_connection

def build_procurement_graphs():
    """
    Constructs:
    1. Bipartite graph B (Bidder nodes and Tender nodes with edges for bids).
    2. Projected Bidder Co-participation graph G_bidder (Bidder-Bidder edges weighted by shared tenders).
    3. Directed Tender-Winner flow graph G_rotation (tracks sequence of winners over shared categories).
    """
    conn = get_db_connection()
    tenders_df = pd.read_sql_query("SELECT * FROM tenders", conn)
    bids_df = pd.read_sql_query("SELECT * FROM bids", conn)
    bidders_df = pd.read_sql_query("SELECT * FROM bidders", conn)
    conn.close()

    # 1. Bipartite Graph
    B = nx.Graph()

    # Add bidder nodes
    for _, row in bidders_df.iterrows():
        B.add_node(
            f"BIDDER_{row['bidder_id']}",
            type="bidder",
            id=row['bidder_id'],
            name=row['name'],
            category=row['category'],
            total_wins=row['total_wins'],
            total_bids=row['total_bids'],
            win_rate=row['win_rate'],
            risk_score=row['risk_score'],
            risk_level=row['risk_level'],
            cartel_group=row['cartel_group']
        )

    # Add tender nodes
    for _, row in tenders_df.iterrows():
        B.add_node(
            f"TENDER_{row['tender_id']}",
            type="tender",
            id=row['tender_id'],
            title=row['title'],
            category=row['category'],
            location=row['location'],
            estimated_value=row['estimated_value'],
            winning_bid=row['winning_bid'],
            winning_supplier_id=row['winning_supplier_id'],
            risk_score=row['risk_score'],
            risk_level=row['risk_level']
        )

    # Add bid edges
    for _, row in bids_df.iterrows():
        bidder_node = f"BIDDER_{row['bidder_id']}"
        tender_node = f"TENDER_{row['tender_id']}"
        if bidder_node in B and tender_node in B:
            B.add_edge(
                bidder_node,
                tender_node,
                bid_amount=row['bid_amount'],
                bid_ratio=row['bid_to_estimate_ratio'],
                is_winner=bool(row['is_winner']),
                ip_address=row['ip_address']
            )

    # 2. Co-participation projected bidder graph
    G_bidder = nx.Graph()
    bidder_ids = bidders_df['bidder_id'].tolist()
    for b_id in bidder_ids:
        b_info = bidders_df[bidders_df['bidder_id'] == b_id].iloc[0]
        G_bidder.add_node(
            b_id,
            name=b_info['name'],
            category=b_info['category'],
            risk_score=b_info['risk_score'],
            risk_level=b_info['risk_level'],
            cartel_group=b_info['cartel_group']
        )

    # Calculate shared tenders between every pair of bidders
    bidder_tenders = bids_df.groupby('bidder_id')['tender_id'].apply(set).to_dict()

    for i in range(len(bidder_ids)):
        b1 = bidder_ids[i]
        tenders_b1 = bidder_tenders.get(b1, set())
        if not tenders_b1:
            continue
        for j in range(i + 1, len(bidder_ids)):
            b2 = bidder_ids[j]
            tenders_b2 = bidder_tenders.get(b2, set())
            if not tenders_b2:
                continue
            
            shared = tenders_b1.intersection(tenders_b2)
            if shared:
                union = tenders_b1.union(tenders_b2)
                jaccard = len(shared) / len(union) if union else 0.0
                G_bidder.add_edge(
                    b1,
                    b2,
                    weight=len(shared),
                    shared_count=len(shared),
                    jaccard_similarity=round(jaccard, 4),
                    shared_tenders=list(shared)
                )

    return B, G_bidder, tenders_df, bids_df, bidders_df
