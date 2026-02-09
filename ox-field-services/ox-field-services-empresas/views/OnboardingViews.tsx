import React, { useState } from 'react';
import { AppView } from '../types';
import { Button } from '../components/Button';
import { ArrowRight, Check, Upload, UserPlus, Users, Loader2 } from 'lucide-react';
import { authService } from '../services/auth';

interface Props {
  setView: (view: AppView) => void;
}

// LOGIN SCREEN
export const LoginView: React.FC<Props> = ({ setView }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tenantDomain, setTenantDomain] = useState(localStorage.getItem('tenantDomain') || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!tenantDomain.trim()) {
      setError('Please enter your company domain');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Garantir que o domínio tenha o sufixo .oxfield.com
      const fullDomain = tenantDomain.trim().endsWith('.oxfield.com') 
        ? tenantDomain.trim() 
        : `${tenantDomain.trim()}.oxfield.com`;

      const response = await authService.login({
        email,
        password,
        appType: 'EMPRESA_WEB',
        tenantDomain: fullDomain
      });
      
      localStorage.setItem('token', response.accessToken || '');
      localStorage.setItem('tenantDomain', fullDomain);
      
      // Optional: Store user info or fetch /me
      setView(AppView.DASHBOARD);
    } catch (err: any) {
      const res = err.response;
      console.error('Login error:', err);
      console.error('Request data:', { email, password: '***', appType: 'EMPRESA_WEB', tenantDomain });
      console.error('Response status:', res?.status, 'Response data:', res?.data);
      if (res?.status >= 500) {
        console.error('Full error response:', JSON.stringify(res?.data ?? null));
      }
      const data = res?.data;
      const serverMessage = data?.message;
      const exceptionMsg = data?.details?.exceptionMessage;
      const fallback = res?.status === 502
        ? 'Backend unreachable. Is the server running on port 8080?'
        : res?.status >= 500
          ? 'Server error. Check backend console for the exception stack trace.'
          : 'Login failed. Please check your credentials and domain.';
      setError(exceptionMsg || serverMessage || fallback);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 opacity-20 pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[600px] h-[600px] rounded-full bg-primary blur-[128px]" />
        <div className="absolute bottom-[0%] right-[0%] w-[500px] h-[500px] rounded-full bg-blue-600 blur-[128px]" />
      </div>

      <div className="w-full max-w-md bg-surface p-8 rounded-2xl border border-white/10 shadow-2xl z-10 mx-4">
        <div className="mb-8 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-blue-600 rounded-2xl mx-auto flex items-center justify-center text-[#0B242A] font-bold text-3xl mb-4">Ox</div>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-secondary">Enter your credentials to access your workspace.</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm text-center">
            {error}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleLogin}>
          <div>
            <label className="block text-sm font-medium text-secondary mb-1">Company Domain *</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                className="flex-1 bg-[#0B242A] border border-white/10 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                placeholder="your-company"
                value={tenantDomain.replace('.oxfield.com', '')}
                onChange={(e) => {
                  const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                  setTenantDomain(value);
                }}
                required
              />
              <span className="text-gray-400">.oxfield.com</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Enter the domain you used when creating your account</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary mb-1">Email</label>
            <input
              type="email"
              className="w-full bg-[#0B242A] border border-white/10 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary mb-1">Password</label>
            <input
              type="password"
              className="w-full bg-[#0B242A] border border-white/10 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading || !tenantDomain.trim()}
            className="w-full mt-6 py-3 bg-primary text-white rounded-lg font-bold text-lg hover:bg-primary-hover transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-secondary">
          Don't have an account? <span className="text-primary cursor-pointer hover:underline" onClick={() => setView(AppView.ONBOARDING_1)}>Sign Up</span>
        </div>
      </div>
    </div>
  );
};

