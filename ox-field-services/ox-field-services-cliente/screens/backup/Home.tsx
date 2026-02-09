import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { customerService, ServiceOrder } from '../services/customer';

export const Home = () => {
  const { user, activeService, setActiveService } = useApp();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [currentOrder, setCurrentOrder] = useState<ServiceOrder | null>(null);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  useEffect(() => {
    const fetchActiveOrder = async () => {
      try {
        setLoading(true);
        const orders = await customerService.getOrders('IN_PROGRESS');
        
        if (orders.length > 0) {
          setCurrentOrder(orders[0]);
          // Also update context
          setActiveService({
            id: orders[0].id,
            type: orders[0].type,
            status: orders[0].status === 'EN_ROUTE' ? 'En Route' : 
                   orders[0].status === 'IN_PROGRESS' ? 'In Progress' : orders[0].status,
            date: orders[0].scheduledDate,
            time: orders[0].scheduledTime,
            address: orders[0].address,
            price: orders[0].price
          });
        } else {
          // Try to fetch scheduled orders
          const scheduledOrders = await customerService.getOrders('SCHEDULED');
          if (scheduledOrders.length > 0) {
            setCurrentOrder(scheduledOrders[0]);
            setActiveService({
              id: scheduledOrders[0].id,
              type: scheduledOrders[0].type,
              status: 'Scheduled',
              date: scheduledOrders[0].scheduledDate,
              time: scheduledOrders[0].scheduledTime,
              address: scheduledOrders[0].address,
              price: scheduledOrders[0].price
            });
          }
        }
      } catch (err) {
        console.error('Failed to fetch active order:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchActiveOrder();
  }, [setActiveService]);

  const displayService = currentOrder || activeService;
  const displayStatus = currentOrder 
    ? (currentOrder.status === 'EN_ROUTE' ? 'En Route' : 
       currentOrder.status === 'IN_PROGRESS' ? 'In Progress' : 
       currentOrder.status === 'SCHEDULED' ? 'Scheduled' : currentOrder.status)
    : activeService?.status;

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar pb-32 animate-fade-in">
      <header className="pt-8 pb-4 px-6 flex justify-between items-center shrink-0">
        <div>
          <p className="text-gray-400 text-sm font-medium mb-1">{getGreeting()},</p>
          <h1 className="text-3xl font-bold text-white">{user.name}</h1>
        </div>
        <button className="relative group" onClick={() => navigate('/notifications')}>
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-surface-dark shadow-sm">
             <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
          </div>
          <div className="absolute top-0 right-0 w-3 h-3 bg-red-500 border-2 border-background-dark rounded-full"></div>
        </button>
      </header>

      {/* Active Service Card */}
      <section className="px-6 mb-8 mt-2">
        {loading ? (
          <div className="bg-surface-dark rounded-[2rem] p-8 text-center border border-white/5">
            <div className="flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl text-gray-400 animate-spin">progress_activity</span>
            </div>
            <p className="text-gray-400 text-sm mt-4">Loading...</p>
          </div>
        ) : displayService ? (
          <div className="bg-primary rounded-[2rem] p-6 text-white shadow-xl shadow-primary/20 relative overflow-hidden group">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-6">
                <span className="bg-white/15 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-sm border border-white/10 tracking-wide text-accent">ACTIVE SERVICE</span>
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/5">
                  <span className="material-symbols-outlined text-[20px] text-white">
                    {(currentOrder?.type || activeService?.type) === 'HVAC' ? 'ac_unit' : 'bolt'}
                  </span>
                </div>
              </div>
              <div className="mb-8">
                <h2 className="text-3xl font-bold mb-2 text-white">{currentOrder?.type || activeService?.type} Service</h2>
                <div className="flex items-center gap-2 text-white/90">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent"></span>
                  </span>
                  <span className="text-sm font-medium">{displayStatus}</span>
                </div>
                {currentOrder?.technician && (
                  <div className="mt-4 flex items-center gap-3 bg-white/10 p-3 rounded-xl">
                    <img 
                      src={currentOrder.technician.avatarUrl || 'https://i.pravatar.cc/100'} 
                      alt={currentOrder.technician.name}
                      className="w-10 h-10 rounded-full"
                    />
                    <div>
                      <p className="font-semibold text-sm">{currentOrder.technician.name}</p>
                      <p className="text-xs text-white/70">Your Technician</p>
                    </div>
                  </div>
                )}
              </div>
              {(displayStatus === 'En Route' || currentOrder?.status === 'EN_ROUTE') && (
                <button 
                  onClick={() => navigate('/tracking')}
                  className="w-full bg-white text-primary h-12 rounded-xl font-bold text-sm hover:bg-gray-100 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg"
                >
                  Track Live
                  <span className="material-symbols-outlined text-[18px]">location_on</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-surface-dark rounded-[2rem] p-8 text-center border border-white/5">
            <div className="bg-white/5 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-3xl text-gray-400">handyman</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No active services</h3>
            <p className="text-gray-400 text-sm mb-6">Need help with maintenance?</p>
            <button 
              onClick={() => navigate('/request')}
              className="bg-primary text-white px-6 py-3 rounded-full font-bold text-sm shadow-lg shadow-primary/20 hover:bg-primary-light transition-all"
            >
              Request Service
            </button>
          </div>
        )}
      </section>

      {/* Quick Actions */}
      <section className="px-6 mb-8">
        <h3 className="text-lg font-bold text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-4">
          <QuickActionButton 
            icon="add_circle" 
            label="Request Service" 
            color="text-blue-400" 
            bg="bg-blue-900/20" 
            onClick={() => navigate('/request')}
          />
          <QuickActionButton 
            icon="history" 
            label="View History" 
            color="text-purple-400" 
            bg="bg-purple-900/20" 
            onClick={() => navigate('/documents')}
          />
          <QuickActionButton 
            icon="support_agent" 
            label="Contact Support" 
            color="text-orange-400" 
            bg="bg-orange-900/20" 
            onClick={() => navigate('/support')}
          />
          <QuickActionButton 
            icon="payments" 
            label="Manage Payments" 
            color="text-accent" 
            bg="bg-teal-900/20" 
            onClick={() => navigate('/profile')}
          />
        </div>
      </section>
    </div>
  );
};

const QuickActionButton = ({ icon, label, color, bg, onClick }: { icon: string, label: string, color: string, bg: string, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className="bg-card-dark p-5 rounded-3xl shadow-sm border border-white/5 flex flex-col items-start gap-4 hover:border-white/10 transition-all active:scale-[0.98] group"
  >
    <div className={`w-11 h-11 rounded-full ${bg} flex items-center justify-center ${color} transition-colors`}>
      <span className="material-symbols-outlined text-[22px]">{icon}</span>
    </div>
    <span className="font-semibold text-[15px] text-left leading-tight text-white">{label}</span>
  </button>
);
