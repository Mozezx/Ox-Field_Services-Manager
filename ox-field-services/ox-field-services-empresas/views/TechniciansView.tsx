import React, { useState, useEffect } from 'react';
import { Users, Copy, Loader2, Link2, Plus } from 'lucide-react';
import { empresaService, Technician } from '../services/empresa';

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'SUSPENDED', label: 'Suspended' },
];

function getStatusDisplay(status: string) {
  switch (status) {
    case 'PENDING':
      return { text: 'Pending', color: 'bg-amber-500/10 text-amber-500' };
    case 'APPROVED':
      return { text: 'Approved', color: 'bg-green-500/10 text-green-500' };
    case 'REJECTED':
      return { text: 'Rejected', color: 'bg-red-500/10 text-red-500' };
    case 'SUSPENDED':
      return { text: 'Suspended', color: 'bg-gray-500/10 text-gray-500' };
    default:
      return { text: status, color: 'bg-gray-500/10 text-gray-500' };
  }
}

export const TechniciansView: React.FC = () => {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [inviteLink, setInviteLink] = useState<string>('');
  const [inviteToken, setInviteToken] = useState<string>('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    const fetchTechnicians = async () => {
      try {
        setLoading(true);
        const data = await empresaService.getTechnicians(statusFilter || undefined);
        setTechnicians(data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch technicians:', err);
        setError('Could not load technicians.');
      } finally {
        setLoading(false);
      }
    };

    fetchTechnicians();
  }, [statusFilter]);

  const handleGenerateInvite = async () => {
    try {
      setInviteLoading(true);
      setError(null);
      const data = await empresaService.createInvite();
      const raw = data as { token?: string; inviteLink?: string; invite_link?: string };
      const token = raw.token ?? '';
      const link = raw.inviteLink ?? raw.invite_link ?? '';
      if (token || link) {
        setInviteToken(token);
        setInviteLink(link);
      } else {
        setError('Invite was generated but not returned. Try again.');
      }
    } catch (err: unknown) {
      console.error('Failed to create invite:', err);
      const res = (err as { response?: { data?: { message?: string }; status?: number } })?.response;
      const msg = res?.data?.message;
      const status = res?.status;
      if (status === 401 || status === 403) {
        setError('Session expired or no permission. Please log in again.');
      } else if (msg && typeof msg === 'string') {
        setError(msg);
      } else {
        setError('Could not generate invite link. Check connection and try again.');
      }
    } finally {
      setInviteLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (!inviteLink) return;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(inviteLink);
      } else {
        const input = document.querySelector<HTMLInputElement>('#invite-link-input');
        if (input) {
          input.select();
          input.setSelectionRange(0, inviteLink.length);
          if (!document.execCommand('copy')) throw new Error('execCommand failed');
        } else throw new Error('Input not found');
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Could not copy. Select and copy the link manually.');
    }
  };

  const handleCopyCode = async () => {
    if (!inviteToken) return;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(inviteToken);
      } else {
        const input = document.querySelector<HTMLInputElement>('#invite-code-input');
        if (input) {
          input.select();
          input.setSelectionRange(0, inviteToken.length);
          if (!document.execCommand('copy')) throw new Error('execCommand failed');
        } else throw new Error('Input not found');
      }
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      setError('Could not copy code.');
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-2">Technicians</h1>
      <p className="text-secondary mb-8">View registered technicians and invite new ones with a unique link or code for those not yet in the system.</p>

      {/* Invite link/code for new technicians */}
      <div className="bg-surface border border-white/10 rounded-xl p-6 mb-8">
        <div className="flex items-center gap-2 text-white font-semibold mb-2">
          <Link2 size={20} className="text-primary" />
          Invite link for new technicians
        </div>
        <p className="text-secondary text-sm mb-3">
          Generate a unique link or code for each <strong>technician who is not yet registered</strong>. Send one per person; when they open the app and complete registration, they will be linked to your company. After you approve them, they can receive service orders.
        </p>
        <div className="flex gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleGenerateInvite}
            disabled={inviteLoading}
            className="flex items-center gap-2 px-4 py-3 rounded-lg font-semibold transition-opacity disabled:opacity-50 border-2 border-[#22D3EE] bg-[#22D3EE] text-[#0B242A] hover:bg-[#06B6D4] hover:border-[#06B6D4] shadow-md"
          >
            {inviteLoading ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
            Generate invite link
          </button>
          {(inviteLink || inviteToken) && (
            <>
              {inviteToken && (
                <div className="mb-3">
                  <p className="text-secondary text-xs font-medium mb-1">Invite code (UUID) — send this code to the technician to paste in the app</p>
                  <div className="flex gap-2 flex-wrap">
                    <input
                      id="invite-code-input"
                      type="text"
                      readOnly
                      value={inviteToken}
                      className="flex-1 min-w-[200px] rounded-lg border border-white/10 bg-[#0f2a30] px-4 py-3 text-white text-sm font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className="flex items-center gap-2 px-4 py-3 rounded-lg bg-white/10 text-white font-semibold hover:bg-white/20 transition-colors shrink-0"
                    >
                      <Copy size={18} />
                      {copiedCode ? 'Copied!' : 'Copy code'}
                    </button>
                  </div>
                </div>
              )}
              {inviteLink && (
                <div className="flex gap-2 flex-1 min-w-0">
                  <input
                    id="invite-link-input"
                    type="text"
                    readOnly
                    value={inviteLink}
                    className="flex-1 min-w-0 rounded-lg border border-white/10 bg-[#0f2a30] px-4 py-3 text-white text-sm font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="flex items-center gap-2 px-4 py-3 rounded-lg bg-white/10 text-white font-semibold hover:bg-white/20 transition-colors shrink-0"
                  >
                    <Copy size={18} />
                    {copied ? 'Copied!' : 'Copy link'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Filter and list */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <label htmlFor="status-filter" className="text-sm text-secondary">Status:</label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-white/10 bg-surface px-3 py-2 text-white text-sm focus:ring-2 focus:ring-primary"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value || 'all'} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div className="text-secondary text-sm">
          {technicians.length} technician(s)
        </div>
      </div>

      {error && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-amber-400 text-sm mb-4">
          {error}
        </div>
      )}

      <div className="bg-surface border border-white/10 rounded-xl overflow-hidden shadow-lg">
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-2 text-secondary">
            <Loader2 size={24} className="animate-spin" />
            Loading technicians...
          </div>
        ) : technicians.length === 0 ? (
          <div className="py-16 text-center text-secondary">
            <Users size={48} className="mx-auto mb-4 opacity-50" />
            <p>No technicians found.</p>
            <p className="text-sm mt-1">Use the invite link above so new technicians can register.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-12 gap-4 p-4 border-b border-white/10 bg-[#0f2a30] text-xs font-bold text-secondary uppercase tracking-wider">
              <div className="col-span-4">Technician</div>
              <div className="col-span-3">Contact</div>
              <div className="col-span-3">Skills</div>
              <div className="col-span-2 text-right">Status</div>
            </div>
            {technicians.map((tech) => {
              const status = getStatusDisplay(tech.status);
              return (
                <div
                  key={tech.id}
                  className="grid grid-cols-12 gap-4 p-4 border-b border-white/5 items-center transition-colors hover:bg-white/5"
                >
                  <div className="col-span-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
                      {tech.avatarUrl ? (
                        <img src={tech.avatarUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Users size={20} className="text-secondary" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-white">{tech.name}</p>
                      {tech.role && <p className="text-xs text-secondary">{tech.role}</p>}
                    </div>
                  </div>
                  <div className="col-span-3">
                    <p className="text-white text-sm">{tech.email}</p>
                    {tech.phone && <p className="text-xs text-secondary">{tech.phone}</p>}
                  </div>
                  <div className="col-span-3">
                    <div className="flex flex-wrap gap-1">
                      {(tech.skills || []).slice(0, 3).map((s) => (
                        <span key={s} className="px-2 py-0.5 rounded bg-white/10 text-xs text-secondary">
                          {s}
                        </span>
                      ))}
                      {(tech.skills?.length || 0) > 3 && (
                        <span className="text-xs text-secondary">+{(tech.skills?.length || 0) - 3}</span>
                      )}
                    </div>
                  </div>
                  <div className="col-span-2 text-right">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${status.color}`}>
                      {status.text}
                    </span>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
};
