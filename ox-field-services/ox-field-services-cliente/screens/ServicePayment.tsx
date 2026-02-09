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
    serviceDate?: string;
    serviceTime?: string;
    address?: string;
}

const PaymentFormInner: React.FC<{
    order: ServiceOrderDetails;
    onSuccess: (paymentMethodId: string) => void;
    onError: (error: string) => void;
}> = ({ order, onSuccess, onError }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<'new-card' | 'saved-card'>('saved-card');
    const [instructions, setInstructions] = useState('');

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
                    throw new Error('Card element not found');
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
            const errorMessage = err instanceof Error ? err.message : 'Payment processing error';
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
                color: '#0a2329',
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

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return 'TBD';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const formatTime = (timeStr?: string) => {
        if (!timeStr) return 'TBD';
        const [hours, minutes] = timeStr.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12;
        return `${hour12}:${minutes || '00'} ${ampm}`;
    };

    // Calculate breakdown
    const serviceFee = order.totalAmount * 0.7;
    const materials = order.totalAmount * 0.2;
    const taxes = order.totalAmount * 0.1;

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            {/* Service Card */}
            <div className="bg-surface-light dark:bg-surface-dark p-4 rounded-lg shadow-soft border border-gray-100 dark:border-gray-800 flex flex-col gap-4">
                <div className="flex gap-4">
                    <div 
                        className="w-24 h-24 shrink-0 rounded-lg bg-center bg-cover bg-no-repeat shadow-inner"
                        style={{
                            backgroundImage: `url("https://picsum.photos/200/200?random=${order.id}")`
                        }}
                    ></div>
                    <div className="flex flex-col flex-1 justify-center gap-1">
                        <span className="inline-flex items-center w-fit px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary dark:bg-white/10 dark:text-white mb-1">
                            Home Service
                        </span>
                        <h3 className="text-primary dark:text-white font-bold text-lg leading-snug">{order.title}</h3>
                        <div className="flex items-center gap-1.5 mt-1">
                            <span className="material-symbols-outlined text-text-secondary dark:text-gray-400 text-[16px]">verified_user</span>
                            <p className="text-text-secondary dark:text-gray-400 text-xs font-medium">Ox Certified Pro</p>
                        </div>
                    </div>
                </div>
                <div className="h-px bg-gray-100 dark:bg-gray-800 w-full"></div>
                <div className="flex flex-col gap-3">
                    <div className="flex items-start gap-3">
                        <div className="size-8 rounded-full bg-background-light dark:bg-background-dark flex items-center justify-center shrink-0 text-primary dark:text-white">
                            <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                        </div>
                        <div>
                            <p className="text-xs text-text-secondary dark:text-gray-400 font-medium uppercase tracking-wide">Date & Time</p>
                            <p className="text-sm font-semibold text-primary dark:text-white">
                                {formatDate(order.serviceDate)} • {formatTime(order.serviceTime)}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="size-8 rounded-full bg-background-light dark:bg-background-dark flex items-center justify-center shrink-0 text-primary dark:text-white">
                            <span className="material-symbols-outlined text-[18px]">location_on</span>
                        </div>
                        <div>
                            <p className="text-xs text-text-secondary dark:text-gray-400 font-medium uppercase tracking-wide">Location</p>
                            <p className="text-sm font-semibold text-primary dark:text-white">{order.address || 'Service Address'}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Payment Method */}
            <div className="flex flex-col gap-3">
                <h3 className="text-lg font-bold text-primary dark:text-white px-1">Payment Method</h3>
                <div className="space-y-3">
                    <button
                        type="button"
                        onClick={() => setPaymentMethod('saved-card')}
                        className={`w-full bg-surface-light dark:bg-surface-dark p-4 rounded-lg shadow-soft border transition-all text-left ${
                            paymentMethod === 'saved-card'
                                ? 'border-primary/30 hover:border-primary/30'
                                : 'border-gray-100 dark:border-gray-800 hover:border-primary/30'
                        }`}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                {/* Mastercard Icon */}
                                <div className="w-12 h-8 bg-[#1a1f36] rounded border border-white/10 relative overflow-hidden flex items-center justify-center shadow-sm">
                                    <div className="absolute left-2 w-5 h-5 bg-[#eb001b] rounded-full opacity-90 mix-blend-screen"></div>
                                    <div className="absolute right-2 w-5 h-5 bg-[#f79e1b] rounded-full opacity-90 mix-blend-screen"></div>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-primary dark:text-white font-bold text-sm">Mastercard •••• 5678</span>
                                    <span className="text-text-secondary dark:text-gray-400 text-xs">Expires 12/25</span>
                                </div>
                            </div>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                paymentMethod === 'saved-card' ? 'border-primary' : 'border-gray-300 dark:border-gray-600'
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
                        className={`w-full bg-surface-light dark:bg-surface-dark p-4 rounded-lg shadow-soft border transition-all text-left ${
                            paymentMethod === 'new-card'
                                ? 'border-primary/30 hover:border-primary/30'
                                : 'border-gray-100 dark:border-gray-800 hover:border-primary/30'
                        }`}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <span className="material-symbols-outlined text-primary dark:text-white text-[24px]">add_card</span>
                                <span className="text-primary dark:text-white font-bold text-sm">Add New Card</span>
                            </div>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                paymentMethod === 'new-card' ? 'border-primary' : 'border-gray-300 dark:border-gray-600'
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
                    <div className="bg-surface-light dark:bg-surface-dark p-4 rounded-lg shadow-soft border border-gray-100 dark:border-gray-800 mt-3">
                        <div className="bg-background-light dark:bg-background-dark rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                            <CardElement options={cardElementOptions} />
                        </div>
                    </div>
                )}
            </div>

            {/* Additional Notes */}
            <div className="flex flex-col gap-3">
                <h3 className="text-lg font-bold text-primary dark:text-white px-1">Instructions</h3>
                <div className="bg-surface-light dark:bg-surface-dark p-1 rounded-lg shadow-soft border border-gray-100 dark:border-gray-800 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                    <div className="flex items-center px-3">
                        <span className="material-symbols-outlined text-text-secondary dark:text-gray-400">description</span>
                        <input
                            value={instructions}
                            onChange={(e) => setInstructions(e.target.value)}
                            className="w-full bg-transparent border-none text-primary dark:text-white placeholder-text-secondary/60 dark:placeholder-gray-500 focus:ring-0 py-3 text-sm"
                            placeholder="Add gate code or instructions (Optional)"
                            type="text"
                        />
                    </div>
                </div>
            </div>

            {/* Price Breakdown */}
            <div className="flex flex-col gap-3">
                <h3 className="text-lg font-bold text-primary dark:text-white px-1">Price Breakdown</h3>
                <div className="bg-surface-light dark:bg-surface-dark p-5 rounded-lg shadow-soft border border-gray-100 dark:border-gray-800 flex flex-col gap-3">
                    <div className="flex justify-between items-center text-sm group">
                        <span className="text-text-secondary dark:text-gray-400 group-hover:text-primary transition-colors">Service Fee</span>
                        <span className="text-primary dark:text-white font-medium">${serviceFee.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm group">
                        <span className="text-text-secondary dark:text-gray-400 group-hover:text-primary transition-colors">Materials (Est.)</span>
                        <span className="text-primary dark:text-white font-medium">${materials.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm group">
                        <span className="text-text-secondary dark:text-gray-400 group-hover:text-primary transition-colors">Taxes & Fees</span>
                        <span className="text-primary dark:text-white font-medium">${taxes.toFixed(2)}</span>
                    </div>
                    <div className="my-2 border-t border-dashed border-gray-200 dark:border-gray-700"></div>
                    <div className="flex justify-between items-center">
                        <span className="text-lg font-bold text-primary dark:text-white">Total</span>
                        <span className="text-xl font-extrabold text-primary dark:text-white">${order.totalAmount.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                    <p className="text-red-400 text-sm">{error}</p>
                </div>
            )}
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
            // In production, load from backend:
            // const data = await customerService.getOrder(orderId);
            
            // Example data
            setOrder({
                id: orderId || '123',
                orderNumber: 'OS-2026-001',
                title: 'Residential Electrical Repair',
                description: 'Electrical service repair',
                totalAmount: 177.50,
                technician: {
                    name: 'John Doe',
                    avatar: 'https://i.pravatar.cc/150?img=12',
                },
                completedAt: new Date().toISOString(),
                serviceDate: new Date().toISOString(),
                serviceTime: '10:00',
                address: '123 Maple Drive, Springfield',
            });
        } catch (err) {
            console.error('Error loading order:', err);
        } finally {
            setLoading(false);
        }
    };

    const handlePaymentSuccess = async (paymentMethodId: string) => {
        console.log('Payment successful with method:', paymentMethodId);
        
        // In production, call backend to confirm payment
        // await customerService.confirmPayment(order?.id, paymentMethodId);
        
        // Navigate to success screen
        navigate('/payment-success', { state: { orderId: order?.id } });
    };

    const handlePaymentError = (error: string) => {
        console.error('Payment error:', error);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center p-4">
                <div className="bg-surface-light dark:bg-surface-dark rounded-xl p-6 max-w-md w-full">
                    <p className="text-primary dark:text-white text-center">Order not found</p>
                    <button
                        onClick={() => navigate('/home')}
                        className="w-full mt-4 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-hover transition-colors"
                    >
                        Back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-background-light dark:bg-background-dark text-text-main dark:text-white font-display antialiased flex flex-col min-h-screen selection:bg-primary selection:text-white">
            {/* Top App Bar */}
            <header className="sticky top-0 z-50 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md px-4 py-4 flex items-center justify-between border-b border-transparent transition-colors duration-200">
                <button
                    onClick={() => navigate(-1)}
                    aria-label="Go back"
                    className="flex size-10 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all text-text-main dark:text-white group"
                >
                    <span className="material-symbols-outlined group-hover:-translate-x-0.5 transition-transform">arrow_back</span>
                </button>
                <h1 className="text-lg font-bold text-text-main dark:text-white tracking-tight">Checkout</h1>
                <div className="size-10"></div>
            </header>

            {/* Main Content */}
            <main className="flex-1 w-full max-w-lg mx-auto px-4 pb-32 pt-2 flex flex-col gap-6">
                {/* Headline */}
                <div>
                    <h2 className="text-2xl font-extrabold text-primary dark:text-white tracking-tight leading-tight">Booking Summary</h2>
                    <p className="text-text-secondary dark:text-gray-400 text-sm mt-1">Review your service details before payment.</p>
                </div>

                <Elements stripe={stripePromise}>
                    <PaymentFormInner
                        order={order}
                        onSuccess={handlePaymentSuccess}
                        onError={handlePaymentError}
                    />
                </Elements>
            </main>

            {/* Sticky Footer */}
            <div className="fixed bottom-0 left-0 right-0 z-40 bg-surface-light/90 dark:bg-surface-dark/95 backdrop-blur-xl border-t border-gray-200/50 dark:border-gray-800 p-4 pb-8 shadow-[0_-8px_30px_rgba(0,0,0,0.08)]">
                <div className="max-w-lg mx-auto w-full flex flex-col gap-3">
                    <div className="flex items-center justify-center gap-1.5 text-xs text-text-secondary dark:text-gray-400 opacity-80">
                        <span className="material-symbols-outlined text-[14px] fill-current">lock</span>
                        <span className="font-medium">Payments are secure and encrypted</span>
                    </div>
                    <button
                        onClick={(e) => {
                            const form = e.currentTarget.closest('form') || document.querySelector('form');
                            if (form) {
                                form.requestSubmit();
                            }
                        }}
                        disabled={!stripePromise}
                        className="w-full bg-primary hover:bg-primary-hover active:scale-[0.98] transition-all duration-200 text-white font-bold text-lg h-14 rounded-lg shadow-lg shadow-primary/25 flex items-center justify-between px-6 group disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <span>Confirm and Pay</span>
                        <span className="bg-white/10 px-2 py-1 rounded text-base font-semibold group-hover:bg-white/20 transition-colors">
                            ${order.totalAmount.toFixed(2)}
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ServicePayment;
