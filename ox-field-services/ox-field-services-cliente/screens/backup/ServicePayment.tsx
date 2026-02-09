import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { stripePromise } from '../services/stripe';

interface ServiceOrderDetails {
    id: string;
    orderNumber: string;
    title: string;
    description: string;
    totalAmount: number;
    technician: {
        name: string;
        avatar?: string;
    };
    completedAt: string;
}

const PaymentForm: React.FC<{ order: ServiceOrderDetails }> = ({ order }) => {
    const stripe = useStripe();
    const elements = useElements();
    const navigate = useNavigate();
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<'new-card' | 'saved-card'>('saved-card');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        setProcessing(true);
        setError(null);

        try {
            if (paymentMethod === 'new-card') {
                const cardElement = elements.getElement(CardElement);
                if (!cardElement) {
                    throw new Error('Elemento de cartão não encontrado');
                }

                // Criar Payment Method
                const { error: stripeError, paymentMethod: pm } = await stripe.createPaymentMethod({
                    type: 'card',
                    card: cardElement,
                });

                if (stripeError) {
                    throw new Error(stripeError.message);
                }

                // Aqui seria feita a chamada ao backend para processar o pagamento
                // await customerService.payOrder(order.id, pm.id);
                console.log('Payment Method created:', pm?.id);
            } else {
                // Usar cartão salvo
                // await customerService.payOrder(order.id, 'saved-card-id');
                console.log('Using saved card');
            }

            // Simular sucesso
            setTimeout(() => {
                navigate('/confirmation-payment', { state: { orderId: order.id } });
            }, 1000);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Erro ao processar pagamento';
            setError(errorMessage);
            setProcessing(false);
        }
    };

    const cardElementOptions = {
        style: {
            base: {
                fontSize: '16px',
                color: '#ffffff',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                '::placeholder': {
                    color: '#9ca3af',
                },
            },
            invalid: {
                color: '#ef4444',
            },
        },
        hidePostalCode: true,
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Payment Method Selection */}
            <div className="space-y-3">
                <button
                    type="button"
                    onClick={() => setPaymentMethod('saved-card')}
                    className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                        paymentMethod === 'saved-card'
                            ? 'bg-primary/20 border-primary'
                            : 'bg-surface-dark border-white/10 hover:border-white/20'
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-7 rounded bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-xs font-bold">
                                VISA
                            </div>
                            <div>
                                <p className="text-white font-medium">Visa •••• 4242</p>
                                <p className="text-xs text-gray-400">Expira 12/24</p>
                            </div>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            paymentMethod === 'saved-card' ? 'border-primary' : 'border-gray-600'
                        }`}>
                            {paymentMethod === 'saved-card' && (
                                <div className="w-3 h-3 rounded-full bg-primary"></div>
                            )}
                        </div>
                    </div>
                </button>

                <button
                    type="button"
                    onClick={() => setPaymentMethod('new-card')}
                    className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                        paymentMethod === 'new-card'
                            ? 'bg-primary/20 border-primary'
                            : 'bg-surface-dark border-white/10 hover:border-white/20'
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-white">add_card</span>
                            <p className="text-white font-medium">Novo Cartão</p>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            paymentMethod === 'new-card' ? 'border-primary' : 'border-gray-600'
                        }`}>
                            {paymentMethod === 'new-card' && (
                                <div className="w-3 h-3 rounded-full bg-primary"></div>
                            )}
                        </div>
                    </div>
                </button>
            </div>

            {/* New Card Form */}
            {paymentMethod === 'new-card' && (
                <div className="bg-surface-dark rounded-xl p-4 border border-border">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Dados do Cartão
                    </label>
                    <div className="bg-background-dark rounded-lg p-3 border border-white/10">
                        <CardElement options={cardElementOptions} />
                    </div>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                    <p className="text-red-400 text-sm">{error}</p>
                </div>
            )}

            {/* Submit Button */}
            <button
                type="submit"
                disabled={!stripe || processing}
                className={`
                    w-full py-4 px-4 rounded-xl font-bold text-lg transition-all shadow-lg
                    ${processing || !stripe
                        ? 'bg-gray-600 cursor-not-allowed text-white'
                        : 'bg-primary text-white hover:bg-primary-light active:scale-[0.98] shadow-primary/30'
                    }
                `}
            >
                {processing ? (
                    <div className="flex items-center justify-center gap-2 text-white">
                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                        <span>Processando...</span>
                    </div>
                ) : (
                    <div className="flex items-center justify-center gap-2 text-white">
                        <span className="material-symbols-outlined">lock</span>
                        <span>Pagar R$ {order.totalAmount.toFixed(2)}</span>
                    </div>
                )}
            </button>

            <p className="text-center text-xs text-gray-500">
                Pagamento seguro com criptografia SSL 256-bit
            </p>
        </form>
    );
};

