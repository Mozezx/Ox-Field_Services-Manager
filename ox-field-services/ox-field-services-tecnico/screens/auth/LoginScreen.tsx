import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/auth';

const TENANT_DOMAIN_KEY = 'tech_login_tenant_domain';

const isValidEmail = (value: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

export const LoginScreen: React.FC = () => {
  const navigate = useNavigate();
  const [tenantDomain, setTenantDomain] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(TENANT_DOMAIN_KEY);
    if (saved) setTenantDomain(saved);
    else setTenantDomain('demo.oxfield.com');
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const domain = tenantDomain?.trim() || '';
    if (!email.trim()) {
      setError('Enter your email.');
      return;
    }
    if (!isValidEmail(email)) {
      setError('Enter a valid email address (e.g. name@company.com). The login uses your email, not a code or ID.');
      return;
    }
    setLoading(true);
    try {
      const response = await authService.login(email, password, domain);
      if (domain) localStorage.setItem(TENANT_DOMAIN_KEY, domain);
      // Technician without company (no tenantId) -> show link-company screen
      if (response.user?.role === 'TECNICO' && response.user?.tenantId == null) {
        navigate('/link-company');
      } else {
        navigate('/agenda');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      let errorMessage = err.response?.data?.message;
      if (err.response?.status === 400 && !errorMessage) {
        errorMessage = 'Validation error. Use your email address (e.g. name@company.com), not a code or ID.';
      }
      setError(errorMessage || 'Login failed. Check your email and password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-dark flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background patterns */}
      <div className="absolute inset-0 opacity-[0.05] bg-[url('https://picsum.photos/id/20/1000/1000')] bg-cover mix-blend-overlay"></div>
      
      <div className="relative z-10 w-full max-w-lg">
        <div className="flex flex-col items-center mb-10">
          <div className="relative mb-6 group cursor-pointer">
             <div className="absolute inset-0 bg-secondary/20 rounded-2xl blur-lg"></div>
             <div className="relative w-24 h-24 bg-gradient-to-br from-primary to-[#0f2e36] rounded-2xl flex items-center justify-center shadow-2xl border border-white/10">
                <span className="material-symbols-outlined text-5xl text-white filled">agriculture</span>
             </div>
          </div>
          <h1 className="text-3xl font-bold text-white text-center">Ox Field Services</h1>
          <div className="flex items-center gap-2 mt-2">
            <div className="h-px w-8 bg-slate-600"></div>
            <span className="text-xs font-bold tracking-[0.2em] text-slate-400 uppercase">Technician Portal</span>
            <div className="h-px w-8 bg-slate-600"></div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-300 ml-1">Company domain</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="material-symbols-outlined text-slate-500 group-focus-within:text-white transition-colors">domain</span>
              </div>
              <input
                type="text"
                value={tenantDomain}
                onChange={(e) => setTenantDomain(e.target.value)}
                placeholder="e.g. demo.oxfield.com or your company domain"
                className="block w-full rounded-lg border-0 py-4 pl-12 pr-4 text-white bg-[#1e2325] ring-1 ring-inset ring-slate-700 placeholder:text-slate-600 focus:ring-2 focus:ring-inset focus:ring-secondary sm:text-base shadow-sm transition-all"
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-300 ml-1">Email</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="material-symbols-outlined text-slate-500 group-focus-within:text-white transition-colors">badge</span>
              </div>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com" 
                required
                className="block w-full rounded-lg border-0 py-4 pl-12 pr-4 text-white bg-[#1e2325] ring-1 ring-inset ring-slate-700 placeholder:text-slate-600 focus:ring-2 focus:ring-inset focus:ring-secondary sm:text-base shadow-sm transition-all"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center ml-1">
              <label className="text-sm font-semibold text-slate-300">Password</label>
            </div>
            <div className="relative group">
               <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="material-symbols-outlined text-slate-500 group-focus-within:text-white transition-colors">lock</span>
              </div>
              <input 
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password" 
                required
                className="block w-full rounded-lg border-0 py-4 pl-12 pr-12 text-white bg-[#1e2325] ring-1 ring-inset ring-slate-700 placeholder:text-slate-600 focus:ring-2 focus:ring-inset focus:ring-secondary sm:text-base shadow-sm transition-all"
              />
               <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-500 hover:text-white"
               >
                <span className="material-symbols-outlined">{showPassword ? 'visibility_off' : 'visibility'}</span>
              </button>
            </div>
             <div className="flex justify-end">
              <a href="#" className="text-xs font-medium text-slate-400 hover:text-white underline underline-offset-4">Forgot Password?</a>
            </div>
          </div>

          <div className="mt-4 flex gap-3">
            <button 
              type="submit"
              disabled={loading}
              className="flex-1 rounded-lg bg-white text-primary px-4 py-4 text-base font-bold shadow-lg hover:bg-slate-100 uppercase tracking-wider transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined animate-spin-cw">progress_activity</span>
                  Logging in...
                </>
              ) : (
                <>
                  Log In
                  <span className="material-symbols-outlined text-sm font-bold">arrow_forward</span>
                </>
              )}
            </button>
            <button type="button" className="aspect-square h-auto rounded-lg bg-[#1e2325] p-3 text-white ring-1 ring-inset ring-slate-700 hover:bg-[#252b2d] active:scale-95 transition-all flex items-center justify-center">
               <span className="material-symbols-outlined text-2xl">face</span>
            </button>
          </div>
        </form>

        <div className="mt-8 flex flex-col items-center gap-2">
             <button onClick={() => navigate('/join-by-code')} className="text-sm text-slate-400 hover:text-white transition-colors">
                I have an <span className="text-secondary font-bold">invite code</span>
             </button>
             <button type="button" onClick={() => navigate('/register')} className="text-sm text-slate-400 hover:text-white transition-colors">
                New Technician? <span className="text-secondary font-bold">Create Account</span>
             </button>
        </div>

        <div className="mt-12 flex flex-col items-center gap-6 w-full">
          <button className="group flex items-center gap-3 px-5 py-3 rounded-full bg-[#1e2325]/50 border border-transparent hover:border-slate-700 transition-all">
            <div className="p-1.5 rounded-full bg-[#252b2d] shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
               <span className="material-symbols-outlined text-lg text-slate-400">headset_mic</span>
            </div>
            <span className="text-sm font-medium text-slate-400 group-hover:text-white">Contact Dispatch Support</span>
          </button>
          <div className="flex flex-col items-center gap-1 opacity-50">
            <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest">Version 2.4.1</p>
          </div>
        </div>

        {/* Demo Credentials Hint */}
        <div className="mt-4 p-3 bg-[#1e2325] rounded-lg border border-slate-700">
          <p className="text-xs text-slate-500 text-center">
            Demo: <span className="text-slate-300 font-mono">tech@demo.com</span> / <span className="text-slate-300 font-mono">password</span>
          </p>
        </div>
      </div>
    </div>
  );
};
