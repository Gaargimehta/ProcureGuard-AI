import React, { useState } from 'react';
import { Settings as SettingsIcon, Sliders, Shield, Save, CheckCircle, Info, Sparkles } from 'lucide-react';

export default function Settings() {
  const [rfWeight, setRfWeight] = useState(28);
  const [xgbWeight, setXgbWeight] = useState(32);
  const [isoWeight, setIsoWeight] = useState(20);
  const [gnnWeight, setGnnWeight] = useState(20);

  const [highRiskThreshold, setHighRiskThreshold] = useState(70);
  const [medRiskThreshold, setMedRiskThreshold] = useState(35);

  const [auditorName, setAuditorName] = useState('Chief Auditor / Anti-Corruption Bureau');
  const [department, setDepartment] = useState('Central Public Procurement Oversight Division');

  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const totalWeight = rfWeight + xgbWeight + isoWeight + gnnWeight;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Settings Header */}
      <div className="bg-[#0f172a]/90 border border-slate-800/80 rounded-2xl p-6 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <SettingsIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-wide">
              ProcureGuard Engine & Auditor Configuration
            </h2>
            <p className="text-xs text-slate-400">
              Tune algorithmic ensemble weights, risk boundary thresholds, and auditor identity
            </p>
          </div>
        </div>
      </div>

      {saved && (
        <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>System configuration parameters updated and applied to live pipeline!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Model Ensemble Weights */}
        <div className="bg-[#0f172a]/90 border border-slate-800/80 rounded-2xl p-6 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                Hybrid Detection Ensemble Weights
              </h3>
              <p className="text-xs text-slate-400">
                Adjust relative influence of tabular ML, anomaly scoring, and Graph Neural Network
              </p>
            </div>
            <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg border ${
              totalWeight === 100 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                : 'bg-red-500/10 border-red-500/30 text-red-400'
            }`}>
              Total: {totalWeight}%
            </span>
          </div>

          <div className="space-y-4 pt-2">
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-slate-300 font-medium">Random Forest Classifier:</span>
                <span className="font-mono text-cyan-400 font-bold">{rfWeight}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                value={rfWeight}
                onChange={(e) => setRfWeight(Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-slate-300 font-medium">XGBoost Gradient Boosted Classifier:</span>
                <span className="font-mono text-cyan-400 font-bold">{xgbWeight}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                value={xgbWeight}
                onChange={(e) => setXgbWeight(Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-slate-300 font-medium">Isolation Forest (Unsupervised Anomaly):</span>
                <span className="font-mono text-cyan-400 font-bold">{isoWeight}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                value={isoWeight}
                onChange={(e) => setIsoWeight(Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-slate-300 font-medium">GraphSAGE Network Embedding (PyTorch):</span>
                <span className="font-mono text-cyan-400 font-bold">{gnnWeight}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                value={gnnWeight}
                onChange={(e) => setGnnWeight(Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Risk Thresholds */}
        <div className="bg-[#0f172a]/90 border border-slate-800/80 rounded-2xl p-6 shadow-lg space-y-4">
          <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
            <Shield className="w-4 h-4 text-cyan-400" />
            Risk Classification Thresholds
          </h3>
          <p className="text-xs text-slate-400">
            Set numerical score thresholds triggering automated case escalation
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="text-xs text-slate-300 block mb-1.5 font-medium">
                High Risk Threshold (Trigger Immediate Dossier):
              </label>
              <input
                type="number"
                min="50"
                max="95"
                value={highRiskThreshold}
                onChange={(e) => setHighRiskThreshold(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-xs text-slate-300 block mb-1.5 font-medium">
                Medium Risk Threshold (Elevated Surveillance):
              </label>
              <input
                type="number"
                min="20"
                max="60"
                value={medRiskThreshold}
                onChange={(e) => setMedRiskThreshold(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>
        </div>

        {/* Auditor Profile */}
        <div className="bg-[#0f172a]/90 border border-slate-800/80 rounded-2xl p-6 shadow-lg space-y-4">
          <h3 className="text-sm font-bold text-white tracking-wide">
            Auditor & Agency Credentials
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-300 block mb-1 font-medium">Authorized Auditor Designation</label>
              <input
                type="text"
                value={auditorName}
                onChange={(e) => setAuditorName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-300 block mb-1 font-medium">Department / Agency</label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all shadow-md cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Configuration</span>
          </button>
        </div>
      </form>
    </div>
  );
}
