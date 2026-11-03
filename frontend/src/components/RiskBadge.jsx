import React from 'react';

export default function RiskBadge({ level, score, size = 'md' }) {
  const normLevel = (level || 'Low').toLowerCase();
  
  const styles = {
    high: 'bg-red-500/15 text-red-400 border-red-500/40 shadow-red-500/10',
    medium: 'bg-amber-500/15 text-amber-400 border-amber-500/40 shadow-amber-500/10',
    low: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40 shadow-emerald-500/10'
  };

  const dots = {
    high: 'bg-red-400 animate-pulse',
    medium: 'bg-amber-400',
    low: 'bg-emerald-400'
  };

  const currentStyle = styles[normLevel] || styles.low;
  const currentDot = dots[normLevel] || dots.low;

  const sizeClasses = size === 'sm' 
    ? 'px-2 py-0.5 text-xs' 
    : size === 'lg' 
    ? 'px-3.5 py-1.5 text-sm font-semibold' 
    : 'px-2.5 py-1 text-xs font-medium';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border shadow-sm ${sizeClasses} ${currentStyle}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${currentDot}`} />
      <span>{level || 'Low'} Risk</span>
      {score !== undefined && (
        <span className="opacity-75 font-mono ml-0.5">({score})</span>
      )}
    </span>
  );
}
