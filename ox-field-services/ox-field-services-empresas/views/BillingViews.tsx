import React, { useEffect, useState } from 'react';
import { empresaService, SubscriptionInfo, InvoiceInfo, CreditInfo, UsageInfo } from '../services/empresa';

// ========== My Subscription View ==========
export const MySubscriptionView: React.FC = () => {
    const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadSubscription();
    }, []);

    const loadSubscription = async () => {
        try {
            setLoading(true);
            const data = await empresaService.getMySubscription();
            setSubscription(data);
        } catch (err) {
            setError('Erro ao carregar assinatura');
        } finally {
            setLoading(false);
        }
    };

    const getPlanBadgeColor = (plan: string) => {
        switch (plan) {
            case 'ENTERPRISE': return 'bg-purple-500';
            case 'PROFESSIONAL': return 'bg-blue-500';
            default: return 'bg-green-500';
        }
    };

    const getStatusBadge = (status: string) => {
        const colors: Record<string, string> = {
            ACTIVE: 'bg-green-500/20 text-green-400',
            PAST_DUE: 'bg-yellow-500/20 text-yellow-400',
            SUSPENDED: 'bg-red-500/20 text-red-400',
            CANCELLED: 'bg-gray-500/20 text-gray-400'
        };
        return colors[status] || 'bg-gray-500/20 text-gray-400';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background p-6 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (error || !subscription) {
        return (
            <div className="min-h-screen bg-background p-6">
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                    <p className="text-red-400">{error || 'Assinatura não encontrada'}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-6">
            <h1 className="text-2xl font-bold text-white mb-6">Minha Assinatura</h1>

            {/* Plan Card */}
            <div className="bg-surface rounded-xl p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <span className={`px-3 py-1 rounded-full text-white text-sm font-medium ${getPlanBadgeColor(subscription.planEdition)}`}>
                            {subscription.planEdition}
                        </span>
                        <span className={`ml-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(subscription.status)}`}>
                            {subscription.status}
                        </span>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-text-secondary">Total Mensal</p>
                        <p className="text-2xl font-bold text-primary">
                            R$ {subscription.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                    </div>
                </div>

                <div className="border-t border-border pt-4">
                    <p className="text-sm text-text-secondary mb-2">Período Atual</p>
                    <p className="text-white">
                        {subscription.periodStart} até {subscription.periodEnd}
                    </p>
                </div>
            </div>

            {/* User Counts */}
            <div className="bg-surface rounded-xl p-6 mb-6">
                <h2 className="text-lg font-semibold text-white mb-4">Usuários Ativos</h2>
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-background rounded-lg p-4">
                        <p className="text-sm text-text-secondary">Admins</p>
                        <p className="text-2xl font-bold text-white">{subscription.userCounts.ADMIN || 0}</p>
                        <p className="text-xs text-text-secondary">R$ 49/mês cada</p>
                    </div>
                    <div className="bg-background rounded-lg p-4">
                        <p className="text-sm text-text-secondary">Gestores</p>
                        <p className="text-2xl font-bold text-white">{subscription.userCounts.GESTOR || 0}</p>
                        <p className="text-xs text-text-secondary">R$ 79/mês cada</p>
                    </div>
                    <div className="bg-background rounded-lg p-4">
                        <p className="text-sm text-text-secondary">Técnicos</p>
                        <p className="text-2xl font-bold text-white">{subscription.userCounts.TECNICO || 0}</p>
                        <p className="text-xs text-text-secondary">R$ 39/mês cada</p>
                    </div>
                </div>
            </div>

            {/* Pricing Breakdown */}
            <div className="bg-surface rounded-xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Detalhamento</h2>
                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <span className="text-text-secondary">Plano Base ({subscription.planEdition})</span>
                        <span className="text-white">R$ {subscription.monthlyBaseAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-text-secondary">Admins ({subscription.userCounts.ADMIN || 0} x R$ 49)</span>
                        <span className="text-white">R$ {((subscription.userCounts.ADMIN || 0) * 49).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-text-secondary">Gestores ({subscription.userCounts.GESTOR || 0} x R$ 79)</span>
                        <span className="text-white">R$ {((subscription.userCounts.GESTOR || 0) * 79).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-text-secondary">Técnicos ({subscription.userCounts.TECNICO || 0} x R$ 39)</span>
                        <span className="text-white">R$ {((subscription.userCounts.TECNICO || 0) * 39).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="border-t border-border pt-3 flex justify-between items-center">
                        <span className="text-white font-semibold">Total</span>
                        <span className="text-primary font-bold text-xl">R$ {subscription.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ========== Invoices View ==========
export const InvoicesView: React.FC = () => {
    const [invoices, setInvoices] = useState<InvoiceInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedInvoice, setSelectedInvoice] = useState<InvoiceInfo | null>(null);

    useEffect(() => {
        loadInvoices();
    }, []);

    const loadInvoices = async () => {
        try {
            setLoading(true);
            const data = await empresaService.getMyInvoices();
            setInvoices(data);
        } catch (err) {
            console.error('Error loading invoices:', err);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const configs: Record<string, { color: string; label: string }> = {
            PAID: { color: 'bg-green-500/20 text-green-400', label: 'Pago' },
            PENDING: { color: 'bg-yellow-500/20 text-yellow-400', label: 'Pendente' },
            OVERDUE: { color: 'bg-red-500/20 text-red-400', label: 'Vencido' },
            CANCELLED: { color: 'bg-gray-500/20 text-gray-400', label: 'Cancelado' },
            DRAFT: { color: 'bg-blue-500/20 text-blue-400', label: 'Rascunho' }
        };
        return configs[status] || { color: 'bg-gray-500/20 text-gray-400', label: status };
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background p-6 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-6">
            <h1 className="text-2xl font-bold text-white mb-6">Faturas</h1>

            {invoices.length === 0 ? (
                <div className="bg-surface rounded-xl p-8 text-center">
                    <p className="text-text-secondary">Nenhuma fatura encontrada</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {invoices.map(invoice => {
                        const { color, label } = getStatusBadge(invoice.status);
                        return (
                            <div 
                                key={invoice.id}
                                className="bg-surface rounded-xl p-4 cursor-pointer hover:bg-surface-hover transition-colors"
                                onClick={() => setSelectedInvoice(invoice)}
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-white font-medium">{invoice.invoiceNumber}</p>
                                        <p className="text-sm text-text-secondary">
                                            {invoice.periodStart} - {invoice.periodEnd}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-bold text-white">
                                            R$ {invoice.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </p>
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${color}`}>
                                            {label}
                                        </span>
                                    </div>
                                </div>
                                <div className="mt-2 text-sm text-text-secondary">
                                    Vencimento: {invoice.dueDate}
                                    {invoice.paidAt && <span className="ml-4">Pago em: {invoice.paidAt}</span>}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Invoice Detail Modal */}
            {selectedInvoice && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-surface rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold text-white">
                                    Fatura {selectedInvoice.invoiceNumber}
                                </h2>
                                <button 
                                    onClick={() => setSelectedInvoice(null)}
                                    className="text-text-secondary hover:text-white"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="bg-background rounded-lg p-4">
                                    <p className="text-sm text-text-secondary">Período</p>
                                    <p className="text-white">{selectedInvoice.periodStart} - {selectedInvoice.periodEnd}</p>
                                </div>

                                <div>
                                    <p className="text-sm text-text-secondary mb-2">Itens</p>
                                    {selectedInvoice.lines.map((line, idx) => (
                                        <div key={idx} className="flex justify-between items-center py-2 border-b border-border">
                                            <div>
                                                <p className="text-white">{line.description}</p>
                                                <p className="text-sm text-text-secondary">{line.quantity} x R$ {line.unitPrice.toFixed(2)}</p>
                                            </div>
                                            <p className="text-white font-medium">R$ {line.total.toFixed(2)}</p>
                                        </div>
                                    ))}
                                </div>

                                <div className="border-t border-border pt-4 space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-text-secondary">Subtotal</span>
                                        <span className="text-white">R$ {selectedInvoice.subtotal.toFixed(2)}</span>
                                    </div>
                                    {selectedInvoice.taxAmount > 0 && (
                                        <div className="flex justify-between">
                                            <span className="text-text-secondary">Impostos</span>
                                            <span className="text-white">R$ {selectedInvoice.taxAmount.toFixed(2)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-lg font-bold">
                                        <span className="text-white">Total</span>
                                        <span className="text-primary">R$ {selectedInvoice.totalAmount.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>

                            <button 
                                onClick={() => setSelectedInvoice(null)}
                                className="w-full mt-6 py-3 bg-primary text-background rounded-lg font-medium hover:bg-primary-hover transition-colors"
                            >
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// ========== Credits View ==========
export const CreditsView: React.FC = () => {
    const [credits, setCredits] = useState<CreditInfo | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadCredits();
    }, []);

    const loadCredits = async () => {
        try {
            setLoading(true);
            const data = await empresaService.getMyCredits();
            setCredits(data);
        } catch (err) {
            console.error('Error loading credits:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background p-6 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-6">
            <h1 className="text-2xl font-bold text-white mb-6">Créditos</h1>

            {/* Total Balance */}
            <div className="bg-gradient-to-r from-primary/20 to-blue-500/20 rounded-xl p-6 mb-6">
                <p className="text-text-secondary">Saldo Disponível</p>
                <p className="text-4xl font-bold text-primary">{credits?.totalAvailable || 0}</p>
                <p className="text-sm text-text-secondary">créditos</p>
            </div>

            {/* Packages */}
            <div className="bg-surface rounded-xl p-6 mb-6">
                <h2 className="text-lg font-semibold text-white mb-4">Comprar Créditos</h2>
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-background rounded-lg p-4 text-center border border-border hover:border-primary transition-colors cursor-pointer">
                        <p className="text-2xl font-bold text-white">500</p>
                        <p className="text-sm text-text-secondary">créditos</p>
                        <p className="text-primary font-semibold mt-2">R$ 199</p>
                        <p className="text-xs text-text-secondary">R$ 0.40/crédito</p>
                    </div>
                    <div className="bg-background rounded-lg p-4 text-center border-2 border-primary relative">
                        <span className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-primary text-background text-xs px-2 py-0.5 rounded">Popular</span>
                        <p className="text-2xl font-bold text-white">2.000</p>
                        <p className="text-sm text-text-secondary">créditos</p>
                        <p className="text-primary font-semibold mt-2">R$ 699</p>
                        <p className="text-xs text-text-secondary">R$ 0.35/crédito</p>
                    </div>
                    <div className="bg-background rounded-lg p-4 text-center border border-border hover:border-primary transition-colors cursor-pointer">
                        <p className="text-2xl font-bold text-white">10.000</p>
                        <p className="text-sm text-text-secondary">créditos</p>
                        <p className="text-primary font-semibold mt-2">R$ 2.999</p>
                        <p className="text-xs text-text-secondary">R$ 0.30/crédito</p>
                    </div>
                </div>
            </div>

            {/* Balance History */}
            {credits && credits.balances.length > 0 && (
                <div className="bg-surface rounded-xl p-6">
                    <h2 className="text-lg font-semibold text-white mb-4">Histórico de Compras</h2>
                    <div className="space-y-3">
                        {credits.balances.map(balance => (
                            <div key={balance.id} className="flex items-center justify-between py-3 border-b border-border">
                                <div>
                                    <p className="text-white">{balance.purchased} créditos</p>
                                    <p className="text-sm text-text-secondary">
                                        Comprado em: {balance.purchasedAt}
                                    </p>
                                    {balance.expiresAt && (
                                        <p className="text-xs text-yellow-400">
                                            Expira em: {balance.expiresAt}
                                        </p>
                                    )}
                                </div>
                                <div className="text-right">
                                    <p className="text-white font-medium">{balance.remaining} restantes</p>
                                    <p className="text-sm text-text-secondary">
                                        R$ {balance.amountPaid?.toFixed(2)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Credit Usage Table */}
            <div className="bg-surface rounded-xl p-6 mt-6">
                <h2 className="text-lg font-semibold text-white mb-4">Consumo por Recurso</h2>
                <table className="w-full">
                    <thead>
                        <tr className="text-text-secondary text-sm">
                            <th className="text-left py-2">Recurso</th>
                            <th className="text-right py-2">Créditos</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="border-t border-border">
                            <td className="py-3 text-white">Ordem de Serviço criada</td>
                            <td className="py-3 text-right text-text-secondary">1 crédito</td>
                        </tr>
                        <tr className="border-t border-border">
                            <td className="py-3 text-white">Otimização de rota</td>
                            <td className="py-3 text-right text-text-secondary">2 créditos</td>
                        </tr>
                        <tr className="border-t border-border">
                            <td className="py-3 text-white">SMS enviado</td>
                            <td className="py-3 text-right text-text-secondary">0.5 crédito</td>
                        </tr>
                        <tr className="border-t border-border">
                            <td className="py-3 text-white">Armazenamento (GB/mês)</td>
                            <td className="py-3 text-right text-text-secondary">5 créditos</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// ========== Usage Report View ==========
export const UsageReportView: React.FC = () => {
    const [usage, setUsage] = useState<UsageInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });

    useEffect(() => {
        loadUsage();
    }, [selectedMonth]);

    const loadUsage = async () => {
        try {
            setLoading(true);
            const [year, month] = selectedMonth.split('-').map(Number);
            const data = await empresaService.getMyUsage(year, month);
            setUsage(data);
        } catch (err) {
            console.error('Error loading usage:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background p-6 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-6">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-white">Relatório de Uso</h1>
                <input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="bg-surface border border-border rounded-lg px-4 py-2 text-white"
                />
            </div>

            {usage && (
                <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-4 gap-4 mb-6">
                        <div className="bg-surface rounded-xl p-4">
                            <p className="text-sm text-text-secondary">Total Usuários</p>
                            <p className="text-2xl font-bold text-white">
                                {Object.values(usage.userCounts).reduce((a, b) => a + b, 0)}
                            </p>
                        </div>
                        <div className="bg-surface rounded-xl p-4">
                            <p className="text-sm text-text-secondary">OS Criadas</p>
                            <p className="text-2xl font-bold text-white">{usage.ordersCreated}</p>
                        </div>
                        <div className="bg-surface rounded-xl p-4">
                            <p className="text-sm text-text-secondary">OS Concluídas</p>
                            <p className="text-2xl font-bold text-white">{usage.ordersCompleted}</p>
                        </div>
                        <div className="bg-surface rounded-xl p-4">
                            <p className="text-sm text-text-secondary">Créditos Usados</p>
                            <p className="text-2xl font-bold text-primary">{usage.totalCreditsUsed}</p>
                        </div>
                    </div>

                    {/* User Breakdown */}
                    <div className="bg-surface rounded-xl p-6 mb-6">
                        <h2 className="text-lg font-semibold text-white mb-4">Usuários por Tipo</h2>
                        <div className="grid grid-cols-4 gap-4">
                            {Object.entries(usage.userCounts).map(([role, count]) => (
                                <div key={role} className="bg-background rounded-lg p-4">
                                    <p className="text-sm text-text-secondary">{role}</p>
                                    <p className="text-2xl font-bold text-white">{count}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Credit Usage Breakdown */}
                    {Object.keys(usage.creditUsageByType).length > 0 && (
                        <div className="bg-surface rounded-xl p-6">
                            <h2 className="text-lg font-semibold text-white mb-4">Uso de Créditos por Tipo</h2>
                            <div className="space-y-3">
                                {Object.entries(usage.creditUsageByType).map(([type, credits]) => (
                                    <div key={type} className="flex items-center justify-between py-2 border-b border-border">
                                        <span className="text-white">{type.replace(/_/g, ' ')}</span>
                                        <span className="text-primary font-medium">{credits} créditos</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default {
    MySubscriptionView,
    InvoicesView,
    CreditsView,
    UsageReportView
};
