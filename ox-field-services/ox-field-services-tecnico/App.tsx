import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { authService } from './services/auth';
import { syncService } from './services/sync';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginScreen } from './screens/auth/LoginScreen';
import { JoinByLinkScreen } from './screens/auth/JoinByLinkScreen';
import { JoinByCodeScreen } from './screens/auth/JoinByCodeScreen';
import { LinkCompanyScreen } from './screens/auth/LinkCompanyScreen';
import { RegisterScreen } from './screens/auth/RegisterScreens';
import { AgendaScreen } from './screens/main/AgendaScreen';
import { MapScreen } from './screens/main/MapScreen';
import { DocumentsScreen } from './screens/main/DocumentsScreen';
import { TaskExecutionScreen } from './screens/task/TaskExecutionScreen';
import { MaterialsLogScreen } from './screens/task/MaterialsLogScreen';
import { ServiceCompletionScreen } from './screens/task/ServiceCompletionScreen';
import { SyncManagerScreen } from './screens/support/SyncManagerScreen';
import { NotificationsScreen } from './screens/support/NotificationsScreen';
import { HistoryScreen } from './screens/support/HistoryScreen';
import { DashboardScreen } from './screens/support/ProductivityDashboardScreen';
import { ProfileScreen } from './screens/support/ProfileScreen';
import { SupportChatScreen } from './screens/support/SupportChatScreen';

const InitialRedirect: React.FC = () => {
  if (!authService.isAuthenticated()) return <Navigate to="/login" replace />;
  const user = authService.getStoredUser();
  if (user?.role === 'TECNICO' && user?.tenantId == null) {
    return <Navigate to="/link-company" replace />;
  }
  return <Navigate to="/agenda" replace />;
};

const LoginOrRedirect: React.FC = () => {
  if (!authService.isAuthenticated()) return <LoginScreen />;
  const user = authService.getStoredUser();
  if (user?.role === 'TECNICO' && user?.tenantId == null) {
    return <Navigate to="/link-company" replace />;
  }
  return <Navigate to="/agenda" replace />;
};

const App: React.FC = () => {
  useEffect(() => {
    const cleanup = syncService.setupListeners(
      () => syncService.syncNow().catch(() => {}),
      () => {}
    );
    return cleanup;
  }, []);

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<InitialRedirect />} />
        <Route path="/login" element={<LoginOrRedirect />} />
        <Route path="/join" element={<JoinByLinkScreen />} />
        <Route path="/join-by-code" element={<JoinByCodeScreen />} />

        {/* Registration: email and password; invite code optional */}
        <Route path="/register" element={<RegisterScreen />} />
        <Route path="/register/1" element={<Navigate to="/register" replace />} />
        <Route path="/register/2" element={<Navigate to="/register" replace />} />
        <Route path="/register/3" element={<Navigate to="/register" replace />} />

        {/* Link to company (technician without tenant) */}
        <Route path="/link-company" element={<ProtectedRoute><LinkCompanyScreen /></ProtectedRoute>} />

        {/* Main App (protected) */}
        <Route path="/agenda" element={<ProtectedRoute><AgendaScreen /></ProtectedRoute>} />
        <Route path="/map" element={<ProtectedRoute><MapScreen /></ProtectedRoute>} />
        <Route path="/documents" element={<ProtectedRoute><DocumentsScreen /></ProtectedRoute>} />

        {/* Task Execution Flow */}
        <Route path="/task/:taskId" element={<ProtectedRoute><TaskExecutionScreen /></ProtectedRoute>} />
        <Route path="/task/:taskId/materials" element={<ProtectedRoute><MaterialsLogScreen /></ProtectedRoute>} />
        <Route path="/task/:taskId/complete" element={<ProtectedRoute><ServiceCompletionScreen /></ProtectedRoute>} />

        {/* Support Screens */}
        <Route path="/sync" element={<ProtectedRoute><SyncManagerScreen /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><NotificationsScreen /></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute><HistoryScreen /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><DashboardScreen /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfileScreen /></ProtectedRoute>} />
        <Route path="/chat" element={<ProtectedRoute><SupportChatScreen /></ProtectedRoute>} />
      </Routes>
    </HashRouter>
  );
};

export default App;
