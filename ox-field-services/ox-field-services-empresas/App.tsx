import React, { useState, useEffect } from 'react';
import { AppView } from './types';
import { Sidebar } from './components/Sidebar';
import { LoginView, SetupView, TeamInvitationView, CompletionView } from './views/OnboardingViews';
import { OperationsDashboard, PlaceholderView } from './views/DashboardViews';
import { DispatchConsole } from './views/DispatchViews';
import { FleetMapView } from './views/FleetMapView';
import { ApprovalInbox, DocumentVerification } from './views/ApprovalViews';
import { BillingContainer } from './views/BillingContainer';
import { TechniciansView } from './views/TechniciansView';
import { ClientsView } from './views/ClientsView';
import { CategoriesView } from './views/CategoriesView';
import { ListingsView } from './views/ListingsView';

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>(AppView.LOGIN);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Restore session on refresh: if token exists, show dashboard instead of login
  useEffect(() => {
    if (localStorage.getItem('token')) {
      setCurrentView(AppView.DASHBOARD);
    }
  }, []);

  // Render Logic
  const renderView = () => {
    switch (currentView) {
      case AppView.LOGIN:
        return <LoginView setView={setCurrentView} />;
      case AppView.ONBOARDING_1:
        return <SetupView setView={setCurrentView} />;
      case AppView.ONBOARDING_2:
        return <TeamInvitationView setView={setCurrentView} />;
      case AppView.ONBOARDING_3:
        return <CompletionView setView={setCurrentView} />;
      case AppView.DASHBOARD:
        return <OperationsDashboard />;
      case AppView.DISPATCH:
        return <DispatchConsole />;
      case AppView.MAP:
        return <FleetMapView />;
      case AppView.INVENTORY:
        return <PlaceholderView title="Inventory Management" />;
      case AppView.APPROVALS:
        return <ApprovalInbox setView={setCurrentView} />;
      case AppView.APPROVALS_VERIFICATION:
        return <DocumentVerification setView={setCurrentView} />;
      case AppView.BILLING:
        return <BillingContainer />;
      case AppView.TECNICOS:
        return <TechniciansView />;
      case AppView.CLIENTS:
        return <ClientsView />;
      case AppView.CATEGORIES:
        return <CategoriesView />;
      case AppView.LISTINGS:
        return <ListingsView />;
      default:
        return <OperationsDashboard />;
    }
  };

  // Check if current view should show sidebar
  const showSidebar = ![
    AppView.LOGIN, 
    AppView.ONBOARDING_1, 
    AppView.ONBOARDING_2, 
    AppView.ONBOARDING_3
  ].includes(currentView);

  return (
    <div className="min-h-screen bg-background text-white font-sans selection:bg-primary selection:text-[#0B242A]">
      {showSidebar && (
        <Sidebar 
          currentView={currentView} 
          setView={setCurrentView} 
          isCollapsed={isSidebarCollapsed}
          toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
      )}
      
      <main 
        className={`
          min-h-screen transition-all duration-300
          ${showSidebar ? (isSidebarCollapsed ? 'ml-20' : 'ml-64') : ''}
        `}
      >
        {renderView()}
      </main>
    </div>
  );
}