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

  const handleTrackService = () => {
    navigate('/home');
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'TBD';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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
      <div className="bg-background-light dark:bg-background-dark font-display text-[#101719] dark:text-gray-100 antialiased overflow-x-hidden">
        <div className="relative flex min-h-screen w-full flex-col items-center justify-between p-6">
          {/* Main Content Area */}
          <div className="flex w-full max-w-md flex-1 flex-col items-center pt-12 md:justify-center md:pt-0">
            {/* Hero Icon */}
            <div className="mb-8 flex flex-col items-center">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 dark:bg-primary/40 animate-pulse">
                <span className="material-symbols-outlined text-[64px] text-primary dark:text-white" style={{fontWeight: 700}}>check</span>
              </div>
            </div>

            {/* Headline Section */}
            <div className="mb-10 text-center">
              <h1 className="mb-3 text-3xl font-extrabold leading-tight tracking-tight text-primary dark:text-white md:text-4xl">
                Booking Confirmed!
              </h1>
              <p className="text-base font-normal leading-relaxed text-[#57838e] dark:text-gray-400 max-w-[280px] mx-auto">
                We've received your request and are processing it now.
              </p>
            </div>

            {/* Summary Card */}
            <div className="w-full overflow-hidden rounded-2xl bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:bg-[#1c2a2e] dark:shadow-none border border-gray-100 dark:border-[#2a383c]">
              {/* Card Header */}
              <div className="border-b border-gray-100 dark:border-[#2a383c] bg-primary/5 p-4 text-center">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#57838e] dark:text-gray-400">Order Summary</p>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-1 divide-y divide-gray-100 dark:divide-[#2a383c] p-4">
                {/* Row 1: Order ID & Date */}
                <div className="flex justify-between py-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-[#57838e] dark:text-gray-400">Order ID</span>
                    <span className="text-sm font-bold text-primary dark:text-white">#{osNumber}</span>
                  </div>
                  <div className="flex flex-col gap-1 text-right">
                    <span className="text-xs font-medium text-[#57838e] dark:text-gray-400">Date & Time</span>
                    <span className="text-sm font-bold text-primary dark:text-white">
                      {formatDate(serviceRequestFlow?.preferredDate || '')} • {formatTime(serviceRequestFlow?.preferredTime || '')}
                    </span>
                  </div>
                </div>

                {/* Row 2: Service Type */}
                <div className="flex flex-col gap-1 py-3">
                  <span className="text-xs font-medium text-[#57838e] dark:text-gray-400">Service Type</span>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg text-primary dark:text-white">
                      {serviceRequestFlow?.category === 'HVAC' ? 'ac_unit' :
                        serviceRequestFlow?.category === 'Electrical' ? 'bolt' :
                          serviceRequestFlow?.category === 'Plumbing' ? 'water_drop' : 'build'}
                    </span>
                    <span className="text-sm font-bold text-primary dark:text-white">
                      {serviceRequestFlow?.category || 'Service'} {serviceRequestFlow?.category === 'HVAC' ? 'Maintenance' : 'Service'}
                    </span>
                  </div>
                </div>

                {/* Row 3: Location */}
                <div className="flex flex-col gap-1 py-3 pt-3">
                  <span className="text-xs font-medium text-[#57838e] dark:text-gray-400">Location</span>
                  <div className="flex items-start gap-2">
                    <span className="material-symbols-outlined mt-0.5 text-lg text-primary dark:text-white">location_on</span>
                    <span className="text-sm font-medium text-primary dark:text-white leading-snug">
                      {serviceRequestFlow?.addressLabel || 'Address'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Technician Note */}
            <div className="mt-8 px-4 text-center">
              <p className="text-sm font-medium leading-relaxed text-[#57838e] dark:text-gray-400">
                We are currently assigning the best technician for your job. You will receive a notification once they are on the way.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex w-full max-w-md flex-col gap-3 pb-4">
            {/* Primary Button */}
            <button 
              onClick={handleTrackService}
              className="group relative flex h-14 w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl bg-primary text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 hover:shadow-primary/30 active:scale-[0.98]"
            >
              <span className="flex items-center gap-2 text-base font-bold tracking-wide">
                <span className="material-symbols-outlined text-[20px]">location_searching</span>
                Track My Service
              </span>
            </button>

            {/* Secondary Button */}
            <button 
              onClick={handleGoHome}
              className="group flex h-14 w-full cursor-pointer items-center justify-center rounded-xl border-2 border-primary/10 bg-transparent text-primary transition-all hover:bg-primary/5 active:scale-[0.98] dark:border-white/10 dark:text-white dark:hover:bg-white/5"
            >
              <span className="text-base font-bold tracking-wide">Back to Home</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show confirmation review screen
  return (
    <div className="min-h-screen bg-background-dark flex flex-col p-6 animate-fade-in">
      <header className="flex items-center justify-between mb-6">
        <button 
          onClick={() => navigate(-1)} 
          className="flex size-10 items-center justify-center rounded-full hover:bg-surface-dark transition-colors"
        >
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
