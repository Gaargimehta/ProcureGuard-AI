import React, { useState, useEffect } from 'react';
import RiskBadge from '../components/RiskBadge';
import Modal from '../components/Modal';
import { fetchBidders, fetchBidderDetail } from '../services/api';
import { Search, Building, Users, Award, TrendingUp, AlertTriangle, ExternalLink } from 'lucide-react';

export default function Bidders({ initialSelectedBidderId, onClearSelectedBidder, onSelectTender }) {
  const [bidders, setBidders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedRisk, setSelectedRisk] = useState('All');
  const [selectedBidder, setSelectedBidder] = useState(null);

  useEffect(() => {
    loadBidders();
  }, [selectedRisk, search]);

  useEffect(() => {
    if (initialSelectedBidderId) {
      handleOpenDetail(initialSelectedBidderId);
      if (onClearSelectedBidder) onClearSelectedBidder();
    }
  }, [initialSelectedBidderId]);

  const loadBidders = async () => {
    try {
      setLoading(true);
      const res = await fetchBidders({
        risk_level: selectedRisk,
        search: search.trim()
      });
      setBidders(res.bidders || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDetail = async (bidderId) => {
    try {
      const res = await fetchBidderDetail(bidderId);
      setSelectedBidder(res);
    } catch (err) {
      console.error(err);
    }
  };

  const formatCurrency = (val) => {
    if (!val) return '$0';
    if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(2)}M`;
    if (val >= 1_000) return `$${(val / 1_000).toFixed(1)}K`;
    return `$${Number(val).toLocaleString()}`;
  };

  return (
    <div className="space-y-6">
      {/* Search & Filter Toolbar */}
      <div className="bg-[#0f172a]/90 border border-slate-800/80 rounded-2xl p-4 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search supplier ID or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={selectedRisk}
            onChange={(e) => setSelectedRisk(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option value="All">All Risk Ratings</option>
            <option value="High">High Risk (&gt;70)</option>
            <option value="Medium">Medium Risk (35-70)</option>
            <option value="Low">Low Risk (&lt;35)</option>
          </select>
        </div>
      </div>

      {/* Bidders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full py-16 text-center text-slate-400 text-xs">
            Querying supplier network profiles...
          </div>
        ) : bidders.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-400 text-xs">
            No suppliers match the current filter.
          </div>
        ) : (
          bidders.map((b) => (
            <div
              key={b.bidder_id}
              onClick={() => handleOpenDetail(b.bidder_id)}
              className="bg-[#0f172a]/90 border border-slate-800/80 hover:border-cyan-500/40 rounded-2xl p-5 shadow-lg hover:shadow-cyan-500/10 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="font-mono text-cyan-400 text-[11px] font-bold">
                      {b.bidder_id}
                    </span>
                    <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-1 mt-0.5">
                      {b.name}
                    </h3>
                  </div>
                  <RiskBadge level={b.risk_level} score={b.risk_score} size="sm" />
                </div>

                <div className="mt-2 text-[11px] text-slate-400 line-clamp-1">
                  Sector: {b.category}
                </div>

                {b.cartel_group && (
                  <div className="mt-2 px-2.5 py-1 rounded bg-red-500/10 border border-red-500/30 text-[10px] text-red-300 font-mono font-medium inline-block">
                    {b.cartel_group}
                  </div>
                )}

                {/* Metrics Breakdown */}
                <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-800 text-center">
                  <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/60">
                    <span className="text-[10px] text-slate-400 uppercase block">Total Won</span>
                    <span className="font-mono text-xs font-bold text-emerald-400 mt-0.5 block">
                      {formatCurrency(b.total_won_value)}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/60">
                    <span className="text-[10px] text-slate-400 uppercase block">Win Rate</span>
                    <span className="font-mono text-xs font-bold text-white mt-0.5 block">
                      {(b.win_rate * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/60">
                    <span className="text-[10px] text-slate-400 uppercase block">Avg Ratio</span>
                    <span className="font-mono text-xs font-bold text-purple-400 mt-0.5 block">
                      {(b.avg_bid_ratio * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* Suspicious Flags */}
                {b.suspicious_flags?.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {b.suspicious_flags.map((flag, idx) => (
                      <span key={idx} className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30 font-medium">
                        {flag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-cyan-400 group-hover:text-cyan-300 font-medium">
                <span>View Historical Dossier</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </div>
            </div>
          ))
        )}
      </div>

      {/* Bidder Detail Modal */}
      {selectedBidder && (
        <Modal
          isOpen={!!selectedBidder}
          onClose={() => setSelectedBidder(null)}
          title={`Supplier Profile: ${selectedBidder.bidder.name}`}
          subtitle={`Identifier: ${selectedBidder.bidder.bidder_id} | Core Sector: ${selectedBidder.bidder.category}`}
          maxWidth="max-w-4xl"
        >
          <div className="space-y-6">
            {/* Header Badge */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900 border border-slate-800">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <RiskBadge 
                    level={selectedBidder.bidder.risk_level} 
                    score={selectedBidder.bidder.risk_score} 
                    size="lg" 
                  />
                  {selectedBidder.bidder.cartel_group && (
                    <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-300 font-mono text-xs font-bold">
                      {selectedBidder.bidder.cartel_group}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-300">
                  Registered: {selectedBidder.bidder.created_at}
                </p>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Total Award Value</span>
                <span className="text-xl font-bold font-mono text-emerald-400">
                  {formatCurrency(selectedBidder.bidder.total_won_value)}
                </span>
              </div>
            </div>

            {/* Frequent Co-Bidders Section */}
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2.5">
                Top Co-Participating Suppliers (Bidding Rings)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {selectedBidder.co_bidders?.map((cb) => (
                  <div key={cb.bidder_id} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                    <span className="font-mono text-cyan-400 text-xs font-bold">{cb.bidder_id}</span>
                    <h5 className="text-xs font-semibold text-white truncate mt-0.5">{cb.bidder_name}</h5>
                    <span className="text-[11px] text-slate-400 mt-1 block">
                      Shared tenders: <b className="text-white font-mono">{cb.shared_tenders}</b>
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tender History Table */}
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2.5">
                Historical Tender Submissions ({selectedBidder.history?.length || 0})
              </h4>
              <div className="rounded-xl border border-slate-800 overflow-hidden max-h-72 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 text-slate-400 text-[11px] font-semibold sticky top-0">
                    <tr>
                      <th className="py-2.5 px-3">Tender ID</th>
                      <th className="py-2.5 px-3">Title</th>
                      <th className="py-2.5 px-3 text-right">Submitted Bid</th>
                      <th className="py-2.5 px-3 text-right">Ratio</th>
                      <th className="py-2.5 px-3 text-center">Result</th>
                      <th className="py-2.5 px-3 text-right">Risk</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 bg-slate-900/40 font-mono text-[11px]">
                    {selectedBidder.history?.map((h) => (
                      <tr 
                        key={h.tender_id}
                        onClick={() => {
                          if (onSelectTender) onSelectTender(h.tender_id);
                          setSelectedBidder(null);
                        }}
                        className="hover:bg-slate-800/60 transition-colors cursor-pointer"
                      >
                        <td className="py-2 px-3 text-cyan-400 font-bold">{h.tender_id}</td>
                        <td className="py-2 px-3 font-sans text-white truncate max-w-xs">{h.title}</td>
                        <td className="py-2 px-3 text-right text-white font-semibold">{formatCurrency(h.bid_amount)}</td>
                        <td className="py-2 px-3 text-right text-slate-300">{(h.bid_to_estimate_ratio * 100).toFixed(1)}%</td>
                        <td className="py-2 px-3 text-center font-sans">
                          {h.is_winner ? (
                            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                              Won L1
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-500">Lost</span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-right">
                          <RiskBadge level={h.risk_level} score={h.risk_score} size="sm" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
