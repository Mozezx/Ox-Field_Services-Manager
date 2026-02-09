import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { customerService, ServiceOrder } from '../services/customer';

type TabType = 'in_progress' | 'scheduled';

export const ActiveServices = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<TabType>('in_progress');
    const [orders, setOrders] = useState<ServiceOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                setLoading(true);
                setLoadError(null);
                const status = activeTab === 'in_progress' ? 'IN_PROGRESS' : 'SCHEDULED';
                const data = await customerService.getOrders(status);
                setOrders(data);
            } catch (error) {
                console.error('Failed to fetch orders:', error);
                setLoadError('Service temporarily unavailable. Please try again later.');
                setOrders([]);
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, [activeTab]);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'EN_ROUTE':
                return (
                    <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 dark:bg-teal-900/30 px-2 py-1 text-xs font-bold text-teal-700 dark:text-teal-300 uppercase tracking-wide">
                        <span className="size-1.5 rounded-full bg-teal-500 animate-pulse" />
                        En Route
                    </span>
                );
            case 'IN_PROGRESS':
                return (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 dark:bg-blue-900/30 px-2 py-1 text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wide">
                        <span className="size-1.5 rounded-full bg-blue-500" />
                        In Progress
                    </span>
                );
            case 'SCHEDULED':
                return (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-900/30 px-2 py-1 text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wide">
                        Confirmed
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1 rounded-full bg-gray-50 dark:bg-gray-900/30 px-2 py-1 text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                        {status}
                    </span>
                );
        }
    };

    return (
        <div className="relative flex flex-col h-full min-h-screen w-full max-w-md mx-auto bg-background-light dark:bg-background-dark shadow-2xl overflow-hidden pb-24">
            {/* Top App Bar */}
            <div className="sticky top-0 z-10 flex items-center bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm p-4 pb-2 justify-between border-b border-gray-100 dark:border-gray-800">
                <button
                    onClick={() => navigate('/home')}
                    className="text-primary dark:text-white flex size-12 shrink-0 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <h2 className="text-primary dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center">
                    Atividades
                </h2>
                <div className="flex w-12 items-center justify-end">
                    <button className="flex items-center justify-center size-12 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-primary dark:text-white transition-colors">
                        <span className="material-symbols-outlined">filter_list</span>
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="pt-2">
                <div className="flex border-b border-gray-200 dark:border-gray-700 px-4 justify-between">
                    <button
                        className={`group flex flex-col items-center justify-center border-b-[3px] pb-[13px] pt-4 flex-1 ${activeTab === 'in_progress'
                                ? 'border-b-primary dark:border-b-white'
                                : 'border-b-transparent hover:border-b-gray-300 dark:hover:border-b-gray-600'
                            } transition-colors`}
                        onClick={() => setActiveTab('in_progress')}
                    >
                        <p className={`text-sm font-bold leading-normal tracking-[0.015em] ${activeTab === 'in_progress'
                                ? 'text-primary dark:text-white'
                                : 'text-gray-400 dark:text-gray-500 group-hover:text-primary dark:group-hover:text-white'
                            } transition-colors`}>
                            Em Andamento
                        </p>
                    </button>
                    <button
                        className={`group flex flex-col items-center justify-center border-b-[3px] pb-[13px] pt-4 flex-1 ${activeTab === 'scheduled'
                                ? 'border-b-primary dark:border-b-white'
                                : 'border-b-transparent hover:border-b-gray-300 dark:hover:border-b-gray-600'
                            } transition-colors`}
                        onClick={() => setActiveTab('scheduled')}
                    >
                        <p className={`text-sm font-bold leading-normal tracking-[0.015em] ${activeTab === 'scheduled'
                                ? 'text-primary dark:text-white'
                                : 'text-gray-400 dark:text-gray-500 group-hover:text-primary dark:group-hover:text-white'
                            } transition-colors`}>
                            Agendados
                        </p>
                    </button>
                </div>
            </div>

            {/* Content List */}
            <div className="flex flex-col gap-4 p-4">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-12">
                        <span className="material-symbols-outlined text-4xl text-gray-400 animate-spin">progress_activity</span>
                        <p className="text-gray-400 text-sm mt-4">Carregando...</p>
                    </div>
                ) : loadError ? (
                    <div className="flex flex-col items-center justify-center py-12">
                        <span className="material-symbols-outlined text-5xl text-amber-500 mb-4">error_outline</span>
                        <p className="text-amber-700 dark:text-amber-400 text-base font-medium text-center">{loadError}</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="mt-6 px-6 py-3 bg-amber-500 text-white rounded-xl font-bold text-sm hover:bg-amber-600 transition-all"
                        >
                            Try Again
                        </button>
                    </div>
                ) : orders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12">
                        <span className="material-symbols-outlined text-5xl text-gray-300 mb-4">event_busy</span>
                        <p className="text-gray-500 text-base font-medium">No services found</p>
                        <p className="text-gray-400 text-sm mt-1">
                            {activeTab === 'in_progress' ? 'You have no services in progress' : 'You have no scheduled services'}
                        </p>
                        <button
                            onClick={() => navigate('/request')}
                            className="mt-6 px-6 py-3 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary/90 transition-all"
                        >
                            Request Service
                        </button>
                    </div>
                ) : (
                    orders.map((order) => (
                        <div
                            key={order.id}
                            className="flex flex-col gap-3 rounded-xl bg-white dark:bg-[#1a2628] p-4 shadow-sm border border-gray-100 dark:border-gray-800"
                        >
                            {/* Header with Status */}
                            <div className="flex justify-between items-start">
                                {getStatusBadge(order.status)}
                                <span className="text-gray-400 dark:text-gray-500 text-xs font-medium">
                                    {order.status === 'SCHEDULED'
                                        ? `${order.scheduledDate} • ${order.scheduledTime}`
                                        : `ID: #${order.id.slice(-4)}`}
                                </span>
                            </div>

                            {/* Main Content */}
                            <div className="flex gap-4">
                                <div className="flex flex-col justify-between flex-1 gap-1">
                                    <h3 className="text-primary dark:text-white text-lg font-bold leading-tight">
                                        {order.type} Service
                                    </h3>
                                    <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                                        {order.status === 'EN_ROUTE' ? 'Technician arriving soon' :
                                            order.status === 'IN_PROGRESS' ? 'Service in progress' :
                                                order.address}
                                    </p>
                                    {order.technician && (
                                        <div className="flex items-center gap-2 mt-2">
                                            <div
                                                className="size-6 rounded-full bg-gray-200 dark:bg-gray-700 bg-cover bg-center"
                                                style={{ backgroundImage: `url('${order.technician.avatarUrl || 'https://i.pravatar.cc/100'}')` }}
                                            />
                                            <p className="text-xs text-primary dark:text-gray-300 font-medium">
                                                {order.technician.name} <span className="text-amber-500">★ 4.9</span>
                                            </p>
                                        </div>
                                    )}
                                </div>
                                <div className="w-24 aspect-square rounded-lg overflow-hidden relative shrink-0 bg-gray-100 dark:bg-gray-800">
                                    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent" />
                                </div>
                            </div>

                            {/* Action Button */}
                            {order.status === 'EN_ROUTE' && (
                                <button
                                    onClick={() => navigate('/tracking')}
                                    className="mt-2 flex w-full cursor-pointer items-center justify-center rounded-lg h-10 bg-primary text-white gap-2 text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-[0.98]"
                                >
                                    <span className="material-symbols-outlined text-[18px]">location_on</span>
                                    Track Live
                                </button>
                            )}
                            {order.status === 'IN_PROGRESS' && (
                                <button
                                    onClick={() => navigate('/support')}
                                    className="mt-2 flex w-full cursor-pointer items-center justify-center rounded-lg h-10 bg-gray-100 dark:bg-gray-800 text-primary dark:text-white gap-2 text-sm font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-all active:scale-[0.98]"
                                >
                                    <span className="material-symbols-outlined text-[18px]">chat</span>
                                    Message Technician
                                </button>
                            )}
                            {order.status === 'SCHEDULED' && (
                                <button
                                    onClick={() => navigate(`/tracking`)}
                                    className="mt-2 flex w-full cursor-pointer items-center justify-center rounded-lg h-10 border border-gray-200 dark:border-gray-700 bg-transparent text-primary dark:text-white gap-2 text-sm font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-all active:scale-[0.98]"
                                >
                                    View Details
                                    <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                                </button>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ActiveServices;
