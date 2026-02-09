import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { customerService } from '../services/customer';
import { geocodingService, AddressSuggestion } from '../services/geocoding';

export const AddAddress = () => {
  const navigate = useNavigate();
  const { loadAddresses } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<AddressSuggestion | null>(null);
  const [label, setLabel] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualAddress, setManualAddress] = useState({
    street: '',
    city: '',
    state: '',
    postalCode: '',
    latitude: '',
    longitude: ''
  });

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Buscar endereços com debounce
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await geocodingService.searchAddresses(searchQuery);
        setSuggestions(results);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Erro ao buscar endereços');
        setSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    }, 500); // Debounce de 500ms

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Quando selecionar um endereço, preencher o label automaticamente
  useEffect(() => {
    if (selectedSuggestion && !label) {
      // Sugerir label baseado no tipo de endereço
      if (selectedSuggestion.street) {
        setLabel(selectedSuggestion.street.split(',')[0] || 'Casa');
      } else {
        setLabel('Casa');
      }
    }
  }, [selectedSuggestion, label]);

  const handleSelectSuggestion = (suggestion: AddressSuggestion) => {
    setSelectedSuggestion(suggestion);
    setSearchQuery(geocodingService.formatFullAddress(suggestion));
    setSuggestions([]);
  };

  const handleSave = async () => {
    if (!selectedSuggestion && !showManualForm) {
      setError('Por favor, selecione um endereço da lista ou preencha o formulário manual');
      return;
    }

    if (!label.trim()) {
      setError('Por favor, informe um nome para o endereço (ex: Casa, Trabalho)');
      return;
    }

    // Validar dados do formulário manual
    if (showManualForm) {
      if (!manualAddress.street.trim()) {
        setError('Por favor, informe a rua/endereço');
        return;
      }
      if (!manualAddress.city.trim()) {
        setError('Por favor, informe a cidade');
        return;
      }
      if (!manualAddress.state.trim()) {
        setError('Por favor, informe o estado');
        return;
      }
    }

    setIsSaving(true);
    setError(null);

    try {
      let addressData;
      
      if (showManualForm) {
        // Se não tiver coordenadas, tentar geocodificar
        let latitude: number | undefined = manualAddress.latitude ? parseFloat(manualAddress.latitude) : undefined;
        let longitude: number | undefined = manualAddress.longitude ? parseFloat(manualAddress.longitude) : undefined;

        if (!latitude || !longitude) {
          try {
            const coords = await geocodingService.geocodeAddress(
              manualAddress.street.trim(),
              manualAddress.city.trim(),
              manualAddress.state.trim(),
              manualAddress.postalCode.trim() || undefined
            );
            if (coords) {
              latitude = coords.latitude;
              longitude = coords.longitude;
            }
          } catch (err) {
            console.warn('Failed to geocode address:', err);
            // Continuar sem coordenadas - o backend pode tentar depois
          }
        }

        // Usar dados do formulário manual
        addressData = {
          label: label.trim(),
          street: manualAddress.street.trim(),
          city: manualAddress.city.trim(),
          state: manualAddress.state.trim(),
          postalCode: manualAddress.postalCode.trim() || '',
          country: 'Brasil',
          isDefault: false,
          latitude: latitude,
          longitude: longitude
        };
      } else {
        // Usar dados da sugestão selecionada
        addressData = {
          label: label.trim(),
          street: selectedSuggestion!.street || geocodingService.formatFullAddress(selectedSuggestion!),
          city: selectedSuggestion!.city || '',
          state: selectedSuggestion!.state || '',
          postalCode: selectedSuggestion!.postalCode || '',
          country: selectedSuggestion!.country || 'Brasil',
          isDefault: false,
          latitude: selectedSuggestion!.latitude,
          longitude: selectedSuggestion!.longitude
        };
      }

      await customerService.addAddress(addressData);

      // Recarregar endereços
      await loadAddresses();

      // Voltar para o perfil
      navigate('/profile');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao salvar endereço. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearSelection = () => {
    setSelectedSuggestion(null);
    setSearchQuery('');
    setLabel('');
    setSuggestions([]);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background-dark pb-8">
      {/* Header */}
      <header className="px-4 pt-6 pb-2 border-b border-white/5 z-20 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex size-10 items-center justify-center rounded-full hover:bg-surface-dark transition-colors"
        >
          <span className="material-symbols-outlined text-white">arrow_back</span>
        </button>
        <h1 className="text-lg font-bold text-white">Add Address</h1>
        <div className="size-10"></div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-6 no-scrollbar animate-fade-in">
        {/* Search Input */}
        <div className="mb-6">
          <label className="block mb-2">
            <span className="text-white text-base font-bold">Search Address</span>
            <p className="text-gray-400 text-sm mt-1">Digite o endereço completo ou parcial</p>
          </label>
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSelectedSuggestion(null);
              }}
              placeholder="Ex: Rua das Flores, 123, São Paulo, SP"
              className="w-full h-14 pl-12 pr-10 bg-background-dark border border-white/10 rounded-xl text-white font-medium focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
              disabled={isSaving}
            />
            <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
              <span className="material-symbols-outlined">search</span>
            </div>
            {isSearching && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <span className="material-symbols-outlined text-primary animate-spin">sync</span>
              </div>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Suggestions List */}
        {!selectedSuggestion && suggestions.length > 0 && (
          <div className="mb-6">
            <p className="text-gray-400 text-sm mb-3">
              {suggestions.length} {suggestions.length === 1 ? 'endereço encontrado' : 'endereços encontrados'}
            </p>
            <div className="space-y-2">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion.id}
                  onClick={() => handleSelectSuggestion(suggestion)}
                  className="w-full p-4 rounded-xl bg-surface-dark border border-white/5 hover:border-primary/50 transition-all text-left group"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-primary text-lg">location_on</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold truncate group-hover:text-primary transition-colors">
                        {suggestion.street || suggestion.displayName.split(',')[0]}
                      </p>
                      <p className="text-gray-400 text-sm mt-1 line-clamp-2">
                        {geocodingService.formatFullAddress(suggestion)}
                      </p>
                    </div>
                    <span className="material-symbols-outlined text-gray-500 group-hover:text-primary transition-colors shrink-0">
                      chevron_right
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Selected Address Details */}
        {selectedSuggestion && (
          <div className="mb-6">
            <div className="p-5 rounded-2xl bg-surface-dark border border-primary/30 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-primary text-xl">check_circle</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-bold">Endereço Selecionado</p>
                    <p className="text-gray-400 text-sm mt-1 break-words">
                      {geocodingService.formatFullAddress(selectedSuggestion)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleClearSelection}
                  className="text-gray-400 hover:text-white transition-colors shrink-0"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="h-px bg-white/10 w-full"></div>


              {/* Address Details */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-500 text-xs">Cidade</p>
                  <p className="text-white font-medium">{selectedSuggestion.city || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Estado</p>
                  <p className="text-white font-medium">{selectedSuggestion.state || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">CEP</p>
                  <p className="text-white font-medium">{selectedSuggestion.postalCode || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Coordenadas</p>
                  <p className="text-white font-medium text-xs">
                    {selectedSuggestion.latitude.toFixed(6)}, {selectedSuggestion.longitude.toFixed(6)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Empty State - Nenhum resultado encontrado */}
        {!selectedSuggestion && !showManualForm && !isSearching && searchQuery.trim().length >= 3 && suggestions.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <span className="material-symbols-outlined text-gray-500 text-5xl">location_off</span>
            <p className="text-gray-400 mt-4">Nenhum endereço encontrado</p>
            <p className="text-gray-500 text-sm mt-2 text-center px-4">
              O endereço pode não estar no banco de dados. Você pode:
            </p>
            <button
              onClick={() => {
                // Preencher formulário manual com dados da busca
                const parts = searchQuery.split(',').map(p => p.trim());
                setManualAddress({
                  street: parts[0] || searchQuery,
                  city: parts[1] || '',
                  state: parts[2] || '',
                  postalCode: parts[3] || '',
                  latitude: '',
                  longitude: ''
                });
                setShowManualForm(true);
              }}
              className="mt-4 px-6 py-3 bg-primary/20 border border-primary/50 text-primary rounded-xl font-medium hover:bg-primary/30 transition-colors"
            >
              Preencher manualmente
            </button>
            <p className="text-gray-500 text-xs mt-4 text-center px-4">
              Ou tente uma busca mais específica (ex: adicione cidade ou CEP)
            </p>
          </div>
        )}

        {/* Manual Form */}
        {showManualForm && (
          <div className="mb-6">
            <div className="p-5 rounded-2xl bg-surface-dark border border-primary/30 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-white font-bold">Cadastrar Endereço Manualmente</p>
                  <p className="text-gray-400 text-sm mt-1">Preencha os dados do endereço</p>
                </div>
                <button
                  onClick={() => {
                    setShowManualForm(false);
                    setManualAddress({ street: '', city: '', state: '', postalCode: '', latitude: '', longitude: '' });
                  }}
                  className="text-gray-400 hover:text-white transition-colors shrink-0"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="h-px bg-white/10 w-full"></div>

              <div className="space-y-4">
                <div>
                  <label className="block mb-2">
                    <span className="text-white text-sm font-bold">Rua/Endereço *</span>
                  </label>
                  <input
                    type="text"
                    value={manualAddress.street}
                    onChange={(e) => setManualAddress({ ...manualAddress, street: e.target.value })}
                    placeholder="Ex: Rua das Flores, 123"
                    className="w-full h-12 px-4 bg-background-dark border border-white/10 rounded-xl text-white font-medium focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                    disabled={isSaving}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block mb-2">
                      <span className="text-white text-sm font-bold">Cidade *</span>
                    </label>
                    <input
                      type="text"
                      value={manualAddress.city}
                      onChange={(e) => setManualAddress({ ...manualAddress, city: e.target.value })}
                      placeholder="Ex: São Paulo"
                      className="w-full h-12 px-4 bg-background-dark border border-white/10 rounded-xl text-white font-medium focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                      disabled={isSaving}
                    />
                  </div>

                  <div>
                    <label className="block mb-2">
                      <span className="text-white text-sm font-bold">Estado *</span>
                    </label>
                    <input
                      type="text"
                      value={manualAddress.state}
                      onChange={(e) => setManualAddress({ ...manualAddress, state: e.target.value })}
                      placeholder="Ex: SP"
                      className="w-full h-12 px-4 bg-background-dark border border-white/10 rounded-xl text-white font-medium focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                      disabled={isSaving}
                    />
                  </div>
                </div>

                <div>
                  <label className="block mb-2">
                    <span className="text-white text-sm font-bold">CEP (opcional)</span>
                  </label>
                  <input
                    type="text"
                    value={manualAddress.postalCode}
                    onChange={(e) => setManualAddress({ ...manualAddress, postalCode: e.target.value })}
                    placeholder="Ex: 01234-567"
                    className="w-full h-12 px-4 bg-background-dark border border-white/10 rounded-xl text-white font-medium focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                    disabled={isSaving}
                  />
                </div>

                <div className="p-3 bg-background-dark/50 rounded-lg border border-white/5">
                  <p className="text-gray-400 text-xs">
                    <span className="material-symbols-outlined text-sm align-middle">info</span>
                    {' '}Coordenadas são opcionais. Se não informadas, serão calculadas automaticamente quando possível.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Initial State */}
        {!selectedSuggestion && searchQuery.trim().length < 3 && (
          <div className="flex flex-col items-center justify-center py-12">
            <span className="material-symbols-outlined text-gray-500 text-5xl">search</span>
            <p className="text-gray-400 mt-4">Digite pelo menos 3 caracteres para buscar</p>
            <p className="text-gray-500 text-sm mt-2">Ex: Rua, Avenida, número, bairro, cidade</p>
          </div>
        )}
      </main>

      {/* Save Button */}
      {(selectedSuggestion || showManualForm) && (
        <div className="px-4 py-4 bg-background-dark border-t border-white/5">
          {!showManualForm && (
            <div className="mb-4">
              <label className="block mb-2">
                <span className="text-white text-sm font-bold">Nome do Endereço *</span>
                <p className="text-gray-500 text-xs mt-1">Ex: Casa, Trabalho, Apartamento</p>
              </label>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Ex: Casa"
                className="w-full h-12 px-4 bg-background-dark border border-white/10 rounded-xl text-white font-medium focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                disabled={isSaving}
              />
            </div>
          )}
          {showManualForm && (
            <div className="mb-4">
              <label className="block mb-2">
                <span className="text-white text-sm font-bold">Nome do Endereço *</span>
                <p className="text-gray-500 text-xs mt-1">Ex: Casa, Trabalho, Apartamento</p>
              </label>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Ex: Casa"
                className="w-full h-12 px-4 bg-background-dark border border-white/10 rounded-xl text-white font-medium focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                disabled={isSaving}
              />
            </div>
          )}
          <button
            onClick={handleSave}
            disabled={isSaving || !label.trim() || (showManualForm && (!manualAddress.street.trim() || !manualAddress.city.trim() || !manualAddress.state.trim()))}
            className="w-full bg-primary disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-light text-white font-bold h-14 rounded-full shadow-lg shadow-primary/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            {isSaving ? (
              <>
                <span className="material-symbols-outlined animate-spin">sync</span>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <span>Save Address</span>
                <span className="material-symbols-outlined">check_circle</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
