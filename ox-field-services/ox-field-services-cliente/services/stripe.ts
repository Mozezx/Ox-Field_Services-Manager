import { loadStripe, Stripe } from '@stripe/stripe-js';

// Chave pública do Stripe (em produção, usar variável de ambiente)
const STRIPE_PUBLIC_KEY = import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_51234567890';

// Singleton: carrega o Stripe apenas uma vez
export const stripePromise: Promise<Stripe | null> = loadStripe(STRIPE_PUBLIC_KEY);

// Helper para formatar valores monetários para Stripe (centavos)
export const formatAmountForStripe = (amount: number): number => {
    return Math.round(amount * 100);
};

// Helper para formatar valores do Stripe (centavos) para exibição
export const formatAmountFromStripe = (amount: number): number => {
    return amount / 100;
};
