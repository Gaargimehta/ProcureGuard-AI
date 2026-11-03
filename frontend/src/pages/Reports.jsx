import React, { useState, useEffect } from 'react';
import RiskBadge from '../components/RiskBadge';
import { 
  fetchAlerts, 
  updateAlertStatus, 
  downloadReportPdfUrl 
} from '../services/api';
import { 
  FileText, 
  Download, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  ExternalLink,
  Filter,
  ShieldAlert
} from 'lucide-react';

export default function Reports({ onSelectTender }) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    loadAlerts();
  }, [statusFilter]);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const res = await fetchAlerts(statusFilter);
      setAlerts(res.alerts || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (alertId, newStatus) => {
    try {
      setUpdatingId(alertId);
      await updateAlertStatus(alertId, newStatus);
      setAlerts((prev) =>
        prev.map((a) => (a.alert_id === alertId ? { ...a, status: newStatus } : a))
      );
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'New': return 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30';
      case 'Under Review': return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'Escalated': return 'bg-red-500/15 text-red-400 border-red-500/30';
      case 'Closed': return 'bg-slate-700/50 text-slate-400 border-slate-600';
      default: return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Filter Bar */}
      <div className="bg-[#0f172a]/90 border border-slate-800/80 rounded-2xl p-4 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 text-red-400" />
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">
              Official Anti-Corruption Case Dossiers & Alerts
            </h3>
            <p className="text-xs text-slate-400">
              Auditor management module for escalating and exporting forensic tender dossiers
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 font-medium">Status Filter:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option value="All">All Case Statuses</option>
            <option value="New">New</option>
            <option value="Under Review">Under Review</option>
            <option value="Escalated">Escalated</option>
            <option value="Closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Alerts & Investigation List */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            Loading investigation records...
          </div>
        ) : alerts.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs bg-[#0f172a]/50 rounded-2xl border border-slate-800">
            No alerts found matching "{statusFilter}".
          </div>
        ) : (
          alerts.map((alert) => (
            <div
              key={alert.alert_id}
              className="bg-[#0f172a]/90 border border-slate-800/80 hover:border-slate-700 rounded-2xl p-5 shadow-lg transition-all space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-bold text-cyan-400">
                    {alert.alert_id}
                  </span>
                  <span className="text-slate-600">•</span>
                  <button
                    onClick={() => onSelectTender(alert.tender_id)}
                    className="font-mono text-sm font-semibold text-white hover:text-cyan-300 underline underline-offset-2 cursor-pointer"
                  >
                    Tender: {alert.tender_id}
                  </button>
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-mono bg-slate-800 text-slate-300 border border-slate-700">
                    {alert.pattern_type}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <RiskBadge level={alert.risk_level} score={alert.risk_score} size="md" />
                  
                  {/* Status Dropdown */}
                  <select
                    value={alert.status}
                    disabled={updatingId === alert.alert_id}
                    onChange={(e) => handleStatusChange(alert.alert_id, e.target.value)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold border focus:outline-none cursor-pointer transition-all ${getStatusColor(alert.status)}`}
                  >
                    <option value="New">New</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Escalated">Escalated</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>
              </div>

              {/* Suspicious Bidder Group */}
              <div className="text-xs text-slate-300 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
                <span className="text-slate-500 font-semibold block text-[10px] uppercase tracking-wider mb-1">
                  Involved Supplier Coalition:
                </span>
                <span className="font-semibold text-white">{alert.bidder_group}</span>
              </div>

              {/* Explanation & Indicators */}
              <div className="space-y-2">
                <p className="text-xs text-slate-300 leading-relaxed">
                  {alert.explanation}
                </p>

                {alert.indicators?.length > 0 && (
                  <div className="pt-2">
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block mb-1">
                      Detected Forensic Markers:
                    </span>
                    <ul className="space-y-1">
                      {alert.indicators.map((ind, i) => (
                        <li key={i} className="text-xs text-slate-400 flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" />
                          <span>{ind}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <span className="text-slate-500 font-mono text-[11px]">
                  Detected At: {alert.created_at}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onSelectTender(alert.tender_id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Inspect In Pipeline</span>
                  </button>

                  <a
                    href={downloadReportPdfUrl(alert.tender_id)}
                    download
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all shadow-md cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Official PDF Dossier</span>
                  </a>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
