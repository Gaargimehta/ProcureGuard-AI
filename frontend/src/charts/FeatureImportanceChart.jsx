import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function FeatureImportanceChart({ features = {} }) {
  const data = Object.entries(features)
    .map(([key, value]) => ({
      feature: key.replace(/_/g, ' '),
      importance: Number((value * 100).toFixed(1))
    }))
    .sort((a, b) => b.importance - a.importance);

  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-500 text-xs">
        No feature importances recorded yet. Run live detection.
      </div>
    );
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 60, bottom: 5 }}>
          <XAxis type="number" stroke="#475569" fontSize={11} unit="%" tickLine={false} />
          <YAxis 
            type="category" 
            dataKey="feature" 
            stroke="#94a3b8" 
            fontSize={11} 
            tickLine={false}
            width={140}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#0f172a', 
              borderColor: '#334155',
              borderRadius: '8px',
              fontSize: '12px'
            }} 
            formatter={(val) => [`${val}%`, 'Relative Weight']}
          />
          <Bar dataKey="importance" fill="#38bdf8" radius={[0, 4, 4, 0]}>
            {data.map((entry, index) => (
              <Cell 
                key={`feat-${index}`} 
                fill={index === 0 ? '#38bdf8' : index < 3 ? '#818cf8' : '#0ea5e9'} 
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
