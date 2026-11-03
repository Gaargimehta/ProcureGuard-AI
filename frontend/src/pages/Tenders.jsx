import React, { useState, useEffect } from 'react';
import RiskBadge from '../components/RiskBadge';
import Modal from '../components/Modal';
import { 
  fetchTenders, 
  fetchTenderDetail, 
  downloadReportPdfUrl 
} from '../services/api';
import { 
  Search, 
  Filter, 
  Download, 
  ExternalLink, 
  AlertCircle, 
  CheckCircle, 
  Info,
  Calendar,
  Building,
  DollarSign
} from 'lucide-react';

export default function Tenders({ initialSelectedTenderId, onClearSelectedTender }) {
  const [tenders, setTenders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedRisk, setSelectedRisk] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedLocation, setSelectedLocation] = useState('All');

  // Detail Modal
  const [selectedTender, setSelectedTender] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    loadTenders();
  }, [selectedRisk, selectedCategory, selectedLocation, search]);

  useEffect(() => {
    if (initialSelectedTenderId) {
      handleOpenDetail(initialSelectedTenderId);
      if (onClearSelectedTender) onClearSelectedTender();
    }
  }, [initialSelectedTenderId]);

  const loadTenders = async () => {
    try {
      setLoading(true);
      const res = await fetchTenders({
        risk_level: selectedRisk,
        category: selectedCategory,
        location: selectedLocation,
        search: search.trim()
      });
      setTenders(res.tenders || []);
      if (categories.length === 0) setCategories(res.categories || []);
      if (locations.length === 0) setLocations(res.locations || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDetail = async (tenderId) => {
    try {
      setDetailLoading(true);
      const detail = await fetchTenderDetail(tenderId);
      setSelectedTender(detail);
    } catch (err) {
      console.error(err);
    } finally {
      setDetailLoading(false);
    }
  };

  const formatCurrency = (val) => {
    if (val === null || val === undefined) return 'N/A';
    return `$${Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="space-y-6">
      {/* Search & Filter Toolbar */}
      <div className="bg-[#0f172a]/90 border border-slate-800/80 rounded-2xl p-4 shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search tender ID, title, or winner..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Risk Level */}
          <select
            value={selectedRisk}
            onChange={(e) => setSelectedRisk(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option value="All">All Risk Levels</option>
            <option value="High">High Risk (&gt;70)</option>
            <option value="Medium">Medium Risk (35-70)</option>
            <option value="Low">Low Risk (&lt;35)</option>
          </select>

          {/* Category */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 cursor-pointer max-w-[200px] truncate"
          >
            <option value="All">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Location */}
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option value="All">All Jurisdictions</option>
            {locations.map((loc) => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>

          {(selectedRisk !== 'All' || selectedCategory !== 'All' || selectedLocation !== 'All' || search) && (
            <button
              onClick={() => {
                setSelectedRisk('All');
                setSelectedCategory('All');
                setSelectedLocation('All');
                setSearch('');
              }}
              className="text-xs text-slate-400 hover:text-white px-2 py-1 underline"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Tenders Table */}
      <div className="bg-[#0f172a]/90 border border-slate-800/80 rounded-2xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#090e1a] border-b border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-3.5 px-4">Tender ID</th>
                <th className="py-3.5 px-4">Title & Category</th>
                <th className="py-3.5 px-4">Jurisdiction</th>
                <th className="py-3.5 px-4 text-right">Est. Value</th>
                <th className="py-3.5 px-4 text-center">Bidders</th>
                <th className="py-3.5 px-4">Winning Supplier</th>
                <th className="py-3.5 px-4 text-right">Winning Bid</th>
                <th className="py-3.5 px-4">Risk Rating</th>
                <th className="py-3.5 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    Querying procurement records...
                  </td>
                </tr>
              ) : tenders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No matching tenders found for current filters.
                  </td>
                </tr>
              ) : (
                tenders.map((t) => (
                  <tr
                    key={t.tender_id}
                    className="hover:bg-slate-800/50 transition-colors group cursor-pointer"
                    onClick={() => handleOpenDetail(t.tender_id)}
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-cyan-400">
                      {t.tender_id}
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-semibold text-white truncate group-hover:text-cyan-300">
                        {t.title}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate mt-0.5">
                        {t.category}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      {t.location}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-white font-medium">
                      {formatCurrency(t.estimated_value)}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px]">
                        {t.num_bidders}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 max-w-[160px] truncate text-slate-200">
                      {t.winning_supplier_name}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-emerald-400 font-semibold">
                      {formatCurrency(t.winning_bid)}
                    </td>
                    <td className="py-3.5 px-4">
                      <RiskBadge level={t.risk_level} score={t.risk_score} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenDetail(t.tender_id)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-400 transition-colors"
                          title="View Forensic Details"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                        <a
                          href={downloadReportPdfUrl(t.tender_id)}
                          download
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                          title="Download PDF Dossier"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tender Forensic Detail Modal */}
      {selectedTender && (
        <Modal
          isOpen={!!selectedTender}
          onClose={() => setSelectedTender(null)}
          title={`Forensic Audit: ${selectedTender.tender.tender_id}`}
          subtitle={selectedTender.tender.title}
          maxWidth="max-w-4xl"
        >
          <div className="space-y-6">
            {/* Top Score Banner */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl bg-slate-900 border border-slate-800 gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <RiskBadge 
                    level={selectedTender.tender.risk_level} 
                    score={selectedTender.tender.risk_score} 
                    size="lg" 
                  />
                  <span className="text-xs text-slate-400 font-mono">
                    Evaluation Date: {selectedTender.tender.tender_date}
                  </span>
                </div>
                <div className="mt-2 text-xs text-slate-300">
                  <span className="text-slate-400">Simulated Ground Truth:</span>{' '}
                  <span className="font-semibold text-cyan-300">{selectedTender.tender.simulation_scenario}</span>
                </div>
              </div>

              <a
                href={downloadReportPdfUrl(selectedTender.tender.tender_id)}
                download
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs hover:bg-cyan-400 transition-all shadow-md cursor-pointer shrink-0"
              >
                <Download className="w-4 h-4" />
                <span>Download Forensic PDF Report</span>
              </a>
            </div>

            {/* AI Explanation Box */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-cyan-500/30 text-xs">
              <span className="font-bold text-cyan-400 uppercase tracking-wide block mb-1">
                AI Explanation & Forensic Assessment:
              </span>
              <p className="text-slate-200 leading-relaxed">
                {selectedTender.tender.ai_explanation}
              </p>

              {/* Detected Indicators */}
              <div className="mt-3 pt-3 border-t border-slate-800">
                <span className="font-semibold text-slate-400 block mb-2">Contributing Anomaly Markers:</span>
                <ul className="space-y-1.5">
                  {selectedTender.tender.contributing_indicators?.map((ind, i) => (
                    <li key={i} className="flex items-start gap-2 text-slate-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" />
                      <span>{ind}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Financial & Bid Spreads Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400 block">Government Estimate</span>
                <span className="font-mono font-bold text-white text-sm mt-0.5 block">
                  {formatCurrency(selectedTender.tender.estimated_value)}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400 block">Winning Bid</span>
                <span className="font-mono font-bold text-emerald-400 text-sm mt-0.5 block">
                  {formatCurrency(selectedTender.tender.winning_bid)}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400 block">Winning Margin (L1 vs L2)</span>
                <span className="font-mono font-bold text-cyan-400 text-sm mt-0.5 block">
                  {formatCurrency(selectedTender.winning_margin)} ({selectedTender.winning_margin_pct}%)
                </span>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400 block">Winning Ratio</span>
                <span className="font-mono font-bold text-purple-400 text-sm mt-0.5 block">
                  {((selectedTender.tender.winning_bid / selectedTender.tender.estimated_value) * 100).toFixed(2)}%
                </span>
              </div>
            </div>

            {/* Participating Bids Table */}
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2.5">
                All Participating Bidders & Submissions
              </h4>
              <div className="rounded-xl border border-slate-800 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 text-slate-400 text-[11px] font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">Supplier Name</th>
                      <th className="py-2.5 px-3 text-right">Bid Amount</th>
                      <th className="py-2.5 px-3 text-right">Ratio to Estimate</th>
                      <th className="py-2.5 px-3">Timestamp</th>
                      <th className="py-2.5 px-3 font-mono">IP Subnet</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 bg-slate-900/40 font-mono text-[11px]">
                    {selectedTender.bids.map((b) => (
                      <tr key={b.bid_id} className={b.is_winner ? 'bg-emerald-950/20' : ''}>
                        <td className="py-2 px-3 font-sans font-medium text-white">
                          {b.bidder_name}
                          <span className="text-[10px] text-slate-400 block font-mono">{b.bidder_id}</span>
                        </td>
                        <td className="py-2 px-3 text-right font-semibold text-white">
                          {formatCurrency(b.bid_amount)}
                        </td>
                        <td className="py-2 px-3 text-right text-slate-300">
                          {(b.bid_to_estimate_ratio * 100).toFixed(2)}%
                        </td>
                        <td className="py-2 px-3 text-slate-400 font-sans">
                          {b.bid_timestamp}
                        </td>
                        <td className="py-2 px-3 text-cyan-400">
                          {b.ip_address}
                        </td>
                        <td className="py-2 px-3 text-center font-sans">
                          {b.is_winner ? (
                            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                              Awarded L1
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400">
                              Unsuccessful
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Historical Overlap in Category */}
            {selectedTender.historical_overlap?.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2">
                  Historical Overlap in Category ({selectedTender.tender.category})
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {selectedTender.historical_overlap.map((hist) => (
                    <div 
                      key={hist.tender_id}
                      className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between"
                    >
                      <div>
                        <span className="font-mono text-cyan-400 font-semibold">{hist.tender_id}</span>
                        <span className="text-slate-400 block text-[11px]">Won by: {hist.winning_supplier_name}</span>
                      </div>
                      <span className="font-mono text-slate-400 text-[11px]">{hist.tender_date}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
