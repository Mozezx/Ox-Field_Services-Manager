import React, { useState, useEffect } from 'react';
import { Copy, Loader2, Link2, Plus, Users } from 'lucide-react';
import { empresaService, ClientListItem } from '../services/empresa';

export const ClientsView: React.FC = () => {
  const [clientInviteLink, setClientInviteLink] = useState<string>('');
  const [clientInviteLoading, setClientInviteLoading] = useState(false);
  const [clientCopied, setClientCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [clients, setClients] = useState<ClientListItem[]>([]);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [clientsError, setClientsError] = useState<string | null>(null);

  useEffect(() => {
    const loadClients = async () => {
      try {
        setClientsLoading(true);
        setClientsError(null);
        const list = await empresaService.getClients();
        setClients(list);
      } catch (err: unknown) {
        console.error('Failed to load clients:', err);
        const res = (err as { response?: { data?: { message?: string }; status?: number } })?.response;
        const status = res?.status;
        const msg = res?.data?.message;
        if (status === 401 || status === 403) {
          setClientsError('Session expired or no permission. Please log in again.');
        } else if (msg && typeof msg === 'string') {
          setClientsError(msg);
        } else {
          setClientsError('Could not load clients. Please try again later.');
        }
      } finally {
        setClientsLoading(false);
      }
    };
    loadClients();
  }, []);

  const handleGenerateClientInvite = async () => {
    try {
      setClientInviteLoading(true);
      setError(null);
      const data = await empresaService.createClientInvite();
      setClientInviteLink(data.inviteLink ?? '');
    } catch (err: unknown) {
      console.error('Failed to create client invite:', err);
      const res = (err as { response?: { data?: { message?: string }; status?: number } })?.response;
      const msg = res?.data?.message;
      const status = res?.status;
      if (status === 401 || status === 403) {
        setError('Session expired or no permission. Please log in again.');
      } else if (msg && typeof msg === 'string') {
        setError(msg);
      } else {
        setError('Could not generate client invite link. Check connection and try again.');
      }
    } finally {
      setClientInviteLoading(false);
    }
  };

  const handleCopyClientLink = async () => {
    if (!clientInviteLink) return;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(clientInviteLink);
      } else {
        const input = document.querySelector<HTMLInputElement>('#client-invite-link-input');
        if (input) {
          input.select();
          input.setSelectionRange(0, clientInviteLink.length);
          if (!document.execCommand('copy')) throw new Error('execCommand failed');
        } else throw new Error('Input not found');
      }
      setClientCopied(true);
      setTimeout(() => setClientCopied(false), 2000);
    } catch {
      setError('Could not copy. Select and copy the link manually.');
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-2">Clients</h1>
      <p className="text-secondary mb-8">
        Invite clients to join your company so they can receive service orders.
      </p>

      {error && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-amber-400 text-sm mb-6">
          {error}
        </div>
      )}

      <div className="bg-surface border border-white/10 rounded-xl p-6">
        <div className="flex items-center gap-2 text-white font-semibold mb-2">
          <Link2 size={20} className="text-primary" />
          Invite link for clients
        </div>
        <p className="text-secondary text-sm mb-3">
          Generate a unique link to send to <strong>clients</strong>. When they open the link, they can sign up or log in and will be associated with your company. You can then create service orders for them.
        </p>
        <div className="flex gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleGenerateClientInvite}
            disabled={clientInviteLoading}
            className="flex items-center gap-2 px-4 py-3 rounded-lg font-semibold transition-opacity disabled:opacity-50 border-2 border-[#22D3EE] bg-[#22D3EE] text-[#0B242A] hover:bg-[#06B6D4] hover:border-[#06B6D4] shadow-md"
          >
            {clientInviteLoading ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
            Generate invite link
          </button>
          {clientInviteLink && (
            <div className="flex gap-2 flex-1 min-w-0 w-full mt-2">
              <input
                id="client-invite-link-input"
                type="text"
                readOnly
                value={clientInviteLink}
                className="flex-1 min-w-0 rounded-lg border border-white/10 bg-[#0f2a30] px-4 py-3 text-white text-sm font-mono"
              />
              <button
                type="button"
                onClick={handleCopyClientLink}
                className="flex items-center gap-2 px-4 py-3 rounded-lg bg-white/10 text-white font-semibold hover:bg-white/20 transition-colors shrink-0"
              >
                <Copy size={18} />
                {clientCopied ? 'Copied!' : 'Copy link'}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 bg-surface border border-white/10 rounded-xl p-6">
        <div className="flex items-center gap-2 text-white font-semibold mb-4">
          <Users size={20} className="text-primary" />
          All clients
        </div>
        {clientsLoading && (
          <div className="flex items-center justify-center py-12 text-secondary">
            <Loader2 size={32} className="animate-spin" />
          </div>
        )}
        {!clientsLoading && clientsError && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-amber-400 text-sm">
            {clientsError}
          </div>
        )}
        {!clientsLoading && !clientsError && clients.length === 0 && (
          <p className="text-secondary text-sm">
            No clients yet. Use the invite link above to invite clients to your company.
          </p>
        )}
        {!clientsLoading && !clientsError && clients.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-secondary">
                  <th className="pb-3 pr-4 font-semibold">Name</th>
                  <th className="pb-3 pr-4 font-semibold">Email</th>
                  <th className="pb-3 pr-4 font-semibold">Phone</th>
                  <th className="pb-3 pr-4 font-semibold">Company</th>
                  <th className="pb-3 font-semibold">Address</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((c) => (
                  <tr key={c.id} className="border-b border-white/5 text-white">
                    <td className="py-3 pr-4">{c.name}</td>
                    <td className="py-3 pr-4">{c.email}</td>
                    <td className="py-3 pr-4">{c.phone ?? '—'}</td>
                    <td className="py-3 pr-4">{c.companyName ?? '—'}</td>
                    <td className="py-3">{c.primaryAddress ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
