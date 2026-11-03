import React, { useState, useEffect } from 'react';
import FeatureImportanceChart from '../charts/FeatureImportanceChart';
import { fetchDetectionStatus, runDetectionPipeline } from '../services/api';
import { Cpu, Network, CheckCircle, RefreshCw, AlertTriangle, Layers, GitBranch, Shield, Zap } from 'lucide-react';

export default function DetectionEngine({ onRunDetection, isDetecting }) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      setLoading(true);
      const res = await fetchDetectionStatus();
      setStatus(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Architecture Banner */}
      <div className="bg-[#0f172a]/90 border border-slate-800/80 rounded-2xl p-6 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                <Cpu className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-base font-bold text-white tracking-wide">
                  Hybrid Machine Learning & Graph Neural Network Architecture
                </h2>
                <p className="text-xs text-slate-400">
                  Four-tier ensemble combining supervised gradient boosted trees, unsupervised anomaly detectors, and graph representation learning.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={onRunDetection}
            disabled={isDetecting}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs transition-all shadow-md cursor-pointer shrink-0 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isDetecting ? 'animate-spin' : ''}`} />
            <span>{isDetecting ? 'Training & Inferring...' : 'Execute Full Pipeline'}</span>
          </button>
        </div>

        {/* 4 Active Sub-Model Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {status?.models_active?.map((mod, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 relative overflow-hidden group hover:border-cyan-500/40 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                  Model 0{idx + 1}
                </span>
                <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  {mod.status}
                </span>
              </div>
              <h3 className="text-sm font-bold text-white mt-2 group-hover:text-cyan-300 transition-colors">
                {mod.name}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{mod.type}</p>
              
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-500">Ensemble Weight:</span>
                <span className="font-mono font-bold text-cyan-400">{mod.weight}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Feature Importance & Mathematical Formulation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Feature Importance Bar Chart */}
        <div className="bg-[#0f172a]/90 border border-slate-800/80 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-white tracking-wide">
                  Model Feature Importance Breakdown
                </h3>
                <p className="text-xs text-slate-400">
                  Computed Gini importance and SHAP contribution from Random Forest & XGBoost
                </p>
              </div>
            </div>
            <FeatureImportanceChart features={status?.feature_importances || {}} />
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Last Trained: <b className="text-white font-mono">{status?.last_run || 'In-Memory'}</b></span>
            <span className="text-cyan-400 font-medium">13 Engineered Features</span>
          </div>
        </div>

        {/* Pipeline Formulation Description */}
        <div className="bg-[#0f172a]/90 border border-slate-800/80 rounded-2xl p-5 shadow-lg space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">
              Hybrid Scoring Formulation
            </h3>
            <p className="text-xs text-slate-400">
              Multi-tiered decision-support calculation
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900 font-mono text-xs text-cyan-300 border border-slate-800">
            Risk = (0.28 · P_RF) + (0.32 · P_XGB) + (0.20 · S_IsoForest) + (0.20 · GNN_SAGE)
          </div>

          <div className="space-y-3 text-xs text-slate-300">
            <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800/80">
              <span className="font-bold text-white flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                1. Statistical & Behavioral Features
              </span>
              <p className="text-slate-400 mt-1 leading-relaxed">
                Extracts price-to-estimate pegging proximity (98-99.5%), winning margins between 1st and 2nd bidders, coefficient of variation across bids, and parallel quotation offsets.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800/80">
              <span className="font-bold text-white flex items-center gap-2">
                <Network className="w-3.5 h-3.5 text-cyan-400" />
                2. GraphSAGE Message Passing (PyTorch)
              </span>
              <p className="text-slate-400 mt-1 leading-relaxed">
                Constructs a bipartite bidder-tender graph, projects weighted co-participation matrices, and executes a 2-layer GraphSAGE convolution with mean neighbor aggregation over bidder subgraphs.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800/80">
              <span className="font-bold text-white flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                3. Forensic Heuristics & Rules
              </span>
              <p className="text-slate-400 mt-1 leading-relaxed">
                Flags network subnets sharing /24 IP blocks and rapid submission timing (bids received within seconds of one another).
              </p>
            </div>
          </div>

          {/* Academic / Audit Disclaimer */}
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-200 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-white">Forensic Decision Support Notice:</span>
              <p className="mt-0.5 leading-relaxed text-amber-200/90">
                A high risk score indicates statistical anomalies requiring human investigation. It does not constitute legal proof of illegal antitrust collusion.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
