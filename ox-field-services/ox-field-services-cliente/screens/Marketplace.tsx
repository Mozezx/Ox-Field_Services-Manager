import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { marketplaceService, MarketplaceListing, MarketplaceCategory } from '../services/marketplace';
import { customerService } from '../services/customer';

export const Marketplace = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setServiceRequestFlow } = useApp();

  const state = location.state as { categoryCode?: string; search?: string } | undefined;
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [categories, setCategories] = useState<MarketplaceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>(state?.categoryCode ?? '');
  const [searchQuery, setSearchQuery] = useState(state?.search ?? '');
  const [selectedListing, setSelectedListing] = useState<MarketplaceListing | null>(null);
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinMessage, setJoinMessage] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const [listingsRes, categoriesRes] = await Promise.all([
          marketplaceService.getListings({
            categoryCode: categoryFilter || undefined,
            search: searchQuery.trim() || undefined,
            page: 0,
            size: 50
          }),
          marketplaceService.getCategories()
        ]);
        setListings(listingsRes.content || []);
        setCategories(categoriesRes || []);
      } catch (err) {
        console.error('Failed to load marketplace:', err);
        setError('Service temporarily unavailable. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [categoryFilter, searchQuery]);

  const handleRequestService = (listing: MarketplaceListing) => {
    setServiceRequestFlow({
      category: listing.categoryCode,
      description: '',
      addressId: '',
      addressLabel: '',
      preferredDate: '',
      preferredTime: '',
      selectedTenantId: listing.tenantId,
      selectedCompanyName: listing.companyName,
      listingId: listing.listingId,
      listingTitle: listing.title
    });
    setSelectedListing(null);
    navigate('/request');
  };

  return (
    <div className="flex flex-col min-h-screen bg-background-dark pb-8">
      <header className="px-4 pt-6 pb-2 border-b border-white/5 z-20 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex size-10 items-center justify-center rounded-full hover:bg-surface-dark transition-colors"
        >
          <span className="material-symbols-outlined text-white">arrow_back</span>
        </button>
        <h1 className="text-lg font-bold text-white">Marketplace</h1>
        <button
          onClick={() => navigate('/home')}
          className="flex h-10 items-center justify-center px-2 hover:bg-surface-dark rounded-full transition-colors"
        >
          <span className="text-text-muted text-sm font-medium">Cancel</span>
        </button>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-6 no-scrollbar animate-fade-in">
        <p className="text-gray-400 text-sm mb-4">
          Choose a service from companies on the platform. Then add your address and schedule.
        </p>

        {/* Search */}
        <div className="relative mb-4">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search services..."
            className="w-full h-12 pl-10 pr-4 bg-surface-dark border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
          />
        </div>

        {/* Category filter */}
        {categories.length > 0 && (
          <div className="mb-4">
            <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-2">Category</p>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
              <button
                onClick={() => setCategoryFilter('')}
                className={`shrink-0 rounded-full py-2 px-4 text-sm font-medium transition-all ${
                  !categoryFilter
                    ? 'bg-primary text-white'
                    : 'bg-surface-dark border border-white/10 text-gray-300'
                }`}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.code}
                  onClick={() => setCategoryFilter(cat.code)}
                  className={`shrink-0 rounded-full py-2 px-4 text-sm font-medium transition-all ${
                    categoryFilter === cat.code
                      ? 'bg-primary text-white'
                      : 'bg-surface-dark border border-white/10 text-gray-300'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex flex-col items-center gap-3">
            <span className="material-symbols-outlined text-amber-500 text-2xl">error_outline</span>
            <p className="text-amber-400 text-sm text-center">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-semibold hover:bg-amber-600 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <span className="material-symbols-outlined text-primary text-5xl animate-spin">sync</span>
            <p className="text-gray-400 mt-4">Loading services...</p>
          </div>
        ) : listings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <span className="material-symbols-outlined text-gray-500 text-5xl">search_off</span>
            <p className="text-gray-400 mt-4">No services found</p>
            <p className="text-gray-500 text-sm mt-2">Try a different category or search</p>
          </div>
        ) : (
          <div className="space-y-3">
            {listings.map((listing) => (
              <button
                key={listing.listingId}
                onClick={() => setSelectedListing(listing)}
                className="w-full p-4 rounded-2xl bg-surface-dark border border-white/5 hover:border-primary/50 transition-all text-left"
              >
                <div className="flex gap-4">
                  {listing.imageUrl ? (
                    <img
                      src={listing.imageUrl}
                      alt=""
                      className="w-20 h-20 rounded-xl object-cover bg-white/5 shrink-0"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-primary text-3xl">build</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-semibold truncate">{listing.title}</h3>
                    <p className="text-gray-400 text-sm">{listing.companyName}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs bg-white/10 text-gray-400 px-2 py-0.5 rounded">
                        {listing.categoryName}
                      </span>
                      {listing.priceFrom != null && (
                        <span className="text-sm text-primary font-medium">
                          From ${Number(listing.priceFrom).toFixed(2)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="material-symbols-outlined text-yellow-400 text-sm filled">star</span>
                      <span className="text-white text-sm font-medium">{marketplaceService.formatRating(listing.rating)}</span>
                      <span className="text-gray-500 text-sm">({listing.totalReviews})</span>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-gray-500 shrink-0">chevron_right</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>

      {/* Detail modal */}
      {selectedListing && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm">
          <div
            className="bg-surface-dark w-full max-w-lg rounded-t-2xl sm:rounded-2xl border border-white/10 shadow-2xl max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-white/5 flex justify-between items-start">
              <h2 className="text-lg font-bold text-white">{selectedListing.title}</h2>
              <button
                onClick={() => setSelectedListing(null)}
                className="p-2 rounded-full hover:bg-white/10 text-gray-400"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              <div className="flex items-center gap-3 mb-4">
                {selectedListing.logoUrl ? (
                  <img src={selectedListing.logoUrl} alt="" className="w-12 h-12 rounded-xl object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary font-bold">
                    {selectedListing.companyName.charAt(0)}
                  </div>
                )}
                <div>
                  <p className="text-white font-medium">{selectedListing.companyName}</p>
                  <p className="text-gray-400 text-sm">{selectedListing.categoryName}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="material-symbols-outlined text-yellow-400 text-sm filled">star</span>
                    <span className="text-white text-sm">{marketplaceService.formatRating(selectedListing.rating)}</span>
                    <span className="text-gray-500 text-sm">({selectedListing.totalReviews} reviews)</span>
                  </div>
                </div>
              </div>
              {selectedListing.description && (
                <p className="text-gray-300 text-sm mb-4">{selectedListing.description}</p>
              )}
              {selectedListing.priceFrom != null && (
                <p className="text-primary font-semibold mb-4">From ${Number(selectedListing.priceFrom).toFixed(2)}</p>
              )}
            </div>
            <div className="p-4 border-t border-white/5 space-y-2">
              {joinMessage && (
                <p className="text-center text-sm text-green-400">{joinMessage}</p>
              )}
              <button
                type="button"
                onClick={() => handleJoinCompany(selectedListing.tenantId, selectedListing.companyName)}
                disabled={joinLoading}
                className="w-full bg-white/10 hover:bg-white/20 text-white font-semibold h-12 rounded-full flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {joinLoading ? (
                  <span className="material-symbols-outlined animate-spin">progress_activity</span>
                ) : (
                  <span className="material-symbols-outlined text-lg">person_add</span>
                )}
                Become a client
              </button>
              <button
                onClick={() => handleRequestService(selectedListing)}
                className="w-full bg-primary hover:bg-primary-light text-white font-bold h-14 rounded-full shadow-lg shadow-primary/30 flex items-center justify-center gap-2"
              >
                Request this service
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
