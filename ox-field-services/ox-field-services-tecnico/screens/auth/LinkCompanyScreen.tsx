import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/auth';

export const LinkCompanyScreen: React.FC = () => {
  const navigate = useNavigate();
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const code = inviteCode.trim();
    if (!code) {
      setError('Enter your invite code.');
      return;
    }

    setLoading(true);
    try {
      await authService.redeemInvite(code);
      navigate('/agenda', { replace: true });
    } catch (err: any) {
      console.error('Redeem invite error:', err);
      setError(err.response?.data?.message || 'Invalid or expired invite code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-dark flex flex-col p-6">
      <header className="flex items-center mb-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-white/10 text-white"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
      </header>

      <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
        <h1 className="text-3xl font-bold leading-tight tracking-tight mb-2 text-white">
          Link to company
        </h1>
        <p className="text-slate-400 mb-8">
          Enter the invite code you received from your company to link your account and access the agenda.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-300 ml-1">Invite code</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <span className="material-symbols-outlined text-slate-500">vpn_key</span>
              </div>
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                className="block w-full rounded-lg border border-slate-700 bg-surface-dark text-white pl-11 pr-4 py-3.5 focus:border-secondary focus:ring-secondary font-mono text-sm"
                placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
                autoComplete="off"
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
                Linking...
              </>
            ) : (
              <>
                Link to company <span className="material-symbols-outlined">arrow_forward</span>
              </>
            )}
          </button>
        </form>

        <button
          type="button"
          onClick={() => authService.logout()}
          className="w-full mt-6 text-slate-400 text-sm hover:text-white transition-colors"
        >
          Use another account
        </button>
      </div>
    </div>
  );
};
