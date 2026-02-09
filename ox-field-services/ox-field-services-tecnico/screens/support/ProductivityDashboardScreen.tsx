import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BottomNav } from '../../components/BottomNav';
import { techService, PerformanceMetrics } from '../../services/tech';
import { BarChart, Bar, ResponsiveContainer, Cell, XAxis } from 'recharts';

export const DashboardScreen: React.FC = () => {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');
  const [weeklyData, setWeeklyData] = useState<any[]>([]);

  useEffect(() => {
    const fetchPerformance = async () => {
      try {
        setLoading(true);
        const data = await techService.getPerformance(period);
        setMetrics(data);
        
        // Generate weekly chart data (simplified - in production, fetch from API)
        const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
        const dataPoints = days.map((day, index) => ({
          name: day,
          val: Math.floor(Math.random() * 50) + 20 // Placeholder - should come from API
        }));
        setWeeklyData(dataPoints);
      } catch (err: any) {
        console.error('Failed to fetch performance:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPerformance();
  }, [period]);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-dark text-white pb-24 flex items-center justify-center">
        <div className="text-center text-slate-400">
          <span className="material-symbols-outlined text-4xl mb-2 animate-spin-cw">sync</span>
          <p className="text-sm">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="min-h-screen bg-bg-dark text-white pb-24 flex items-center justify-center p-4">
        <div className="text-center text-red-400">
          <span className="material-symbols-outlined text-4xl mb-2">error</span>
          <p className="text-sm">Erro ao carregar métricas</p>
        </div>
      </div>
    );
  }

  const completionRate = metrics.jobsCompleted > 0 ? Math.round((metrics.jobsCompleted / (metrics.jobsCompleted + 5)) * 100) : 0;

  return (
    <div className="min-h-screen bg-bg-dark text-white pb-24">
      <header className="flex items-center justify-between px-4 py-3 sticky top-0 bg-bg-dark/95 backdrop-blur z-20">
         <button onClick={() => navigate('/agenda')} className="size-10 flex items-center justify-center rounded-full hover:bg-white/10">
            <span className="material-symbols-outlined">arrow_back</span>
         </button>
         <h1 className="text-lg font-bold">Productivity Dashboard</h1>
         <div className="flex gap-2">
            {(['7d', '30d', '90d'] as const).map(p => (
               <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-2 py-1 text-xs rounded ${
                     period === p
                       ? 'bg-secondary text-primary font-bold'
                       : 'bg-surface-dark text-slate-400'
                  }`}
               >
                  {p}
               </button>
            ))}
         </div>
      </header>

      <div className="p-4 flex flex-col gap-6">
         <section className="flex flex-col p-6 rounded-3xl bg-surface-dark text-white shadow-lg relative overflow-hidden border border-slate-800">
            <div className="absolute right-[-20px] top-[-20px] w-32 h-32 bg-accent/20 rounded-full blur-2xl"></div>
            <div className="relative z-10">
               <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-slate-300">This {period === '7d' ? 'Week' : period === '30d' ? 'Month' : 'Quarter'}'s Goal</span>
                  <div className="flex items-center gap-1 text-accent text-xs font-semibold bg-accent/10 px-2 py-1 rounded-full">
                     <span className="material-symbols-outlined text-[14px]">trending_up</span> On Track
                  </div>
               </div>
               <div className="flex items-baseline gap-2 mb-6">
                  <span className="text-4xl font-bold">{metrics.jobsCompleted}</span>
                  <span className="text-xl text-slate-400">Jobs Completed</span>
               </div>
               <div className="space-y-2">
                  <div className="flex justify-between text-xs text-slate-300">
                     <span>{completionRate}% Completed</span>
                     <span>{Math.max(0, 10 - metrics.jobsCompleted)} Jobs Remaining</span>
                  </div>
                  <div className="h-3 w-full bg-slate-700/50 rounded-full overflow-hidden">
                     <div 
                        className="h-full bg-gradient-to-r from-accent to-cyan-300 rounded-full shadow-[0_0_12px_rgba(25,195,230,0.6)]" 
                        style={{ width: `${completionRate}%` }}
                     ></div>
                  </div>
               </div>
            </div>
         </section>

         <section>
             <h2 className="text-base font-bold mb-4">Daily Activity</h2>
             <div className="bg-surface-dark rounded-3xl p-5 border border-slate-800 h-64">
                <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={weeklyData}>
                      <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                      <Bar dataKey="val" radius={[4, 4, 0, 0]}>
                        {weeklyData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index === 2 ? '#19c3e6' : '#284e57'} />
                        ))}
                      </Bar>
                   </BarChart>
                </ResponsiveContainer>
             </div>
         </section>

         <section className="grid grid-cols-2 gap-4">
             <div className="bg-surface-dark p-5 rounded-3xl border border-slate-800 h-40 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                   <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
                      <span className="material-symbols-outlined">timer</span>
                   </div>
                   <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">
                      {metrics.avgDuration > 0 ? '↓' : '↑'} {Math.abs(metrics.avgDuration - 45)}m
                   </span>
                </div>
                <div>
                   <h4 className="text-2xl font-bold">{metrics.avgDuration}m</h4>
                   <p className="text-[11px] text-slate-400 uppercase tracking-wide mt-1">Avg Resolution</p>
                </div>
             </div>
             <div className="bg-surface-dark p-5 rounded-3xl border border-slate-800 h-40 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                   <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl">
                      <span className="material-symbols-outlined filled">star</span>
                   </div>
                </div>
                <div>
                   <div className="flex items-center gap-1">
                      <h4 className="text-2xl font-bold">{metrics.customerRating.toFixed(1)}</h4>
                      <span className="material-symbols-outlined text-amber-400 text-sm filled">star</span>
                   </div>
                   <p className="text-[11px] text-slate-400 uppercase tracking-wide mt-1">Cust. Rating</p>
                </div>
             </div>
         </section>

         <section className="grid grid-cols-2 gap-4">
             <div className="bg-surface-dark p-5 rounded-3xl border border-slate-800">
                <div className="flex items-center gap-3 mb-2">
                   <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl">
                      <span className="material-symbols-outlined">schedule</span>
                   </div>
                   <div>
                      <h4 className="text-2xl font-bold">{metrics.onTimeRate.toFixed(0)}%</h4>
                      <p className="text-[11px] text-slate-400 uppercase tracking-wide mt-1">On Time Rate</p>
                   </div>
                </div>
             </div>
             <div className="bg-surface-dark p-5 rounded-3xl border border-slate-800">
                <div className="flex items-center gap-3 mb-2">
                   <div className="p-2 bg-green-500/10 text-green-400 rounded-xl">
                      <span className="material-symbols-outlined">payments</span>
                   </div>
                   <div>
                      <h4 className="text-2xl font-bold">R$ {metrics.earnings.toFixed(2)}</h4>
                      <p className="text-[11px] text-slate-400 uppercase tracking-wide mt-1">Earnings</p>
                   </div>
                </div>
             </div>
         </section>
      </div>
      <BottomNav />
    </div>
  );
};
