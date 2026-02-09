import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  Server, 
  ShieldAlert, 
  Settings, 
  Bell, 
  Search, 
  Globe, 
  LogOut,
  Activity,
  HardDrive,
  Ticket,
  Eye,
  Menu,
  X,
  Loader2
} from 'lucide-react';
import { Tenant } from './types';
import Dashboard from './pages/Dashboard';
import TenantManagement from './pages/Tenants';
import Infrastructure from './pages/Infrastructure';
import Login from './pages/Login';
import { AuthProvider, useAuth } from './context/AuthContext';
import { MOCK_TENANTS } from './constants';

type ViewState = 'dashboard' | 'tenants' | 'billing' | 'infra' | 'security' | 'support' | 'settings';

function MainApp() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [impersonatingTenant, setImpersonatingTenant] = useState<Tenant | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="flex h-screen w-full bg-dark-950 items-center justify-center">
        <Loader2 className="h-8 w-8 text-ox-500 animate-spin" />
      </div>
    );
  }

  // Show login if not authenticated
  if (!isAuthenticated) {
    return <Login />;
  }

  const handleImpersonate = (tenant: Tenant) => {
    setImpersonatingTenant(tenant);
    // When impersonating, we might theoretically route to a different "home" 
    // but for this demo, we maintain the shell.
  };

  const exitImpersonation = () => {
    setImpersonatingTenant(null);
  };

  const renderContent = () => {
    if (impersonatingTenant) {
      // In a real app, this would be the actual Client App.
      // Here we show a placeholder for the client context.
      return (
        <div className="flex-1 p-8 bg-dark-900 text-slate-300">
          <h2 className="text-2xl font-bold text-white mb-4">Client View: {impersonatingTenant.name}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
             <div className="bg-dark-800 p-6 rounded-lg border border-dark-700">
                <h3 className="text-sm uppercase tracking-wider text-slate-500 mb-2">My Field Techs</h3>
                <p className="text-3xl font-mono text-white">42</p>
             </div>
             <div className="bg-dark-800 p-6 rounded-lg border border-dark-700">
                <h3 className="text-sm uppercase tracking-wider text-slate-500 mb-2">Active Jobs</h3>
                <p className="text-3xl font-mono text-white">156</p>
             </div>
             <div className="bg-dark-800 p-6 rounded-lg border border-dark-700">
                <h3 className="text-sm uppercase tracking-wider text-slate-500 mb-2">Completion Rate</h3>
                <p className="text-3xl font-mono text-ox-500">98.5%</p>
             </div>
          </div>
          <div className="bg-dark-800 h-96 rounded-lg border border-dark-700 flex items-center justify-center">
             <p className="text-slate-500">Client specific operational map would load here...</p>
          </div>
        </div>
      );
    }

    switch (currentView) {
      case 'dashboard':
        return <Dashboard onViewChange={setCurrentView} />;
      case 'tenants':
        return <TenantManagement onImpersonate={handleImpersonate} />;
      case 'infra':
        return <Infrastructure />;
      default:
        return (
          <div className="flex items-center justify-center h-full text-slate-500">
            Module {currentView} under construction
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen w-full bg-dark-950 text-slate-200 overflow-hidden">
      
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-ox-900 border-r border-dark-700 transform transition-transform duration-200 ease-in-out ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0`}>
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="h-16 flex items-center px-6 border-b border-white/10">
            <Activity className="h-6 w-6 text-ox-500 mr-2" />
            <span className="font-bold text-lg tracking-tight text-white">OX FIELD SVCS</span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1">
            {impersonatingTenant ? (
              <>
                <div className="px-3 py-2 text-xs font-semibold text-ox-500 uppercase tracking-wider mb-2">
                  Client Context
                </div>
                <NavItem icon={<LayoutDashboard />} label="Overview" active={true} onClick={() => {}} />
                <NavItem icon={<Users />} label="Workforce" onClick={() => {}} />
                <NavItem icon={<Ticket />} label="Jobs" onClick={() => {}} />
                <NavItem icon={<Settings />} label="Settings" onClick={() => {}} />
              </>
            ) : (
              <>
                <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Global Admin
                </div>
                <NavItem 
                  icon={<LayoutDashboard />} 
                  label="Dashboard" 
                  active={currentView === 'dashboard'} 
                  onClick={() => { setCurrentView('dashboard'); setMobileMenuOpen(false); }} 
                />
                <NavItem 
                  icon={<Users />} 
                  label="Tenants" 
                  active={currentView === 'tenants'} 
                  onClick={() => { setCurrentView('tenants'); setMobileMenuOpen(false); }} 
                />
                <NavItem 
                  icon={<CreditCard />} 
                  label="Billing" 
                  active={currentView === 'billing'} 
                  onClick={() => { setCurrentView('billing'); setMobileMenuOpen(false); }} 
                />
                <NavItem 
                  icon={<Globe />} 
                  label="Global Templates" 
                  active={currentView === 'settings'} 
                  onClick={() => { setCurrentView('settings'); setMobileMenuOpen(false); }} 
                />
                <div className="mt-6 px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Ops & Security
                </div>
                <NavItem 
                  icon={<Server />} 
                  label="Infrastructure" 
                  active={currentView === 'infra'} 
                  onClick={() => { setCurrentView('infra'); setMobileMenuOpen(false); }} 
                />
                <NavItem 
                  icon={<ShieldAlert />} 
                  label="Security & Audit" 
                  active={currentView === 'security'} 
                  onClick={() => { setCurrentView('security'); setMobileMenuOpen(false); }} 
                />
                <NavItem 
                  icon={<Ticket />} 
                  label="Support Tickets" 
                  active={currentView === 'support'} 
                  onClick={() => { setCurrentView('support'); setMobileMenuOpen(false); }} 
                />
              </>
            )}
          </nav>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-white/10 bg-black/20">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-ox-500 flex items-center justify-center text-white font-bold">
                {user?.name?.charAt(0) || 'SA'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user?.name || 'Super Admin'}</p>
                <p className="text-xs text-slate-400 truncate">{user?.email || 'admin@oxfield.io'}</p>
              </div>
              <button 
                onClick={logout}
                className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title="Sign Out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Bar */}
        <header className="h-16 bg-dark-900 border-b border-dark-800 flex items-center justify-between px-4 lg:px-8 z-40">
          <div className="flex items-center flex-1">
            <button 
              className="lg:hidden p-2 text-slate-400 hover:text-white mr-4"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X /> : <Menu />}
            </button>
            
            <div className="relative w-full max-w-md hidden md:block">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input 
                type="text" 
                placeholder="Search global tenants, logs, or users..." 
                className="w-full bg-dark-950 border border-dark-700 text-slate-200 text-sm rounded-md pl-10 pr-4 py-2 focus:outline-none focus:border-ox-500 focus:ring-1 focus:ring-ox-500 transition-all placeholder-slate-600"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 text-slate-400 hover:text-white transition-colors relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full border border-dark-900"></span>
            </button>
            <div className="h-6 w-px bg-dark-700 mx-2"></div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-500">v2.4.0-stable</span>
            </div>
          </div>
        </header>

        {/* Impersonation Banner */}
        {impersonatingTenant && (
          <div className="bg-ox-900 border-b border-ox-700 px-4 lg:px-8 py-3 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg z-30">
            <div className="flex items-center gap-3">
              <Eye className="h-5 w-5 text-ox-500 animate-pulse" />
              <div>
                <p className="text-sm font-bold text-white uppercase tracking-wide">Impersonation Mode Active</p>
                <p className="text-xs text-slate-400">Viewing as <span className="text-ox-500 font-mono">{impersonatingTenant.name}</span> (ID: {impersonatingTenant.id})</p>
              </div>
            </div>
            <button 
              onClick={exitImpersonation}
              className="px-4 py-2 bg-red-900/50 hover:bg-red-900 text-red-100 text-sm font-medium rounded border border-red-800 transition-colors flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Exit Session
            </button>
          </div>
        )}

        {/* Viewport */}
        <main className="flex-1 overflow-auto bg-dark-950 relative">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
        active 
          ? 'bg-white/10 text-white shadow-sm border border-white/5' 
          : 'text-slate-400 hover:text-white hover:bg-white/5'
      }`}
    >
      {React.cloneElement(icon as React.ReactElement, { 
        className: `h-5 w-5 ${active ? 'text-ox-500' : 'text-slate-500 group-hover:text-slate-300'}` 
      })}
      {label}
    </button>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
