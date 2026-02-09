import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon: React.ReactNode;
}

export const StatsCard: React.FC<StatsCardProps> = ({ title, value, change, trend, icon }) => {
  return (
    <div className="bg-dark-900 p-5 rounded-lg border border-dark-800 hover:border-ox-800 transition-colors shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 bg-dark-800 rounded-md text-slate-400 border border-dark-700">
          {icon}
        </div>
        {change && (
          <div className={`flex items-center text-xs font-medium px-2 py-1 rounded-full ${
            trend === 'up' ? 'bg-emerald-500/10 text-emerald-400' : 
            trend === 'down' ? 'bg-red-500/10 text-red-400' : 'bg-slate-700 text-slate-300'
          }`}>
            {trend === 'up' && <ArrowUpRight className="h-3 w-3 mr-1" />}
            {trend === 'down' && <ArrowDownRight className="h-3 w-3 mr-1" />}
            {change}
          </div>
        )}
      </div>
      <h3 className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">{title}</h3>
      <p className="text-2xl font-bold text-white font-mono">{value}</p>
    </div>
  );
};