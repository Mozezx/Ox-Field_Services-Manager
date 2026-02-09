import { Tenant, TenantStatus, LogEntry, MetricPoint } from './types';

export const MOCK_TENANTS: Tenant[] = [
  { id: 't-001', name: 'Acme Logistics', domain: 'acme.oxfield.io', users: 1420, mrr: 12500, status: TenantStatus.ACTIVE, healthScore: 98, region: 'US-East', lastAudit: '2023-10-24' },
  { id: 't-002', name: 'Global Freight', domain: 'global.oxfield.io', users: 850, mrr: 8200, status: TenantStatus.ACTIVE, healthScore: 92, region: 'EU-West', lastAudit: '2023-10-23' },
  { id: 't-003', name: 'Rapid Delivery', domain: 'rapid.oxfield.io', users: 3200, mrr: 28000, status: TenantStatus.DELINQUENT, healthScore: 45, region: 'US-West', lastAudit: '2023-10-20' },
  { id: 't-004', name: 'Construct Co', domain: 'construct.oxfield.io', users: 120, mrr: 1200, status: TenantStatus.PROVISIONING, healthScore: 100, region: 'AP-South', lastAudit: '2023-10-25' },
  { id: 't-005', name: 'Urban Services', domain: 'urban.oxfield.io', users: 560, mrr: 4800, status: TenantStatus.SUSPENDED, healthScore: 20, region: 'US-East', lastAudit: '2023-10-15' },
  { id: 't-006', name: 'TechField Ops', domain: 'tech.oxfield.io', users: 2100, mrr: 18500, status: TenantStatus.ACTIVE, healthScore: 88, region: 'EU-Central', lastAudit: '2023-10-24' },
];

export const MOCK_LOGS: LogEntry[] = [
  { id: 'l-992', timestamp: '10:42:12', level: 'INFO', service: 'Auth', message: 'User login successful', user: 'admin@acme.com' },
  { id: 'l-993', timestamp: '10:42:15', level: 'WARN', service: 'Billing', message: 'Payment gateway latency > 500ms' },
  { id: 'l-994', timestamp: '10:43:01', level: 'CRIT', service: 'Infra', message: 'Pod eviction detected on node-us-e-4', user: 'System' },
  { id: 'l-995', timestamp: '10:44:22', level: 'SEC', service: 'Access', message: 'Impersonation session started', user: 'SuperAdmin' },
  { id: 'l-996', timestamp: '10:45:00', level: 'INFO', service: 'API', message: 'Rate limit quota updated for t-003' },
];

export const GROWTH_DATA: MetricPoint[] = [
  { name: 'Jan', value: 4000, value2: 2400 },
  { name: 'Feb', value: 3000, value2: 1398 },
  { name: 'Mar', value: 2000, value2: 9800 },
  { name: 'Apr', value: 2780, value2: 3908 },
  { name: 'May', value: 1890, value2: 4800 },
  { name: 'Jun', value: 2390, value2: 3800 },
  { name: 'Jul', value: 3490, value2: 4300 },
];

export const SERVER_LOAD_DATA: MetricPoint[] = [
  { name: '00:00', value: 20 },
  { name: '04:00', value: 15 },
  { name: '08:00', value: 65 },
  { name: '12:00', value: 85 },
  { name: '16:00', value: 75 },
  { name: '20:00', value: 40 },
];