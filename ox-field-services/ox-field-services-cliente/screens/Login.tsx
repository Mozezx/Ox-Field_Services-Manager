import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate, useLocation } from 'react-router-dom';

export const Login = () => {
  const { login, register, loginError, isLoading } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { returnUrl?: string; mode?: 'login' | 'register' } | undefined;
  const returnUrl = state?.returnUrl;
  const [mode, setMode] = useState<'login' | 'register'>(state?.mode ?? 'login');
  useEffect(() => {
    if (state?.mode) setMode(state.mode);
  }, [state?.mode]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordRegister, setShowPasswordRegister] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const handleEmailLogin = async () => {
    if (!email || !password) {
      setError('Please enter email and password');
      return;
    }

    try {
      setError('');
      await login(email, password);
      navigate(returnUrl || '/home', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Login failed');
    }
  };

  const handleRegister = async () => {
    if (!name || !email || !password || !phone) {
      setError('Please fill in all fields');
      return;
    }

    if (!termsAccepted) {
      setError('Please accept the Terms of Service and Privacy Policy');
      return;
    }

    try {
      setError('');
      await register(name, email, password, phone);
      navigate(returnUrl || '/home', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    }
  };

  const handleSocialLogin = () => {
    // Social login would be implemented here
    // For now, just show the email form
    setMode('login');
  };

  // Display error from context or local state
  const displayError = error || loginError;

  if (mode === 'register') {
    return (
      <div className="bg-white dark:bg-background-dark font-display antialiased text-primary dark:text-white transition-colors duration-200">
        <div className="relative flex h-full min-h-screen w-full flex-col overflow-x-hidden max-w-md mx-auto shadow-sm">
          {/* Header */}
          <header className="flex items-center justify-between px-4 py-4 bg-white dark:bg-background-dark z-10 sticky top-0">
            <button 
              onClick={() => setMode('login')}
              className="flex items-center justify-center size-10 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
            >
              <span className="material-symbols-outlined text-2xl text-primary dark:text-white">arrow_back_ios_new</span>
            </button>
            <div className="flex-1 text-center pr-10">
              <span className="text-sm font-semibold tracking-wide uppercase text-primary/60 dark:text-white/60">Register</span>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 flex flex-col px-6 pb-8 pt-2">
            {/* Headline */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold tracking-tight text-primary dark:text-white mb-2">Create Account</h1>
              <p className="text-primary/60 dark:text-white/60 text-base">Expert home maintenance at your fingertips.</p>
            </div>

            {/* Error Message */}
            {displayError && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">
                {displayError}
              </div>
            )}

            {/* Form Fields */}
            <div className="space-y-5">
              {/* Full Name */}
              <div className="group">
                <label className="block text-sm font-medium text-primary dark:text-white mb-2 ml-1">Full Name</label>
                <div className="relative">
                  <input 
                    className="w-full h-14 px-4 bg-background-light dark:bg-white/5 border border-transparent focus:border-primary/30 dark:focus:border-white/30 focus:bg-white dark:focus:bg-black/20 focus:ring-0 rounded-lg text-base text-primary dark:text-white placeholder-primary/40 dark:placeholder-white/30 transition-all outline-none" 
                    placeholder="e.g. Alex Johnson" 
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>

              {/* Email */}
              <div className="group">
                <label className="block text-sm font-medium text-primary dark:text-white mb-2 ml-1">Email Address</label>
                <div className="relative">
                  <input 
                    className="w-full h-14 px-4 bg-background-light dark:bg-white/5 border border-transparent focus:border-primary/30 dark:focus:border-white/30 focus:bg-white dark:focus:bg-black/20 focus:ring-0 rounded-lg text-base text-primary dark:text-white placeholder-primary/40 dark:placeholder-white/30 transition-all outline-none" 
                    placeholder="name@example.com" 
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="group">
                <label className="block text-sm font-medium text-primary dark:text-white mb-2 ml-1">Phone Number</label>
                <div className="relative flex items-center">
                  <div className="absolute left-4 flex items-center pointer-events-none">
                    <span className="text-primary/60 dark:text-white/60 text-base font-medium">+1</span>
                    <div className="h-4 w-[1px] bg-primary/20 dark:bg-white/20 mx-3"></div>
                  </div>
                  <input 
                    className="w-full h-14 pl-16 pr-4 bg-background-light dark:bg-white/5 border border-transparent focus:border-primary/30 dark:focus:border-white/30 focus:bg-white dark:focus:bg-black/20 focus:ring-0 rounded-lg text-base text-primary dark:text-white placeholder-primary/40 dark:placeholder-white/30 transition-all outline-none" 
                    placeholder="(555) 000-0000" 
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="group">
                <label className="block text-sm font-medium text-primary dark:text-white mb-2 ml-1">Password</label>
                <div className="relative">
                  <input 
                    className="w-full h-14 px-4 bg-background-light dark:bg-white/5 border border-transparent focus:border-primary/30 dark:focus:border-white/30 focus:bg-white dark:focus:bg-black/20 focus:ring-0 rounded-lg text-base text-primary dark:text-white placeholder-primary/40 dark:placeholder-white/30 transition-all outline-none pr-12" 
                    placeholder="Minimum 8 characters" 
                    type={showPasswordRegister ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPasswordRegister(!showPasswordRegister)}
                    className="absolute right-0 top-0 h-full w-12 flex items-center justify-center text-primary/40 dark:text-white/40 hover:text-primary dark:hover:text-white"
                  >
                    <span className="material-symbols-outlined text-xl">
                      {showPasswordRegister ? 'visibility' : 'visibility_off'}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Terms Checkbox */}
            <div className="mt-6 flex items-start gap-3">
              <div className="relative flex items-center pt-1">
                <input 
                  className="appearance-none bg-transparent m-0 font-inherit color-current w-5 h-5 border-2 border-primary/30 dark:border-white/30 rounded cursor-pointer focus:ring-0 focus:ring-offset-0 checked:bg-primary dark:checked:bg-white checked:border-primary dark:checked:border-white" 
                  id="terms" 
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  style={{
                    clipPath: termsAccepted ? 'polygon(14% 44%, 0 65%, 50% 100%, 100% 16%, 80% 0%, 43% 62%)' : 'none',
                    background: termsAccepted ? 'currentColor' : 'transparent'
                  }}
                />
              </div>
              <label className="text-sm leading-tight text-primary/70 dark:text-white/70 select-none cursor-pointer" htmlFor="terms">
                I agree to the <a className="font-semibold text-primary dark:text-white underline decoration-primary/30 underline-offset-2" href="#">Terms of Service</a> and <a className="font-semibold text-primary dark:text-white underline decoration-primary/30 underline-offset-2" href="#">Privacy Policy</a>.
              </label>
            </div>

            {/* Action Button */}
            <div className="mt-8">
              <button 
                onClick={handleRegister}
                disabled={isLoading}
                className="w-full h-14 bg-primary text-white font-bold text-lg rounded-lg shadow-lg shadow-primary/20 hover:bg-primary/90 dark:bg-white dark:text-primary dark:hover:bg-gray-100 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <span className="material-symbols-outlined animate-spin">progress_activity</span>
                    Creating Account...
                  </>
                ) : (
                  'Create Account'
                )}
              </button>
            </div>

            {/* Divider */}
            <div className="relative my-8">
              <div aria-hidden="true" className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-white/10"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white dark:bg-background-dark px-3 text-sm text-gray-400">Or continue with</span>
              </div>
            </div>

            {/* Social Login */}
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={handleSocialLogin}
                className="flex items-center justify-center h-14 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10 transition-colors"
              >
                <img alt="Google Logo" className="w-5 h-5" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBBRMAr-tzr61GzThRtgtvKOxKoxUjvejmeVWmTSGvk7c06Oy4tUulC2fc4ybCucjh5towyRt7nyrmIGTq-GUgRrGvTErqmKTbpDsU2eQCDNNlOb9KOfsycy1_1R0ZNIm8LffcPhIuhDshKPoa_jnytoEBKcOPZ77RIvpTItWhRN6GUBVVQZSyk2CUAI-T3DeEb7N3up0BRQLL4R5MMzakl5HJG61aZmIGt3XDyCnoFetCsR6O5cD2s0rCQwZ0tDfK3Ce3EbtAkb3Y"/>
              </button>
              <button 
                onClick={handleSocialLogin}
                className="flex items-center justify-center h-14 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10 transition-colors"
              >
                <span className="material-symbols-outlined text-2xl text-black dark:text-white">ios</span>
              </button>
            </div>

            {/* Footer Link */}
            <div className="mt-auto pt-8 text-center">
              <p className="text-primary/60 dark:text-white/60 text-base">
                Already have an account?{' '}
                <button 
                  onClick={() => setMode('login')}
                  className="font-bold text-primary dark:text-white hover:underline"
                >
                  Log in
                </button>
              </p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Login Mode
  return (
    <div className="font-display antialiased text-slate-800 bg-background-dark min-h-screen flex flex-col">
      {/* Top Section: Logo & Branding */}
      <div className="flex-none h-[30vh] w-full flex flex-col items-center justify-center relative bg-primary z-0">
        {/* Abstract background pattern for luxury feel */}
        <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'radial-gradient(circle at 70% 20%, #ffffff 1px, transparent 1px)', backgroundSize: '24px 24px'}}></div>
        <div className="z-10 flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-xl">
            <span className="material-symbols-outlined text-white text-4xl">handyman</span>
          </div>
          <h1 className="text-white text-2xl font-bold tracking-tight">Ox Field Services</h1>
        </div>
      </div>

      {/* Bottom Section: White Card */}
      <div className="flex-1 w-full bg-white dark:bg-[#FFFFFF] rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.2)] relative z-10 px-6 pt-10 pb-8 flex flex-col">
        {/* Handle bar */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-12 h-1.5 bg-gray-200 rounded-full"></div>
        
        <div className="w-full max-w-md mx-auto flex flex-col h-full">
          {/* Header Text */}
          <div className="mb-8 text-center sm:text-left">
            <h2 className="text-3xl font-bold text-primary tracking-tight mb-2">Welcome Back</h2>
            <p className="text-slate-500 text-base">Please enter your details to continue.</p>
          </div>

          {/* Error Message */}
          {displayError && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">
              {displayError}
            </div>
          )}

          {/* Login Form */}
          <form className="flex flex-col gap-5" onSubmit={(e) => { e.preventDefault(); handleEmailLogin(); }}>
            {/* Email Field */}
            <div>
              <label className="block text-sm font-semibold text-primary mb-2 pl-1" htmlFor="email">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-slate-400">mail</span>
                </div>
                <input 
                  className="block w-full rounded-xl border-slate-200 bg-slate-50 border focus:border-primary focus:ring-0 focus:bg-white transition-colors h-14 pl-12 pr-4 text-base placeholder:text-slate-400 text-primary font-medium" 
                  id="email" 
                  placeholder="hello@example.com" 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-semibold text-primary mb-2 pl-1" htmlFor="password">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-slate-400">lock</span>
                </div>
                <input 
                  className="block w-full rounded-xl border-slate-200 bg-slate-50 border focus:border-primary focus:ring-0 focus:bg-white transition-colors h-14 pl-12 pr-12 text-base placeholder:text-slate-400 text-primary font-medium" 
                  id="password" 
                  placeholder="••••••••" 
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-primary transition-colors"
                >
                  <span className="material-symbols-outlined" style={{fontSize: '20px'}}>
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
              <div className="flex justify-end mt-2">
                <a className="text-sm font-semibold text-primary/80 hover:text-primary transition-colors" href="#">Forgot Password?</a>
              </div>
            </div>

            {/* Login Button */}
            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary hover:bg-[#06181c] text-white font-bold h-14 rounded-xl shadow-lg shadow-primary/20 transition-all transform active:scale-[0.98] mt-2 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <span className="material-symbols-outlined animate-spin">progress_activity</span>
                  Signing in...
                </>
              ) : (
                <>
                  Login
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-slate-500 font-medium">Or continue with</span>
            </div>
          </div>

          {/* Social Login */}
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={handleSocialLogin}
              className="flex items-center justify-center gap-3 h-14 px-4 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 transition-colors"
            >
              <img alt="Google" className="w-5 h-5" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAz5mtXnLo4i7VfKZe0m5C4ayjWpXI5pM0dKYh90OAANV_Sakh-J7vwmVuf_uKlawlU7ifKEKtLmd9cM4IBz29wBtfeZoimahNhRFJxANlTxWfCvB4WDyspUPyD8Jp3cvFii3dbOUL0qATt_UlxesMpTmJR5W9Kz1N071UAykbVIN3zzQpUApGKe487Mv9zyA25vkRzIUepNlzCzvLuDk_JkVxkXzM7-s352cSabQBlQ7eihfgli2MBRyXfJEMKTp6TsqYQF5CQutw"/>
              <span className="text-sm font-bold text-slate-700">Google</span>
            </button>
            <button 
              onClick={handleSocialLogin}
              className="flex items-center justify-center gap-3 h-14 px-4 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 transition-colors"
            >
              <span className="material-symbols-outlined text-black" style={{fontSize: '24px'}}>ios</span>
              <span className="text-sm font-bold text-slate-700">Apple</span>
            </button>
          </div>

          {/* Sign Up Link */}
          <div className="mt-auto pt-6 text-center pb-2">
            <p className="text-slate-600 font-medium">
              Don't have an account?{' '}
              <button 
                onClick={() => setMode('register')}
                className="text-primary font-bold hover:underline"
              >
                Sign Up
              </button>
            </p>
          </div>

          {/* Demo Credentials Hint */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 mt-4">
            <p className="text-xs text-slate-500 text-center">
              Demo: <span className="text-slate-700 font-mono">client@demo.com</span> / <span className="text-slate-700 font-mono">password</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
