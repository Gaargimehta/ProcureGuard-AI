import React from 'react';
import Modal from './Modal';
import RiskBadge from './RiskBadge';
import { Sparkles, CheckCircle2, AlertTriangle, ArrowRight, ShieldCheck, Download } from 'lucide-react';
import { downloadReportPdfUrl } from '../services/api';

export default function DemoScenarioModal({ 
  isOpen, 
  onClose, 
  scenarios = [], 
  onInspectTender 
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="B.Tech Major Project - Live Demonstration Scenarios"
      subtitle="Examine how ProcureGuard AI detects real collusion versus healthy competitive procurement."
      maxWidth="max-w-5xl"
    >
      <div className="space-y-6">
        {/* Banner Explaining Simulation vs Model Prediction */}
        <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-500/40 text-xs text-cyan-200 flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-white text-sm">Academic Methodology Note:</span>
            <p className="mt-1 text-slate-300 leading-relaxed">
              In this evaluation suite, simulated ground-truth scenarios (<b>Normal</b>, <b>Bid Rotation</b>, and <b>Cover Bidding</b>) are strictly quarantined from the machine learning inference engine. The detection scores (0-100) are generated purely via statistical feature extraction, XGBoost/Random Forest probabilities, and GraphSAGE message passing.
            </p>
          </div>
        </div>

        {/* 3 Scenarios Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {scenarios.map((scen, idx) => {
            const isHigh = scen.expected_risk.includes('High');
            const borderColor = isHigh ? 'border-red-500/40' : 'border-emerald-500/40';
            const badgeColor = isHigh ? 'red' : 'emerald';
            
            return (
              <div 
                key={scen.id}
                className={`bg-[#0f172a] rounded-xl border ${borderColor} p-5 flex flex-col justify-between hover:bg-[#131d35] transition-all`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                      Scenario 0{idx + 1}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                      isHigh ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'
                    }`}>
                      {scen.tag}
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-white mt-2 leading-snug">
                    {scen.name.replace(/Scenario \d+: /, '')}
                  </h4>

                  <div className="mt-3 p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Target Tender:</span>
                      <span className="font-mono text-cyan-400 font-semibold">{scen.tender_id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Simulated Ground Truth:</span>
                      <span className="font-mono text-slate-300 font-medium">{scen.simulation_label}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Expected Risk:</span>
                      <span className={`font-mono font-bold ${isHigh ? 'text-red-400' : 'text-emerald-400'}`}>
                        {scen.expected_risk}
                      </span>
                    </div>
                  </div>

                  <p className="mt-3 text-xs text-slate-300 leading-relaxed">
                    {scen.description}
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-800/80">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide block mb-2">
                      Key Algorithmic Signals:
                    </span>
                    <ul className="space-y-1.5">
                      {scen.key_signals.map((sig, sIdx) => (
                        <li key={sIdx} className="text-xs text-slate-400 flex items-start gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${isHigh ? 'bg-red-400' : 'bg-emerald-400'}`} />
                          <span>{sig}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                  <button
                    onClick={() => {
                      onInspectTender(scen.tender_id);
                      onClose();
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 text-xs font-semibold transition-all cursor-pointer"
                  >
                    <span>Inspect In Pipeline</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <a
                    href={downloadReportPdfUrl(scen.tender_id)}
                    download
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                    title="Download Forensic PDF Dossier"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Modal>
  );
}
