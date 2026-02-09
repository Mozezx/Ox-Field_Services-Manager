import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { techService, Notification } from '../../services/tech';

export const NotificationsScreen: React.FC = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'NEW_JOB' | 'SYSTEM'>('ALL');

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        const data = await techService.getNotifications();
        setNotifications(data);
      } catch (err: any) {
        console.error('Failed to fetch notifications:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      await techService.markNotificationRead(id);
      setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const unread = notifications.filter(n => !n.read);
      await Promise.all(unread.map(n => techService.markNotificationRead(n.id)));
      setNotifications(notifications.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const filteredNotifications = filter === 'ALL' 
    ? notifications 
    : notifications.filter(n => n.type === filter);

  const unreadCount = notifications.filter(n => !n.read).length;
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'NEW_JOB': return 'assignment_add';
      case 'RESCHEDULE': return 'event_repeat';
      case 'CANCELLATION': return 'cancel';
      case 'MESSAGE': return 'message';
      default: return 'notifications';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'NEW_JOB': return 'bg-secondary/20 text-secondary';
      case 'RESCHEDULE': return 'bg-orange-500/20 text-orange-400';
      case 'CANCELLATION': return 'bg-red-500/20 text-red-400';
      case 'MESSAGE': return 'bg-blue-500/20 text-blue-400';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  if (loading && notifications.length === 0) {
    return (
      <div className="min-h-screen bg-bg-dark text-white pb-6 flex items-center justify-center">
        <div className="text-center text-slate-400">
          <span className="material-symbols-outlined text-4xl mb-2 animate-spin-cw">sync</span>
          <p className="text-sm">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-dark text-white pb-6">
       <div className="sticky top-0 z-20 bg-bg-dark/95 backdrop-blur-md border-b border-white/5 px-4 py-3 flex justify-between items-center">
          <button onClick={() => navigate(-1)} className="size-10 flex items-center justify-center rounded-full hover:bg-white/10">
             <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h2 className="text-lg font-bold">Notifications</h2>
          <button 
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0}
            className="size-10 flex items-center justify-center rounded-full hover:bg-white/10 text-secondary disabled:opacity-30 disabled:cursor-not-allowed"
          >
             <span className="material-symbols-outlined">done_all</span>
          </button>
       </div>

       <div className="px-4 py-3 flex gap-2 overflow-x-auto no-scrollbar sticky top-[60px] z-10 bg-bg-dark pb-4">
          <button
            onClick={() => setFilter('ALL')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
              filter === 'ALL'
                ? 'bg-secondary text-primary'
                : 'bg-surface-dark border border-slate-700 text-slate-400'
            }`}
          >
             All {unreadCount > 0 && (
               <span className="bg-black/10 text-[10px] px-1.5 py-0.5 rounded-full ml-1">{unreadCount}</span>
             )}
          </button>
          <button
            onClick={() => setFilter('NEW_JOB')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === 'NEW_JOB'
                ? 'bg-secondary text-primary'
                : 'bg-surface-dark border border-slate-700 text-slate-400'
            }`}
          >
            Assignments
          </button>
          <button
            onClick={() => setFilter('SYSTEM')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === 'SYSTEM'
                ? 'bg-secondary text-primary'
                : 'bg-surface-dark border border-slate-700 text-slate-400'
            }`}
          >
            Alerts
          </button>
       </div>

       <div className="px-4 flex flex-col gap-4">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <span className="material-symbols-outlined text-4xl mb-2">notifications_off</span>
              <p className="text-sm">Nenhuma notificação</p>
            </div>
          ) : (
            filteredNotifications.map(notification => (
              <div
                key={notification.id}
                onClick={() => !notification.read && handleMarkAsRead(notification.id)}
                className={`bg-surface-dark border rounded-2xl p-4 relative overflow-hidden group hover:border-secondary/50 transition-colors ${
                  notification.read ? 'border-slate-800 bg-surface-dark/40' : 'border-slate-700'
                }`}
              >
                {!notification.read && (
                  <div className="absolute top-4 right-4 h-2.5 w-2.5 rounded-full bg-secondary shadow-[0_0_8px_#13ec5b]"></div>
                )}
                <div className="flex items-start justify-between mb-3">
                   <div className="flex items-center gap-2">
                      <div className={`size-8 rounded-full flex items-center justify-center ${
                        getNotificationColor(notification.type)
                      }`}>
                         <span className="material-symbols-outlined text-lg">{getNotificationIcon(notification.type)}</span>
                      </div>
                      <div>
                         <p className="text-xs font-medium text-slate-400 uppercase">{notification.type.replace('_', ' ')}</p>
                         <p className="text-xs text-slate-500">{formatTimeAgo(notification.createdAt)}</p>
                      </div>
                   </div>
                </div>
                <h3 className="text-lg font-bold mb-2">{notification.title}</h3>
                <p className="text-sm text-slate-300 mb-4">{notification.message}</p>
                {notification.data?.orderId && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/task/${notification.data.orderId}`);
                    }}
                    className="w-full bg-primary hover:bg-primary/90 text-white py-2.5 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                  >
                    Quick View <span className="material-symbols-outlined text-lg">arrow_forward</span>
                  </button>
                )}
              </div>
            ))
          )}
       </div>
    </div>
  );
};
