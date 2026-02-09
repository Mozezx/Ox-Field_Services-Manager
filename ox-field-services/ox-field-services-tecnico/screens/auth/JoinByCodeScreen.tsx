import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Screen where the technician pastes the invite code (UUID) received from the company.
 * Redirects to /join?token=UUID to reuse the "Join the team" flow.
 */
export const JoinByCodeScreen: React.FC = () => {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmed = code.trim();
    if (!trimmed) {
      setError('Enter the invite code.');
      return;
    }
    // Redirect to join screen with token in URL; it validates and shows the company
    navigate(`/join?token=${encodeURIComponent(trimmed)}`);
  };

  return (
    <div className="min-h-screen bg-bg-dark flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.05] bg-[url('https://picsum.photos/id/20/1000/1000')] bg-cover mix-blend-overlay" />
      <div className="relative z-10 w-full max-w-lg">
        <div className="flex flex-col items-center mb-10">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-secondary/20 rounded-2xl blur-lg" />
            <div className="relative w-24 h-24 bg-gradient-to-br from-primary to-[#0f2e36] rounded-2xl flex items-center justify-center shadow-2xl border border-white/10">
              <span className="material-symbols-outlined text-5xl text-white filled">vpn_key</span>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white text-center">Invite code</h1>
          <p className="text-slate-400 text-center mt-4">
            Paste the code (UUID) your company sent you to register and start receiving service orders.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2 ml-1">Invite code</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Ex: 550e8400-e29b-41d4-a716-446655440000"
              className="block w-full rounded-lg border-0 py-4 px-4 text-white bg-[#1e2325] ring-1 ring-inset ring-slate-700 placeholder:text-slate-600 focus:ring-2 focus:ring-inset focus:ring-secondary font-mono text-sm"
              autoComplete="off"
            />
          </div>
          <button
            type="submit"
            className="w-full h-14 rounded-full bg-white text-primary text-base font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
          >
            Continue
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>
        </form>

        <button
          type="button"
          onClick={() => navigate('/login')}
          className="w-full mt-6 text-slate-400 text-sm hover:text-white transition-colors"
        >
          Back to login
        </button>
      </div>
    </div>
  );
};
