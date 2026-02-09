import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BottomNav } from '../../components/BottomNav';
import { techService, AgendaItem } from '../../services/tech';

export const HistoryScreen: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<AgendaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<string>('ALL');
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params: any = { page, limit: 20 };

      if (dateFilter !== 'ALL') {
        const now = new Date();
        let startDate: Date;

        switch (dateFilter) {
          case 'LAST_7_DAYS':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case 'THIS_MONTH':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
          case 'LAST_MONTH':
            startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const endDate = new Date(now.getFullYear(), now.getMonth(), 0);
            params.startDate = startDate.toISOString().split('T')[0];
            params.endDate = endDate.toISOString().split('T')[0];
            break;
          default:
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        }

        if (dateFilter !== 'LAST_MONTH') {
          params.startDate = startDate.toISOString().split('T')[0];
          params.endDate = now.toISOString().split('T')[0];
        }
      }

      const response = await techService.getHistory(params);
      setOrders(response.orders);
      setTotal(response.total);
    } catch (err: any) {
      console.error('Failed to fetch history:', err);
      const status = err.response?.status;
      const message = err.response?.data?.message;
      if (status === 401) {
        setError('Sessão expirada ou não autenticado. Faça login novamente.');
      } else if (status === 500) {
        setError(message || 'Erro interno do servidor. Tente novamente mais tarde.');
      } else {
        setError(message || 'Erro ao carregar histórico. Tente novamente.');
      }
      setOrders([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, dateFilter]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const filteredOrders = orders.filter(order => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      order.orderNumber.toLowerCase().includes(query) ||
      order.title.toLowerCase().includes(query) ||
      order.customer.name.toLowerCase().includes(query)
    );
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-bg-dark text-white pb-24">
       <header className="flex items-center justify-between px-4 py-3 bg-bg-dark/95 backdrop-blur-md border-b border-white/5 sticky top-0 z-20">
          <button onClick={() => navigate('/agenda')} className="size-10 flex items-center justify-center rounded-full hover:bg-white/10">
             <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="text-lg font-bold">Service History</h1>
          <div className="size-10"></div>
       </header>

       <div className="sticky top-[60px] z-10 bg-bg-dark/95 backdrop-blur-md pt-4 pb-2 border-b border-white/5">
          <div className="px-4 mb-3">
             <div className="flex w-full items-center rounded-xl bg-surface-dark border border-slate-700 h-12 overflow-hidden px-4">
                <span className="material-symbols-outlined text-slate-400">search</span>
                <input 
                  className="w-full bg-transparent border-none text-white pl-3 focus:ring-0 placeholder-slate-400" 
                  placeholder="Search OS # or Client..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
             </div>
          </div>
          <div className="flex gap-2 px-4 overflow-x-auto no-scrollbar pb-2">
             <button 
               onClick={() => setDateFilter('ALL')}
               className={`h-8 px-4 rounded-full text-sm font-medium border whitespace-nowrap ${
                 dateFilter === 'ALL' 
                   ? 'bg-secondary text-primary border-secondary' 
                   : 'bg-surface-dark border-slate-700 text-slate-300'
               }`}
             >
               All
             </button>
             {[
               { key: 'LAST_7_DAYS', label: 'Last 7 Days' },
               { key: 'THIS_MONTH', label: 'This Month' },
               { key: 'LAST_MONTH', label: 'Last Month' }
             ].map(filter => (
                <button 
                  key={filter.key}
                  onClick={() => setDateFilter(filter.key)}
                  className={`h-8 px-4 rounded-full text-sm font-medium border whitespace-nowrap ${
                    dateFilter === filter.key
                      ? 'bg-secondary text-primary border-secondary'
                      : 'bg-surface-dark border-slate-700 text-slate-300'
                  }`}
                >
                  {filter.label}
                </button>
             ))}
          </div>
       </div>

       {error && (
         <div className="mx-4 mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
           <p>{error}</p>
           <button
             onClick={() => fetchHistory()}
             className="mt-3 flex items-center justify-center gap-2 w-full py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-200 font-medium transition-colors"
           >
             <span className="material-symbols-outlined text-[18px]">refresh</span>
             Tentar novamente
           </button>
         </div>
       )}
       {loading && orders.length === 0 && !error ? (
         <div className="flex items-center justify-center py-12">
           <div className="text-center text-slate-400">
             <span className="material-symbols-outlined text-4xl mb-2 animate-spin-cw">sync</span>
             <p className="text-sm">Carregando...</p>
           </div>
         </div>
       ) : (
         <div className="p-4 flex flex-col gap-4">
            {filteredOrders.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <span className="material-symbols-outlined text-4xl mb-2">history</span>
                <p className="text-sm">{error ? '' : 'Nenhuma OS encontrada'}</p>
              </div>
            ) : (
              filteredOrders.map(order => (
                <div 
                  key={order.id} 
                  onClick={() => navigate(`/task/${order.id}`)}
                  className="group flex flex-col gap-3 rounded-xl bg-surface-dark p-4 shadow-sm border border-slate-800 active:scale-[0.99] transition-transform cursor-pointer hover:border-secondary/50"
                >
                   <div className="flex justify-between items-start">
                      <div className="flex flex-col gap-1">
                         <div className="flex items-center gap-2 text-xs font-medium text-slate-400 uppercase tracking-wide">
                            <span>{order.orderNumber}</span>
                            <span className="size-1 rounded-full bg-slate-400"></span>
                            <span>{formatDate(order.scheduledDate)}</span>
                         </div>
                         <h3 className="text-lg font-bold leading-tight">{order.customer.name || order.title}</h3>
                      </div>
                      <span className="material-symbols-outlined text-slate-500">chevron_right</span>
                   </div>
                   <div className="flex items-center justify-between mt-1">
                      <div className="flex items-center gap-2">
                         <span className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold border ${
                           order.status === 'COMPLETED'
                             ? 'bg-green-500/20 text-green-400 border-green-500/20'
                             : 'bg-red-500/20 text-red-400 border-red-500/20'
                         }`}>
                            <span className="material-symbols-outlined text-[16px] filled">check_circle</span>
                            {order.status === 'COMPLETED' ? 'Completed' : 'Cancelled'}
                         </span>
                      </div>
                      <div className="text-xs text-slate-400 font-medium">{order.category}</div>
                   </div>
                </div>
              ))
            )}
            {total > orders.length && (
              <button
                onClick={() => setPage(page + 1)}
                className="py-4 text-center text-sm text-secondary font-semibold"
              >
                Load More ({total - orders.length} remaining)
              </button>
            )}
            {filteredOrders.length > 0 && (
              <div className="py-4 flex justify-center text-xs text-slate-500">End of list</div>
            )}
         </div>
       )}
       <BottomNav />
    </div>
  );
};
