import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { ServiceRequest, User, Notification } from '../types';
import { authService, UserInfo } from '../services/auth';
import { customerService, Address } from '../services/customer';

// Estado do fluxo de solicitação de serviço
export interface ServiceRequestFlow {
  category: string;
  description: string;
  addressId: string;
  addressLabel: string;
  preferredDate: string;
  preferredTime: string;
  // Marketplace: company and listing chosen by client
  selectedTenantId?: string;
  selectedCompanyName?: string;
  listingId?: string;
  listingTitle?: string;
  technicianDistanceKm?: number;
  estimatedArrivalMin?: number;
  // Endereço (para busca de empresas ou exibição)
  addressLatitude?: number;
  addressLongitude?: number;
}

interface AppContextType {
  user: User;
  activeService: ServiceRequest | null;
  setActiveService: (service: ServiceRequest | null) => void;
  pastServices: ServiceRequest[];
  notifications: Notification[];
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, phone: string) => Promise<void>;
  logout: () => void;
  addService: (service: ServiceRequest) => void;
  loginError: string | null;
  // Service Request Flow
  serviceRequestFlow: ServiceRequestFlow | null;
  setServiceRequestFlow: (flow: ServiceRequestFlow | null) => void;
  updateServiceRequestFlow: (updates: Partial<ServiceRequestFlow>) => void;
  addresses: Address[];
  loadAddresses: () => Promise<void>;
  submitServiceRequest: () => Promise<{ success: boolean; osNumber?: string; error?: string }>;
}

const defaultUser: User = {
  name: "Guest",
  email: "",
  avatar: "https://i.pravatar.cc/150?u=guest",
  addresses: []
};

const defaultNotifications: Notification[] = [
  { id: '1', title: 'Technician Arriving Soon', message: 'Your technician, Mike, is 10 minutes away.', time: '10:05 AM', type: 'info', read: false },
  { id: '2', title: 'Invoice #1024 Available', message: 'View your invoice for the recent plumbing service.', time: '09:00 AM', type: 'info', read: false },
];

const AppContext = createContext<AppContextType | undefined>(undefined);

function getInitialUser(): User {
  const stored = authService.getStoredUser();
  if (!stored) return defaultUser;
  return {
    name: stored.name,
    email: stored.email,
    avatar: stored.avatarUrl || `https://i.pravatar.cc/150?u=${stored.email}`,
    addresses: []
  };
}

export const AppProvider = ({ children }: { children?: ReactNode }) => {
  const [user, setUser] = useState<User>(defaultUser);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [activeService, setActiveService] = useState<ServiceRequest | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>(defaultNotifications);
  const [pastServices, setPastServices] = useState<ServiceRequest[]>([
    { id: 'hvac-01', type: 'HVAC', status: 'Completed', date: 'Oct 12, 2023', time: '10:00 AM', address: '123 Maple St', price: 165.00 },
    { id: 'plumb-02', type: 'Plumbing', status: 'Completed', date: 'Sep 28, 2023', time: '2:00 PM', address: '123 Maple St', price: 120.00 }
  ]);

  // Service Request Flow state
  const [serviceRequestFlow, setServiceRequestFlow] = useState<ServiceRequestFlow | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);

  // Sync session from storage on mount (e.g. after tab refresh or token restored elsewhere)
  useEffect(() => {
    if (authService.isAuthenticated()) {
      setUser(getInitialUser());
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setLoginError(null);
    setIsLoading(true);

    try {
      const response = await authService.login(email, password);
      setUser({
        name: response.user.name,
        email: response.user.email,
        avatar: response.user.avatarUrl || `https://i.pravatar.cc/150?u=${response.user.email}`,
        addresses: []
      });
      setIsAuthenticated(true);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Login failed. Please check your credentials.';
      setLoginError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Registro de cliente no marketplace.
   * Clientes são globais (sem tenant fixo) e escolhem empresa por serviço.
   */
  const register = async (name: string, email: string, password: string, phone: string) => {
    setLoginError(null);
    setIsLoading(true);

    try {
      const response = await authService.register({
        name,
        email,
        password,
        phone
        // Sem tenantDomain - cliente global do marketplace
      });
      setUser({
        name: response.user.name,
        email: response.user.email,
        avatar: response.user.avatarUrl || `https://i.pravatar.cc/150?u=${response.user.email}`,
        addresses: []
      });
      setIsAuthenticated(true);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Registration failed. Please try again.';
      setLoginError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(defaultUser);
    setIsAuthenticated(false);
    setActiveService(null);
  };

  const addService = (service: ServiceRequest) => {
    setActiveService(service);
    // In a real app, this would also add to a pending list
  };

  // Load addresses from API (stable reference so consumers can use in useEffect deps)
  const loadAddresses = useCallback(async () => {
    try {
      const fetchedAddresses = await customerService.getAddresses();
      setAddresses(fetchedAddresses);
    } catch (error) {
      console.error('Failed to load addresses:', error);
      // Keep previous list on error so UI doesn't wipe; only set [] when we have no previous state
      setAddresses(prev => (prev.length === 0 ? [] : prev));
    }
  }, []);

  const removeAddressById = useCallback((id: string) => {
    setAddresses(prev => prev.filter(a => a.id !== id));
  }, []);

  // Update service request flow partially
  const updateServiceRequestFlow = (updates: Partial<ServiceRequestFlow>) => {
    setServiceRequestFlow(prev => prev ? { ...prev, ...updates } : null);
  };

  /**
   * Submete a solicitação de serviço para o backend.
   * No modelo marketplace, inclui o tenantId da empresa selecionada.
   */
  const submitServiceRequest = async (): Promise<{ success: boolean; osNumber?: string; error?: string }> => {
    if (!serviceRequestFlow) {
      return { success: false, error: 'No service request data' };
    }

    // Verificar se empresa foi selecionada (obrigatório no marketplace)
    if (!serviceRequestFlow.selectedTenantId) {
      return { success: false, error: 'Please select a service provider' };
    }

    try {
      const response = await customerService.createServiceRequest({
        type: serviceRequestFlow.category,
        category: serviceRequestFlow.category.toLowerCase(),
        description: serviceRequestFlow.description,
        addressId: serviceRequestFlow.addressId,
        preferredDate: serviceRequestFlow.preferredDate,
        preferredTime: serviceRequestFlow.preferredTime,
        tenantId: serviceRequestFlow.selectedTenantId // Empresa selecionada no marketplace
      });

      // Add to active services
      addService({
        id: response.id,
        type: serviceRequestFlow.category as any,
        status: 'Pending',
        date: serviceRequestFlow.preferredDate,
        time: serviceRequestFlow.preferredTime,
        address: serviceRequestFlow.addressLabel
      });

      // Clear the flow
      setServiceRequestFlow(null);

      return { success: true, osNumber: response.id };
    } catch (error: any) {
      console.error('Failed to submit service request:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to submit service request'
      };
    }
  };

  return (
    <AppContext.Provider value={{
      user,
      activeService,
      setActiveService,
      pastServices,
      notifications,
      isAuthenticated,
      isLoading,
      login,
      register,
      logout,
      addService,
      loginError,
      // Service Request Flow
      serviceRequestFlow,
      setServiceRequestFlow,
      updateServiceRequestFlow,
      addresses,
      loadAddresses,
      removeAddressById,
      submitServiceRequest
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
