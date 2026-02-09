import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { customerService, ServiceOrder } from '../services/customer';

interface PopularService {
  id: string;
  name: string;
  description: string;
  price: string;
  rating: number;
  image: string;
  icon?: string;
}

export const Home = () => {
  const { user, activeService, setActiveService, addresses, loadAddresses } = useApp();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [currentOrder, setCurrentOrder] = useState<ServiceOrder | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadError, setLoadError] = useState<string | null>(null);

  // Popular services data
  const popularServices: PopularService[] = [
    {
      id: '1',
      name: 'Standard AC Service',
      description: 'Includes filter cleaning & gas check',
      price: 'Starts at $50',
      rating: 4.8,
      image: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=200&h=200&fit=crop'
    },
    {
      id: '2',
      name: 'Deep Home Cleaning',
      description: 'Intensive cleaning for all rooms',
      price: 'Starts at $85',
      rating: 4.9,
      image: 'https://images.unsplash.com/photo-1558317374-067fb5f30001?w=200&h=200&fit=crop'
    },
    {
      id: '3',
      name: 'General Handyman',
      description: 'Repairs for furniture & fixtures',
      price: '$40 / hr',
      rating: 4.7,
      image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=200&h=200&fit=crop'
    }
  ];

  const categories = [
    { icon: 'bolt', label: 'Electrical', code: 'electrical', color: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400' },
    { icon: 'water_drop', label: 'Plumbing', code: 'plumbing', color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' },
    { icon: 'ac_unit', label: 'AC Repair', code: 'hvac', color: 'bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600 dark:text-cyan-400' },
    { icon: 'cleaning_services', label: 'Cleaning', code: 'general', color: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400' },
  ];

  // Get default address for display
  const defaultAddress = addresses.find(a => a.isDefault) || addresses[0];
  const addressDisplay = defaultAddress?.fullAddress || defaultAddress?.label || '123 Maple Ave, Apt 4B';

  useEffect(() => {
    loadAddresses();
  }, [loadAddresses]);

  useEffect(() => {
    const fetchActiveOrder = async () => {
      try {
        setLoading(true);
        setLoadError(null);
        const orders = await customerService.getOrders('IN_PROGRESS');

        if (orders.length > 0) {
          setCurrentOrder(orders[0]);
          setActiveService({
            id: orders[0].id,
            type: orders[0].type,
            status: orders[0].status === 'EN_ROUTE' ? 'En Route' :
              orders[0].status === 'IN_PROGRESS' ? 'In Progress' : orders[0].status,
            date: orders[0].scheduledDate,
            time: orders[0].scheduledTime,
            address: orders[0].address,
            price: orders[0].price
          });
        }
      } catch (err) {
        console.error('Failed to fetch active order:', err);
        setLoadError('Service temporarily unavailable. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchActiveOrder();
  }, [setActiveService]);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate('/request');
    }
  };

  const handleServiceClick = (service: PopularService) => {
    navigate('/service-details', {
      state: {
        service: {
          name: service.name,
          description: service.description,
          price: service.price,
          rating: service.rating,
          reviews: 234,
          image: service.image,
          features: ['Professional service', 'Quality guaranteed', '90-day warranty', 'Licensed technicians'],
          category: 'General'
        }
      }
    });
  };

  return (
    <div className="relative flex h-full min-h-screen w-full max-w-md mx-auto flex-col overflow-x-hidden pb-24 shadow-2xl bg-background-light dark:bg-background-dark">
      {/* Header Section */}
      <header className="bg-primary pt-12 pb-6 px-5 rounded-b-[2.5rem] shadow-lg z-20">
        <div className="flex items-center justify-between mb-6">
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1 text-gray-300 text-sm font-medium">
              <span className="material-symbols-outlined text-[18px]">location_on</span>
              <span>Current Location</span>
            </div>
            <div className="text-white text-xl font-bold tracking-tight">{addressDisplay}</div>
          </div>
          <button
            onClick={() => navigate('/notifications')}
            className="flex items-center justify-center size-10 rounded-full bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 transition-colors"
          >
            <span className="material-symbols-outlined">notifications</span>
          </button>
        </div>
        {/* Search Bar */}
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <span className="material-symbols-outlined text-gray-400">search</span>
          </div>
          <input
            className="block w-full pl-11 pr-4 py-3.5 bg-white text-primary rounded-full border-none focus:ring-2 focus:ring-[#2D4A54] placeholder:text-gray-400 font-medium shadow-sm"
            placeholder="What needs fixing?"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col gap-6 -mt-2 pt-6 px-5">
        {/* Promotional Banner */}
        <section
          className="relative w-full h-40 rounded-2xl overflow-hidden cursor-pointer"
          onClick={() => navigate('/marketplace')}
        >
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&h=400&fit=crop')" }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-primary/40" />
          <div className="relative z-10 h-full flex flex-col justify-center p-5">
            <span className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-1">Limited Offer</span>
            <h3 className="text-white text-2xl font-extrabold leading-tight mb-3">
              Premium<br />Maintenance
            </h3>
            <button className="self-start flex items-center gap-1 bg-white text-primary px-4 py-2 rounded-full text-sm font-bold shadow-lg hover:bg-gray-100 transition-colors">
              Book Now
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>
        </section>

        {/* Categories Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-primary dark:text-white">Categories</h3>
            <button
              onClick={() => navigate('/marketplace')}
              className="text-sm font-semibold text-gray-500 hover:text-primary dark:hover:text-white transition-colors"
            >
              See All
            </button>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {categories.map((cat) => (
              <button
                key={cat.label}
                onClick={() => navigate('/marketplace', { state: { categoryCode: cat.code } })}
                className="bg-white dark:bg-[#1a2629] p-4 rounded-2xl flex flex-col items-center justify-center gap-2 shadow-sm hover:shadow-md transition-all active:scale-95 cursor-pointer border border-gray-100 dark:border-gray-800"
              >
                <div className={`p-3 ${cat.color} rounded-full`}>
                  <span className="material-symbols-outlined text-[24px]">{cat.icon}</span>
                </div>
                <span className="font-semibold text-xs text-primary dark:text-white text-center">{cat.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Popular Services Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-primary dark:text-white">Popular Services</h3>
          </div>
          <div className="flex flex-col gap-4">
            {popularServices.map((service) => (
              <div
                key={service.id}
                onClick={() => handleServiceClick(service)}
                className="flex items-center gap-4 bg-white dark:bg-[#1a2629] p-4 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer border border-gray-100 dark:border-gray-800"
              >
                {/* Service Image */}
                <div
                  className="w-20 h-20 rounded-xl bg-cover bg-center shrink-0"
                  style={{ backgroundImage: `url('${service.image}')` }}
                />

                {/* Service Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className="text-base font-bold text-primary dark:text-white leading-tight">
                      {service.name}
                    </h4>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="material-symbols-outlined text-amber-500 text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                      <span className="text-sm font-bold text-primary dark:text-white">{service.rating}</span>
                    </div>
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mb-2 line-clamp-1">
                    {service.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-primary dark:text-white text-sm font-bold">
                      {service.price}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleServiceClick(service);
                      }}
                      className="w-8 h-8 rounded-full bg-primary dark:bg-white flex items-center justify-center hover:opacity-90 transition-opacity"
                    >
                      <span className="material-symbols-outlined text-white dark:text-primary text-[18px]">add</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Loading State */}
        {loading && (
          <section>
            <div className="bg-white dark:bg-primary/40 rounded-lg p-8 text-center border border-gray-100 dark:border-white/5">
              <div className="flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl text-gray-400 animate-spin">progress_activity</span>
              </div>
              <p className="text-gray-400 text-sm mt-4">Loading...</p>
            </div>
          </section>
        )}

        {/* Error State */}
        {!loading && loadError && (
          <section>
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-6 text-center border border-amber-200 dark:border-amber-800">
              <span className="material-symbols-outlined text-3xl text-amber-500">error_outline</span>
              <p className="text-amber-700 dark:text-amber-400 text-sm mt-3 font-medium">{loadError}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-semibold hover:bg-amber-600 transition-colors"
              >
                Try Again
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
};
