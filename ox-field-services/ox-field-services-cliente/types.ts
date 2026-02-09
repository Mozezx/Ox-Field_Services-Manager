export interface ServiceRequest {
  id: string;
  type: 'HVAC' | 'Electrical' | 'Plumbing' | 'General';
  status: 'Pending' | 'Scheduled' | 'En Route' | 'Completed';
  date: string;
  time: string;
  technician?: Technician;
  address: string;
  description?: string;
  price?: number;
}

export interface Technician {
  id: string;
  name: string;
  role: string;
  rating: number;
  image: string;
  vehicle?: {
    model: string;
    licensePlate: string;
  };
  location?: {
    lat: number;
    lng: number;
  };
}

export interface User {
  name: string;
  email: string;
  avatar: string;
  addresses: Address[];
}

export interface Address {
  id: string;
  label: string;
  fullAddress: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'info' | 'success' | 'warning' | 'alert';
  read: boolean;
}