import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { customerService, ServiceOrder } from '../services/customer';

type FilterType = 'all' | 'hvac' | 'plumbing' | 'electrical';

export const Documents = () => {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const data = await customerService.getOrders('COMPLETED');
        setOrders(data);
      } catch (error) {
        console.error('Failed to fetch orders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'hvac', label: 'HVAC' },
    { key: 'plumbing', label: 'Plumbing' },
    { key: 'electrical', label: 'Electrical' },
  ];

  const getServiceIcon = (type: string) => {
    const t = type?.toLowerCase() || '';
    if (t.includes('hvac') || t.includes('ac')) return 'ac_unit';
    if (t.includes('plumb')) return 'plumbing';
    if (t.includes('electric')) return 'bolt';
    if (t.includes('lawn') || t.includes('garden')) return 'grass';
    return 'build';
  };

  return (
    <div className="relative flex h-full min-h-screen w-full flex-col overflow-x-hidden max-w-md mx-auto shadow-2xl bg-background-light dark:bg-background-dark">
      {/* Header */}
      <div className="sticky top-0 z-20 flex items-center bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md p-4 pb-2 justify-between border-b border-gray-200/50 dark:border-gray-800">
        <div
          onClick={() => navigate('/home')}
          className="text-primary dark:text-white flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-2xl">arrow_back</span>
        </div>
        <h2 className="text-primary dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center">
          Document Center
        </h2>
        <div className="flex w-10 items-center justify-end">
          <span className="material-symbols-outlined text-primary dark:text-gray-400 cursor-pointer">search</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex w-full overflow-x-auto hide-scrollbar py-4 px-4 gap-3 bg-background-light dark:bg-background-dark z-10">
        {filters.map(filter => (
          <button
            key={filter.key}
            onClick={() => setActiveFilter(filter.key)}
            className={`flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-full px-5 transition-transform active:scale-95 ${activeFilter === filter.key
                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                : 'bg-white dark:bg-[#1e282c] border border-gray-200 dark:border-gray-700 text-primary dark:text-gray-300'
              }`}
          >
            <p className="text-sm font-semibold leading-normal">{filter.label}</p>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex flex-col gap-4 px-4 pb-24">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <span className="material-symbols-outlined text-4xl text-gray-400 animate-spin">progress_activity</span>
            <p className="text-gray-400 text-sm mt-4">Loading...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <span className="material-symbols-outlined text-5xl text-gray-300 mb-4">description</span>
            <p className="text-gray-500 text-base font-medium">No documents found</p>
            <p className="text-gray-400 text-sm mt-1">Completed services will appear here</p>
          </div>
        ) : (
          <>
            {/* Month Divider Example */}
            <div className="px-1 py-2">
              <h3 className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider">Recent</h3>
            </div>

            {orders.map(order => (
              <div
                key={order.id}
                className="group flex flex-col gap-4 bg-white dark:bg-[#1e282c] p-5 rounded-[1.5rem] shadow-[0_4px_20px_-2px_rgba(11,32,40,0.05)] border border-transparent dark:border-gray-800 transition-all hover:shadow-md"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-4">
                    <div className="flex items-center justify-center rounded-2xl bg-primary/5 dark:bg-white/5 shrink-0 size-14 text-primary dark:text-white">
                      <span className="material-symbols-outlined text-[28px]">{getServiceIcon(order.type)}</span>
                    </div>
                    <div className="flex flex-col pt-0.5">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-primary dark:text-white text-lg font-extrabold leading-tight">
                          {order.type}
                        </p>
                        {order.status === 'COMPLETED' && (
                          <span className="material-symbols-outlined text-green-600 text-[18px]">check_circle</span>
                        )}
                      </div>
                      <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                        {order.technician?.name ? `Technician: ${order.technician.name}` : 'Service completed'}
                      </p>
                      <p className="text-gray-400 dark:text-gray-500 text-xs mt-0.5">
                        {order.scheduledDate} • {order.scheduledTime}
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 mt-1">
                    <div className="px-2.5 py-1 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center gap-1.5">
                      <div className="size-1.5 rounded-full bg-green-600" />
                      <span className="text-green-700 dark:text-green-400 text-[10px] font-bold uppercase tracking-wide">
                        Done
                      </span>
                    </div>
                  </div>
                </div>

                <div className="h-px bg-gray-100 dark:bg-gray-700 w-full" />

                <div className="flex gap-3 flex-wrap sm:flex-nowrap">
                  <button className="flex flex-1 min-w-[140px] h-11 items-center justify-center gap-2 rounded-full border border-primary dark:border-gray-600 bg-transparent hover:bg-primary/5 dark:hover:bg-white/5 transition-colors">
                    <span className="material-symbols-outlined text-primary dark:text-white text-[20px]">receipt_long</span>
                    <span className="text-primary dark:text-white text-sm font-bold">Invoice</span>
                  </button>
                  <button className="flex flex-1 min-w-[140px] h-11 items-center justify-center gap-2 rounded-full border border-primary dark:border-gray-600 bg-transparent hover:bg-primary/5 dark:hover:bg-white/5 transition-colors">
                    <span className="material-symbols-outlined text-primary dark:text-white text-[20px]">photo_library</span>
                    <span className="text-primary dark:text-white text-sm font-bold">Photos</span>
                  </button>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
};

export default Documents;
