import React, { useCallback, useMemo, useState } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';

const defaultCenter = { lat: -23.5505, lng: -46.6333 };
const mapContainerStyle = { width: '100%', height: '100%' };

export interface TrackingMapProps {
  technicianLocation: { lat: number; lng: number } | null;
  destination?: { lat: number; lng: number } | null;
  timeLeft?: number;
  className?: string;
}

interface MapContentOnlyProps {
  technicianLocation: { lat: number; lng: number } | null;
  destination: { lat: number; lng: number } | null;
  timeLeft?: number;
  center: { lat: number; lng: number };
  bounds: google.maps.LatLngBounds | undefined;
  onLoad: (map: google.maps.Map) => void;
}

const MapContentOnly: React.FC<MapContentOnlyProps> = ({
  technicianLocation,
  destination,
  timeLeft,
  center,
  bounds,
  onLoad,
}) => (
  <GoogleMap
    mapContainerStyle={mapContainerStyle}
    center={center}
    zoom={14}
    onLoad={onLoad}
    options={{
      disableDefaultUI: false,
      zoomControl: true,
      mapTypeControl: true,
      fullscreenControl: false,
      streetViewControl: false,
    }}
  >
    {technicianLocation && (
      <Marker
        position={technicianLocation}
        icon={{
          path: google.maps.SymbolPath.CIRCLE,
          scale: 12,
          fillColor: '#0a2329',
          fillOpacity: 1,
          strokeColor: '#fff',
          strokeWeight: 2,
        }}
      >
        {timeLeft != null && (
          <InfoWindow position={technicianLocation}>
            <span className="text-sm font-semibold">{timeLeft} min</span>
          </InfoWindow>
        )}
      </Marker>
    )}
    {destination && (
      <Marker
        position={destination}
        icon={{
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#2563eb',
          fillOpacity: 1,
          strokeColor: '#fff',
          strokeWeight: 2,
        }}
      >
        <InfoWindow position={destination}>
          <span className="text-sm">Your address</span>
        </InfoWindow>
      </Marker>
    )}
  </GoogleMap>
);

export const TrackingMap: React.FC<TrackingMapProps> = ({
  technicianLocation,
  destination = null,
  timeLeft,
  className = '',
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey,
  });

  const center = useMemo(() => {
    if (technicianLocation && destination) {
      return {
        lat: (technicianLocation.lat + destination.lat) / 2,
        lng: (technicianLocation.lng + destination.lng) / 2,
      };
    }
    if (technicianLocation) return technicianLocation;
    return defaultCenter;
  }, [technicianLocation, destination]);

  const bounds = useMemo(() => {
    if (!technicianLocation || typeof google === 'undefined' || !google.maps?.LatLngBounds) {
      return undefined;
    }
    const b = new google.maps.LatLngBounds();
    b.extend(technicianLocation);
    if (destination) b.extend(destination);
    return b;
  }, [technicianLocation, destination]);

  const onLoad = useCallback(
    (map: google.maps.Map) => {
      if (bounds) {
        map.fitBounds(bounds, { top: 48, right: 24, bottom: 24, left: 24 });
      }
    },
    [bounds]
  );

  if (!apiKey) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-200 dark:bg-gray-800 ${className}`}
      >
        <p className="text-sm text-gray-600 dark:text-gray-400 px-4">
          Set VITE_GOOGLE_MAPS_API_KEY to display the map.
        </p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-200 dark:bg-gray-800 ${className}`}
      >
        <p className="text-sm text-gray-600 dark:text-gray-400 px-4">
          Could not load the map.
        </p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-200 dark:bg-gray-800 ${className}`}
      >
        <p className="text-sm text-gray-600 dark:text-gray-400">Carregando mapa...</p>
      </div>
    );
  }

  const mapContent = (
    <div className="relative w-full h-full">
      <MapContentOnly
        technicianLocation={technicianLocation}
        destination={destination}
        timeLeft={timeLeft}
        center={center}
        bounds={bounds}
        onLoad={onLoad}
      />
      <button
        type="button"
        onClick={() => setIsFullscreen(true)}
        className="absolute bottom-3 right-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-surface-dark shadow-lg text-primary dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
        aria-label="Abrir mapa em tela cheia"
      >
        <span className="material-symbols-outlined text-[20px]">fullscreen</span>
      </button>
    </div>
  );

  return (
    <>
      <div className={className} style={{ minHeight: 200 }}>
        {mapContent}
      </div>
      {isFullscreen && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col">
          <div className="absolute top-4 right-4 z-[101]">
            <button
              type="button"
              onClick={() => setIsFullscreen(false)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-surface-dark shadow-lg text-primary dark:text-white"
              aria-label="Fechar tela cheia"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          <div className="flex-1 w-full relative">
            <MapContentOnly
              technicianLocation={technicianLocation}
              destination={destination}
              timeLeft={timeLeft}
              center={center}
              bounds={bounds}
              onLoad={onLoad}
            />
          </div>
        </div>
      )}
    </>
  );
};
