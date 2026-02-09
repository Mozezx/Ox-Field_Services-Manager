import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { TrackingMap } from '../components/TrackingMap';
import { trackingService, TrackingUpdate, pollTrackingUpdate, TechnicianLocation } from '../services/tracking';
import { customerService, TrackingInfo, ServiceOrder } from '../services/customer';

type TechnicianInfo = NonNullable<ServiceOrder['technician']>;

export const Tracking = () => {
  const navigate = useNavigate();
  const { activeService, setActiveService } = useApp();
  const [timeLeft, setTimeLeft] = useState(8);
  const [techLocation, setTechLocation] = useState<TechnicianLocation | null>(null);
  const [trackingInfo, setTrackingInfo] = useState<TrackingInfo | null>(null);
  const [techName, setTechName] = useState('Michael');
  const [techRating, setTechRating] = useState(4.9);
  const [technicianInfo, setTechnicianInfo] = useState<TechnicianInfo | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [destinationLatLng, setDestinationLatLng] = useState<{ lat: number; lng: number } | null>(null);
  const [sheetExpanded, setSheetExpanded] = useState(true);

  const orderId = activeService?.id || 'demo-order';

  const isValidUUID = (s: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);

  // Handle tracking updates (technicianLocation only when within 200m - OS-87378)
  const handleTrackingUpdate = useCallback((update: TrackingUpdate) => {
    if (update.technicianLocation) {
      setTechLocation(update.technicianLocation);
    } else {
      setTechLocation(null); // Backend omits coords when > 200m; hide marker
    }

    if (update.estimatedArrival) {
      // Parse estimated arrival to get minutes
      const arrival = new Date(update.estimatedArrival);
      const now = new Date();
      const diffMs = arrival.getTime() - now.getTime();
      const diffMins = Math.max(0, Math.ceil(diffMs / 60000));
      setTimeLeft(diffMins);
    }

    // Handle status changes
    if (update.status === 'COMPLETED') {
      navigate('/rating');
    }
  }, [navigate]);

  // Initialize tracking
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const initTracking = async () => {
      const demoLocation = { lat: -23.5505, lng: -46.6333, updatedAt: new Date().toISOString() };
      const demoInfo: TrackingInfo = {
        orderId,
        status: 'EN_ROUTE',
        technicianLocation: demoLocation,
        estimatedArrival: new Date(Date.now() + timeLeft * 60000).toISOString(),
        currentStep: 0,
        steps: [
          { name: 'Technician en route', status: 'current' },
          { name: 'Arrived', status: 'pending' },
          { name: 'Service Started', status: 'pending' },
        ],
      };

      if (!isValidUUID(orderId)) {
        setError('Unable to connect to live tracking. Using estimated times.');
        setTechLocation(demoLocation);
        setTrackingInfo(demoInfo);
        return;
      }

      try {
        const order = await customerService.getOrder(orderId);
        if (order.technician) setTechnicianInfo(order.technician);
        // Set destination (client address) for map and 200m logic (OS-87378)
        const addr = order.address;
        if (addr && typeof addr === 'object' && addr.latitude != null && addr.longitude != null) {
          setDestinationLatLng({ lat: addr.latitude, lng: addr.longitude });
        }
      } catch {
        // Non-blocking: modal will use techName/techRating fallbacks
      }

      if (activeService?.technician) {
        setTechnicianInfo(activeService.technician);
      }

      try {
        const info = await customerService.getOrderTracking(orderId);
        setTrackingInfo(info);

        if (info.technicianLocation) {
          setTechLocation(info.technicianLocation);
        }

        if (info.estimatedArrival) {
          const arrival = new Date(info.estimatedArrival);
          const now = new Date();
          const diffMs = arrival.getTime() - now.getTime();
          const diffMins = Math.max(0, Math.ceil(diffMs / 60000));
          setTimeLeft(diffMins);
        }

        if (info.technician) {
          setTechName(info.technician.name || 'Michael');
          setTechRating(info.technician.rating || 4.9);
        } else if (typeof (info as { technicianName?: string }).technicianName === 'string') {
          setTechName((info as { technicianName: string }).technicianName);
        }

        trackingService.connect(orderId);
        unsubscribe = trackingService.subscribe(orderId, handleTrackingUpdate);
        setTimeout(() => {
          setIsConnected(trackingService.isConnected());
        }, 1000);
      } catch (err) {
        console.error('Failed to initialize tracking:', err);
        setError('Unable to connect to live tracking. Using estimated times.');
        setTechLocation(demoLocation);
        setTrackingInfo(demoInfo);
      }
    };

    initTracking();
    return () => {
      if (unsubscribe) unsubscribe();
      trackingService.disconnect();
    };
  }, [orderId, handleTrackingUpdate]);

  // Fallback: Poll for updates if WebSocket fails
  useEffect(() => {
    if (isConnected) return;

    const pollInterval = setInterval(async () => {
      const update = await pollTrackingUpdate(orderId);
      if (update) {
        handleTrackingUpdate(update);
      }
    }, 10000); // Poll every 10 seconds

    return () => clearInterval(pollInterval);
  }, [isConnected, orderId, handleTrackingUpdate]);

  // Navigate to rating when countdown reaches 0 (outside setState to avoid "update during render")
  useEffect(() => {
    if (timeLeft <= 0) navigate('/rating');
  }, [timeLeft, navigate]);

  // Countdown timer (fallback for demo)
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 60000); // Real minute countdown

    const demoTimer = setInterval(() => {
      setTimeLeft((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 5000); // 5 seconds = 1 minute for demo

    return () => {
      clearInterval(timer);
      clearInterval(demoTimer);
    };
  }, []);

  const getStatusText = () => {
    if (trackingInfo?.currentStep !== undefined) {
      const currentStep = trackingInfo.steps[trackingInfo.currentStep];
      return currentStep?.name || 'En Route';
    }
    return 'En Route';
  };

  const getCurrentStepIndex = () => {
    if (trackingInfo?.currentStep !== undefined) {
      return trackingInfo.currentStep;
    }
    return 0; // Default to first step (En Route)
  };

  const formatArrivalTime = () => {
    if (trackingInfo?.estimatedArrival) {
      const arrival = new Date(trackingInfo.estimatedArrival);
      return arrival.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    }
    // Calculate from timeLeft
    const now = new Date();
    now.setMinutes(now.getMinutes() + timeLeft);
    return now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const steps = [
    { name: 'Technician en route', icon: 'local_shipping', status: 'current' },
    { name: 'Arrived', icon: 'location_on', status: 'pending' },
    { name: 'Service Started', icon: 'build', status: 'pending' },
  ];

  // Update steps based on trackingInfo
  if (trackingInfo?.steps && trackingInfo.steps.length > 0) {
    trackingInfo.steps.forEach((step, idx) => {
      if (idx < steps.length) {
        steps[idx].name = step.name;
        steps[idx].status = step.status;
      }
    });
  }

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden bg-background-light dark:bg-background-dark font-display text-primary dark:text-white antialiased">
      {/* Top Navigation Overlay (Floating) */}
      <div className="absolute top-0 left-0 w-full z-20 pt-12 px-5 flex justify-between items-center pointer-events-none">
        <button 
          onClick={() => navigate('/home')} 
          className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-surface-dark shadow-lg text-primary dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        </button>
        <div className="pointer-events-auto px-4 py-2 bg-white/90 dark:bg-surface-dark/90 backdrop-blur-md rounded-full shadow-lg">
          <span className="text-xs font-bold uppercase tracking-wider text-primary dark:text-white">
            {isConnected ? 'Live Tracking' : 'Tracking'}
          </span>
        </div>
        <button className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-surface-dark shadow-lg text-primary dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
          <span className="material-symbols-outlined text-[20px]">more_horiz</span>
        </button>
      </div>

      {/* Map Section - grows when sheet is collapsed */}
      <div
        className={`relative w-full z-0 transition-all duration-300 ${
          sheetExpanded ? 'h-[65vh]' : 'flex-1 min-h-[200px]'
        }`}
      >
        <TrackingMap
          technicianLocation={techLocation ? { lat: techLocation.lat, lng: techLocation.lng } : null}
          destination={destinationLatLng}
          timeLeft={timeLeft}
          className="w-full h-full min-h-[300px]"
        />
        <div className="absolute top-0 w-full h-24 bg-gradient-to-b from-black/20 to-transparent pointer-events-none" />
        {/* Click overlay to collapse sheet and give map more space - only when sheet is expanded */}
        {sheetExpanded && (
          <button
            type="button"
            onClick={() => setSheetExpanded(false)}
            className="absolute inset-0 z-10 cursor-pointer"
            aria-label="Expandir mapa"
          />
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-30 mx-4 p-2 bg-amber-500/20 border border-amber-500/30 rounded-lg text-amber-400 text-xs text-center">
          {error}
        </div>
      )}

      {/* Message when technician is en route but location not yet visible (only within 200m) - OS-87378 */}
      {!error && trackingInfo?.status === 'EN_ROUTE' && !techLocation && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-30 mx-4 p-2 bg-white/90 dark:bg-surface-dark/90 backdrop-blur-md rounded-lg shadow-lg text-primary dark:text-white text-xs text-center">
          Técnico a caminho. A localização será visível quando estiver a menos de 200 m.
        </div>
      )}

      {/* Bottom Sheet - collapsed: thin bar; expanded: full content */}
      <div
        className={`absolute bottom-0 w-full flex flex-col bg-background-light dark:bg-surface-dark rounded-t-[32px] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-30 transition-all duration-300 ${
          sheetExpanded ? 'h-[40vh] min-h-[380px]' : 'h-14 min-h-[56px]'
        }`}
      >
        {/* Handle - click to expand when collapsed */}
        <button
          type="button"
          onClick={() => setSheetExpanded((e) => !e)}
          className="w-full flex flex-col items-center pt-3 pb-2 cursor-pointer hover:bg-gray-100/50 dark:hover:bg-gray-800/50 active:bg-gray-200/50 dark:active:bg-gray-700/50 transition-colors rounded-t-[32px]"
          aria-label={sheetExpanded ? 'Recolher' : 'Expandir detalhes'}
        >
          <div className="h-1.5 w-12 rounded-full bg-gray-200 dark:bg-gray-600 shrink-0" />
          {!sheetExpanded && (
            <span className="text-xs font-medium text-primary dark:text-white mt-1 truncate max-w-[80%]">
              {technicianInfo?.name ?? techName} · Toque para expandir
            </span>
          )}
        </button>

        {/* Scrollable Content - only when expanded */}
        {sheetExpanded && (
        <div className="flex-1 overflow-y-auto no-scrollbar px-6 pb-8 pt-2">
          <div className="flex flex-col gap-6">
            {/* Technician Profile Card - real data from order details or tracking */}
            {(() => {
              const displayName = technicianInfo?.name ?? techName;
              const displayRating = technicianInfo?.rating ?? techRating;
              const avatarUrl = technicianInfo?.avatarUrl || `https://i.pravatar.cc/150?u=${encodeURIComponent(displayName)}`;
              return (
                <div className="flex items-center gap-4">
                  <div className="relative shrink-0">
                    <div
                      className="h-16 w-16 rounded-full bg-gray-200 bg-cover bg-center border-2 border-white dark:border-gray-700 shadow-sm"
                      style={{ backgroundImage: `url("${avatarUrl}")` }}
                    />
                    <div className="absolute -bottom-1 -right-1 bg-green-500 h-4 w-4 rounded-full border-2 border-white dark:border-surface-dark" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-bold text-primary dark:text-white truncate">{displayName}</h2>
                      <div className="flex items-center gap-1 bg-surface-light dark:bg-gray-800 px-2 py-0.5 rounded-full">
                        <span className="material-symbols-outlined text-yellow-500 text-[14px] fill-current">star</span>
                        <span className="text-xs font-bold text-primary dark:text-gray-200">{displayRating.toFixed(1)}</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate">
                      {activeService?.type || activeService?.category || 'HVAC'} Senior Tech
                    </p>
                  </div>
                </div>
              );
            })()}
            
            {/* Actions */}
            <div className="flex gap-3">
              <button 
                onClick={() => navigate('/support')}
                className="flex-1 flex items-center justify-center gap-2 h-12 rounded-full bg-surface-light dark:bg-gray-800 text-primary dark:text-white font-bold text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">chat_bubble</span>
                Chat
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 h-12 rounded-full bg-primary text-white font-bold text-sm shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all active:scale-[0.98]">
                <span className="material-symbols-outlined text-[20px]">call</span>
                Call
              </button>
            </div>
          </div>
          
          {/* Divider */}
          <div className="w-full h-px bg-gray-100 dark:bg-gray-700 my-6"></div>
          
          {/* Timeline */}
          <div className="flex flex-col px-1">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-5 ml-1">Live Status</h3>
            
            {steps.map((step, idx) => {
              const isActive = idx === getCurrentStepIndex();
              const isCompleted = idx < getCurrentStepIndex();
              const isLast = idx === steps.length - 1;
              
              return (
                <div key={idx} className={`flex gap-4 relative group ${!isActive && !isCompleted ? 'opacity-60' : ''} ${isCompleted ? 'opacity-100' : ''}`}>
                  {/* Line connecting steps */}
                  {!isLast && (
                    <div className="absolute left-[15px] top-[32px] bottom-[-20px] w-0.5 bg-gray-200 dark:bg-gray-700"></div>
                  )}
                  
                  <div className="relative z-10 flex flex-col items-center">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center shadow-md ring-4 ring-white dark:ring-surface-dark ${
                      isCompleted 
                        ? 'bg-green-500 text-white' 
                        : isActive 
                          ? 'bg-primary text-white' 
                          : 'bg-surface-light dark:bg-gray-800 text-gray-400 border-2 border-transparent group-hover:border-gray-300 dark:group-hover:border-gray-600 transition-colors'
                    }`}>
                      <span className="material-symbols-outlined text-[16px]">{step.icon}</span>
                    </div>
                  </div>
                  
                  <div className={`${isLast ? 'pt-1' : 'pb-8 pt-1'} flex-1`}>
                    <p className={`${isActive || isCompleted ? 'text-primary dark:text-white font-bold' : 'text-gray-500 dark:text-gray-400 font-medium'} leading-tight`}>
                      {step.name}
                    </p>
                    {isActive && idx === 0 && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Expected arrival {formatArrivalTime()}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        )}
      </div>
    </div>
  );
};
