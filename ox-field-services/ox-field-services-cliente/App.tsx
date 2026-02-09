import React from 'react';
import { HashRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { Login } from './screens/Login';
import { Home } from './screens/Home';
import { RequestService } from './screens/RequestService';
import { CompanyList } from './screens/CompanyList';
import { Marketplace } from './screens/Marketplace';
import { Schedule } from './screens/Schedule';
import { Confirmation } from './screens/Confirmation';
import { Tracking } from './screens/Tracking';
import { Rating } from './screens/Rating';
import { Documents } from './screens/Documents';
import { Profile } from './screens/Profile';
import { AddAddress } from './screens/AddAddress';
import { MyAddresses } from './screens/MyAddresses';
import { Support } from './screens/Support';
import { PaymentMethods } from './screens/PaymentMethods';
import ServicePayment from './screens/ServicePayment';
import PaymentHistory from './screens/PaymentHistory';
import { ServiceDetails } from './screens/ServiceDetails';
import { ActiveServices } from './screens/ActiveServices';
import { Notifications } from './screens/Notifications';
import { BookingSuccess } from './screens/BookingSuccess';
import { OrderByToken } from './screens/OrderByToken';
import { JoinByToken } from './screens/JoinByToken';
import { OrderDetail } from './screens/OrderDetail';
import { BottomNav } from './components/BottomNav';

const ProtectedRoute = ({ children }: { children?: React.ReactNode }) => {
  const { isAuthenticated } = useApp();
  if (!isAuthenticated) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const LoginOrHome = () => {
  const { isAuthenticated } = useApp();
  if (isAuthenticated) return <Navigate to="/home" replace />;
  return <Login />;
};

const Layout = () => {
  const location = useLocation();
  // Hide bottom nav on specific screens
  const hideNavPaths = ['/', '/request', '/companies', '/schedule', '/confirmation', '/tracking', '/rating', '/support', '/chat', '/payments', '/add-address', '/addresses', '/service-details', '/booking-success', '/notifications'];
  const showNav = !hideNavPaths.includes(location.pathname) && !location.pathname.startsWith('/order');

  return (
    <>
      <Routes>
        <Route path="/" element={<LoginOrHome />} />
        <Route path="/order/:token" element={<OrderByToken />} />
        <Route path="/join/:token" element={<JoinByToken />} />
        <Route path="/order/detail/:orderId" element={<ProtectedRoute><OrderDetail /></ProtectedRoute>} />
        <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/marketplace" element={<ProtectedRoute><Marketplace /></ProtectedRoute>} />
        <Route path="/request" element={<ProtectedRoute><RequestService /></ProtectedRoute>} />
        <Route path="/companies" element={<ProtectedRoute><CompanyList /></ProtectedRoute>} />
        <Route path="/schedule" element={<ProtectedRoute><Schedule /></ProtectedRoute>} />
        <Route path="/confirmation" element={<ProtectedRoute><Confirmation /></ProtectedRoute>} />
        <Route path="/tracking" element={<ProtectedRoute><Tracking /></ProtectedRoute>} />
        <Route path="/rating" element={<ProtectedRoute><Rating /></ProtectedRoute>} />
        <Route path="/documents" element={<ProtectedRoute><Documents /></ProtectedRoute>} />
        <Route path="/appointments" element={<ProtectedRoute><ActiveServices /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/addresses" element={<ProtectedRoute><MyAddresses /></ProtectedRoute>} />
        <Route path="/add-address" element={<ProtectedRoute><AddAddress /></ProtectedRoute>} />
        <Route path="/support" element={<ProtectedRoute><Support /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
        <Route path="/payments" element={<ProtectedRoute><PaymentMethods /></ProtectedRoute>} />
        <Route path="/pay/:orderId" element={<ProtectedRoute><ServicePayment /></ProtectedRoute>} />
        <Route path="/payment-history" element={<ProtectedRoute><PaymentHistory /></ProtectedRoute>} />
        <Route path="/service-details" element={<ProtectedRoute><ServiceDetails /></ProtectedRoute>} />
        <Route path="/active-services" element={<ProtectedRoute><ActiveServices /></ProtectedRoute>} />
        <Route path="/booking-success" element={<ProtectedRoute><BookingSuccess /></ProtectedRoute>} />
      </Routes>
      {showNav && <BottomNav />}
    </>
  );
};

export default function App() {
  return (
    <AppProvider>
      <Router>
        <Layout />
      </Router>
    </AppProvider>
  );
}