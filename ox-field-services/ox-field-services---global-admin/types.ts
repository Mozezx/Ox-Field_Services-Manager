export enum TenantStatus {
  ACTIVE = 'Active',
  SUSPENDED = 'Suspended',
  PROVISIONING = 'Provisioning',
  DELINQUENT = 'Delinquent'
}

export interface Tenant {
  id: string;
  name: string;
  domain: string;
  users: number;
  mrr: number;
  status: TenantStatus;
  healthScore: number; // 0-100
  region: string;
  lastAudit: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'CRIT' | 'SEC';
  service: string;
  message: string;
  user?: string;
}

export interface MetricPoint {
  name: string;
  value: number;
  value2?: number;
}