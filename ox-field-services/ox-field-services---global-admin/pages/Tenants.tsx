import React, { useState, useEffect } from 'react';
import { 
  Eye, 
  MoreHorizontal, 
  Download,
  Plus,
  Loader2,
  Search,
  RefreshCw,
  ArrowLeft,
  Users,
  ChevronRight,
  FileText
} from 'lucide-react';
import { MOCK_TENANTS } from '../constants';
import { Tenant as TenantType, TenantStatus } from '../types';
import { adminService, Tenant as ApiTenant, TechnicianWithTenant, TechnicianDocument } from '../services/admin';

interface TenantProps {
  onImpersonate: (tenant: TenantType) => void;
}

type TenantView = 'list' | 'technicians' | 'technicianDetail';

const TenantManagement: React.FC<TenantProps> = ({ onImpersonate }) => {
  const [tenants, setTenants] = useState<TenantType[]>(MOCK_TENANTS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [view, setView] = useState<TenantView>('list');
  const [selectedTenant, setSelectedTenant] = useState<TenantType | null>(null);
  const [tenantTechnicians, setTenantTechnicians] = useState<TechnicianWithTenant[]>([]);
  const [techniciansLoading, setTechniciansLoading] = useState(false);
  const [selectedTechnician, setSelectedTechnician] = useState<TechnicianWithTenant | null>(null);
  const [technicianDocuments, setTechnicianDocuments] = useState<TechnicianDocument[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await adminService.getTenants({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: searchTerm || undefined
      });
      
      // Transform API response to match our UI type
      const transformedTenants: TenantType[] = response.tenants.map(t => ({
        id: t.id,
        name: t.name,
        domain: t.domain,
        status: (t.status === 'active' ? TenantStatus.ACTIVE :
                 t.status === 'suspended' ? TenantStatus.SUSPENDED :
                 t.status === 'pending' ? TenantStatus.PROVISIONING :
                 TenantStatus.DELINQUENT) as TenantStatus,
        region: t.region,
        users: t.userCount,
        mrr: t.mrr,
        healthScore: 85 // API doesn't provide this, use default
      }));
      
      setTenants(transformedTenants);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch tenants:', err);
      setError('Using cached data - API unavailable');
      // Keep using mock data
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const filteredTenants = tenants.filter(t => {
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return t.name.toLowerCase().includes(search) || 
             t.domain.toLowerCase().includes(search);
    }
    return true;
  });
  
  const getStatusColor = (status: TenantStatus) => {
    switch (status) {
      case TenantStatus.ACTIVE: return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case TenantStatus.SUSPENDED: return 'bg-red-500/10 text-red-400 border-red-500/20';
      case TenantStatus.PROVISIONING: return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case TenantStatus.DELINQUENT: return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      default: return 'bg-slate-700 text-slate-300';
    }
  };

  const openTechnicians = async (tenant: TenantType) => {
    setSelectedTenant(tenant);
    setView('technicians');
    setTechniciansLoading(true);
    setTenantTechnicians([]);
    try {
      const list = await adminService.getTenantTechnicians(tenant.id);
      setTenantTechnicians(list);
    } catch (err) {
      console.error('Failed to load technicians:', err);
      setTenantTechnicians([]);
    } finally {
      setTechniciansLoading(false);
    }
  };

  const openTechnicianDetail = (tech: TechnicianWithTenant) => {
    setSelectedTechnician(tech);
    setView('technicianDetail');
    setDocsLoading(true);
    setTechnicianDocuments([]);
    adminService.getTechnicianDocuments(tech.id)
      .then(setTechnicianDocuments)
      .catch(() => setTechnicianDocuments([]))
      .finally(() => setDocsLoading(false));
  };

  const backToTechnicians = () => {
    setView('technicians');
    setSelectedTechnician(null);
    setTechnicianDocuments([]);
  };

  const backToList = () => {
    setView('list');
    setSelectedTenant(null);
    setTenantTechnicians([]);
    setSelectedTechnician(null);
    setTechnicianDocuments([]);
  };

  // Tenant technicians view (read-only)
  if (view === 'technicians' && selectedTenant) {
    return (
      <div className="p-6 lg:p-8 max-w-[1600px] mx-auto h-full flex flex-col">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={backToList} className="p-2 text-slate-400 hover:text-white rounded-lg border border-dark-700 hover:bg-dark-800">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">Technicians · {selectedTenant.name}</h1>
            <p className="text-slate-400 text-sm">Read-only view. Approvals are done by company admins.</p>
          </div>
        </div>
        {techniciansLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 text-ox-500 animate-spin" />
          </div>
        ) : (
          <div className="bg-dark-900 border border-dark-800 rounded-lg overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead className="bg-dark-950 text-slate-500 text-xs uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-6 py-4 border-b border-dark-700">Name</th>
                  <th className="px-6 py-4 border-b border-dark-700">Email</th>
                  <th className="px-6 py-4 border-b border-dark-700">Status</th>
                  <th className="px-6 py-4 border-b border-dark-700">Role</th>
                  <th className="px-6 py-4 border-b border-dark-700 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-800 text-sm">
                {tenantTechnicians.map((tech) => (
                  <tr key={tech.id} className="hover:bg-dark-800/50">
                    <td className="px-6 py-4 font-medium text-white">{tech.name}</td>
                    <td className="px-6 py-4 text-slate-400">{tech.email}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        tech.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        tech.status === 'PENDING' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                        'bg-slate-700 text-slate-300 border-slate-600'
                      }`}>{tech.status}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-400">{tech.role || '—'}</td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => openTechnicianDetail(tech)} className="text-ox-500 hover:text-ox-400 flex items-center justify-end gap-1 w-full">
                        View details <ChevronRight className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {tenantTechnicians.length === 0 && (
              <div className="py-12 text-center text-slate-500">No technicians for this tenant.</div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Technician detail view (read-only: details + documents)
  if (view === 'technicianDetail' && selectedTechnician) {
    return (
      <div className="p-6 lg:p-8 max-w-[1600px] mx-auto h-full flex flex-col">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={backToTechnicians} className="p-2 text-slate-400 hover:text-white rounded-lg border border-dark-700 hover:bg-dark-800">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">{selectedTechnician.name}</h1>
            <p className="text-slate-400 text-sm">{selectedTechnician.email} · {selectedTechnician.tenantName || selectedTenant?.name}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-dark-900 border border-dark-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Details</h2>
            <dl className="space-y-2 text-sm">
              <div><span className="text-slate-500">Status</span><span className="ml-2 text-white">{selectedTechnician.status}</span></div>
              <div><span className="text-slate-500">Role</span><span className="ml-2 text-slate-300">{selectedTechnician.role || '—'}</span></div>
              <div><span className="text-slate-500">Phone</span><span className="ml-2 text-slate-300">{selectedTechnician.phone || '—'}</span></div>
              <div><span className="text-slate-500">Rating</span><span className="ml-2 text-slate-300">{selectedTechnician.rating ?? '—'}</span></div>
              <div><span className="text-slate-500">Online</span><span className="ml-2 text-slate-300">{selectedTechnician.isOnline ? 'Yes' : 'No'}</span></div>
            </dl>
          </div>
          <div className="bg-dark-900 border border-dark-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Documents</h2>
            {docsLoading ? (
              <Loader2 className="h-6 w-6 text-ox-500 animate-spin" />
            ) : technicianDocuments.length === 0 ? (
              <p className="text-slate-500 text-sm">No documents uploaded.</p>
            ) : (
              <ul className="space-y-2">
                {technicianDocuments.map((doc) => (
                  <li key={doc.id} className="flex items-center gap-3 text-sm">
                    <FileText className="h-4 w-4 text-slate-500" />
                    <span className="text-slate-300">{doc.fileName}</span>
                    <span className="text-slate-500 text-xs">({doc.type} · {doc.status})</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Tenant Management</h1>
          <p className="text-slate-400 mt-1">Manage global instances, access control, and onboarding.</p>
        </div>
        <div className="flex items-center gap-3">
          {loading && <Loader2 className="h-5 w-5 text-ox-500 animate-spin" />}
          <button className="flex items-center gap-2 px-4 py-2 bg-dark-800 hover:bg-dark-700 text-slate-300 rounded border border-dark-700 text-sm transition-colors">
            <Download className="h-4 w-4" />
            Export
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-ox-900 hover:bg-ox-800 text-white font-medium rounded border border-ox-700 text-sm transition-colors shadow-lg shadow-ox-900/20">
            <Plus className="h-4 w-4" />
            New Tenant
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-400 text-sm">
          {error}
        </div>
      )}

      <div className="bg-dark-900 border border-dark-800 rounded-lg flex flex-col flex-1 overflow-hidden shadow-xl">
        {/* Toolbar */}
        <div className="p-4 border-b border-dark-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-dark-800/50">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search tenants..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-1.5 bg-dark-950 border border-dark-700 rounded text-sm text-white placeholder-slate-500 focus:outline-none focus:border-ox-500 w-48"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 bg-dark-800 text-slate-300 text-sm rounded border border-dark-700 focus:outline-none focus:border-ox-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="pending">Pending</option>
            </select>
            <button 
              onClick={fetchData}
              disabled={loading}
              className="p-1.5 bg-dark-800 text-slate-400 rounded border border-dark-700 hover:text-white disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <div className="h-6 w-px bg-dark-700 mx-2"></div>
            <span className="text-sm text-slate-400">Showing <span className="text-white font-mono">{filteredTenants.length}</span> tenants</span>
          </div>
          <div className="flex gap-2">
             <span className="text-xs text-ox-500 font-medium cursor-pointer hover:underline">New Requests (2)</span>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead className="bg-dark-950 text-slate-500 text-xs uppercase tracking-wider font-semibold sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4 border-b border-dark-700">Tenant Name</th>
                <th className="px-6 py-4 border-b border-dark-700">Status</th>
                <th className="px-6 py-4 border-b border-dark-700">Region</th>
                <th className="px-6 py-4 border-b border-dark-700 text-right">Users</th>
                <th className="px-6 py-4 border-b border-dark-700 text-right">MRR</th>
                <th className="px-6 py-4 border-b border-dark-700">Health</th>
                <th className="px-6 py-4 border-b border-dark-700 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-800 text-sm">
              {filteredTenants.map((tenant) => (
                <tr key={tenant.id} className="group hover:bg-dark-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded bg-dark-800 flex items-center justify-center text-slate-400 text-xs font-bold border border-dark-700 group-hover:border-ox-700 group-hover:text-ox-400 transition-colors">
                        {tenant.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-white group-hover:text-ox-400 transition-colors">{tenant.name}</div>
                        <div className="text-xs text-slate-500 font-mono">{tenant.domain}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(tenant.status)}`}>
                      {tenant.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-400 font-mono text-xs">
                    {tenant.region}
                  </td>
                  <td className="px-6 py-4 text-right text-slate-300 font-mono">
                    {tenant.users.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right text-slate-300 font-mono">
                    ${tenant.mrr.toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-dark-800 rounded-full overflow-hidden w-24">
                        <div 
                          className={`h-full rounded-full ${
                            tenant.healthScore > 90 ? 'bg-emerald-500' : 
                            tenant.healthScore > 60 ? 'bg-amber-500' : 'bg-red-500'
                          }`} 
                          style={{ width: `${tenant.healthScore}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-500 w-8 text-right">{tenant.healthScore}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => openTechnicians(tenant)}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-dark-700 rounded transition-colors group/btn"
                        title="View technicians"
                      >
                        <Users className="h-4 w-4 group-hover/btn:text-ox-400" />
                      </button>
                      <button 
                        onClick={() => onImpersonate(tenant)}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-dark-700 rounded transition-colors group/btn"
                        title="Impersonate"
                      >
                        <Eye className="h-4 w-4 group-hover/btn:text-ox-400" />
                      </button>
                      <button className="p-1.5 text-slate-400 hover:text-white hover:bg-dark-700 rounded transition-colors">
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="p-4 border-t border-dark-800 bg-dark-800/30 flex items-center justify-between text-xs text-slate-500">
          <span>Showing 1-{filteredTenants.length} of {filteredTenants.length} tenants</span>
          <div className="flex gap-2">
            <button className="px-3 py-1 rounded bg-dark-800 border border-dark-700 hover:text-white disabled:opacity-50" disabled>Prev</button>
            <button className="px-3 py-1 rounded bg-dark-800 border border-dark-700 hover:text-white" disabled>Next</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TenantManagement;
