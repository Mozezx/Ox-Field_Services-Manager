export interface Task {
  id: string;
  osNumber: string;
  title: string;
  client: string;
  address: string;
  status: 'pending' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  timeScheduled: string;
  duration?: string;
  lat?: number;
  lng?: number;
}

export interface MaterialItem {
  id: string;
  name: string;
  sku: string;
  stock: number;
  qty: number;
  category: 'Electrical' | 'Plumbing' | 'HVAC' | 'Fasteners';
  image?: string;
}

export interface Notification {
  id: string;
  type: 'assignment' | 'alert' | 'system';
  title: string;
  message: string;
  time: string;
  priority?: 'high' | 'medium' | 'low';
  read: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  role: string;
  avatar: string;
  email: string;
}
