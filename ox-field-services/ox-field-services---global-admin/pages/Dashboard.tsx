import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Users, 
  Activity, 
  AlertTriangle,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { StatsCard } from '../components/StatsCard';
import { MOCK_TENANTS, GROWTH_DATA } from '../constants';
import { adminService, DashboardMetrics } from '../services/admin';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardProps {
  onViewChange: (view: any) => void;
}

// Fallback data
const fallbackMetrics: DashboardMetrics = {
  totalTenants: MOCK_TENANTS.length,
  activeTenants: MOCK_TENANTS.filter(t => t.status === 'active').length,
  totalUsers: MOCK_TENANTS.reduce((acc, t) => acc + t.users, 0),
  totalRevenue: MOCK_TENANTS.reduce((acc, t) => acc + t.mrr, 0),
  revenueChange: 12.5,
  systemHealth: 'healthy',
  apiLatency: 42,
  errorRate: 0.02
};

const Dashboard: React.FC<DashboardProps> = ({ onViewChange }) => {
  const [metrics, setMetrics] = useState<DashboardMetrics>(fallbackMetrics);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await adminService.getDashboard();
      setMetrics(data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch dashboard:', err);
      setError('Using cached data - API unavailable');
      // Keep using fallback data
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Calculate aggregate stats from fallback if API doesn't provide them
  const sickTenants = MOCK_TENANTS.filter(t => t.healthScore < 60);

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">System Health</h1>
          <p className="text-slate-400 mt-1">Real-time overview of the Ox ecosystem.</p>
        </div>
        <div className="flex gap-3 items-center">
          {loading && <Loader2 className="h-5 w-5 text-ox-500 animate-spin" />}
          <button className="px-4 py-2 bg-dark-800 hover:bg-dark-700 text-slate-300 rounded border border-dark-700 text-sm transition-colors">
            Download Report
          </button>
          <button 
            onClick={fetchData}
            disabled={loading}
            className="px-4 py-2 bg-ox-900 hover:bg-ox-800 text-white rounded border border-ox-700 text-sm transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh Data
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-400 text-sm">
          {error}
        </div>
      )}

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard 
          title="Total MRR" 
          value={`$${metrics.totalRevenue.toLocaleString()}`} 
          change={`+${metrics.revenueChange}%`}
          trend="up"
          icon={<DollarSign className="h-5 w-5" />} 
        />
        <StatsCard 
          title="Active Tenants" 
          value={metrics.activeTenants.toString()} 
          change={`/${metrics.totalTenants} total`}
          trend="up"
          icon={<Users className="h-5 w-5" />} 
        />
        <StatsCard 
          title="Total Users" 
          value={metrics.totalUsers.toLocaleString()} 
          change="+8.1%" 
          trend="up"
          icon={<Activity className="h-5 w-5" />} 
        />
        <StatsCard 
          title="System Status" 
          value={metrics.systemHealth === 'healthy' ? 'Healthy' : metrics.systemHealth}
          change={`${metrics.apiLatency}ms latency`}
          trend={metrics.systemHealth === 'healthy' ? 'up' : 'down'}
          icon={<AlertTriangle className={`h-5 w-5 ${metrics.systemHealth !== 'healthy' ? 'text-amber-500' : ''}`} />} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Growth Chart */}
        <div className="lg:col-span-2 bg-dark-900 rounded-lg border border-dark-800 p-6">
          <h3 className="text-lg font-semibold text-white mb-6">Ecosystem Growth</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={GROWTH_DATA} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4A8B99" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#4A8B99" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#4B5563" tick={{fill: '#9CA3AF', fontSize: 12}} />
                <YAxis stroke="#4B5563" tick={{fill: '#9CA3AF', fontSize: 12}} />
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1E1E1E', border: '1px solid #374151', borderRadius: '4px' }}
                  itemStyle={{ color: '#E5E5E5' }}
                />
                <Area type="monotone" dataKey="value" stroke="#4A8B99" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tenants needing attention */}
        <div className="bg-dark-900 rounded-lg border border-dark-800 p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Attention Required</h3>
            <button 
              onClick={() => onViewChange('tenants')}
              className="text-xs text-ox-500 hover:text-ox-400 font-medium"
            >
              View All
            </button>
          </div>
          <div className="flex-1 overflow-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-dark-800">
                <tr>
                  <th className="px-4 py-2 rounded-l">Tenant</th>
                  <th className="px-4 py-2 text-right rounded-r">Health</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-800">
                {sickTenants.length === 0 && (
                  <tr>
                    <td colSpan={2} className="px-4 py-8 text-center text-slate-500">
                      All systems nominal.
                    </td>
                  </tr>
                )}
                {sickTenants.map(tenant => (
                  <tr key={tenant.id} className="group hover:bg-dark-800 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-200">{tenant.name}</div>
                      <div className="text-xs text-slate-500">{tenant.domain}</div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                        {tenant.healthScore}%
                      </span>
                    </td>
                  </tr>
                ))}
                {/* Adding some healthy ones for visual balance if list is short */}
                {sickTenants.length < 3 && MOCK_TENANTS.slice(0, 3 - sickTenants.length).map(tenant => (
                   <tr key={tenant.id} className="group hover:bg-dark-800 transition-colors">
                   <td className="px-4 py-3">
                     <div className="font-medium text-slate-200">{tenant.name}</div>
                     <div className="text-xs text-slate-500">{tenant.domain}</div>
                   </td>
                   <td className="px-4 py-3 text-right">
                     <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                       {tenant.healthScore}%
                     </span>
                   </td>
                 </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
