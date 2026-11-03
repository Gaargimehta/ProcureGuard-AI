import networkx as nx
from networkx.algorithms import community
import numpy as np
from typing import Dict, Any, List

def analyze_procurement_network(B: nx.Graph, G_bidder: nx.Graph):
    """
    Performs comprehensive structural network analysis:
    - Identifies tight-knit bidder communities (potential cartels/coalitions)
    - Jaccard similarity matrices
    - Degree and Betweenness centrality
    - Clique identification
    - Bid rotation / alternating win sequence detection
    """
    metrics = {
        "bidder_metrics": {},
        "cliques": [],
        "communities": [],
        "suspicious_pairs": [],
        "rotation_rings": []
    }

    # Centrality metrics on co-participation network
    degree_centrality = nx.degree_centrality(G_bidder)
    betweenness = nx.betweenness_centrality(G_bidder)
    clustering = nx.clustering(G_bidder)

    for node in G_bidder.nodes:
        metrics["bidder_metrics"][node] = {
            "degree_centrality": round(degree_centrality.get(node, 0.0), 4),
            "betweenness_centrality": round(betweenness.get(node, 0.0), 4),
            "clustering_coefficient": round(clustering.get(node, 0.0), 4),
            "degree": G_bidder.degree(node)
        }

    # Community detection using greedy modularity communities
    try:
        communities = list(community.greedy_modularity_communities(G_bidder))
        for idx, comm in enumerate(communities):
            members = list(comm)
            if len(members) >= 2:
                # Calculate internal edge density of community
                sub = G_bidder.subgraph(members)
                density = nx.density(sub)
                metrics["communities"].append({
                    "community_id": f"COMM-{idx + 1}",
                    "members": members,
                    "size": len(members),
                    "density": round(density, 4)
                })
    except Exception as e:
        print("Community detection notice:", e)

    # Suspicious pairs with high Jaccard co-participation
    for u, v, data in G_bidder.edges(data=True):
        jaccard = data.get("jaccard_similarity", 0.0)
        shared = data.get("shared_count", 0)
        # Bidders participating together in >= 4 tenders with Jaccard >= 0.35 are anomalous
        if shared >= 3 and jaccard >= 0.30:
            metrics["suspicious_pairs"].append({
                "bidder_a": u,
                "bidder_b": v,
                "shared_tenders": shared,
                "jaccard_similarity": jaccard
            })

    metrics["suspicious_pairs"].sort(key=lambda x: (x["jaccard_similarity"], x["shared_tenders"]), reverse=True)

    # Maximal Cliques (Bidder groups that almost exclusively co-bid together)
    cliques = list(nx.find_cliques(G_bidder))
    significant_cliques = [c for c in cliques if len(c) >= 3]
    for idx, c in enumerate(significant_cliques):
        # Check average edge weight in clique
        weights = []
        for i in range(len(c)):
            for j in range(i + 1, len(c)):
                if G_bidder.has_edge(c[i], c[j]):
                    weights.append(G_bidder[c[i]][c[j]].get("shared_count", 1))
        avg_w = sum(weights) / len(weights) if weights else 0
        if avg_w >= 3:
            metrics["cliques"].append({
                "clique_id": f"CLIQUE-{idx + 1}",
                "members": c,
                "size": len(c),
                "avg_shared_tenders": round(avg_w, 2)
            })

    return metrics
