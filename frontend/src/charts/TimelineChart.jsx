import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function TimelineChart({ data = [] }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-500 text-xs">
        No tender activity history available
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="suspiciousGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4}/>
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0}/>
            </linearGradient>
            <linearGradient id="normalGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4}/>
              <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0}/>
            </linearGradient>
          </defs>
          <XAxis 
            dataKey="month" 
            stroke="#475569" 
            fontSize={11} 
            tickLine={false}
          />
          <YAxis 
            stroke="#475569" 
            fontSize={11} 
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#0f172a', 
              borderColor: '#334155',
              borderRadius: '8px',
              fontSize: '12px'
            }} 
          />
          <Legend 
            verticalAlign="top" 
            height={36} 
            iconType="circle"
            wrapperStyle={{ fontSize: '11px' }}
          />
          <Area 
            type="monotone" 
            dataKey="normal" 
            name="Normal Competitive" 
            stroke="#06b6d4" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#normalGrad)" 
          />
          <Area 
            type="monotone" 
            dataKey="suspicious" 
            name="Suspicious / Flagged" 
            stroke="#ef4444" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#suspiciousGrad)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