// ONBOARDING LAYOUT WRAPPER
const OnboardingLayout: React.FC<{
  step: number;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  onNext: () => void;
  btnText?: string;
  loading?: boolean;
}> = ({ step, title, subtitle, children, onNext, btnText = 'Next', loading = false }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background relative px-4">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 opacity-10 pointer-events-none">
        <div className="absolute top-[20%] right-[30%] w-[400px] h-[400px] rounded-full bg-primary blur-[100px]" />
      </div>

      <div className="w-full max-w-2xl">
        {/* Progress */}
        <div className="mb-8 flex items-center justify-between text-sm font-medium text-secondary">
          <span>Step {step} of 3</span>
          <div className="flex gap-2">
            {[1, 2, 3].map(i => (
              <div
                key={i}
                className={`h-2 rounded-full transition-all duration-500 ${i <= step ? 'w-8 bg-primary' : 'w-2 bg-white/10'}`}
              />
            ))}
          </div>
        </div>

        <div className="bg-surface border border-white/5 p-8 md:p-12 rounded-2xl shadow-2xl backdrop-blur-sm relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-3xl font-bold text-white mb-2">{title}</h2>
            <p className="text-secondary mb-8">{subtitle}</p>

            <div className="min-h-[200px] mb-8">
              {children}
            </div>

            <div className="flex justify-end pt-6 border-t border-white/5">
              <Button onClick={onNext} disabled={loading} className="px-8 py-3 text-lg">
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Creating...
                  </>
                ) : (
                  <>
                    {btnText} <ArrowRight size={20} />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// STEP 1: SETUP
export const SetupView: React.FC<Props> = ({ setView }) => {
  const [companyName, setCompanyName] = useState('');
  const [domain, setDomain] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [description, setDescription] = useState('');
  const [industry, setIndustry] = useState('HVAC');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleNext = async () => {
    // Validar campos obrigatórios
    if (!companyName.trim()) {
      setError('Company name is required');
      return;
    }
    if (!domain.trim()) {
      setError('Domain is required');
      return;
    }
    if (!adminName.trim()) {
      setError('Admin name is required');
      return;
    }
    if (!adminEmail.trim()) {
      setError('Admin email is required');
      return;
    }
    if (!password || password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Registrar empresa no backend
      // O domínio deve ser completo (ex: empresa.oxfield.com)
      const fullDomain = domain.trim().endsWith('.oxfield.com') 
        ? domain.trim() 
        : `${domain.trim()}.oxfield.com`;
      
      const response = await authService.registerCompany({
        companyName: companyName.trim(),
        domain: fullDomain,
        adminEmail: adminEmail.trim(),
        password: password,
        adminName: adminName.trim(),
        phone: phone.trim() || undefined,
        region: 'us-east-1',
        description: description.trim() || undefined
      });

      // Salvar token e domínio para login futuro
      localStorage.setItem('token', response.accessToken || '');
      localStorage.setItem('tenantDomain', fullDomain);

      // Continuar para próximo passo
      setView(AppView.ONBOARDING_2);
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.response?.data?.message || 'Failed to create company. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <OnboardingLayout
      step={1}
      title="Setup your Organization"
      subtitle="Tell us a bit about your company to customize your workspace."
      onNext={handleNext}
      btnText="Next"
      loading={loading}
    >
      <div className="space-y-6">
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Company Info */}
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 rounded-full border-2 border-dashed border-white/20 flex flex-col items-center justify-center text-secondary hover:text-primary hover:border-primary cursor-pointer transition-colors bg-[#0B242A]">
            <Upload size={24} />
            <span className="text-xs mt-2">Logo</span>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-secondary mb-1">Company Name *</label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Your Company Name"
              className="w-full bg-[#0B242A] border border-white/10 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-primary outline-none"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary mb-1">Domain *</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={domain}
              onChange={(e) => {
                const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                setDomain(value);
                // Auto-gerar domínio baseado no nome da empresa se vazio
                if (!value && companyName) {
                  const autoDomain = companyName.toLowerCase()
                    .replace(/[^a-z0-9\s]/g, '')
                    .replace(/\s+/g, '-')
                    .substring(0, 50);
                  setDomain(autoDomain);
                }
              }}
              placeholder="your-company"
              className="flex-1 bg-[#0B242A] border border-white/10 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-primary outline-none"
              required
            />
            <span className="text-gray-400">.oxfield.com</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">This will be your unique workspace URL</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary mb-1">Description (optional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of your company..."
            className="w-full bg-[#0B242A] border border-white/10 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-primary outline-none min-h-[80px] resize-none"
          />
        </div>

        <div className="h-px bg-white/10"></div>

        {/* Admin Account */}
        <div>
          <h3 className="text-white font-semibold mb-4">Administrator Account</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-secondary mb-1">Admin Name *</label>
              <input
                type="text"
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                placeholder="Your full name"
                className="w-full bg-[#0B242A] border border-white/10 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-primary outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary mb-1">Admin Email *</label>
              <input
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="admin@company.com"
                className="w-full bg-[#0B242A] border border-white/10 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-primary outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary mb-1">Password *</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="w-full bg-[#0B242A] border border-white/10 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-primary outline-none"
                required
                minLength={8}
              />
              <p className="text-xs text-gray-500 mt-1">Minimum 8 characters</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary mb-1">Phone (optional)</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+55 11 99999-9999"
                className="w-full bg-[#0B242A] border border-white/10 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-secondary mb-1">Industry</label>
            <select 
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="w-full bg-[#0B242A] border border-white/10 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-primary outline-none"
            >
              <option>HVAC</option>
              <option>Plumbing</option>
              <option>Electrical</option>
              <option>General Maintenance</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary mb-1">Team Size</label>
            <select className="w-full bg-[#0B242A] border border-white/10 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-primary outline-none">
              <option>1-10</option>
              <option>11-50</option>
              <option>50+</option>
            </select>
          </div>
        </div>
      </div>
    </OnboardingLayout>
  );
};

// STEP 2: TEAM INVITATION
export const TeamInvitationView: React.FC<Props> = ({ setView }) => {
  const [emails, setEmails] = useState(['']);

  return (
    <OnboardingLayout
      step={2}
      title="Invite your Team"
      subtitle="Add your technicians and dispatchers. You can add more later."
      onNext={() => setView(AppView.ONBOARDING_3)}
    >
      <div className="space-y-4">
        {emails.map((_, idx) => (
          <div key={idx} className="flex gap-3">
            <input
              type="email"
              placeholder="colleague@company.com"
              className="flex-1 bg-[#0B242A] border border-white/10 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-primary outline-none"
            />
            <select className="w-32 bg-[#0B242A] border border-white/10 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-primary outline-none">
              <option>Admin</option>
              <option>Tech</option>
              <option>Viewer</option>
            </select>
          </div>
        ))}

        <button
          onClick={() => setEmails([...emails, ''])}
          className="flex items-center gap-2 text-primary hover:text-white font-medium transition-colors text-sm mt-2"
        >
          <UserPlus size={16} /> Add another member
        </button>

        <div className="mt-8 p-4 bg-primary/10 rounded-lg border border-primary/20 flex items-start gap-3">
          <Users className="text-primary shrink-0 mt-0.5" size={20} />
          <div>
            <h4 className="text-white font-medium text-sm">Bulk Import?</h4>
            <p className="text-secondary text-xs mt-1">You can upload a CSV file with your team details in the settings later.</p>
          </div>
        </div>
      </div>
    </OnboardingLayout>
  );
};

// STEP 3: COMPLETION
export const CompletionView: React.FC<Props> = ({ setView }) => {
  return (
    <OnboardingLayout
      step={3}
      title="You're All Set!"
      subtitle="Your workspace is ready. Let's start managing your operations."
      onNext={() => setView(AppView.DASHBOARD)}
      btnText="Start Managing"
    >
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mb-6 animate-bounce">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center text-[#0B242A]">
            <Check size={32} strokeWidth={4} />
          </div>
        </div>

        <h3 className="text-xl font-semibold text-white mb-2">Workspace Created Successfully</h3>
        <p className="text-secondary max-w-md">
          We've set up your dashboard with some sample data so you can explore the features right away.
        </p>

        <div className="grid grid-cols-3 gap-4 mt-8 w-full">
          <div className="p-4 bg-[#0B242A] rounded-xl border border-white/5 text-center">
            <div className="text-2xl font-bold text-white mb-1">Dispatch</div>
            <div className="text-xs text-secondary">Assign Jobs</div>
          </div>
          <div className="p-4 bg-[#0B242A] rounded-xl border border-white/5 text-center">
            <div className="text-2xl font-bold text-white mb-1">Map</div>
            <div className="text-xs text-secondary">Track Fleet</div>
          </div>
          <div className="p-4 bg-[#0B242A] rounded-xl border border-white/5 text-center">
            <div className="text-2xl font-bold text-white mb-1">Approve</div>
            <div className="text-xs text-secondary">Verify Docs</div>
          </div>
        </div>
      </div>
    </OnboardingLayout>
  );
};