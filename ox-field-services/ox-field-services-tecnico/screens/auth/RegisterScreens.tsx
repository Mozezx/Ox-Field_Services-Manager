import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, RegisterTechnicianRequest } from '../../services/auth';
import { INVITE_TENANT_STORAGE_KEY, INVITE_TOKEN_KEY } from './JoinByLinkScreen';

/**
 * Single-step registration: email and password only. Invite code is optional and can be added later.
 * Invite code can be pre-filled from join-by-code or join-by-link when present.
 */
export const RegisterScreen: React.FC = () => {
  const navigate = useNavigate();
  const [inviteCode, setInviteCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Pre-fill invite code from session when coming from join-by-link or join-by-code
  useEffect(() => {
    const token = sessionStorage.getItem(INVITE_TOKEN_KEY)?.trim();
    if (token) setInviteCode(token);
  }, []);

  const isValidEmail = (value: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) {
      setError('Enter your email.');
      return;
    }
    if (!isValidEmail(email)) {
      setError('Enter a valid email address (e.g. name@company.com).');
      return;
    }
    if (!password.trim()) {
      setError('Enter your password.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    try {
      const tenantDomain = sessionStorage.getItem(INVITE_TENANT_STORAGE_KEY)?.trim();
      const code = inviteCode.trim();
      const registerData: RegisterTechnicianRequest = {
        email: email.trim(),
        password,
        name: email.trim().split('@')[0] || 'User',
        ...(code ? { inviteToken: code } : {}),
        ...(tenantDomain ? { tenantDomain } : {})
      };
      await authService.register(registerData);
      sessionStorage.removeItem(INVITE_TOKEN_KEY);
      sessionStorage.removeItem(INVITE_TENANT_STORAGE_KEY);
      navigate('/login');
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-dark flex flex-col p-6">
      <header className="flex items-center mb-6">
        <button onClick={() => navigate('/')} className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-white/10 text-white">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
      </header>

      <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
        <h1 className="text-3xl font-bold leading-tight tracking-tight mb-2 text-white">Register</h1>
        <p className="text-slate-400 mb-8">Enter your email and password. You can add an invite code later to link to a company.</p>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-300 ml-1">Invite code (optional)</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <span className="material-symbols-outlined text-slate-500">vpn_key</span>
              </div>
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                className="block w-full rounded-lg border border-slate-700 bg-surface-dark text-white pl-11 pr-4 py-3.5 focus:border-secondary focus:ring-secondary font-mono text-sm"
                placeholder="You can add later to link to a company"
                autoComplete="off"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-300 ml-1">Email *</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <span className="material-symbols-outlined text-slate-500">mail</span>
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full rounded-lg border border-slate-700 bg-surface-dark text-white pl-11 pr-4 py-3.5 focus:border-secondary focus:ring-secondary"
                placeholder="your@email.com"
                autoComplete="email"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-300 ml-1">Password *</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <span className="material-symbols-outlined text-slate-500">lock</span>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full rounded-lg border border-slate-700 bg-surface-dark text-white pl-11 pr-4 py-3.5 focus:border-secondary focus:ring-secondary"
                placeholder="At least 8 characters"
                autoComplete="new-password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-14 rounded-full bg-secondary text-primary text-base font-bold mt-6 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <span className="material-symbols-outlined animate-spin-cw">progress_activity</span>
                Registering...
              </>
            ) : (
              <>
                Register <span className="material-symbols-outlined">arrow_forward</span>
              </>
            )}
          </button>
        </form>

        <button
          type="button"
          onClick={() => navigate('/login')}
          className="w-full mt-6 text-slate-400 text-sm hover:text-white transition-colors"
        >
          Already have an account – log in
        </button>
      </div>
    </div>
  );
};

export const ApprovalScreen: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-bg-dark flex flex-col items-center justify-center p-6 text-center">
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-secondary/20 rounded-full blur-2xl transform scale-150 opacity-50"></div>
        <div className="relative size-32 rounded-full bg-[#1e282b] border-4 border-[#2b3436] flex items-center justify-center shadow-xl">
          <span className="material-symbols-outlined text-6xl text-white animate-pulse">pending</span>
        </div>
      </div>
      <h1 className="text-3xl font-bold text-white mb-3">Awaiting Approval</h1>
      <p className="text-slate-400 max-w-xs mb-8">Your registration was successful. You will receive an email once activated.</p>
      <button onClick={() => navigate('/login')} className="text-slate-400 hover:text-white underline">Back to Login</button>
    </div>
  );
};
