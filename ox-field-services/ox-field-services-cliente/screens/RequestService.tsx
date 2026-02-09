import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export const RequestService = () => {
  const navigate = useNavigate();
  const { addresses, loadAddresses, serviceRequestFlow, setServiceRequestFlow, updateServiceRequestFlow } = useApp();

  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Require flow from marketplace (company already chosen)
  useEffect(() => {
    if (!serviceRequestFlow?.selectedTenantId) {
      navigate('/marketplace', { replace: true });
      return;
    }
  }, [serviceRequestFlow, navigate]);

  useEffect(() => {
    const fetchAddresses = async () => {
      setIsLoading(true);
      await loadAddresses();
      setIsLoading(false);
    };
    fetchAddresses();
  }, [loadAddresses]);

  useEffect(() => {
    if (addresses.length > 0 && !selectedAddressId) {
      const defaultAddr = addresses.find(a => a.isDefault) || addresses[0];
      setSelectedAddressId(defaultAddr.id);
    }
  }, [addresses, selectedAddressId]);

  const handleContinue = () => {
    const selectedAddress = addresses.find(a => a.id === selectedAddressId);
    if (!selectedAddress) return;

    updateServiceRequestFlow({
      description,
      addressId: selectedAddressId,
      addressLabel: selectedAddress?.fullAddress || selectedAddress?.label || 'Unknown',
      addressLatitude: (selectedAddress as { latitude?: number })?.latitude,
      addressLongitude: (selectedAddress as { longitude?: number })?.longitude
    });

    navigate('/schedule');
  };

  const isFormValid = !!selectedAddressId;

  if (!serviceRequestFlow?.selectedTenantId) {
    return null;
  }

  return (
    <div className="flex flex-col min-h-screen bg-background-dark pb-8">
      <header className="px-4 pt-6 pb-2 border-b border-white/5 z-20 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="flex size-10 items-center justify-center rounded-full hover:bg-surface-dark transition-colors">
          <span className="material-symbols-outlined text-white">arrow_back</span>
        </button>
        <h1 className="text-lg font-bold text-white">Address & Details</h1>
        <button onClick={() => navigate('/home')} className="flex h-10 items-center justify-center px-2 hover:bg-surface-dark rounded-full transition-colors">
          <span className="text-text-muted text-sm font-medium">Cancel</span>
        </button>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-6 no-scrollbar animate-fade-in">
        {/* Summary: service and company from marketplace */}
        <div className="mb-6 p-4 rounded-2xl bg-surface-dark border border-white/5">
          <p className="text-gray-400 text-sm">Service</p>
          <p className="text-white font-semibold">{serviceRequestFlow.listingTitle || serviceRequestFlow.category}</p>
          <p className="text-gray-400 text-sm mt-1">Provider: {serviceRequestFlow.selectedCompanyName}</p>
        </div>

        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-surface-dark border border-white/5 space-y-3">
            <label className="block space-y-3">
              <span className="text-white text-base font-bold">Where is the issue?</span>
              <div className="relative">
                {isLoading ? (
                  <div className="w-full h-14 pl-12 pr-10 bg-background-dark border border-white/10 rounded-xl flex items-center">
                    <span className="text-gray-500">Loading addresses...</span>
                  </div>
                ) : (
                  <select
                    value={selectedAddressId}
                    onChange={(e) => setSelectedAddressId(e.target.value)}
                    className="w-full h-14 pl-12 pr-10 bg-background-dark border border-white/10 rounded-xl text-white font-medium focus:ring-2 focus:ring-primary focus:border-primary appearance-none transition-colors"
                  >
                    {addresses.map(addr => (
                      <option key={addr.id} value={addr.id}>
                        {addr.label || addr.fullAddress}
                      </option>
                    ))}
                  </select>
                )}
                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                  <span className="material-symbols-outlined filled">location_on</span>
                </div>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                  <span className="material-symbols-outlined">expand_more</span>
                </div>
              </div>
            </label>
          </div>

          <div className="p-5 rounded-2xl bg-surface-dark border border-white/5 space-y-3">
            <label className="block space-y-3">
              <span className="text-white text-base font-bold">Describe the problem</span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full min-h-[140px] p-4 bg-background-dark border border-white/10 rounded-xl text-white placeholder-gray-500 font-normal focus:ring-2 focus:ring-primary focus:border-primary resize-none transition-colors"
                placeholder="Please describe the issue in detail..."
              />
            </label>
          </div>

          <div className="p-5 rounded-2xl bg-surface-dark border border-white/5 space-y-4">
            <div>
              <h3 className="text-base font-bold text-white">Photos</h3>
              <p className="text-sm text-gray-400 mt-1">Photos help us diagnose the issue faster</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <button type="button" className="aspect-square flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-white/20 bg-white/5 hover:bg-white/10 transition-colors group">
                <span className="material-symbols-outlined text-white group-hover:scale-110 transition-transform">add_a_photo</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      <div className="px-4 py-4 bg-background-dark border-t border-white/5">
        <button
          onClick={handleContinue}
          disabled={!isFormValid}
          className="w-full bg-primary disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-light text-white font-bold h-14 rounded-full shadow-lg shadow-primary/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
        >
          <span>Continue</span>
          <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
        </button>
      </div>
    </div>
  );
};
