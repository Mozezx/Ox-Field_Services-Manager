import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { customerService, PublicOrderByToken } from '../services/customer';

export const OrderByToken = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useApp();
  const [loading, setLoading] = useState(true);
  const [invalid, setInvalid] = useState(false);
  const [orderInfo, setOrderInfo] = useState<PublicOrderByToken | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);

  const returnUrl = token ? `/order/${token}` : '/home';

  useEffect(() => {
    if (!token) {
      setInvalid(true);
      setLoading(false);
      return;
    }

    const run = async () => {
      if (isAuthenticated) {
        setClaiming(true);
        setClaimError(null);
        try {
          const order = await customerService.claimOrder(token);
          navigate(`/order/detail/${order.id}`, { replace: true });
          return;
        } catch {
          setClaimError('This order has already been claimed or the link is invalid.');
        } finally {
          setClaiming(false);
        }
        return;
      }

      try {
        setLoading(true);
        const info = await customerService.getOrderByToken(token);
        setOrderInfo(info);
        setInvalid(false);
      } catch {
        setInvalid(true);
        setOrderInfo(null);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [token, isAuthenticated, navigate]);

  const goToLogin = () => {
    navigate('/', { state: { returnUrl } });
  };

  const goToRegister = () => {
    navigate('/', { state: { returnUrl, mode: 'register' } });
  };

  if (loading || claiming) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="flex flex-col items-center gap-3">
          <span className="material-symbols-outlined animate-spin text-4xl text-primary dark:text-white">progress_activity</span>
          <p className="text-primary/70 dark:text-white/70">{claiming ? 'Claiming order...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  if (invalid || claimError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background-light dark:bg-background-dark">
        <span className="material-symbols-outlined text-5xl text-red-500 mb-4">link_off</span>
        <h1 className="text-xl font-bold text-primary dark:text-white text-center mb-2">Invalid or expired link</h1>
        <p className="text-primary/70 dark:text-white/70 text-center mb-6">
          {claimError || 'This link is invalid or the order has already been claimed by another account.'}
        </p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-3 bg-primary text-white dark:bg-white dark:text-primary font-semibold rounded-lg"
        >
          Go to home
        </button>
      </div>
    );
  }

  if (orderInfo) {
    return (
      <div className="min-h-screen flex flex-col p-6 bg-background-light dark:bg-background-dark">
        <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
          <h1 className="text-xl font-bold text-primary dark:text-white mb-2">
            Service order {orderInfo.orderNumber} – {orderInfo.title}
          </h1>
          <p className="text-primary/70 dark:text-white/70 mb-6">
            Sign in or create an account to view details and technician.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={goToLogin}
              className="flex-1 py-3 px-4 bg-primary text-white dark:bg-white dark:text-primary font-semibold rounded-lg"
            >
              Sign in
            </button>
            <button
              onClick={goToRegister}
              className="flex-1 py-3 px-4 border-2 border-primary dark:border-white text-primary dark:text-white font-semibold rounded-lg"
            >
              Create account
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
