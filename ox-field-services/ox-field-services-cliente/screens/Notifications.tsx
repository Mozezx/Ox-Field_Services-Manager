import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface Notification {
    id: string;
    type: 'en_route' | 'confirmed' | 'invoice' | 'review' | 'system';
    title: string;
    message: string;
    time: string;
    isUnread: boolean;
}

export const Notifications = () => {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState<Notification[]>([
        {
            id: '1',
            type: 'en_route',
            title: 'Technician En Route',
            message: 'Mike is 10 mins away. Please ensure someone is home to let him in.',
            time: '10:45 AM',
            isUnread: true
        },
        {
            id: '2',
            type: 'confirmed',
            title: 'Appointment Confirmed',
            message: 'HVAC Repair set for Oct 24.',
            time: '9:00 AM',
            isUnread: false
        },
        {
            id: '3',
            type: 'invoice',
            title: 'Invoice Ready',
            message: 'Receipt for Plumbing Service #402 is now available for download.',
            time: '4:30 PM',
            isUnread: false
        },
        {
            id: '4',
            type: 'review',
            title: 'Review Service',
            message: 'How was your experience with Mike? Rate your service to help others.',
            time: '2:00 PM',
            isUnread: false
        },
        {
            id: '5',
            type: 'system',
            title: 'System Update',
            message: 'Ox Field Services Terms of Service have been updated.',
            time: 'Oct 20',
            isUnread: false
        }
    ]);

    const getIconConfig = (type: string) => {
        switch (type) {
            case 'en_route':
                return { icon: 'local_shipping', bgClass: 'bg-primary/10 text-primary dark:bg-primary/20', filled: true };
            case 'confirmed':
                return { icon: 'event_available', bgClass: 'bg-indigo-50 text-indigo-500 dark:bg-indigo-500/20 dark:text-indigo-300', filled: true };
            case 'invoice':
                return { icon: 'receipt_long', bgClass: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400', filled: false };
            case 'review':
                return { icon: 'star', bgClass: 'bg-amber-50 text-amber-500 dark:bg-amber-500/20 dark:text-amber-400', filled: true };
            case 'system':
                return { icon: 'shield', bgClass: 'bg-slate-100 text-slate-500 dark:bg-slate-700/30 dark:text-slate-400', filled: false };
            default:
                return { icon: 'notifications', bgClass: 'bg-gray-100 text-gray-500', filled: false };
        }
    };

    const handleMarkAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, isUnread: false })));
    };

    const handleNotificationClick = (notification: Notification) => {
        // Mark as read
        setNotifications(prev => prev.map(n =>
            n.id === notification.id ? { ...n, isUnread: false } : n
        ));

        // Navigate based on type
        switch (notification.type) {
            case 'en_route':
                navigate('/tracking');
                break;
            case 'review':
                navigate('/rating');
                break;
            case 'invoice':
                navigate('/documents');
                break;
            case 'confirmed':
                navigate('/active-services');
                break;
            default:
                break;
        }
    };

    const todayNotifications = notifications.slice(0, 2);
    const yesterdayNotifications = notifications.slice(2, 4);
    const earlierNotifications = notifications.slice(4);

    return (
        <div className="bg-background-light dark:bg-background-dark font-display min-h-screen flex flex-col antialiased">
            {/* Top App Bar */}
            <div className="sticky top-0 z-50 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm border-b border-gray-100 dark:border-gray-800 transition-colors duration-300">
                <div className="flex items-center justify-between px-4 py-3 sm:px-6">
                    <button
                        onClick={() => navigate('/home')}
                        className="flex items-center justify-center w-10 h-10 -ml-2 rounded-full text-slate-800 dark:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                    >
                        <span className="material-symbols-outlined text-[28px]">chevron_left</span>
                    </button>
                    <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Notifications</h1>
                    <button
                        onClick={handleMarkAllAsRead}
                        className="text-sm font-bold text-[#11add4] hover:text-[#11add4]/80 transition-colors px-2 py-1 rounded-lg"
                    >
                        Mark all as read
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <main className="flex-1 w-full max-w-md mx-auto px-4 pb-8 sm:px-0">
                {/* Section: Today */}
                {todayNotifications.length > 0 && (
                    <div className="mt-6">
                        <h2 className="px-2 mb-3 text-lg font-bold text-slate-900 dark:text-white">Today</h2>
                        <div className="space-y-3">
                            {todayNotifications.map(notification => {
                                const iconConfig = getIconConfig(notification.type);
                                return (
                                    <div
                                        key={notification.id}
                                        onClick={() => handleNotificationClick(notification)}
                                        className="group relative flex items-start gap-4 p-4 bg-white dark:bg-[#18282c] rounded-2xl shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)] border border-transparent dark:border-gray-800 hover:border-[#11add4]/20 transition-all cursor-pointer overflow-hidden"
                                    >
                                        <div className="shrink-0 relative">
                                            <div className={`flex items-center justify-center w-12 h-12 rounded-2xl ${iconConfig.bgClass}`}>
                                                <span className={`material-symbols-outlined ${iconConfig.filled ? 'filled' : ''}`} style={iconConfig.filled ? { fontVariationSettings: "'FILL' 1" } : {}}>
                                                    {iconConfig.icon}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0 pt-0.5">
                                            <div className="flex justify-between items-start mb-1">
                                                <h3 className="text-base font-bold text-slate-900 dark:text-white truncate pr-2">{notification.title}</h3>
                                                <span className={`text-xs font-medium whitespace-nowrap ${notification.isUnread ? 'text-[#11add4]' : 'text-slate-400 dark:text-slate-500'}`}>
                                                    {notification.time}
                                                </span>
                                            </div>
                                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                                                {notification.message}
                                            </p>
                                        </div>
                                        {notification.isUnread && (
                                            <div className="absolute top-1/2 -translate-y-1/2 right-4 flex items-center justify-center">
                                                <div className="w-2.5 h-2.5 rounded-full bg-[#0B242A] dark:bg-[#11add4] shadow-sm ring-4 ring-white dark:ring-[#18282c]" />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Section: Yesterday */}
                {yesterdayNotifications.length > 0 && (
                    <div className="mt-8">
                        <h2 className="px-2 mb-3 text-lg font-bold text-slate-900 dark:text-white">Yesterday</h2>
                        <div className="space-y-3">
                            {yesterdayNotifications.map(notification => {
                                const iconConfig = getIconConfig(notification.type);
                                return (
                                    <div
                                        key={notification.id}
                                        onClick={() => handleNotificationClick(notification)}
                                        className="group relative flex items-start gap-4 p-4 bg-white dark:bg-[#18282c] rounded-2xl shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)] border border-transparent dark:border-gray-800 hover:border-[#11add4]/20 transition-all cursor-pointer"
                                    >
                                        <div className="shrink-0">
                                            <div className={`flex items-center justify-center w-12 h-12 rounded-2xl ${iconConfig.bgClass}`}>
                                                <span className={`material-symbols-outlined ${iconConfig.filled ? 'filled' : ''}`} style={iconConfig.filled ? { fontVariationSettings: "'FILL' 1" } : {}}>
                                                    {iconConfig.icon}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0 pt-0.5">
                                            <div className="flex justify-between items-start mb-1">
                                                <h3 className="text-base font-bold text-slate-900 dark:text-white truncate pr-2">{notification.title}</h3>
                                                <span className="text-xs font-medium text-slate-400 dark:text-slate-500 whitespace-nowrap">{notification.time}</span>
                                            </div>
                                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
                                                {notification.message}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Section: Earlier */}
                {earlierNotifications.length > 0 && (
                    <div className="mt-8 mb-12">
                        <h2 className="px-2 mb-3 text-lg font-bold text-slate-900 dark:text-white">Earlier</h2>
                        <div className="space-y-3">
                            {earlierNotifications.map(notification => {
                                const iconConfig = getIconConfig(notification.type);
                                return (
                                    <div
                                        key={notification.id}
                                        onClick={() => handleNotificationClick(notification)}
                                        className="group relative flex items-start gap-4 p-4 bg-white/60 dark:bg-[#18282c]/60 rounded-2xl shadow-sm border border-transparent dark:border-gray-800 hover:bg-white dark:hover:bg-[#18282c] transition-all cursor-pointer"
                                    >
                                        <div className="shrink-0">
                                            <div className={`flex items-center justify-center w-12 h-12 rounded-2xl ${iconConfig.bgClass}`}>
                                                <span className="material-symbols-outlined">{iconConfig.icon}</span>
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0 pt-0.5">
                                            <div className="flex justify-between items-start mb-1">
                                                <h3 className="text-base font-bold text-slate-900 dark:text-white truncate pr-2">{notification.title}</h3>
                                                <span className="text-xs font-medium text-slate-400 dark:text-slate-500 whitespace-nowrap">{notification.time}</span>
                                            </div>
                                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
                                                {notification.message}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default Notifications;
