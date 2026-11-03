import React from 'react';
import { Play, Sparkles, RefreshCw, AlertTriangle, ShieldCheck, Download } from 'lucide-react';

export default function Header({ 
  currentTab, 
  onRunDetection, 
  isDetecting, 
  onOpenDemoScenarios,
  lastDetectionTime
}) {
  const titles = {
    overview: { title: 'Procurement Intelligence Overview', sub: 'Real-time multi-dimensional surveillance of government procurement bids' },
    tenders: { title: 'Tender Analytics & Investigation', sub: 'Forensic exploration of tenders, bids, price spreads, and pricing peg indicators' },
    bidders: { title: 'Bidder Intelligence & Cartel Tracking', sub: 'Supplier behavioral profiling, winning frequencies, and cartel coalition memberships' },
    network: { title: 'Collusion & Co-Bidding Network', sub: 'Interactive bipartite graph & Louvain community detection of recurring bidding rings' },
    engine: { title: 'AI Detection Engine Architecture', sub: 'Hybrid ensemble of Random Forest, XGBoost, Isolation Forest & PyTorch GraphSAGE' },
    reports: { title: 'Forensic Investigation Reports', sub: 'Official audit dossiers, case status management, and downloadable PDF packages' },
    dataset: { title: 'Procurement Dataset Management', sub: 'CSV ingest, data sanitization, duplicate removal, and synthetic sample generators' },
    settings: { title: 'System Engine Settings', sub: 'Detection sensitivity thresholds, ML ensemble weights, and college demo configuration' },
  };

  const current = titles[currentTab] || { title: 'ProcureGuard Intelligence', sub: 'Transparent Procurement Surveillance' };

  return (
    <header className="sticky top-0 z-30 bg-[#090e1a]/90 backdrop-blur-md border-b border-slate-800/80 px-6 py-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      {/* Title & Section details */}
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          {current.title}
        </h1>
        <p className="text-xs text-slate-400 mt-0.5 max-w-2xl">
          {current.sub}
        </p>
      </div>

      {/* Action Controls & Demo Mode Button */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Scenario Selector Pill */}
        <button
          onClick={onOpenDemoScenarios}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-purple-500/15 border border-purple-500/40 text-purple-300 hover:bg-purple-500/25 transition-all shadow-sm cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span>Demo Scenarios</span>
        </button>

        {/* Primary Action: Run Live Collusion Detection */}
        <button
          onClick={onRunDetection}
          disabled={isDetecting}
          className={`flex items-center gap-2.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-lg cursor-pointer ${
            isDetecting
              ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50 cursor-not-allowed opacity-80'
              : 'bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-[1.02] active:scale-[0.98]'
          }`}
        >
          <Play className={`w-3.5 h-3.5 fill-current ${isDetecting ? 'animate-spin' : ''}`} />
          <span>{isDetecting ? 'RUNNING DETECTION...' : 'RUN LIVE COLLUSION DETECTION'}</span>
        </button>
      </div>
    </header>
  );
}
