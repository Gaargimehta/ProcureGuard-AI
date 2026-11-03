import React from 'react';

export default function StatCard({ title, value, subtext, icon: Icon, trend, color = 'blue' }) {
  const colorMap = {
    blue: {
      border: 'border-cyan-500/30 hover:border-cyan-500/60',
      iconBg: 'bg-cyan-500/10 text-cyan-400',
      glow: 'group-hover:shadow-[0_0_20px_rgba(6,182,212,0.15)]',
    },
    red: {
      border: 'border-red-500/30 hover:border-red-500/60',
      iconBg: 'bg-red-500/10 text-red-400',
      glow: 'group-hover:shadow-[0_0_20px_rgba(239,68,68,0.15)]',
    },
    amber: {
      border: 'border-amber-500/30 hover:border-amber-500/60',
      iconBg: 'bg-amber-500/10 text-amber-400',
      glow: 'group-hover:shadow-[0_0_20px_rgba(245,158,11,0.15)]',
    },
    purple: {
      border: 'border-purple-500/30 hover:border-purple-500/60',
      iconBg: 'bg-purple-500/10 text-purple-400',
      glow: 'group-hover:shadow-[0_0_20px_rgba(168,85,247,0.15)]',
    },
    emerald: {
      border: 'border-emerald-500/30 hover:border-emerald-500/60',
      iconBg: 'bg-emerald-500/10 text-emerald-400',
      glow: 'group-hover:shadow-[0_0_20px_rgba(16,185,129,0.15)]',
    }
  };

  const style = colorMap[color] || colorMap.blue;

  return (
    <div className={`group relative bg-[#0f172a]/90 backdrop-blur-sm border ${style.border} rounded-xl p-5 transition-all duration-300 ${style.glow}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-slate-400">{title}</span>
        {Icon && (
          <div className={`p-2 rounded-lg ${style.iconBg} transition-transform group-hover:scale-110 duration-200`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl font-bold tracking-tight text-white font-mono">{value}</span>
        {trend && (
          <span className="text-xs font-medium text-emerald-400 flex items-center">
            {trend}
          </span>
        )}
      </div>

      {subtext && (
        <p className="mt-1 text-xs text-slate-400 line-clamp-1">{subtext}</p>
      )}
    </div>
  );
}
