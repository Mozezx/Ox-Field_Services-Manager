import React, { useState } from 'react';
import { Activity, Loader2, Lock, Mail, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
    } catch (err: any) {
      console.error('Login error:', err);
      const errorMessage = err.response?.data?.message || 'Login failed. Please check your credentials.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center p-4">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-ox-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-ox-500/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-ox-500/10 rounded-xl border border-ox-500/20 mb-4">
            <Activity className="h-8 w-8 text-ox-500" />
          </div>
          <h1 className="text-2xl font-bold text-white">OX FIELD SERVICES</h1>
          <p className="text-slate-400 text-sm mt-2">Global Administration Portal</p>
        </div>

        {/* Login Card */}
        <div className="bg-dark-900 rounded-xl border border-dark-700 shadow-2xl p-8">
          <h2 className="text-xl font-semibold text-white mb-6">Sign in to your account</h2>

          {error && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3 text-red-400 text-sm">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@oxfield.com"
                  required
                  className="w-full bg-dark-950 border border-dark-700 text-white rounded-lg pl-11 pr-4 py-3 focus:outline-none focus:border-ox-500 focus:ring-1 focus:ring-ox-500 transition-all placeholder-slate-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-dark-950 border border-dark-700 text-white rounded-lg pl-11 pr-4 py-3 focus:outline-none focus:border-ox-500 focus:ring-1 focus:ring-ox-500 transition-all placeholder-slate-600"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 bg-dark-950 border-dark-700 rounded text-ox-500 focus:ring-ox-500" />
                <span className="text-sm text-slate-400">Remember me</span>
              </label>
              <a href="#" className="text-sm text-ox-500 hover:text-ox-400 transition-colors">
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-ox-500 hover:bg-ox-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-slate-500 text-xs">
            Protected by enterprise security. © 2026 OX Field Services.
          </p>
        </div>

        {/* Demo Credentials Hint */}
        <div className="mt-4 p-3 bg-dark-800 rounded-lg border border-dark-700">
          <p className="text-xs text-slate-500 text-center">
            Demo credentials: <span className="text-slate-300 font-mono">admin@oxfield.com</span> / <span className="text-slate-300 font-mono">password</span>
          </p>
        </div>
      </div>
    </div>
  );
}
