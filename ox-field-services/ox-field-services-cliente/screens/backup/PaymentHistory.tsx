import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface PaymentRecord {
    paymentId: string;
    orderId: string;
    orderNumber: string;
    serviceTitle: string;
    amount: number;
    status: 'PAID' | 'PENDING' | 'FAILED' | 'REFUNDED';
    paidAt: string;
    paymentMethod: string;
}

export const PaymentHistory: React.FC = () => {
    const navigate = useNavigate();
    const [payments, setPayments] = useState<PaymentRecord[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadPaymentHistory();
    }, []);

    const loadPaymentHistory = async () => {
        try {
            setLoading(true);
            
            // Em produção, carregar do backend:
            // const data = await customerService.getPaymentHistory();
            
            // Dados de exemplo
            setPayments([
                {
                    paymentId: '1',
                    orderId: 'os-001',
                    orderNumber: 'OS-2026-001',
                    serviceTitle: 'Reparo Encanamento',
                    amount: 203.00,
                    status: 'PAID',
                    paidAt: new Date().toISOString(),
                    paymentMethod: 'Visa •••• 4242',
                },
                {
                    paymentId: '2',
                    orderId: 'os-002',
                    orderNumber: 'OS-2026-002',
                    serviceTitle: 'Instalação Elétrica',
                    amount: 450.00,
                    status: 'PAID',
                    paidAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                    paymentMethod: 'Mastercard •••• 5678',
                },
            ]);
        } catch (err) {
            console.error('Error loading payment history:', err);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const configs: Record<string, { color: string; label: string; icon: string }> = {
            PAID: { color: 'bg-green-500/20 text-green-400', label: 'Pago', icon: 'check_circle' },
            PENDING: { color: 'bg-yellow-500/20 text-yellow-400', label: 'Pendente', icon: 'schedule' },
            FAILED: { color: 'bg-red-500/20 text-red-400', label: 'Falhou', icon: 'error' },
            REFUNDED: { color: 'bg-blue-500/20 text-blue-400', label: 'Reembolsado', icon: 'undo' },
        };
        return configs[status] || configs.PENDING;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background-dark flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background-dark">
            {/* Header */}
            <header className="px-4 pt-6 pb-4 border-b border-white/5 flex items-center gap-4 sticky top-0 bg-background-dark z-10 backdrop-blur-sm">
                <button
                    onClick={() => navigate(-1)}
                    className="flex size-10 items-center justify-center rounded-full hover:bg-surface-dark transition-colors"
                >
                    <span className="material-symbols-outlined text-white">arrow_back</span>
                </button>
                <h1 className="text-lg font-bold text-white">Histórico de Pagamentos</h1>
            </header>

            <main className="px-4 py-6 pb-24">
                {payments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16">
                        <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4">
                            <span className="material-symbols-outlined text-gray-500 text-5xl">receipt_long</span>
                        </div>
                        <p className="text-gray-400 text-center">Nenhum pagamento realizado ainda</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {payments.map((payment) => {
                            const statusConfig = getStatusBadge(payment.status);
                            const paidDate = new Date(payment.paidAt);
                            
                            return (
                                <div
                                    key={payment.paymentId}
                                    className="bg-surface-dark rounded-xl p-4 border border-white/10 hover:border-white/20 transition-all cursor-pointer"
                                    onClick={() => navigate(`/receipt/${payment.paymentId}`)}
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1">
                                            <p className="text-white font-semibold">{payment.serviceTitle}</p>
                                            <p className="text-xs text-gray-500 mt-0.5">{payment.orderNumber}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-bold text-white">
                                                R$ {payment.amount.toFixed(2)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1 ${statusConfig.color}`}>
                                                <span className="material-symbols-outlined text-sm">{statusConfig.icon}</span>
                                                {statusConfig.label}
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                {paidDate.toLocaleDateString('pt-BR', { 
                                                    day: '2-digit', 
                                                    month: 'short', 
                                                    year: 'numeric' 
                                                })}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500">{payment.paymentMethod}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Summary Card */}
                {payments.length > 0 && (
                    <div className="mt-6 bg-gradient-to-br from-primary/20 to-blue-500/20 rounded-xl p-5 border border-primary/30">
                        <p className="text-sm text-gray-300 mb-1">Total Gasto</p>
                        <p className="text-3xl font-bold text-white">
                            R$ {payments.reduce((sum, p) => sum + p.amount, 0).toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                            {payments.length} pagamento{payments.length !== 1 ? 's' : ''} realizado{payments.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default PaymentHistory;
