import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { customerService, ServiceOrder } from '../services/customer';

export const OrderDetail = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<ServiceOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) {
      setError('Order not specified');
      setLoading(false);
      return;
    }
    customerService.getOrder(orderId)
      .then(setOrder)
      .catch(() => setError('Could not load the order.'))
      .finally(() => setLoading(false));
  }, [orderId]);

  const orderNumber = order?.orderNumber ?? order?.osNumber ?? order?.id?.slice(-8) ?? '—';
  const scheduledTime = order?.scheduledStart ?? order?.scheduledTime ?? '';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
        <span className="material-symbols-outlined animate-spin text-4xl text-primary dark:text-white">progress_activity</span>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background-light dark:bg-background-dark">
        <p className="text-primary/70 dark:text-white/70 mb-4">{error || 'Order not found.'}</p>
        <button onClick={() => navigate('/home')} className="px-6 py-3 bg-primary text-white dark:bg-white dark:text-primary font-semibold rounded-lg">
          Back
        </button>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col min-h-screen w-full max-w-md mx-auto bg-background-light dark:bg-background-dark pb-24">
      <div className="sticky top-0 z-10 flex items-center bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm p-4 border-b border-gray-100 dark:border-gray-800">
        <button
          onClick={() => navigate(-1)}
          className="flex size-12 shrink-0 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-primary dark:text-white transition-colors"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="flex-1 text-center text-lg font-bold text-primary dark:text-white truncate pr-12">
          Ordem #{orderNumber}
        </h1>
      </div>

      <div className="flex-1 p-4 space-y-6">
        <div className="rounded-xl bg-white dark:bg-[#1a2628] p-4 shadow-sm border border-gray-100 dark:border-gray-800">
          <h2 className="text-xl font-bold text-primary dark:text-white mb-1">{order.title}</h2>
          <p className="text-sm text-primary/70 dark:text-white/70">{orderNumber}</p>
          <div className="mt-3 flex items-center gap-2">
            <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-bold uppercase ${
              order.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' :
              order.status === 'IN_PROGRESS' ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400' :
              order.status === 'SCHEDULED' ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400' :
              'bg-gray-500/20 text-gray-600 dark:text-gray-400'
            }`}>
              {order.status}
            </span>
          </div>
        </div>

        {(order.scheduledDate || scheduledTime) && (
          <div className="rounded-xl bg-white dark:bg-[#1a2628] p-4 shadow-sm border border-gray-100 dark:border-gray-800">
            <h3 className="text-sm font-bold text-primary dark:text-white mb-2">Agendamento</h3>
            <p className="text-primary/70 dark:text-white/70">
              {order.scheduledDate}{scheduledTime ? ` • ${scheduledTime}` : ''}
              {(order.durationMinutes ?? order.estimatedDuration) ? ` • ${order.durationMinutes ?? order.estimatedDuration} min` : ''}
            </p>
          </div>
        )}

        {order.description && (
          <div className="rounded-xl bg-white dark:bg-[#1a2628] p-4 shadow-sm border border-gray-100 dark:border-gray-800">
            <h3 className="text-sm font-bold text-primary dark:text-white mb-2">Descrição</h3>
            <p className="text-primary/70 dark:text-white/70 text-sm">{order.description}</p>
          </div>
        )}

        {order.technician && (
          <div className="rounded-xl bg-white dark:bg-[#1a2628] p-4 shadow-sm border border-gray-100 dark:border-gray-800">
            <h3 className="text-sm font-bold text-primary dark:text-white mb-3">Técnico</h3>
            <div className="flex items-center gap-4">
              <div
                className="size-14 rounded-full bg-gray-200 dark:bg-gray-700 bg-cover bg-center shrink-0"
                style={{ backgroundImage: `url('${order.technician.avatarUrl || 'https://i.pravatar.cc/100'}')` }}
              />
              <div>
                <p className="font-semibold text-primary dark:text-white">{order.technician.name}</p>
                <p className="text-sm text-primary/70 dark:text-white/70 flex items-center gap-1">
                  <span className="text-amber-500">★</span> {(order.technician.rating ?? 5).toFixed(1)}
                </p>
              </div>
            </div>
          </div>
        )}

        {(order.estimatedPrice != null || order.finalPrice != null) && (
          <div className="rounded-xl bg-white dark:bg-[#1a2628] p-4 shadow-sm border border-gray-100 dark:border-gray-800">
            <h3 className="text-sm font-bold text-primary dark:text-white mb-2">Valor</h3>
            <p className="text-primary/70 dark:text-white/70">
              {order.finalPrice != null ? `Final: ${Number(order.finalPrice).toFixed(2)}` : ''}
              {order.finalPrice != null && order.estimatedPrice != null ? ' • ' : ''}
              {order.estimatedPrice != null ? `Estimado: ${Number(order.estimatedPrice).toFixed(2)}` : ''}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
