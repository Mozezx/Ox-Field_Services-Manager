import React, { useState } from 'react';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { stripePromise } from '../services/stripe';

interface CheckoutFormProps {
    amount: number;
    onSuccess: (paymentMethodId: string) => void;
    onError: (error: string) => void;
    buttonText?: string;
}

const CheckoutForm: React.FC<CheckoutFormProps> = ({ amount, onSuccess, onError, buttonText = 'Pagar' }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        setProcessing(true);
        setError(null);

        const cardElement = elements.getElement(CardElement);
        if (!cardElement) {
            setError('Elemento de cartão não encontrado');
            setProcessing(false);
            return;
        }

        try {
            // Criar Payment Method
            const { error: stripeError, paymentMethod } = await stripe.createPaymentMethod({
                type: 'card',
                card: cardElement,
            });

            if (stripeError) {
                setError(stripeError.message || 'Erro ao processar cartão');
                onError(stripeError.message || 'Erro ao processar cartão');
                setProcessing(false);
                return;
            }

            if (paymentMethod) {
                onSuccess(paymentMethod.id);
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
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
                '::placeholder': {
                    color: '#9ca3af',
                },
                backgroundColor: 'transparent',
            },
            invalid: {
                color: '#ef4444',
            },
        },
        hidePostalCode: true,
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-surface-dark rounded-lg p-4 border border-border">
                <CardElement options={cardElementOptions} />
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                    <p className="text-red-400 text-sm">{error}</p>
                </div>
            )}

            <button
                type="submit"
                disabled={!stripe || processing}
                className={`
                    w-full py-3 px-4 rounded-lg font-semibold transition-all
                    ${processing 
                        ? 'bg-gray-600 cursor-not-allowed' 
                        : 'bg-primary text-[#0B242A] hover:bg-primary-hover shadow-lg shadow-primary/20'
                    }
                `}
            >
                {processing ? (
                    <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-[#0B242A]"></div>
                        <span>Processando...</span>
                    </div>
                ) : (
                    `${buttonText} R$ ${amount.toFixed(2)}`
                )}
            </button>
        </form>
    );
};

interface StripeCheckoutProps {
    amount: number;
    onSuccess: (paymentMethodId: string) => void;
    onError: (error: string) => void;
    buttonText?: string;
}

export const StripeCheckout: React.FC<StripeCheckoutProps> = (props) => {
    return (
        <Elements stripe={stripePromise}>
            <CheckoutForm {...props} />
        </Elements>
    );
};
