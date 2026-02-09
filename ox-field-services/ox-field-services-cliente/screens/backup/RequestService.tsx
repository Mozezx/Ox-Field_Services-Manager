import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export const RequestService = () => {
  const navigate = useNavigate();
  const { addresses, loadAddresses, setServiceRequestFlow } = useApp();

  const [selectedType, setSelectedType] = useState('');
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Load addresses on mount
  useEffect(() => {
    const fetchAddresses = async () => {
      setIsLoading(true);
      await loadAddresses();
      setIsLoading(false);
    };
    fetchAddresses();
  }, []);

  // Set default address when addresses load
  useEffect(() => {
    if (addresses.length > 0 && !selectedAddressId) {
      const defaultAddr = addresses.find(a => a.isDefault) || addresses[0];
      setSelectedAddressId(defaultAddr.id);
    }
  }, [addresses]);

  const handleContinue = () => {
    const selectedAddress = addresses.find(a => a.id === selectedAddressId);

    // Initialize the service request flow in context
    setServiceRequestFlow({
      category: selectedType,
      description: description,
      addressId: selectedAddressId,
      addressLabel: selectedAddress?.fullAddress || selectedAddress?.label || 'Unknown',
      preferredDate: '',
      preferredTime: '',
      // Passar localização do endereço para busca de empresas (se disponível)
      addressLatitude: (selectedAddress as any)?.latitude,
      addressLongitude: (selectedAddress as any)?.longitude
    });

    // Navegar para seleção de empresa (marketplace)
    navigate('/companies');
  };

  const isFormValid = selectedType && selectedAddressId;

  return (
    <div className="flex flex-col min-h-screen bg-background-dark pb-8">
      <header className="px-4 pt-6 pb-2 border-b border-white/5 z-20 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="flex size-10 items-center justify-center rounded-full hover:bg-surface-dark transition-colors">
          <span className="material-symbols-outlined text-white">arrow_back</span>
        </button>
        <h1 className="text-lg font-bold text-white">Request Service</h1>
        <button onClick={() => navigate('/home')} className="flex h-10 items-center justify-center px-2 hover:bg-surface-dark rounded-full transition-colors">
          <span className="text-text-muted text-sm font-medium">Cancel</span>
        </button>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-6 no-scrollbar animate-fade-in">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-white mb-4">What do you need help with?</h2>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
            {['HVAC', 'Electrical', 'Plumbing', 'General'].map(type => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`flex shrink-0 items-center gap-x-2 rounded-full py-2.5 px-5 border transition-all ${selectedType === type
                    ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20'
                    : 'bg-surface-dark border-white/10 text-gray-300 hover:border-white/30'
                  }`}
              >
                <span className="material-symbols-outlined text-[20px]">
                  {type === 'HVAC' ? 'mode_fan' : type === 'Electrical' ? 'bolt' : type === 'Plumbing' ? 'water_drop' : 'build'}
                </span>
                <span className="text-sm font-semibold">{type}</span>
              </button>
            ))}
          </div>
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
              ></textarea>
            </label>
          </div>

          <div className="p-5 rounded-2xl bg-surface-dark border border-white/5 space-y-4">
            <div className="flex justify-between items-end">
              <div>
                <h3 className="text-base font-bold text-white">Photos</h3>
                <p className="text-sm text-gray-400 mt-1">Photos help us diagnose the issue faster</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <button className="aspect-square flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-white/20 bg-white/5 hover:bg-white/10 transition-colors group">
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