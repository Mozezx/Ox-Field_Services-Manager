import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { customerService, Address } from '../services/customer';

export const MyAddresses = () => {
  const navigate = useNavigate();
  const { addresses, loadAddresses, removeAddressById } = useApp();
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<Address | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    loadAddresses()
      .catch((e: any) => {
        if (!cancelled) setError(e.response?.data?.message || 'Error loading addresses.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [loadAddresses]);

  const handleDelete = async (addr: Address) => {
    setDeletingId(addr.id);
    setError(null);
    try {
      await customerService.deleteAddress(addr.id);
      removeAddressById(addr.id);
      setConfirmRemove(null);
      // Não chamar loadAddresses() aqui: a resposta pode vir antes do servidor persistir
      // e trazer o endereço de volta; a remoção otimista já deixa a lista correta.
    } catch (e: any) {
      const msg = e.response?.data?.message || e.message || 'Failed to remove address.';
      setError(msg);
      console.error('Delete address failed:', e.response?.data || e);
    } finally {
      setDeletingId(null);
    }
  };

  const setDefault = async (addr: Address) => {
    if (addr.isDefault) return;
    setError(null);
    try {
      await customerService.updateAddress(addr.id, { isDefault: true });
      await loadAddresses();
    } catch (e: any) {
      setError(e.response?.data?.message || 'Error setting default address.');
    }
  };

  const displayAddress = (addr: Address) =>
    addr.fullAddress || [addr.street, addr.city, addr.state].filter(Boolean).join(', ') || addr.label;

  return (
    <div className="flex flex-col min-h-screen bg-background-dark pb-8">
      <header className="px-4 pt-6 pb-2 border-b border-white/5 z-20 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex size-10 items-center justify-center rounded-full hover:bg-surface-dark transition-colors"
        >
          <span className="material-symbols-outlined text-white">arrow_back</span>
        </button>
        <h1 className="text-lg font-bold text-white">My Addresses</h1>
        <div className="size-10" />
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-6 no-scrollbar">
        {error && (
          <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <span className="material-symbols-outlined text-primary animate-spin text-4xl">sync</span>
          </div>
        ) : addresses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <span className="material-symbols-outlined text-white/50 text-5xl">location_off</span>
            <p className="text-gray-400 mt-4">No addresses yet</p>
            <p className="text-gray-500 text-sm mt-2 text-center px-4">
              Add an address to schedule services.
            </p>
            <button
              onClick={() => navigate('/add-address')}
              className="mt-6 px-6 py-3 border-2 border-white/50 text-white rounded-xl font-medium hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-white">add</span>
              Add Address
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-3 mb-6">
              {addresses.map((addr) => (
                <div
                  key={addr.id}
                  className="p-4 rounded-xl bg-surface-dark border border-white/5 flex items-start gap-3"
                >
                  <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-white text-lg">location_on</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white font-semibold">{addr.label}</span>
                      {addr.isDefault && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-white/20 text-white">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-gray-400 text-sm mt-1 line-clamp-2">{displayAddress(addr)}</p>
                    {!addr.isDefault && (
                      <button
                        type="button"
                        onClick={() => setDefault(addr)}
                        className="text-white text-xs font-medium mt-2 hover:underline"
                      >
                        Set as Default
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setConfirmRemove(addr)}
                    disabled={deletingId !== null}
                    className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                    aria-label="Remove address"
                  >
                    <span className="material-symbols-outlined text-[22px]">delete</span>
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={() => navigate('/add-address')}
              className="w-full h-14 rounded-full border-2 border-dashed border-white/50 text-white font-semibold flex items-center justify-center gap-2 hover:bg-white/10 transition-colors"
            >
              <span className="material-symbols-outlined text-white">add</span>
              Add Address
            </button>
          </>
        )}
      </main>

      {/* Modal de confirmação de exclusão */}
      {confirmRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => setConfirmRemove(null)}>
          <div
            className="bg-surface-dark border border-white/10 rounded-2xl p-5 w-full max-w-sm shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-white font-bold">Remove address?</p>
            <p className="text-gray-400 text-sm mt-2">{confirmRemove.label} – {displayAddress(confirmRemove)}</p>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setConfirmRemove(null)}
                className="flex-1 py-3 rounded-xl border border-white/20 text-white font-medium hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmRemove)}
                disabled={deletingId === confirmRemove.id}
                className="flex-1 py-3 rounded-xl bg-red-500/20 border border-red-500/50 text-red-400 font-medium hover:bg-red-500/30 disabled:opacity-50"
              >
                {deletingId === confirmRemove.id ? 'Removing...' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
