import React, { useState, useEffect, useRef } from 'react';
import { fetchNetworkData } from '../services/api';
import RiskBadge from '../components/RiskBadge';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Filter, 
  Share2, 
  Info, 
  Layers, 
  AlertTriangle,
  Users,
  Search
} from 'lucide-react';

export default function NetworkView({ onSelectBidder }) {
  const [graph, setGraph] = useState({ nodes: [], edges: [], cliques: [], communities: [] });
  const [loading, setLoading] = useState(true);

  // Filters
  const [minShared, setMinShared] = useState(2);
  const [onlySuspicious, setOnlySuspicious] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Interactive selection state
  const [selectedNode, setSelectedNode] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);

  // Canvas pan & zoom state
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 0.85 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const containerRef = useRef(null);

  useEffect(() => {
    loadGraph();
  }, [minShared, onlySuspicious, selectedCategory]);

  const loadGraph = async () => {
    try {
      setLoading(true);
      const data = await fetchNetworkData({
        min_shared: minShared,
        only_suspicious: onlySuspicious,
        category: selectedCategory
      });
      setGraph(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Node neighbors lookup
  const getNeighbors = (nodeId) => {
    if (!nodeId) return new Set();
    const set = new Set();
    graph.edges.forEach((e) => {
      if (e.source === nodeId) set.add(e.target);
      if (e.target === nodeId) set.add(e.source);
    });
    return set;
  };

  const selectedNeighbors = selectedNode ? getNeighbors(selectedNode.id) : new Set();

  const handleMouseDown = (e) => {
    if (e.target.tagName.toLowerCase() === 'svg' || e.target.id === 'network-canvas-bg') {
      setIsDragging(true);
      setDragStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      setTransform((prev) => ({
        ...prev,
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      }));
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const zoom = (factor) => {
    setTransform((prev) => ({
      ...prev,
      k: Math.max(0.3, Math.min(2.5, prev.k * factor))
    }));
  };

  const resetView = () => {
    setTransform({ x: 0, y: 0, k: 0.85 });
    setSelectedNode(null);
  };

  const getNodeColor = (node) => {
    if (node.risk_level === 'High') return '#ef4444';
    if (node.risk_level === 'Medium') return '#f59e0b';
    return '#10b981';
  };

  return (
    <div className="space-y-4">
      {/* Network Filter Bar */}
      <div className="bg-[#0f172a]/90 border border-slate-800/80 rounded-2xl p-4 shadow-lg flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Share2 className="w-5 h-5 text-cyan-400" />
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">
              Bipartite Co-Participation & Collusion Graph
            </h3>
            <p className="text-xs text-slate-400">
              Interactive structural map of suppliers connected by shared tender submissions
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs">
          {/* Min Shared Tenders Slider */}
          <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
            <span className="text-slate-400">Min Shared Tenders:</span>
            <input
              type="range"
              min="1"
              max="8"
              value={minShared}
              onChange={(e) => setMinShared(Number(e.target.value))}
              className="w-20 accent-cyan-400 cursor-pointer"
            />
            <span className="font-mono text-cyan-400 font-bold w-4">{minShared}</span>
          </div>

          {/* Suspicious Only Toggle */}
          <button
            onClick={() => setOnlySuspicious(!onlySuspicious)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
              onlySuspicious
                ? 'bg-red-500/20 border-red-500/50 text-red-300 font-semibold'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>High/Medium Risk Only</span>
          </button>

          {/* Graph Stats Badge */}
          <div className="hidden sm:flex items-center gap-2 font-mono text-[11px] text-slate-400">
            <span>Nodes: <b className="text-white">{graph.nodes.length}</b></span>
            <span>•</span>
            <span>Edges: <b className="text-white">{graph.edges.length}</b></span>
          </div>
        </div>
      </div>

      {/* Main Interactive Canvas Area */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Graph Visualizer Container */}
        <div 
          ref={containerRef}
          className="lg:col-span-3 h-[600px] bg-[#070c18] border border-slate-800/80 rounded-2xl relative overflow-hidden select-none cursor-grab active:cursor-grabbing shadow-inner"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Controls Overlay */}
          <div className="absolute top-4 right-4 z-20 flex flex-col gap-1.5 bg-[#0f172a]/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-800 shadow-xl">
            <button
              onClick={() => zoom(1.2)}
              className="p-2 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => zoom(0.8)}
              className="p-2 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={resetView}
              className="p-2 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Reset View"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Legend Overlay */}
          <div className="absolute bottom-4 left-4 z-20 bg-[#0f172a]/90 backdrop-blur-md p-3 rounded-xl border border-slate-800 text-[11px] space-y-1.5 shadow-xl pointer-events-none">
            <span className="font-semibold text-slate-400 uppercase tracking-wider block text-[10px]">
              Computed Node Risk:
            </span>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]" />
              <span className="text-slate-300">High Risk (&gt;70)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_#f59e0b]" />
              <span className="text-slate-300">Medium Risk (35-70)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
              <span className="text-slate-300">Low Risk (&lt;35)</span>
            </div>
            <div className="flex items-center gap-2 pt-1 border-t border-slate-800 text-[10px] text-slate-400">
              <span className="w-3 h-0.5 bg-red-400" />
              <span>Co-bidding &gt;3 tenders (Anomalous)</span>
            </div>
          </div>

          {/* SVG Canvas */}
          <svg
            id="network-canvas-bg"
            className="w-full h-full"
            style={{
              backgroundImage: 'radial-gradient(rgba(56, 189, 248, 0.04) 1px, transparent 0)',
              backgroundSize: '24px 24px'
            }}
          >
            <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.k})`}>
              {/* Edges */}
              {graph.edges.map((e) => {
                const sourceNode = graph.nodes.find((n) => n.id === e.source);
                const targetNode = graph.nodes.find((n) => n.id === e.target);
                if (!sourceNode || !targetNode) return null;

                const isConnected = selectedNode && (
                  selectedNode.id === e.source || selectedNode.id === e.target
                );
                const isDimmed = selectedNode && !isConnected;

                const edgeStroke = e.is_suspicious 
                  ? '#ef4444' 
                  : isConnected 
                  ? '#38bdf8' 
                  : '#334155';

                const strokeWidth = Math.max(1, Math.min(e.weight * 0.8, 5));
                const strokeOpacity = isDimmed ? 0.08 : isConnected ? 0.9 : e.is_suspicious ? 0.6 : 0.35;

                return (
                  <line
                    key={e.id}
                    x1={sourceNode.x}
                    y1={sourceNode.y}
                    x2={targetNode.x}
                    y2={targetNode.y}
                    stroke={edgeStroke}
                    strokeWidth={strokeWidth}
                    strokeOpacity={strokeOpacity}
                    strokeDasharray={e.is_suspicious ? '4,4' : undefined}
                  />
                );
              })}

              {/* Nodes */}
              {graph.nodes.map((node) => {
                const isSelected = selectedNode?.id === node.id;
                const isNeighbor = selectedNeighbors.has(node.id);
                const isDimmed = selectedNode && !isSelected && !isNeighbor;
                const color = getNodeColor(node);

                return (
                  <g
                    key={node.id}
                    transform={`translate(${node.x}, ${node.y})`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedNode(node);
                    }}
                    onMouseEnter={() => setHoveredNode(node)}
                    onMouseLeave={() => setHoveredNode(null)}
                    className="cursor-pointer transition-all duration-200"
                    opacity={isDimmed ? 0.15 : 1}
                  >
                    {/* Pulsing ring for high risk cartel nodes */}
                    {node.risk_level === 'High' && (
                      <circle
                        r={24}
                        fill="none"
                        stroke="#ef4444"
                        strokeWidth={1.5}
                        strokeOpacity={0.4}
                        className="animate-ping"
                      />
                    )}

                    {/* Outer border for selected */}
                    {isSelected && (
                      <circle
                        r={22}
                        fill="none"
                        stroke="#00F0FF"
                        strokeWidth={3}
                        strokeDasharray="4,2"
                      />
                    )}

                    {/* Main Node Circle */}
                    <circle
                      r={isSelected ? 18 : 14}
                      fill="#0f172a"
                      stroke={color}
                      strokeWidth={isSelected ? 3.5 : 2.5}
                      className="hover:scale-110 transition-transform"
                    />

                    {/* Inner core */}
                    <circle
                      r={isSelected ? 7 : 5}
                      fill={color}
                    />

                    {/* Node Label Text */}
                    <text
                      dy={28}
                      textAnchor="middle"
                      fill={isSelected ? '#38bdf8' : '#e2e8f0'}
                      fontSize={isSelected ? 11 : 9.5}
                      fontFamily="monospace"
                      fontWeight={isSelected ? 'bold' : 'normal'}
                      className="pointer-events-none select-none drop-shadow-md"
                    >
                      {node.label.length > 14 ? node.label.substring(0, 12) + '...' : node.label}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>
        </div>

        {/* Sidebar Inspector Panel */}
        <div className="bg-[#0f172a]/90 border border-slate-800/80 rounded-2xl p-5 shadow-lg flex flex-col justify-between h-[600px] overflow-y-auto">
          {selectedNode ? (
            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400">
                  Node Inspector
                </span>
                <h3 className="text-base font-bold text-white mt-1 leading-snug">
                  {selectedNode.label}
                </h3>
                <span className="text-xs font-mono text-slate-400">
                  ID: {selectedNode.id}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <RiskBadge 
                  level={selectedNode.risk_level} 
                  score={selectedNode.risk_score} 
                  size="md" 
                />
                {selectedNode.cartel_group && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-500/20 text-red-300 font-mono">
                    {selectedNode.cartel_group}
                  </span>
                )}
              </div>

              {/* Topological Graph Metrics */}
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                  Topological Centrality (NetworkX):
                </span>
                <div className="flex justify-between">
                  <span className="text-slate-400">Degree (Connections):</span>
                  <span className="font-mono text-white font-bold">{selectedNode.degree}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Degree Centrality:</span>
                  <span className="font-mono text-cyan-400 font-bold">{selectedNode.centrality}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Clustering Coefficient:</span>
                  <span className="font-mono text-purple-400 font-bold">{selectedNode.clustering}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Historical Win Rate:</span>
                  <span className="font-mono text-emerald-400 font-bold">
                    {(selectedNode.win_rate * 100).toFixed(0)}% ({selectedNode.total_wins} wins)
                  </span>
                </div>
              </div>

              {/* Connected Neighbors List */}
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                  Connected Co-Bidders ({selectedNeighbors.size}):
                </span>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {Array.from(selectedNeighbors).map((nId) => {
                    const nNode = graph.nodes.find((n) => n.id === nId);
                    const edge = graph.edges.find((e) => 
                      (e.source === selectedNode.id && e.target === nId) ||
                      (e.target === selectedNode.id && e.source === nId)
                    );
                    return (
                      <div
                        key={nId}
                        onClick={() => setSelectedNode(nNode)}
                        className="p-2 rounded-lg bg-slate-900/60 hover:bg-slate-800 border border-slate-800 flex items-center justify-between text-xs cursor-pointer transition-colors"
                      >
                        <div>
                          <span className="text-white font-medium block truncate max-w-[120px]">
                            {nNode?.label || nId}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Shared: <b className="text-cyan-400 font-mono">{edge?.shared_tenders || 1}</b> tenders
                          </span>
                        </div>
                        <span className="font-mono text-[10px] text-purple-400">
                          J={edge?.jaccard_similarity || 0}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <button
                onClick={() => {
                  if (onSelectBidder) onSelectBidder(selectedNode.id);
                }}
                className="w-full py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 text-xs font-semibold transition-all cursor-pointer"
              >
                Open Full Bidder Dossier →
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 space-y-3">
              <Users className="w-10 h-10 text-slate-600" />
              <div>
                <h4 className="text-sm font-semibold text-white">Select a Supplier Node</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-[180px]">
                  Click any node on the graph to inspect structural collusion metrics, cliques, and connected partners.
                </p>
              </div>
            </div>
          )}

          {/* Bottom Detected Cliques summary */}
          {graph.cliques?.length > 0 && (
            <div className="pt-3 border-t border-slate-800 text-[11px]">
              <span className="text-slate-400 block mb-1 font-semibold">Detected Cartel Cliques:</span>
              <div className="flex flex-wrap gap-1">
                {graph.cliques.map((clique, idx) => (
                  <span key={idx} className="px-2 py-0.5 rounded bg-red-500/10 border border-red-500/30 text-red-300 font-mono text-[10px]">
                    {clique.clique_id}: {clique.size} Members
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
