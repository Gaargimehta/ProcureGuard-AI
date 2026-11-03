import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DemoScenarioModal from './components/DemoScenarioModal';

import Overview from './pages/Overview';
import Tenders from './pages/Tenders';
import Bidders from './pages/Bidders';
import NetworkView from './pages/NetworkView';
import DetectionEngine from './pages/DetectionEngine';
import Reports from './pages/Reports';
import DatasetManager from './pages/DatasetManager';
import Settings from './pages/Settings';

import { 
  fetchDashboardData, 
  fetchDemoScenarios, 
  runLiveDemoDetection,
  runDetectionPipeline 
} from './services/api';

import { CheckCircle2, AlertTriangle, ShieldCheck, Sparkles, X } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState('overview');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Core Data
  const [dashboardData, setDashboardData] = useState(null);
  const [loadingDashboard, setLoadingDashboard] = useState(true);

  // Demo Scenarios Modal
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [scenarios, setScenarios] = useState([]);

  // Live Detection Trigger State
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectionSuccessBanner, setDetectionSuccessBanner] = useState(null);

  // Cross-page navigation state
  const [selectedTenderId, setSelectedTenderId] = useState(null);
  const [selectedBidderId, setSelectedBidderId] = useState(null);

  useEffect(() => {
    loadDashboard();
    loadScenarios();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoadingDashboard(true);
      const data = await fetchDashboardData();
      setDashboardData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDashboard(false);
    }
  };

  const loadScenarios = async () => {
    try {
      const res = await fetchDemoScenarios();
      setScenarios(res.scenarios || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRunDetection = async () => {
    try {
      setIsDetecting(true);
      setDetectionSuccessBanner(null);
      const res = await runLiveDemoDetection();
      await loadDashboard();
      setDetectionSuccessBanner({
        message: res.message || 'Detection Engine executed successfully!',
        details: res.details
      });
      // Auto-dismiss after 6 seconds
      setTimeout(() => {
        setDetectionSuccessBanner(null);
      }, 7000);
    } catch (err) {
      console.error(err);
      alert('Error running detection: ' + err.message);
    } finally {
      setIsDetecting(false);
    }
  };

  const handleSelectTender = (tenderId) => {
    setSelectedTenderId(tenderId);
    setCurrentTab('tenders');
  };

  const handleSelectBidder = (bidderId) => {
    setSelectedBidderId(bidderId);
    setCurrentTab('bidders');
  };

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 flex">
      {/* Collapsible Intelligence Sidebar */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
      />

      {/* Main App Content Area */}
      <div 
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${
          isSidebarCollapsed ? 'ml-20' : 'ml-64'
        }`}
      >
        {/* Top Header */}
        <Header
          currentTab={currentTab}
          onRunDetection={handleRunDetection}
          isDetecting={isDetecting}
          onOpenDemoScenarios={() => setIsDemoModalOpen(true)}
        />

        {/* Live Pipeline Execution Success Notification */}
        {detectionSuccessBanner && (
          <div className="mx-6 mt-4 p-4 rounded-2xl bg-gradient-to-r from-cyan-950/80 via-slate-900 to-indigo-950/80 border border-cyan-500/50 shadow-[0_0_25px_rgba(6,182,212,0.2)] flex items-center justify-between animate-in slide-in-from-top duration-300">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>{detectionSuccessBanner.message}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                    Live Inference Complete
                  </span>
                </h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  Extracted bidding features, computed GraphSAGE node embeddings, and updated hybrid risk indicators across all active tenders.
                </p>
              </div>
            </div>

            <button
              onClick={() => setDetectionSuccessBanner(null)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Page Render Router */}
        <main className="flex-1 p-6">
          {currentTab === 'overview' && (
            <Overview
              data={dashboardData}
              loading={loadingDashboard}
              onSelectTender={handleSelectTender}
              onSelectBidder={handleSelectBidder}
              onNavigateToTab={(tab) => setCurrentTab(tab)}
            />
          )}

          {currentTab === 'tenders' && (
            <Tenders
              initialSelectedTenderId={selectedTenderId}
              onClearSelectedTender={() => setSelectedTenderId(null)}
            />
          )}

          {currentTab === 'bidders' && (
            <Bidders
              initialSelectedBidderId={selectedBidderId}
              onClearSelectedBidder={() => setSelectedBidderId(null)}
              onSelectTender={handleSelectTender}
            />
          )}

          {currentTab === 'network' && (
            <NetworkView
              onSelectBidder={handleSelectBidder}
            />
          )}

          {currentTab === 'engine' && (
            <DetectionEngine
              onRunDetection={handleRunDetection}
              isDetecting={isDetecting}
            />
          )}

          {currentTab === 'reports' && (
            <Reports
              onSelectTender={handleSelectTender}
            />
          )}

          {currentTab === 'dataset' && (
            <DatasetManager
              onDatasetReloaded={loadDashboard}
              onRunDetection={handleRunDetection}
            />
          )}

          {currentTab === 'settings' && (
            <Settings />
          )}
        </main>
      </div>

      {/* College Project Demo Scenarios Modal */}
      <DemoScenarioModal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
        scenarios={scenarios}
        onInspectTender={handleSelectTender}
      />
    </div>
  );
}
