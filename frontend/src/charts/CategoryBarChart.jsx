import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function CategoryBarChart({ data = [] }) {
  if (!data || data.length === 0) {
    return <div className="h-64 flex items-center justify-center text-slate-500 text-xs">No category data</div>;
  }

  // Format category labels for brevity
  const formatted = data.map((item) => ({
    ...item,
    shortName: item.category.length > 20 ? item.category.substring(0, 18) + '...' : item.category
  }));

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={formatted} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
          <XAxis type="number" stroke="#475569" fontSize={11} tickLine={false} />
          <YAxis 
            type="category" 
            dataKey="shortName" 
            stroke="#94a3b8" 
            fontSize={11} 
            tickLine={false}
            width={120} 
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#0f172a', 
              borderColor: '#334155',
              borderRadius: '8px',
              fontSize: '12px'
            }} 
            formatter={(val, name, props) => [`${val} Tenders (Avg Risk: ${props.payload.avg_risk})`, 'Volume']}
          />
          <Bar dataKey="count" radius={[0, 4, 4, 0]}>
            {formatted.map((entry, index) => {
              const color = entry.avg_risk >= 70 ? '#ef4444' : entry.avg_risk >= 35 ? '#f59e0b' : '#06b6d4';
              return <Cell key={`bar-${index}`} fill={color} />;
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
