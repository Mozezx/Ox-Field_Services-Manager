import React from 'react';
import { 
  Server, 
  Database, 
  Cpu, 
  Activity,
  Terminal
} from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, YAxis } from 'recharts';
import { MOCK_LOGS, SERVER_LOAD_DATA } from '../constants';

export default function Infrastructure() {
  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto h-full flex flex-col">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
          <Server className="h-8 w-8 text-ox-500" />
          Command Center
        </h1>
        <p className="text-slate-400 mt-1 font-mono text-sm">Cluster Status: <span className="text-emerald-400">OPERATIONAL</span> | Region: GLOBAL</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* CPU Metric */}
        <div className="bg-dark-900 border border-dark-800 rounded-lg p-5 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-ox-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">CPU Usage (Avg)</p>
              <h3 className="text-2xl font-mono text-white mt-1">42%</h3>
            </div>
            <Cpu className="h-5 w-5 text-ox-500" />
          </div>
          <div className="h-16 w-full opacity-50">
             <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={SERVER_LOAD_DATA}>
                <Area type="monotone" dataKey="value" stroke="#4A8B99" fill="#4A8B99" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Memory Metric */}
        <div className="bg-dark-900 border border-dark-800 rounded-lg p-5 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Memory Allocation</p>
              <h3 className="text-2xl font-mono text-white mt-1">64.2 TB</h3>
            </div>
            <Database className="h-5 w-5 text-purple-500" />
          </div>
          <div className="w-full bg-dark-700 h-1.5 rounded-full mt-8 overflow-hidden">
            <div className="bg-purple-500 h-full rounded-full w-[65%]"></div>
          </div>
        </div>

        {/* Active Pods */}
        <div className="bg-dark-900 border border-dark-800 rounded-lg p-5 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Instances</p>
              <h3 className="text-2xl font-mono text-white mt-1">842</h3>
            </div>
            <Activity className="h-5 w-5 text-emerald-500" />
          </div>
          <div className="flex gap-1 mt-8">
            {[...Array(12)].map((_, i) => (
              <div key={i} className={`h-1.5 flex-1 rounded-full ${i < 10 ? 'bg-emerald-500' : 'bg-dark-700'}`}></div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
        {/* Live Logs Console */}
        <div className="bg-black border border-dark-800 rounded-lg flex flex-col font-mono text-sm shadow-2xl overflow-hidden">
          <div className="px-4 py-2 bg-dark-900 border-b border-dark-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="h-4 w-4 text-slate-400" />
              <span className="text-slate-300 text-xs font-bold">System Logs</span>
            </div>
            <div className="flex gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-red-500/20 border border-red-500"></div>
              <div className="h-2.5 w-2.5 rounded-full bg-amber-500/20 border border-amber-500"></div>
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-500/20 border border-emerald-500"></div>
            </div>
          </div>
          <div className="flex-1 p-4 overflow-y-auto space-y-2 bg-[#050505]">
            {MOCK_LOGS.map((log) => (
              <div key={log.id} className="flex gap-3 hover:bg-white/5 p-1 rounded transition-colors">
                <span className="text-slate-500 shrink-0 select-none">[{log.timestamp}]</span>
                <span className={`shrink-0 font-bold w-12 text-center select-none ${
                  log.level === 'INFO' ? 'text-blue-400' :
                  log.level === 'WARN' ? 'text-amber-400' :
                  log.level === 'SEC' ? 'text-purple-400' : 'text-red-500'
                }`}>{log.level}</span>
                <span className="text-slate-300 break-all">
                  <span className="text-slate-500 mr-2">[{log.service}]</span>
                  {log.message}
                </span>
              </div>
            ))}
            <div className="animate-pulse text-ox-500">_</div>
          </div>
        </div>

        {/* Regional Status Map Placeholder */}
        <div className="bg-dark-900 border border-dark-800 rounded-lg p-6 flex flex-col">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4">Regional Latency</h3>
          <div className="flex-1 border border-dark-700 rounded-md bg-dark-950 flex items-center justify-center relative overflow-hidden">
            {/* Abstract "Map" Dots */}
            <div className="absolute top-1/4 left-1/4 h-3 w-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse"></div>
            <div className="absolute top-1/3 left-1/2 h-3 w-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse delay-75"></div>
            <div className="absolute bottom-1/3 right-1/3 h-3 w-3 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]"></div>
            <div className="absolute top-1/2 right-1/4 h-3 w-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse delay-150"></div>
            
            <span className="text-slate-600 text-xs uppercase tracking-widest">Interactive Map Visualization</span>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="text-center">
              <p className="text-xs text-slate-500">US-East</p>
              <p className="text-lg font-mono text-emerald-400">12ms</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-500">EU-West</p>
              <p className="text-lg font-mono text-emerald-400">45ms</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-500">AP-South</p>
              <p className="text-lg font-mono text-amber-400">182ms</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}