import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { trackingService, TrackingUpdate, pollTrackingUpdate, TechnicianLocation } from '../services/tracking';
import { customerService, TrackingInfo } from '../services/customer';

export const Tracking = () => {
  const navigate = useNavigate();
  const { activeService, setActiveService } = useApp();
  const [timeLeft, setTimeLeft] = useState(8);
  const [techLocation, setTechLocation] = useState<TechnicianLocation | null>(null);
  const [trackingInfo, setTrackingInfo] = useState<TrackingInfo | null>(null);
  const [techName, setTechName] = useState('Mike');
  const [techRating, setTechRating] = useState(4.9);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const orderId = activeService?.id || 'demo-order';

  // Handle tracking updates
  const handleTrackingUpdate = useCallback((update: TrackingUpdate) => {
    if (update.technicianLocation) {
      setTechLocation(update.technicianLocation);
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
    const initTracking = async () => {
      try {
        // First, try to get initial tracking info via REST
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

        // Then try to connect via WebSocket
        trackingService.connect(orderId);
        
        const unsubscribe = trackingService.subscribe(orderId, handleTrackingUpdate);
        
        // Check connection status
        setTimeout(() => {
          setIsConnected(trackingService.isConnected());
        }, 1000);

        return () => {
          unsubscribe();
          trackingService.disconnect();
        };
      } catch (err) {
        console.error('Failed to initialize tracking:', err);
        setError('Unable to connect to live tracking. Using estimated times.');
      }
    };

    initTracking();
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

  // Countdown timer (fallback for demo)
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/rating');
          return 0;
        }
        return prev - 1;
      });
    }, 60000); // Real minute countdown

    // Demo mode: faster countdown
    const demoTimer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(demoTimer);
          navigate('/rating');
          return 0;
        }
        return prev - 1;
      });
    }, 5000); // 5 seconds = 1 minute for demo

    return () => {
      clearInterval(timer);
      clearInterval(demoTimer);
    };
  }, [navigate]);

  const getStatusText = () => {
    if (trackingInfo?.currentStep !== undefined) {
      const currentStep = trackingInfo.steps[trackingInfo.currentStep];
      return currentStep?.name || 'En Route';
    }
    return 'En Route';
  };

  return (
    <div className="relative h-screen w-full bg-background-dark overflow-hidden flex flex-col">
      {/* Map Background (Simulated) */}
      <div className="absolute inset-0 z-0 opacity-60">
        <img 
          src="https://picsum.photos/800/1200?grayscale&blur=2" 
          alt="Map" 
          className="w-full h-full object-cover invert" 
        />
        <div className="absolute inset-0 bg-primary/20 mix-blend-overlay"></div>
      </div>

      {/* Floating Header */}
      <div className="relative z-10 pt-12 px-4 flex justify-between items-center">
        <button onClick={() => navigate('/home')} className="size-10 rounded-full bg-surface-dark shadow-lg flex items-center justify-center text-white">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div className="bg-surface-dark/90 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 flex items-center gap-2">
          {isConnected && (
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
          )}
          <span className="text-sm font-bold text-white">Technician {getStatusText()}</span>
        </div>
        <button className="size-10 rounded-full bg-surface-dark shadow-lg flex items-center justify-center text-white">
          <span className="material-symbols-outlined">my_location</span>
        </button>
      </div>

      {error && (
        <div className="relative z-10 mx-4 mt-4 p-2 bg-amber-500/20 border border-amber-500/30 rounded-lg text-amber-400 text-xs text-center">
          {error}
        </div>
      )}

      {/* Technician Marker Simulation */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0">
        <div className="relative">
          <div className="size-16 rounded-full bg-primary/30 animate-ping absolute inset-0"></div>
          <div className="size-16 rounded-full bg-primary border-4 border-white shadow-xl flex items-center justify-center z-10 relative">
             <span className="material-symbols-outlined text-white text-3xl">local_shipping</span>
          </div>
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-surface-dark px-2 py-1 rounded text-xs font-bold text-white whitespace-nowrap">
            {techName} • {timeLeft} min
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      {trackingInfo?.steps && (
        <div className="relative z-10 mt-auto px-4 mb-4">
          <div className="bg-surface-dark/90 backdrop-blur-md rounded-xl p-3 border border-white/10">
            <div className="flex justify-between">
              {trackingInfo.steps.map((step, idx) => (
                <div key={idx} className="flex flex-col items-center flex-1">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    step.status === 'completed' ? 'bg-green-500 text-white' :
                    step.status === 'current' ? 'bg-primary text-white' :
                    'bg-gray-700 text-gray-400'
                  }`}>
                    {step.status === 'completed' ? '✓' : idx + 1}
                  </div>
                  <span className="text-[10px] text-gray-400 mt-1 text-center">{step.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex-1"></div>

      {/* Bottom Sheet */}
      <div className="relative z-20 bg-surface-dark rounded-t-[2rem] p-6 shadow-2xl border-t border-white/5 animate-slide-up">
        <div className="w-12 h-1.5 bg-gray-600 rounded-full mx-auto mb-6"></div>
        
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Arriving in {timeLeft} mins</h2>
            <p className="text-gray-400 text-sm">
              {new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} • On Time
            </p>
          </div>
          <div className={`${isConnected ? 'bg-green-500/20 text-accent' : 'bg-amber-500/20 text-amber-400'} px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2`}>
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-accent' : 'bg-amber-400'} animate-pulse`}></span>
            {isConnected ? 'LIVE' : 'UPDATING'}
          </div>
        </div>

        <div className="flex items-center gap-4 bg-background-dark p-4 rounded-2xl border border-white/5 mb-6">
          <div className="relative">
             <img src="https://i.pravatar.cc/150?u=mike" alt="Tech" className="w-14 h-14 rounded-full border-2 border-surface-dark" />
             <div className="absolute -bottom-1 -right-1 bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-surface-dark">{techRating} ★</div>
          </div>
          <div className="flex-1">
             <h3 className="text-white font-bold">{techName}</h3>
             <p className="text-gray-400 text-xs">{activeService?.type || 'HVAC'} Senior Tech</p>
          </div>
          <div className="flex gap-2">
             <button onClick={() => navigate('/support')} className="size-10 rounded-full bg-surface-dark border border-white/10 flex items-center justify-center text-white hover:bg-white/5">
                <span className="material-symbols-outlined text-[20px]">chat_bubble</span>
             </button>
             <button className="size-10 rounded-full bg-accent flex items-center justify-center text-primary shadow-lg hover:brightness-110">
                <span className="material-symbols-outlined text-[20px]">call</span>
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};
