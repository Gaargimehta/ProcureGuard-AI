import React, { useState } from 'react';
import { 
  uploadDatasetCsv, 
  resetSampleDataset 
} from '../services/api';
import { 
  Upload, 
  Download, 
  RefreshCcw, 
  FileSpreadsheet, 
  CheckCircle, 
  AlertCircle, 
  Database,
  ArrowRight
} from 'lucide-react';

export default function DatasetManager({ onDatasetReloaded, onRunDetection }) {
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [resetting, setResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setErrorMessage(null);
      setUploadResult(null);
      const res = await uploadDatasetCsv(file);
      setUploadResult(res);
      if (onDatasetReloaded) onDatasetReloaded();
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleResetSample = async () => {
    try {
      setResetting(true);
      setErrorMessage(null);
      const res = await resetSampleDataset();
      setResetMessage(res.message);
      if (onDatasetReloaded) onDatasetReloaded();
      setTimeout(() => setResetMessage(null), 4000);
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Fast Actions */}
      <div className="bg-[#0f172a]/90 border border-slate-800/80 rounded-2xl p-6 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
              <Database className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">
                Procurement Dataset Administration
              </h2>
              <p className="text-xs text-slate-400">
                Manage, validate, ingest raw procurement bidding logs, or restore simulated benchmarks
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Download Raw CSV */}
          <a
            href="/api/dataset/download/raw"
            download
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all border border-slate-700"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Download Raw CSV</span>
          </a>

          {/* Download Processed CSV */}
          <a
            href="/api/dataset/download/processed"
            download
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all border border-slate-700"
          >
            <Download className="w-3.5 h-3.5 text-purple-400" />
            <span>Download Processed Features</span>
          </a>

          {/* Reset Sample Dataset */}
          <button
            onClick={handleResetSample}
            disabled={resetting}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-50"
          >
            <RefreshCcw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin' : ''}`} />
            <span>{resetting ? 'Regenerating...' : 'Reset Sample Dataset'}</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {resetMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{resetMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* CSV Upload Area */}
      <div className="bg-[#0f172a]/90 border border-slate-800/80 rounded-2xl p-6 shadow-lg">
        <h3 className="text-sm font-bold text-white tracking-wide mb-2">
          Ingest External Procurement Bidding File
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Upload comma-separated values (.csv) with required schema: <code className="text-cyan-400 font-mono">tender_id, title, category, estimated_value, bidder_id, bidder_name, bid_amount</code>. Missing values and duplicates will be sanitized automatically.
        </p>

        <label className="border-2 border-dashed border-slate-700 hover:border-cyan-500/60 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors bg-slate-900/50 hover:bg-slate-900/80">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            disabled={uploading}
            className="hidden"
          />
          <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Upload className="w-6 h-6" />
          </div>
          <div className="text-center">
            <span className="text-xs font-semibold text-white">
              {uploading ? 'Validating and parsing CSV records...' : 'Click to browse or drop CSV file here'}
            </span>
            <span className="text-[11px] text-slate-400 block mt-1">
              Supports CSV files up to 25MB
            </span>
          </div>
        </label>

        {/* Upload Success Preview */}
        {uploadResult && (
          <div className="mt-6 p-4 rounded-xl bg-slate-900 border border-cyan-500/30 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-white">{uploadResult.filename}</span>
                <span className="text-[11px] text-slate-400">
                  ({uploadResult.cleaned_rows} clean rows loaded, {uploadResult.duplicates_removed} duplicates stripped)
                </span>
              </div>

              <button
                onClick={onRunDetection}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500 text-slate-950 font-bold text-xs hover:bg-cyan-400 transition-all cursor-pointer"
              >
                <span>Trigger Detection on New Data</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Table Preview */}
            <div className="rounded-xl border border-slate-800 overflow-hidden">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase">
                  <tr>
                    <th className="py-2 px-3">Tender ID</th>
                    <th className="py-2 px-3">Title</th>
                    <th className="py-2 px-3">Category</th>
                    <th className="py-2 px-3">Bidder Name</th>
                    <th className="py-2 px-3 text-right">Bid Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-slate-900/60 text-[11px] text-slate-300">
                  {uploadResult.preview?.map((row, idx) => (
                    <tr key={idx}>
                      <td className="py-2 px-3 text-cyan-400">{row.tender_id}</td>
                      <td className="py-2 px-3 font-sans text-white truncate max-w-xs">{row.title}</td>
                      <td className="py-2 px-3 text-slate-400 font-sans">{row.category}</td>
                      <td className="py-2 px-3 font-sans text-slate-200">{row.bidder_name}</td>
                      <td className="py-2 px-3 text-right font-semibold text-emerald-400">
                        ${Number(row.bid_amount).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Dataset Synthetic Composition Explainer */}
      <div className="bg-[#0f172a]/90 border border-slate-800/80 rounded-2xl p-6 shadow-lg space-y-4">
        <h3 className="text-sm font-bold text-white tracking-wide">
          Synthetic Ground-Truth Composition (Standard Benchmark)
        </h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          The ProcureGuard synthetic dataset simulates 120 government procurement packages with 500+ individual competitive bids across 6 categories. It injects authentic coordination cartels alongside organic competitive tenders:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
            <span className="font-bold text-white block">Cartel Ring Alpha (Highway)</span>
            <span className="text-slate-400 text-[11px] block">Apex Infra, BuildTech Corp, Vertex Eng</span>
            <p className="text-slate-400 mt-1 leading-relaxed">
              Systematic winner rotation across 15 successive contracts with pre-arranged cover bids at 108% to 112%.
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
            <span className="font-bold text-white block">Cartel Ring Beta (Medical)</span>
            <span className="text-slate-400 text-[11px] block">MedSupply Direct, HealthCare Global, BioPharma</span>
            <p className="text-slate-400 mt-1 leading-relaxed">
              Price-pegged cover bidding at 99.2% of government estimate with parallel token quotes submitted from same subnet.
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
            <span className="font-bold text-white block">Competitive Benchmark</span>
            <span className="text-slate-400 text-[11px] block">30+ Independent Verified Vendors</span>
            <p className="text-slate-400 mt-1 leading-relaxed">
              Healthy market price variance (CV &gt; 8%), diverse winning margins, and independent ISP submission routing.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
