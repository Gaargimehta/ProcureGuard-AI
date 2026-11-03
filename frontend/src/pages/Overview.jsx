import React from 'react';
import StatCard from '../components/StatCard';
import RiskBadge from '../components/RiskBadge';
import TimelineChart from '../charts/TimelineChart';
import RiskDonutChart from '../charts/RiskDonutChart';
import CategoryBarChart from '../charts/CategoryBarChart';
import { 
  FileCheck2, 
  Users, 
  AlertTriangle, 
  Building2, 
  Activity, 
  DollarSign, 
  MapPin, 
  ArrowUpRight,
  ShieldAlert,
  Download
} from 'lucide-react';
import { downloadReportPdfUrl } from '../services/api';

export default function Overview({ 
  data, 
  loading, 
  onSelectTender, 
  onSelectBidder, 
  onNavigateToTab 
}) {
  if (loading || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-400 gap-3">
        <Activity className="w-8 h-8 text-cyan-400 animate-spin" />
        <span className="text-sm font-medium">Loading ProcureGuard Intelligence metrics...</span>
      </div>
    );
  }

  const formatCurrency = (val) => {
    if (!val) return '$0';
    if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(2)}M`;
    if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}K`;
    return `$${val.toLocaleString()}`;
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Tenders Analysed"
          value={data.total_tenders}
          subtext="Total tenders in dataset"
          icon={FileCheck2}
          color="blue"
        />
        <StatCard
          title="Unique Bidders"
          value={data.total_bidders}
          subtext="Suppliers monitored"
          icon={Users}
          color="purple"
        />
        <StatCard
          title="Suspicious Tenders"
          value={data.suspicious_tenders}
          subtext="Risk score ≥ 35"
          icon={AlertTriangle}
          color="red"
        />
        <StatCard
          title="High-Risk Groups"
          value={data.high_risk_groups}
          subtext="Suppliers in flagged rings"
          icon={Building2}
          color="amber"
        />
        <StatCard
          title="Average Risk"
          value={`${data.avg_risk_score} / 100`}
          subtext="Across all contracts"
          icon={Activity}
          color="blue"
        />
        <StatCard
          title="Affected Value"
          value={formatCurrency(data.affected_contract_value)}
          subtext="Contracts flagged for audit"
          icon={DollarSign}
          color="red"
        />
      </div>

      {/* Primary Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timeline Area Chart */}
        <div className="lg:col-span-2 bg-[#0f172a]/90 border border-slate-800/80 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">Procurement Activity & Collusion Trend</h3>
              <p className="text-xs text-slate-400">Normal competitive submissions vs AI-flagged suspicious tenders</p>
            </div>
            <span className="text-[11px] font-mono bg-cyan-500/10 text-cyan-400 px-2.5 py-1 rounded-md border border-cyan-500/20">
              Live Stream
            </span>
          </div>
          <TimelineChart data={data.tender_activity} />
        </div>

        {/* Risk Distribution Donut */}
        <div className="bg-[#0f172a]/90 border border-slate-800/80 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">Tender Risk Classification</h3>
            <p className="text-xs text-slate-400">Low (&lt;35), Medium (35-70), and High (&gt;70) risk ratings</p>
          </div>
          <RiskDonutChart distribution={data.risk_distribution} />
          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-800/80 text-center text-xs">
            <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/20">
              <span className="text-emerald-400 block font-bold font-mono">{data.risk_distribution.Low || 0}</span>
              <span className="text-[10px] text-slate-400">Low Risk</span>
            </div>
            <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20">
              <span className="text-amber-400 block font-bold font-mono">{data.risk_distribution.Medium || 0}</span>
              <span className="text-[10px] text-slate-400">Medium</span>
            </div>
            <div className="p-2 rounded bg-red-500/10 border border-red-500/20">
              <span className="text-red-400 block font-bold font-mono">{data.risk_distribution.High || 0}</span>
              <span className="text-[10px] text-slate-400">High Risk</span>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Row: Category Risk & Top Suspicious Bidders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="bg-[#0f172a]/90 border border-slate-800/80 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">Procurement Category Risk Profile</h3>
              <p className="text-xs text-slate-400">Tender volume and average risk exposure by sector</p>
            </div>
            <button
              onClick={() => onNavigateToTab('tenders')}
              className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium"
            >
              Explore <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <CategoryBarChart data={data.category_distribution} />
        </div>

        {/* Top Suspicious Bidders */}
        <div className="bg-[#0f172a]/90 border border-slate-800/80 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-white tracking-wide">Top Anomalous Suppliers</h3>
                <p className="text-xs text-slate-400">Suppliers with highest composite collusion risk ratings</p>
              </div>
              <button
                onClick={() => onNavigateToTab('bidders')}
                className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium"
              >
                All Bidders <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2 mt-2">
              {data.top_suspicious_bidders?.map((bidder) => (
                <div
                  key={bidder.bidder_id}
                  onClick={() => onSelectBidder(bidder.bidder_id)}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800/80 hover:border-cyan-500/40 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 font-mono text-xs font-bold">
                      {bidder.risk_score}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
                        {bidder.name}
                      </h4>
                      <span className="text-[11px] text-slate-400">
                        {bidder.category} &nbsp;•&nbsp; Win Rate: {(bidder.win_rate * 100).toFixed(0)}% ({bidder.total_wins} wins)
                      </span>
                    </div>
                  </div>
                  <RiskBadge level={bidder.risk_level} score={bidder.risk_score} size="sm" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tertiary Row: Recent AI Alerts & Geographic Procurement Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent AI Alerts */}
        <div className="lg:col-span-2 bg-[#0f172a]/90 border border-slate-800/80 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-400" />
              <div>
                <h3 className="text-sm font-bold text-white tracking-wide">Recent AI Surveillance Alerts</h3>
                <p className="text-xs text-slate-400">Real-time alerts flagged for auditor forensic review</p>
              </div>
            </div>
            <button
              onClick={() => onNavigateToTab('reports')}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-medium"
            >
              View Dossiers →
            </button>
          </div>

          <div className="space-y-2.5">
            {data.recent_alerts?.slice(0, 4).map((alert) => (
              <div
                key={alert.alert_id}
                className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-700 transition-all"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-cyan-400">{alert.alert_id}</span>
                    <span className="text-slate-400 text-xs">for Tender</span>
                    <button
                      onClick={() => onSelectTender(alert.tender_id)}
                      className="font-mono text-xs text-white hover:text-cyan-300 font-semibold underline underline-offset-2"
                    >
                      {alert.tender_id}
                    </button>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                      {alert.pattern_type}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 line-clamp-1">{alert.explanation}</p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <RiskBadge level={alert.risk_level} score={alert.risk_score} size="sm" />
                  <a
                    href={downloadReportPdfUrl(alert.tender_id)}
                    download
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                    title="Download Official Audit PDF"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Geographic Procurement Activity */}
        <div className="bg-[#0f172a]/90 border border-slate-800/80 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-4 h-4 text-cyan-400" />
              <div>
                <h3 className="text-sm font-bold text-white tracking-wide">Geographic Activity</h3>
                <p className="text-xs text-slate-400">Jurisdictions and anomaly density</p>
              </div>
            </div>

            <div className="space-y-2 mt-2">
              {data.geographic_activity?.slice(0, 6).map((geo, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/60 text-xs">
                  <span className="text-slate-300 font-medium">{geo.location}</span>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-slate-400 text-[11px]">{geo.tenders_count} tenders</span>
                    {geo.high_risk_count > 0 && (
                      <span className="text-red-400 text-[11px] bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/30">
                        {geo.high_risk_count} flagged
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
