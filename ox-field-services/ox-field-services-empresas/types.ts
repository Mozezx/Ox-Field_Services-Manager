export enum AppView {
  LOGIN = 'LOGIN',
  ONBOARDING_1 = 'ONBOARDING_1',
  ONBOARDING_2 = 'ONBOARDING_2',
  ONBOARDING_3 = 'ONBOARDING_3',
  DASHBOARD = 'DASHBOARD',
  DISPATCH = 'DISPATCH',
  MAP = 'MAP',
  INVENTORY = 'INVENTORY',
  APPROVALS = 'APPROVALS',
  APPROVALS_VERIFICATION = 'APPROVALS_VERIFICATION',
  BILLING = 'BILLING',
  TECNICOS = 'TECNICOS',
  CLIENTS = 'CLIENTS',
  CATEGORIES = 'CATEGORIES',
  LISTINGS = 'LISTINGS',
}

export interface Technician {
  id: string;
  name: string;
  role: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  avatar: string;
  email: string;
  skills: string[];
}

export interface ServiceOrder {
  id: string;
  title: string;
  customer: string;
  status: 'Scheduled' | 'In Progress' | 'Completed';
  start: number; // Hour of day (0-23)
  duration: number; // Hours
  techId: string;
}