export const ServicePayment: React.FC = () => {
    const navigate = useNavigate();
    const { orderId } = useParams<{ orderId: string }>();
    const [order, setOrder] = useState<ServiceOrderDetails | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadOrderDetails();
    }, [orderId]);

    const loadOrderDetails = async () => {
        try {
            setLoading(true);
            // Em produção, carregar do backend:
            // const data = await customerService.getOrder(orderId);
            
            // Dados de exemplo
            setOrder({
                id: orderId || '123',
                orderNumber: 'OS-2026-001',
                title: 'Reparo Encanamento',
                description: 'Vazamento embaixo da pia da cozinha',
                totalAmount: 203.00,
                technician: {
                    name: 'João Silva',
                    avatar: 'https://i.pravatar.cc/150?img=12',
                },
                completedAt: new Date().toISOString(),
            });
        } catch (err) {
            console.error('Error loading order:', err);
        } finally {
            setLoading(false);
        }
    };

    const handlePaymentSuccess = async (paymentMethodId: string) => {
        console.log('Payment successful with method:', paymentMethodId);
        
        // Em produção, chamar backend para confirmar pagamento
        // await customerService.confirmPayment(order.id, paymentMethodId);
        
        // Navegar para tela de confirmação
        navigate('/payment-success', { state: { orderId: order?.id } });
    };

    const handlePaymentError = (error: string) => {
        console.error('Payment error:', error);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background-dark flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="min-h-screen bg-background-dark flex items-center justify-center p-4">
                <div className="bg-surface-dark rounded-xl p-6 max-w-md w-full">
                    <p className="text-white text-center">Ordem não encontrada</p>
                    <button
                        onClick={() => navigate('/home')}
                        className="w-full mt-4 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-light transition-colors"
                    >
                        Voltar
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background-dark">
            {/* Header */}
            <header className="px-4 pt-6 pb-4 border-b border-white/5 flex items-center gap-4 sticky top-0 bg-background-dark z-10">
                <button
                    onClick={() => navigate(-1)}
                    className="flex size-10 items-center justify-center rounded-full hover:bg-surface-dark transition-colors"
                >
                    <span className="material-symbols-outlined text-white">arrow_back</span>
                </button>
                <h1 className="text-lg font-bold text-white">Pagamento do Serviço</h1>
            </header>

            <main className="px-4 py-6 max-w-2xl mx-auto">
                {/* Order Summary */}
                <div className="bg-surface-dark rounded-xl p-5 mb-6 border border-white/10">
                    <div className="flex items-start gap-4 mb-4">
                        <img
                            src={order.technician.avatar || 'https://i.pravatar.cc/150?img=12'}
                            alt={order.technician.name}
                            className="w-12 h-12 rounded-full"
                        />
                        <div className="flex-1">
                            <p className="text-white font-semibold">{order.title}</p>
                            <p className="text-sm text-gray-400">Por {order.technician.name}</p>
                            <p className="text-xs text-gray-500 mt-1">{order.orderNumber}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-gray-500">Total</p>
                            <p className="text-2xl font-bold text-primary">
                                R$ {order.totalAmount.toFixed(2)}
                            </p>
                        </div>
                    </div>

                    <div className="border-t border-white/10 pt-4">
                        <div className="flex items-center gap-2 text-sm">
                            <span className="material-symbols-outlined text-green-400 text-base">check_circle</span>
                            <span className="text-gray-300">Serviço concluído em {new Date(order.completedAt).toLocaleDateString('pt-BR')}</span>
                        </div>
                    </div>
                </div>

                {/* Payment Section */}
                <div className="bg-surface-dark rounded-xl p-5 mb-6 border border-white/10">
                    <h2 className="text-lg font-bold text-white mb-4">Método de Pagamento</h2>
                    
                    <Elements stripe={stripePromise}>
                        <PaymentFormInner
                            order={order}
                            onSuccess={handlePaymentSuccess}
                            onError={handlePaymentError}
                        />
                    </Elements>
                </div>

                {/* Security Info */}
                <div className="flex items-center justify-center gap-2 text-gray-500 text-xs">
                    <span className="material-symbols-outlined text-sm">lock</span>
                    <span>Pagamento seguro processado via Stripe</span>
                </div>
            </main>
        </div>
    );
};

