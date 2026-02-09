import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { customerService } from '../services/customer';

export const JoinByToken = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useApp();
  const [loading, setLoading] = useState(true);
  const [invalid, setInvalid] = useState(false);
  const [tenantName, setTenantName] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joinSuccess, setJoinSuccess] = useState<string | null>(null);

  const returnUrl = token ? `/join/${token}` : '/home';

  useEffect(() => {
    if (!token) {
      setInvalid(true);
      setLoading(false);
      return;
    }

    const run = async () => {
      if (isAuthenticated) {
        setJoining(true);
        setJoinError(null);
        try {
          const result = await customerService.joinCompanyByToken(token);
          setJoinSuccess(result.companyName);
          setTimeout(() => navigate('/home', { replace: true }), 2000);
          return;
        } catch {
          setJoinError('Link already used or invalid.');
        } finally {
          setJoining(false);
        }
        return;
      }

      try {
        setLoading(true);
        const info = await customerService.getJoinByToken(token);
        setTenantName(info.name);
        setInvalid(false);
      } catch {
        setInvalid(true);
        setTenantName(null);
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

  if (loading || joining) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="flex flex-col items-center gap-3">
          <span className="material-symbols-outlined animate-spin text-4xl text-primary dark:text-white">progress_activity</span>
          <p className="text-primary/70 dark:text-white/70">{joining ? 'Joining company...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  if (joinSuccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background-light dark:bg-background-dark">
        <span className="material-symbols-outlined text-5xl text-green-500 mb-4">check_circle</span>
        <h1 className="text-xl font-bold text-primary dark:text-white text-center mb-2">You are now a client of {joinSuccess}</h1>
        <p className="text-primary/70 dark:text-white/70 text-center mb-6">
          Redirecting to home...
        </p>
      </div>
    );
  }

  if (invalid || joinError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background-light dark:bg-background-dark">
        <span className="material-symbols-outlined text-5xl text-red-500 mb-4">link_off</span>
        <h1 className="text-xl font-bold text-primary dark:text-white text-center mb-2">Invalid or expired link</h1>
        <p className="text-primary/70 dark:text-white/70 text-center mb-6">
          {joinError || 'This link is invalid or has already been used.'}
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

  if (tenantName) {
    return (
      <div className="min-h-screen flex flex-col p-6 bg-background-light dark:bg-background-dark">
        <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
          <h1 className="text-xl font-bold text-primary dark:text-white mb-2">
            Sign up or log in to become a client of {tenantName}
          </h1>
          <p className="text-primary/70 dark:text-white/70 mb-6">
            By signing in or creating an account, you will be linked to this company and can receive service orders.
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
