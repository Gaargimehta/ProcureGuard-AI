import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export default function RiskDonutChart({ distribution = { Low: 0, Medium: 0, High: 0 } }) {
  const data = [
    { name: 'Low Risk', value: distribution.Low || 0, color: '#10b981' },
    { name: 'Medium Risk', value: distribution.Medium || 0, color: '#f59e0b' },
    { name: 'High Risk', value: distribution.High || 0, color: '#ef4444' },
  ];

  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="h-64 w-full flex items-center justify-center relative">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#0f172a', 
              borderColor: '#334155',
              borderRadius: '8px',
              fontSize: '12px'
            }} 
          />
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={65}
            outerRadius={90}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} stroke="#0f172a" strokeWidth={2} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      
      {/* Center Label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-2xl font-bold font-mono text-white">{total}</span>
        <span className="text-[10px] uppercase tracking-wider text-slate-400">Total Analyzed</span>
      </div>
    </div>
  );
}
