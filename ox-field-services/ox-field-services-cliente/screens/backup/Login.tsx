import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';

export const Login = () => {
  const { login, register, loginError, isLoading } = useApp();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');

  const handleEmailLogin = async () => {
    if (!email || !password) {
      setError('Please enter email and password');
      return;
    }

    try {
      setError('');
      await login(email, password);
      navigate('/home');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    }
  };

  const handleRegister = async () => {
    if (!name || !email || !password || !phone) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setError('');
      await register(name, email, password, phone);
      navigate('/home');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    }
  };

  const handleSocialLogin = () => {
    // Social login would be implemented here
    // For now, just show the email form
    setMode('login');
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col justify-between bg-background-dark">
      <div className="flex-1 flex flex-col items-center justify-end pb-8 pt-12 px-6">
        <div className="w-full max-w-[320px] aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl shadow-black/50 mb-8 relative bg-surface-dark border border-white/5">
          <img 
            src="https://picsum.photos/800/600?grayscale" 
            alt="Abstract building" 
            className="absolute inset-0 w-full h-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background-dark via-transparent to-transparent"></div>
        </div>

        <div className="flex flex-col items-center text-center max-w-sm mx-auto animate-slide-up">
          <div className="mb-4 h-14 w-14 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg shadow-black/20 ring-1 ring-white/10">
            <span className="material-symbols-outlined text-3xl text-accent">token</span>
          </div>
          <h1 className="text-white text-3xl md:text-4xl font-extrabold tracking-tight leading-tight mb-3">
            Welcome to Ox
          </h1>
          <p className="text-gray-400 text-base md:text-lg font-medium leading-relaxed">
            Transparency and control for your field service needs.
          </p>
        </div>
      </div>

      <div className="w-full bg-surface-dark rounded-t-[2.5rem] px-6 pb-10 pt-8 flex flex-col gap-5 max-w-md mx-auto shadow-[0_-10px_60px_-15px_rgba(0,0,0,0.6)] border-t border-white/5 animate-slide-up">
        
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        {mode === 'login' ? (
          <>
            <div className="flex flex-col gap-3 w-full">
              <div className="flex flex-col gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  className="w-full h-12 px-4 bg-[#25282a] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary"
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full h-12 px-4 bg-[#25282a] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary"
                />
              </div>

              <button 
                onClick={handleEmailLogin}
                disabled={isLoading}
                className="flex w-full items-center justify-center rounded-full h-14 px-6 bg-primary hover:bg-primary-light text-white shadow-lg shadow-primary/20 ring-1 ring-white/5 transition-all active:scale-[0.98] gap-3 disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="material-symbols-outlined text-[20px] animate-spin">progress_activity</span>
                ) : (
                  <span className="material-symbols-outlined text-[20px]">login</span>
                )}
                <span className="text-base font-bold tracking-wide">
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </span>
              </button>
            </div>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-white/10"></div>
              <span className="flex-shrink-0 mx-4 text-gray-500 text-xs font-semibold uppercase tracking-widest">Or</span>
              <div className="flex-grow border-t border-white/10"></div>
            </div>

            <div className="flex flex-col gap-3 w-full">
              <button onClick={handleSocialLogin} className="relative flex w-full items-center justify-center rounded-full h-14 px-6 bg-white hover:bg-gray-100 text-black transition-all active:scale-[0.98] shadow-md">
                <span className="text-base font-bold tracking-wide">Continue with Apple</span>
              </button>
              <button onClick={handleSocialLogin} className="relative flex w-full items-center justify-center rounded-full h-14 px-6 bg-[#25282a] border border-white/10 hover:bg-[#2e3235] text-white transition-all active:scale-[0.98]">
                <span className="text-base font-bold tracking-wide">Continue with Google</span>
              </button>
            </div>

            <div className="flex items-center justify-center pt-2">
              <p className="text-sm text-gray-400">
                Don't have an account?{' '}
                <span 
                  onClick={() => setMode('register')}
                  className="font-bold text-white cursor-pointer hover:underline"
                >
                  Create one
                </span>
              </p>
            </div>

            {/* Demo Credentials Hint */}
            <div className="p-3 bg-[#1a1c1e] rounded-lg border border-white/5">
              <p className="text-xs text-gray-500 text-center">
                Demo: <span className="text-gray-300 font-mono">client@demo.com</span> / <span className="text-gray-300 font-mono">password</span>
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-col gap-3 w-full">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full name"
                className="w-full h-12 px-4 bg-[#25282a] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary"
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                className="w-full h-12 px-4 bg-[#25282a] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary"
              />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone number"
                className="w-full h-12 px-4 bg-[#25282a] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary"
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create password"
                className="w-full h-12 px-4 bg-[#25282a] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary"
              />

              <button 
                onClick={handleRegister}
                disabled={isLoading}
                className="flex w-full items-center justify-center rounded-full h-14 px-6 bg-primary hover:bg-primary-light text-white shadow-lg shadow-primary/20 ring-1 ring-white/5 transition-all active:scale-[0.98] gap-3 disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="material-symbols-outlined text-[20px] animate-spin">progress_activity</span>
                ) : (
                  <span className="material-symbols-outlined text-[20px]">person_add</span>
                )}
                <span className="text-base font-bold tracking-wide">
                  {isLoading ? 'Creating account...' : 'Create Account'}
                </span>
              </button>
            </div>

            <div className="flex items-center justify-center pt-2">
              <p className="text-sm text-gray-400">
                Already have an account?{' '}
                <span 
                  onClick={() => setMode('login')}
                  className="font-bold text-white cursor-pointer hover:underline"
                >
                  Sign in
                </span>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
