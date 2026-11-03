import React from 'react';
import { 
  ShieldAlert, 
  LayoutDashboard, 
  FileText, 
  Users, 
  Share2, 
  Cpu, 
  FileCheck, 
  Database, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  Radio
} from 'lucide-react';

export default function Sidebar({ currentTab, setCurrentTab, isCollapsed, setIsCollapsed }) {
  const menuItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'tenders', label: 'Tender Analytics', icon: FileText },
    { id: 'bidders', label: 'Bidder Intelligence', icon: Users },
    { id: 'network', label: 'Collusion Network', icon: Share2 },
    { id: 'engine', label: 'AI Detection Engine', icon: Cpu },
    { id: 'reports', label: 'Investigation Reports', icon: FileCheck },
    { id: 'dataset', label: 'Dataset Management', icon: Database },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside
      className={`fixed top-0 left-0 h-screen z-40 bg-[#090e1a] border-r border-slate-800/80 transition-all duration-300 flex flex-col justify-between ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div>
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800/60 bg-[#070b14]">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-500/40 text-cyan-400 shrink-0">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
              <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="font-extrabold text-sm tracking-wider bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400 bg-clip-text text-transparent">
                  PROCUREGUARD AI
                </span>
                <span className="text-[10px] text-slate-400 font-medium truncate max-w-[150px]">
                  Transparent Procurement
                </span>
              </div>
            )}
          </div>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Live Operational Status Indicator */}
        {!isCollapsed && (
          <div className="mx-3 mt-3 p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-emerald-400 font-medium text-[11px]">System Active</span>
            </div>
            <span className="text-slate-400 text-[10px] font-mono">GNN v2.9</span>
          </div>
        )}

        {/* Navigation Items */}
        <nav className="mt-4 px-2 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-xs transition-all duration-200 group ${
                  active
                    ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/10 text-cyan-300 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.15)] font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    active ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
                {active && !isCollapsed && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-400" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Info */}
      {!isCollapsed && (
        <div className="p-3 m-3 rounded-xl bg-slate-900/60 border border-slate-800 text-[10px] text-slate-400">
          <div className="flex items-center justify-between font-mono text-[9px] text-slate-400">
            <span>B.Tech Major Project</span>
            <span className="text-cyan-400">v1.0-PRO</span>
          </div>
          <p className="mt-1 text-slate-400 leading-tight">
            Graph Neural Network & ML Hybrid Collusion Detection
          </p>
        </div>
      )}
    </aside>
  );
}