interface PaymentFormInnerProps {
    order: ServiceOrderDetails;
    onSuccess: (paymentMethodId: string) => void;
    onError: (error: string) => void;
}

const PaymentFormInner: React.FC<PaymentFormInnerProps> = ({ order, onSuccess, onError }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<'new-card' | 'saved-card'>('saved-card');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        setProcessing(true);
        setError(null);

        try {
            if (paymentMethod === 'new-card') {
                const cardElement = elements.getElement(CardElement);
                if (!cardElement) {
                    throw new Error('Elemento de cartão não encontrado');
                }

                const { error: stripeError, paymentMethod: pm } = await stripe.createPaymentMethod({
                    type: 'card',
                    card: cardElement,
                });

                if (stripeError) {
                    throw new Error(stripeError.message);
                }

                if (pm) {
                    onSuccess(pm.id);
                }
            } else {
                onSuccess('saved-card-id');
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Erro ao processar pagamento';
            setError(errorMessage);
            onError(errorMessage);
        } finally {
            setProcessing(false);
        }
    };

    const cardElementOptions = {
        style: {
            base: {
                fontSize: '16px',
                color: '#ffffff',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                '::placeholder': {
                    color: '#9ca3af',
                },
            },
            invalid: {
                color: '#ef4444',
            },
        },
        hidePostalCode: true,
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-3">
                <button
                    type="button"
                    onClick={() => setPaymentMethod('saved-card')}
                    className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                        paymentMethod === 'saved-card'
                            ? 'bg-primary/20 border-primary'
                            : 'bg-background-dark border-white/10 hover:border-white/20'
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-7 rounded bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-xs font-bold text-gray-900">
                                VISA
                            </div>
                            <div>
                                <p className="text-white font-medium">Visa •••• 4242</p>
                                <p className="text-xs text-gray-400">Expira 12/24</p>
                            </div>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            paymentMethod === 'saved-card' ? 'border-primary' : 'border-gray-600'
                        }`}>
                            {paymentMethod === 'saved-card' && (
                                <div className="w-3 h-3 rounded-full bg-primary"></div>
                            )}
                        </div>
                    </div>
                </button>

                <button
                    type="button"
                    onClick={() => setPaymentMethod('new-card')}
                    className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                        paymentMethod === 'new-card'
                            ? 'bg-primary/20 border-primary'
                            : 'bg-background-dark border-white/10 hover:border-white/20'
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-white">add_card</span>
                            <p className="text-white font-medium">Novo Cartão</p>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            paymentMethod === 'new-card' ? 'border-primary' : 'border-gray-600'
                        }`}>
                            {paymentMethod === 'new-card' && (
                                <div className="w-3 h-3 rounded-full bg-primary"></div>
                            )}
                        </div>
                    </div>
                </button>
            </div>

            {paymentMethod === 'new-card' && (
                <div className="bg-background-dark rounded-xl p-4 border border-white/10">
                    <CardElement options={cardElementOptions} />
                </div>
            )}

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                    <p className="text-red-400 text-sm">{error}</p>
                </div>
            )}

            <button
                type="submit"
                disabled={!stripe || processing}
                className={`
                    w-full py-4 px-4 rounded-xl font-bold text-lg transition-all
                    ${processing || !stripe
                        ? 'bg-gray-600 cursor-not-allowed text-white'
                        : 'bg-primary text-white hover:bg-primary-light active:scale-[0.98] shadow-lg shadow-primary/30'
                    }
                `}
            >
                {processing ? (
                    <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-[#0B242A]"></div>
                        <span>Processando...</span>
                    </div>
                ) : (
                    <div className="flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined">lock</span>
                        <span>Pagar R$ {order.totalAmount.toFixed(2)}</span>
                    </div>
                )}
            </button>
        </form>
    );
};

export default ServicePayment;
