import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { marketplaceService, CompanySearchResult } from '../services/marketplace';

export const CompanyList = () => {
  const navigate = useNavigate();
  const { serviceRequestFlow, updateServiceRequestFlow, addresses } = useApp();

  const [companies, setCompanies] = useState<CompanySearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Buscar empresas ao carregar a tela
  useEffect(() => {
    const fetchCompanies = async () => {
      if (!serviceRequestFlow) {
        navigate('/request');
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Obter localização do endereço selecionado
        const selectedAddress = addresses.find(a => a.id === serviceRequestFlow.addressId);
        
        // Usar coordenadas do endereço ou padrão (São Paulo)
        const latitude = serviceRequestFlow.addressLatitude || selectedAddress?.latitude || -23.5505;
        const longitude = serviceRequestFlow.addressLongitude || selectedAddress?.longitude || -46.6333;

        // Buscar empresas no marketplace
        const results = await marketplaceService.searchCompanies({
          category: serviceRequestFlow.category,
          latitude,
          longitude,
          date: new Date().toISOString().split('T')[0] // Data atual como padrão
        });

        setCompanies(results);
      } catch (err: any) {
        console.error('Failed to fetch companies:', err);
        setError(err.response?.data?.message || 'Failed to load companies. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompanies();
  }, [serviceRequestFlow, addresses, navigate]);

  // Selecionar empresa e continuar para agendamento
  const handleSelectCompany = (company: CompanySearchResult) => {
    updateServiceRequestFlow({
      selectedTenantId: company.tenantId,
      selectedCompanyName: company.companyName,
      technicianDistanceKm: company.nearestTechnicianDistanceKm,
      estimatedArrivalMin: company.estimatedArrivalMinutes
    });

    navigate('/schedule');
  };

  // Redirecionar se não há dados do fluxo
  useEffect(() => {
    if (!serviceRequestFlow) {
      navigate('/request');
    }
  }, [serviceRequestFlow, navigate]);

  // Renderizar estrelas de rating
  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const stars = [];

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <span key={`full-${i}`} className="material-symbols-outlined text-yellow-400 text-sm filled">
          star
        </span>
      );
    }

    if (hasHalfStar) {
      stars.push(
        <span key="half" className="material-symbols-outlined text-yellow-400 text-sm">
          star_half
        </span>
      );
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <span key={`empty-${i}`} className="material-symbols-outlined text-gray-600 text-sm">
          star
        </span>
      );
    }

    return stars;
  };

  // Ícone da categoria
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'HVAC': return 'mode_fan';
      case 'Electrical': return 'bolt';
      case 'Plumbing': return 'water_drop';
      default: return 'build';
    }
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
        <h1 className="text-lg font-bold text-white">Select Company</h1>
        <div className="size-10"></div>
      </header>

      {/* Service Summary */}
      {serviceRequestFlow && (
        <div className="px-4 py-4 bg-surface-dark/50 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary">
                {getCategoryIcon(serviceRequestFlow.category)}
              </span>
            </div>
            <div className="flex-1">
              <p className="text-white font-semibold">{serviceRequestFlow.category} Service</p>
              <p className="text-gray-400 text-sm truncate">{serviceRequestFlow.addressLabel}</p>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <main className="flex-1 overflow-y-auto px-4 py-6 no-scrollbar animate-fade-in">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <span className="material-symbols-outlined text-primary text-5xl animate-spin">sync</span>
            <p className="text-gray-400 mt-4">Finding available companies...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12">
            <span className="material-symbols-outlined text-red-400 text-5xl">error</span>
            <p className="text-gray-400 mt-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-6 py-2 bg-primary rounded-full text-white font-medium"
            >
              Try Again
            </button>
          </div>
        ) : companies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <span className="material-symbols-outlined text-gray-500 text-5xl">search_off</span>
            <p className="text-gray-400 mt-4">No companies available in your area</p>
            <p className="text-gray-500 text-sm mt-2">Try a different service or location</p>
          </div>
        ) : (
          <>
            <p className="text-gray-400 text-sm mb-4">
              {companies.length} {companies.length === 1 ? 'company' : 'companies'} available • Sorted by nearest technician
            </p>

            <div className="space-y-3">
              {companies.map((company, index) => (
                <button
                  key={company.tenantId}
                  onClick={() => handleSelectCompany(company)}
                  className="w-full p-4 rounded-2xl bg-surface-dark border border-white/5 hover:border-primary/50 transition-all text-left group"
                >
                  <div className="flex items-start gap-4">
                    {/* Company Logo */}
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center shrink-0 overflow-hidden">
                      {company.logoUrl ? (
                        <img
                          src={company.logoUrl}
                          alt={company.companyName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-2xl font-bold text-primary">
                          {company.companyName.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>

                    {/* Company Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-white font-semibold truncate group-hover:text-primary transition-colors">
                          {company.companyName}
                        </h3>
                        {index === 0 && (
                          <span className="shrink-0 px-2 py-0.5 bg-accent/20 text-accent text-xs font-bold rounded-full">
                            CLOSEST
                          </span>
                        )}
                      </div>

                      {/* Rating */}
                      <div className="flex items-center gap-1 mt-1">
                        <div className="flex items-center">
                          {renderStars(company.rating)}
                        </div>
                        <span className="text-white font-medium text-sm ml-1">
                          {marketplaceService.formatRating(company.rating)}
                        </span>
                        <span className="text-gray-500 text-sm">
                          ({company.totalReviews} {company.totalReviews === 1 ? 'review' : 'reviews'})
                        </span>
                      </div>

                      {/* Distance & Time */}
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-gray-400 text-sm">
                            location_on
                          </span>
                          <span className="text-gray-400 text-sm">
                            Technician {marketplaceService.formatDistance(company.nearestTechnicianDistanceKm)} away
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-gray-400 text-sm">
                            schedule
                          </span>
                          <span className="text-gray-400 text-sm">
                            {marketplaceService.formatArrivalTime(company.estimatedArrivalMinutes)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Arrow */}
                    <span className="material-symbols-outlined text-gray-500 group-hover:text-primary transition-colors shrink-0">
                      chevron_right
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
};
