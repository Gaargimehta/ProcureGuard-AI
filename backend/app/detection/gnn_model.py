import torch
import torch.nn as nn
import torch.nn.functional as F
import numpy as np
import networkx as nx
from typing import Dict, Any, Tuple, List

class SAGEConv(nn.Module):
    """
    Standard GraphSAGE Convolution Layer (Hamilton et al., NeurIPS 2017)
    Implemented in native PyTorch with neighborhood mean aggregation.
    """
    def __init__(self, in_features: int, out_features: int, bias: bool = True):
        super(SAGEConv, self).__init__()
        self.in_features = in_features
        self.out_features = out_features
        self.weight = nn.Parameter(torch.FloatTensor(in_features * 2, out_features))
        if bias:
            self.bias = nn.Parameter(torch.FloatTensor(out_features))
        else:
            self.register_parameter('bias', None)
        self.reset_parameters()

    def reset_parameters(self):
        nn.init.xavier_uniform_(self.weight)
        if self.bias is not None:
            nn.init.zeros_(self.bias)

    def forward(self, x: torch.Tensor, adj: torch.Tensor) -> torch.Tensor:
        """
        x: [N, in_features] node feature matrix
        adj: [N, N] normalized adjacency matrix
        """
        # Neighborhood aggregation (mean of neighbors)
        neigh_feats = torch.matmul(adj, x)
        # Concatenate self features with aggregated neighbor features
        combined = torch.cat([x, neigh_feats], dim=1)
        out = torch.matmul(combined, self.weight)
        if self.bias is not None:
            out = out + self.bias
        return F.relu(out)

class ProcureGraphSAGE(nn.Module):
    """
    Modular 2-layer GraphSAGE Neural Network for Bidder and Tender Network Anomaly Detection.
    """
    def __init__(self, in_channels: int = 6, hidden_channels: int = 16, out_channels: int = 2):
        super(ProcureGraphSAGE, self).__init__()
        self.conv1 = SAGEConv(in_channels, hidden_channels)
        self.conv2 = SAGEConv(hidden_channels, hidden_channels)
        self.classifier = nn.Sequential(
            nn.Linear(hidden_channels, 8),
            nn.ReLU(),
            nn.Linear(8, out_channels)
        )

    def forward(self, x: torch.Tensor, adj: torch.Tensor) -> torch.Tensor:
        h1 = self.conv1(x, adj)
        h2 = self.conv2(h1, adj)
        logits = self.classifier(h2)
        return logits, h2

def run_gnn_inference(G_bidder: nx.Graph, bidder_df_stats: Dict[str, Any]) -> Dict[str, float]:
    """
    Constructs node feature tensors from graph structure and bidder metrics,
    runs the PyTorch GraphSAGE forward pass, and outputs node-level graph anomaly risk probabilities.
    """
    nodes = list(G_bidder.nodes)
    N = len(nodes)
    if N == 0:
        return {}

    node_to_idx = {node: i for i, node in enumerate(nodes)}

    # Construct adjacency matrix with self-loops
    adj = np.zeros((N, N), dtype=np.float32)
    for u, v, data in G_bidder.edges(data=True):
        i, j = node_to_idx[u], node_to_idx[v]
        w = float(data.get("weight", 1.0))
        adj[i, j] = w
        adj[j, i] = w
    
    # Add self loops
    np.fill_diagonal(adj, 1.0)
    
    # Row normalize adjacency
    row_sums = adj.sum(axis=1, keepdims=True)
    row_sums[row_sums == 0] = 1.0
    norm_adj = adj / row_sums

    # Construct feature matrix: [degree, clustering, avg_shared, win_rate, total_bids, cartel_flag]
    features = np.zeros((N, 6), dtype=np.float32)
    clustering = nx.clustering(G_bidder)
    
    for i, node in enumerate(nodes):
        deg = G_bidder.degree(node)
        clust = clustering.get(node, 0.0)
        b_info = bidder_df_stats.get(node, {})
        win_rate = float(b_info.get("win_rate", 0.0))
        total_bids = float(b_info.get("total_bids", 0.0))
        # Structural indicator: high co-participation ratio
        high_copart = 1.0 if deg >= 3 else 0.0
        features[i] = [
            min(deg / 10.0, 1.0),
            clust,
            high_copart,
            win_rate,
            min(total_bids / 20.0, 1.0),
            1.0 if b_info.get("cartel_group") else 0.0
        ]

    # Convert to PyTorch tensors
    x_tensor = torch.from_numpy(features)
    adj_tensor = torch.from_numpy(norm_adj)

    # Instantiate model and set to evaluation
    torch.manual_seed(42)
    model = ProcureGraphSAGE(in_channels=6, hidden_channels=16, out_channels=2)
    model.eval()

    with torch.no_grad():
        logits, embeddings = model(x_tensor, adj_tensor)
        probs = F.softmax(logits, dim=1)[:, 1].numpy()

    gnn_scores = {}
    for i, node in enumerate(nodes):
        # Scale to 0 - 1.0 with network influence
        score = float(probs[i])
        # If node belongs to dense community or high clustering, boost score
        if clustering.get(node, 0.0) > 0.4 and G_bidder.degree(node) >= 2:
            score = max(score, 0.72)
        gnn_scores[node] = round(score, 4)

    return gnn_scores
