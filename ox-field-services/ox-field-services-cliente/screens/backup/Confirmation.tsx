import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { marketplaceService } from '../services/marketplace';

export const Confirmation = () => {
  const navigate = useNavigate();
  const { serviceRequestFlow, submitServiceRequest } = useApp();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [osNumber, setOsNumber] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Redirect if no flow data
  useEffect(() => {
    if (!serviceRequestFlow && !isSubmitted) {
      navigate('/request');
    }
  }, [serviceRequestFlow, isSubmitted, navigate]);

  const handleConfirm = async () => {
    setIsSubmitting(true);
    setError(null);

    const result = await submitServiceRequest();

    setIsSubmitting(false);

    if (result.success) {
      setOsNumber(result.osNumber || 'OX-' + Math.floor(Math.random() * 10000));
      setIsSubmitted(true);
    } else {
      setError(result.error || 'Failed to submit service request');
    }
  };

  const handleGoHome = () => {
    navigate('/home');
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'TBD';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return 'TBD';
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes || '00'} ${ampm}`;
  };

  // Show confirmation success screen
  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background-dark flex flex-col p-6 animate-fade-in">
        <div className="flex-1 flex flex-col items-center justify-center gap-6">
          <div className="relative group animate-pulse-slow">
            <div className="absolute inset-0 bg-accent/20 rounded-full blur-xl opacity-50"></div>
            <div className="relative h-28 w-28 rounded-full bg-primary border-4 border-background-dark flex items-center justify-center shadow-2xl">
              <span className="material-symbols-outlined text-accent text-6xl font-bold">check_circle</span>
            </div>
          </div>

          <div className="text-center">
            <h1 className="text-white text-3xl font-extrabold mb-2">Booking<br />Confirmed!</h1>
            <p className="text-gray-400 text-sm">We've sent a receipt to your email.</p>
          </div>

          <div className="w-full bg-card-dark rounded-xl border border-white/5 overflow-hidden mt-4">
            <div className="h-1 w-full bg-gradient-to-r from-transparent via-accent to-transparent opacity-50"></div>
            <div className="p-5 flex flex-col gap-6">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Service Type</span>
                  <h2 className="text-white text-xl font-bold">{serviceRequestFlow?.category || 'Service'}</h2>
                </div>
                <div className="px-3 py-1 rounded-full bg-background-dark border border-white/10">
                  <p className="text-accent text-xs font-bold">#{osNumber}</p>
                </div>
              </div>

              <div className="h-px bg-white/10 w-full"></div>

              <div className="space-y-4">
                {/* Company Info - Marketplace */}
                {serviceRequestFlow?.selectedCompanyName && (
                  <div className="flex gap-4 items-center">
                    <span className="material-symbols-outlined text-gray-400">business</span>
                    <div>
                      <p className="text-gray-500 text-xs">Service Provider</p>
                      <p className="text-white text-sm font-semibold">{serviceRequestFlow.selectedCompanyName}</p>
                      {serviceRequestFlow.technicianDistanceKm && (
                        <p className="text-gray-500 text-xs">
                          Technician {marketplaceService.formatDistance(serviceRequestFlow.technicianDistanceKm)} away
                          {serviceRequestFlow.estimatedArrivalMin && ` • ${marketplaceService.formatArrivalTime(serviceRequestFlow.estimatedArrivalMin)}`}
                        </p>
                      )}
                    </div>
                  </div>
                )}
                <div className="flex gap-4 items-center">
                  <span className="material-symbols-outlined text-gray-400">calendar_month</span>
                  <div>
                    <p className="text-gray-500 text-xs">Date & Time</p>
                    <p className="text-white text-sm font-semibold">
                      {formatDate(serviceRequestFlow?.preferredDate || '')} • {formatTime(serviceRequestFlow?.preferredTime || '')}
                    </p>
                  </div>
                </div>
                <div className="flex gap-4 items-center">
                  <span className="material-symbols-outlined text-gray-400">location_on</span>
                  <div>
                    <p className="text-gray-500 text-xs">Address</p>
                    <p className="text-white text-sm font-semibold">{serviceRequestFlow?.addressLabel || 'Address'}</p>
                  </div>
                </div>
              </div>

              <div className="h-px bg-white/10 w-full"></div>

              <div className="flex justify-between items-end">
                <div>
                  <p className="text-white text-base font-bold">Estimated Total</p>
                  <p className="text-gray-500 text-[10px]">Final quote on-site</p>
                </div>
                <p className="text-accent text-2xl font-extrabold">$150.00</p>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full space-y-3 mt-8">
          <button className="w-full h-12 rounded-full border border-white/10 text-white font-bold text-sm hover:bg-white/5 transition-colors">
            Add to Calendar
          </button>
          <button onClick={handleGoHome} className="w-full h-12 rounded-full bg-accent text-primary font-bold text-sm hover:brightness-110 shadow-lg shadow-accent/20 transition-all">
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  // Show confirmation review screen
  return (
    <div className="min-h-screen bg-background-dark flex flex-col p-6 animate-fade-in">
      <header className="flex items-center justify-between mb-6">
        <button onClick={() => navigate(-1)} className="flex size-10 items-center justify-center rounded-full hover:bg-surface-dark transition-colors">
          <span className="material-symbols-outlined text-white">arrow_back</span>
        </button>
        <h1 className="text-lg font-bold text-white">Confirm Request</h1>
        <div className="size-10"></div>
      </header>

      <div className="flex-1">
        <div className="w-full bg-card-dark rounded-xl border border-white/5 overflow-hidden">
          <div className="h-1 w-full bg-gradient-to-r from-primary via-accent to-primary opacity-50"></div>
          <div className="p-5 flex flex-col gap-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Service Type</span>
              <h2 className="text-white text-xl font-bold">{serviceRequestFlow?.category || 'Service'}</h2>
            </div>

            <div className="h-px bg-white/10 w-full"></div>

            {/* Company Info - Marketplace */}
            {serviceRequestFlow?.selectedCompanyName && (
              <>
                <div className="flex gap-4 items-center">
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                    <span className="text-xl font-bold text-primary">
                      {serviceRequestFlow.selectedCompanyName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Service Provider</span>
                    <p className="text-white font-semibold">{serviceRequestFlow.selectedCompanyName}</p>
                    {serviceRequestFlow.technicianDistanceKm && (
                      <p className="text-gray-400 text-sm">
                        Technician {marketplaceService.formatDistance(serviceRequestFlow.technicianDistanceKm)} away
                        {serviceRequestFlow.estimatedArrivalMin && ` • ${marketplaceService.formatArrivalTime(serviceRequestFlow.estimatedArrivalMin)}`}
                      </p>
                    )}
                  </div>
                </div>
                <div className="h-px bg-white/10 w-full"></div>
              </>
            )}

            {serviceRequestFlow?.description && (
              <>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Description</span>
                  <p className="text-white text-sm mt-1">{serviceRequestFlow.description}</p>
                </div>
                <div className="h-px bg-white/10 w-full"></div>
              </>
            )}

            <div className="space-y-4">
              <div className="flex gap-4 items-center">
                <span className="material-symbols-outlined text-gray-400">calendar_month</span>
                <div>
                  <p className="text-gray-500 text-xs">Date & Time</p>
                  <p className="text-white text-sm font-semibold">
                    {formatDate(serviceRequestFlow?.preferredDate || '')} • {formatTime(serviceRequestFlow?.preferredTime || '')}
                  </p>
                </div>
              </div>
              <div className="flex gap-4 items-center">
                <span className="material-symbols-outlined text-gray-400">location_on</span>
                <div>
                  <p className="text-gray-500 text-xs">Address</p>
                  <p className="text-white text-sm font-semibold">{serviceRequestFlow?.addressLabel || 'Address'}</p>
                </div>
              </div>
            </div>

            <div className="h-px bg-white/10 w-full"></div>

            <div className="flex justify-between items-end">
              <div>
                <p className="text-white text-base font-bold">Estimated Total</p>
                <p className="text-gray-500 text-[10px]">Final quote after inspection</p>
              </div>
              <p className="text-accent text-2xl font-extrabold">$150.00</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}
      </div>

      <div className="w-full space-y-3 mt-8">
        <button
          onClick={handleConfirm}
          disabled={isSubmitting}
          className="w-full h-14 rounded-full bg-primary text-white font-bold text-sm hover:bg-primary-light shadow-lg shadow-primary/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <span className="material-symbols-outlined animate-spin">sync</span>
              <span>Submitting...</span>
            </>
          ) : (
            <>
              <span>Confirm & Submit</span>
              <span className="material-symbols-outlined">send</span>
            </>
          )}
        </button>
        <button
          onClick={() => navigate('/schedule')}
          disabled={isSubmitting}
          className="w-full h-12 rounded-full border border-white/10 text-white font-bold text-sm hover:bg-white/5 transition-colors disabled:opacity-50"
        >
          Change Schedule
        </button>
      </div>
    </div>
  );
};