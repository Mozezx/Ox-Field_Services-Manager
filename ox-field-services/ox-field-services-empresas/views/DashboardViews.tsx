import React, { useState, useEffect } from 'react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Activity, Users, DollarSign, Clock, Loader2 } from 'lucide-react';
import { empresaService, DashboardData, WeeklyJobData } from '../services/empresa';

// Fallback data for when API is not available
const fallbackChartData = [
  { name: 'Mon', jobs: 12 },
  { name: 'Tue', jobs: 19 },
  { name: 'Wed', jobs: 15 },
  { name: 'Thu', jobs: 22 },
  { name: 'Fri', jobs: 30 },
  { name: 'Sat', jobs: 25 },
  { name: 'Sun', jobs: 18 },
];

const fallbackDashboard: DashboardData = {
  totalJobs: 1284,
  totalJobsChange: 12,
  revenue: 48200,
  revenueChange: 8,
  avgResponseTime: 42,
  avgResponseTimeChange: -2,
  activeTechnicians: 24,
  totalTechnicians: 30,
  utilizationRate: 80
};

export const OperationsDashboard: React.FC = () => {
  const [dashboard, setDashboard] = useState<DashboardData>(fallbackDashboard);
  const [chartData, setChartData] = useState<WeeklyJobData[]>(fallbackChartData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [dashboardData, weeklyData] = await Promise.all([
          empresaService.getDashboard().catch(() => fallbackDashboard),
          empresaService.getWeeklyJobs().catch(() => fallbackChartData)
        ]);
        setDashboard(dashboardData);
        setChartData(weeklyData);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
        setError('Failed to load dashboard data. Using cached data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatCurrency = (value: number) => {
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}k`;
    }
    return `$${value}`;
  };

  const formatChange = (value: number, inverse: boolean = false) => {
    const isPositive = inverse ? value < 0 : value > 0;
    const arrow = isPositive ? '↑' : '↓';
    const colorClass = isPositive ? 'text-green-400' : 'text-red-400';
    return { arrow, colorClass, value: Math.abs(value) };
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-white">Operations & KPI Dashboard</h1>
          <p className="text-secondary">Real-time overview of fleet performance.</p>
        </div>
        {loading && <Loader2 className="animate-spin text-primary" size={24} />}
      </div>

      {error && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-amber-400 text-sm">
          {error}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-surface p-6 rounded-xl border border-white/10 shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
          <div className="flex items-center gap-4 mb-4">
             <div className="p-3 bg-blue-500/20 rounded-lg text-blue-400"><Activity size={24} /></div>
             <div className="text-secondary font-medium">Total Jobs</div>
          </div>
          <div className="text-3xl font-bold text-white">{dashboard.totalJobs.toLocaleString()}</div>
          <div className={`${formatChange(dashboard.totalJobsChange).colorClass} text-sm mt-1 flex items-center gap-1`}>
            {formatChange(dashboard.totalJobsChange).arrow} {formatChange(dashboard.totalJobsChange).value}% <span className="text-secondary">vs last week</span>
          </div>
        </div>

        <div className="bg-surface p-6 rounded-xl border border-white/10 shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
          <div className="flex items-center gap-4 mb-4">
             <div className="p-3 bg-green-500/20 rounded-lg text-green-400"><DollarSign size={24} /></div>
             <div className="text-secondary font-medium">Revenue</div>
          </div>
          <div className="text-3xl font-bold text-white">{formatCurrency(dashboard.revenue)}</div>
          <div className={`${formatChange(dashboard.revenueChange).colorClass} text-sm mt-1 flex items-center gap-1`}>
            {formatChange(dashboard.revenueChange).arrow} {formatChange(dashboard.revenueChange).value}% <span className="text-secondary">vs last week</span>
          </div>
        </div>

        <div className="bg-surface p-6 rounded-xl border border-white/10 shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
          <div className="flex items-center gap-4 mb-4">
             <div className="p-3 bg-amber-500/20 rounded-lg text-amber-400"><Clock size={24} /></div>
             <div className="text-secondary font-medium">Avg Response</div>
          </div>
          <div className="text-3xl font-bold text-white">{dashboard.avgResponseTime}m</div>
          <div className={`${formatChange(dashboard.avgResponseTimeChange, true).colorClass} text-sm mt-1 flex items-center gap-1`}>
            {formatChange(dashboard.avgResponseTimeChange, true).arrow} {formatChange(dashboard.avgResponseTimeChange, true).value}m <span className="text-secondary">{dashboard.avgResponseTimeChange < 0 ? 'faster' : 'slower'}</span>
          </div>
        </div>

         <div className="bg-surface p-6 rounded-xl border border-white/10 shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
          <div className="flex items-center gap-4 mb-4">
             <div className="p-3 bg-purple-500/20 rounded-lg text-purple-400"><Users size={24} /></div>
             <div className="text-secondary font-medium">Active Techs</div>
          </div>
          <div className="text-3xl font-bold text-white">{dashboard.activeTechnicians}/{dashboard.totalTechnicians}</div>
          <div className="text-secondary text-sm mt-1">{dashboard.utilizationRate}% Utilization</div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-surface p-6 rounded-xl border border-white/10 shadow-lg">
        <h3 className="text-xl font-bold text-white mb-6">Weekly Job Completion</h3>
        <div className="w-full min-h-[300px]" style={{ height: 300 }}>
          <ResponsiveContainer width="100%" height={300} minHeight={300} minWidth={0}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorJobs" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22D3EE" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#22D3EE" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="name" stroke="#94A3B8" />
              <YAxis stroke="#94A3B8" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#132F35', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                itemStyle={{ color: '#fff' }}
              />
              <Area type="monotone" dataKey="jobs" stroke="#22D3EE" strokeWidth={3} fillOpacity={1} fill="url(#colorJobs)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export const PlaceholderView: React.FC<{title: string}> = ({ title }) => (
  <div className="h-full flex flex-col items-center justify-center text-center p-8 animate-fade-in">
    <div className="w-32 h-32 bg-surface rounded-full flex items-center justify-center mb-6 animate-pulse">
       <span className="text-4xl">🚧</span>
    </div>
    <h1 className="text-3xl font-bold text-white mb-2">{title}</h1>
    <p className="text-secondary max-w-md">This view is currently under construction in this prototype.</p>
  </div>
);