import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getTenantByDomain, getTenantByInviteToken } from '../../services/auth';

export const INVITE_TENANT_KEY = 'invite_tenant_domain';
export const INVITE_TOKEN_KEY = 'invite_token';

export const JoinByLinkScreen: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const domain = searchParams.get('domain');

  const [tenantName, setTenantName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token && token.trim()) {
      let cancelled = false;
      getTenantByInviteToken(token)
        .then((data) => {
          if (!cancelled) {
            setTenantName(data.name);
            setError(null);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setError('Invalid or expired link.');
          }
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
      return () => { cancelled = true; };
    }
    if (domain && domain.trim()) {
      let cancelled = false;
      getTenantByDomain(domain)
        .then((data) => {
          if (!cancelled) {
            setTenantName(data.name);
            setError(null);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setError('Invalid or expired link.');
          }
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
      return () => { cancelled = true; };
    }
    setLoading(false);
  }, [token, domain]);

  const handleGoToRegister = () => {
    if (token?.trim()) {
      sessionStorage.setItem(INVITE_TOKEN_KEY, token.trim());
      sessionStorage.removeItem(INVITE_TENANT_KEY);
      navigate('/register');
      return;
    }
    if (domain?.trim()) {
      sessionStorage.setItem(INVITE_TENANT_KEY, domain.trim());
      sessionStorage.removeItem(INVITE_TOKEN_KEY);
      navigate('/register');
    }
  };

  if ((!token || !token.trim()) && (!domain || !domain.trim())) {
    navigate('/login', { replace: true });
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-dark flex flex-col items-center justify-center p-6">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-bg-dark flex flex-col items-center justify-center p-6">
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 max-w-md text-center">
          <p className="text-red-400 font-medium mb-4">{error}</p>
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="rounded-lg bg-white text-primary px-4 py-2 font-semibold"
          >
            Go to login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-dark flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.05] bg-[url('https://picsum.photos/id/20/1000/1000')] bg-cover mix-blend-overlay" />
      <div className="relative z-10 w-full max-w-lg">
        <div className="flex flex-col items-center mb-10">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-secondary/20 rounded-2xl blur-lg" />
            <div className="relative w-24 h-24 bg-gradient-to-br from-primary to-[#0f2e36] rounded-2xl flex items-center justify-center shadow-2xl border border-white/10">
              <span className="material-symbols-outlined text-5xl text-white filled">group_add</span>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white text-center">Join the team</h1>
          <p className="text-slate-400 text-center mt-4">
            You are joining <span className="text-white font-semibold">{tenantName}</span>.
            After registering you will be able to receive service orders once approved.
          </p>
        </div>
        <button
          type="button"
          onClick={handleGoToRegister}
          className="w-full h-14 rounded-full bg-white text-primary text-base font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
        >
          Register
          <span className="material-symbols-outlined">arrow_forward</span>
        </button>
        <button
          type="button"
          onClick={() => navigate('/login')}
          className="w-full mt-4 text-slate-400 text-sm hover:text-white transition-colors"
        >
          Already have an account – log in
        </button>
      </div>
    </div>
  );
};

export const INVITE_TENANT_STORAGE_KEY = INVITE_TENANT_KEY;
