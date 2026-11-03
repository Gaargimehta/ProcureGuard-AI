from fastapi import APIRouter, Query
from app.graph.builder import build_procurement_graphs
from app.graph.analysis import analyze_procurement_network
import networkx as nx
import math

router = APIRouter(prefix="/api/network", tags=["Network"])

@router.get("")
def get_network_graph(
    min_shared: int = Query(2, description="Minimum shared tenders to show co-bidding edge"),
    only_suspicious: bool = Query(False, description="Filter only medium/high risk nodes"),
    category: str = Query("All")
):
    """
    Returns graph nodes and edges optimized for frontend interactive rendering (Cytoscape or Custom Canvas/SVG):
    - Bidder nodes with computed risk colors, degree, centrality
    - Co-participation edges weighted by shared tender count & Jaccard index
    - Highlighted Cartel Communities / Cliques
    """
    B, G_bidder, tenders_df, bids_df, bidders_df = build_procurement_graphs()
    graph_metrics = analyze_procurement_network(B, G_bidder)

    nodes = []
    edges = []

    # Map positions using spring layout or circular layout for aesthetics
    subgraph = G_bidder.copy()
    if category != "All":
        filtered_bidders = bidders_df[bidders_df["category"] == category]["bidder_id"].tolist()
        subgraph = subgraph.subgraph(filtered_bidders)

    pos = nx.spring_layout(subgraph, seed=42, k=1.8, iterations=50)

    # Prepare bidder nodes
    for node_id in subgraph.nodes:
        b_info = bidders_df[bidders_df["bidder_id"] == node_id].iloc[0]
        risk_score = float(b_info["risk_score"])
        risk_level = b_info["risk_level"]

        if only_suspicious and risk_level == "Low":
            continue

        x, y = pos.get(node_id, (0.0, 0.0))
        # Scale to canvas coordinates
        cx = round((float(x) * 450) + 500, 1)
        cy = round((float(y) * 350) + 380, 1)

        b_metric = graph_metrics["bidder_metrics"].get(node_id, {})

        nodes.append({
            "id": node_id,
            "label": b_info["name"],
            "category": b_info["category"],
            "type": "bidder",
            "risk_score": risk_score,
            "risk_level": risk_level,
            "cartel_group": b_info["cartel_group"],
            "total_wins": int(b_info["total_wins"]),
            "win_rate": float(b_info["win_rate"]),
            "total_bids": int(b_info["total_bids"]),
            "degree": b_metric.get("degree", 0),
            "centrality": b_metric.get("degree_centrality", 0.0),
            "clustering": b_metric.get("clustering_coefficient", 0.0),
            "x": cx,
            "y": cy
        })

    valid_node_ids = {n["id"] for n in nodes}

    # Prepare edges
    edge_id = 0
    for u, v, data in subgraph.edges(data=True):
        if u not in valid_node_ids or v not in valid_node_ids:
            continue
        
        shared = data.get("shared_count", 1)
        jaccard = data.get("jaccard_similarity", 0.0)

        if shared < min_shared and not only_suspicious:
            continue

        # Suspicious edge condition
        is_suspicious_edge = (shared >= 4 or jaccard >= 0.35)

        edges.append({
            "id": f"e_{edge_id}",
            "source": u,
            "target": v,
            "shared_tenders": shared,
            "jaccard_similarity": jaccard,
            "is_suspicious": is_suspicious_edge,
            "weight": shared
        })
        edge_id += 1

    return {
        "nodes": nodes,
        "edges": edges,
        "cliques": graph_metrics.get("cliques", []),
        "communities": graph_metrics.get("communities", []),
        "suspicious_pairs": graph_metrics.get("suspicious_pairs", [])[:10],
        "stats": {
            "total_nodes": len(nodes),
            "total_edges": len(edges),
            "high_risk_nodes": sum(1 for n in nodes if n["risk_level"] == "High"),
            "suspicious_edges": sum(1 for e in edges if e["is_suspicious"])
        }
    }
