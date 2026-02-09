import { useEffect, useState } from 'react';

export interface LatLng {
  lat: number;
  lng: number;
}

/**
 * Hook para obter a localização atual em tempo real.
 * Usa watchPosition para atualizações contínuas (ideal para mapas).
 */
export const useGeolocation = (enabled: boolean = true) => {
  const [position, setPosition] = useState<LatLng | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setPosition(null);
      setError(null);
      return;
    }

    if (!navigator.geolocation) {
      setError('Geolocalização não disponível');
      return;
    }

    const handleSuccess = (geo: GeolocationPosition) => {
      setPosition({ lat: geo.coords.latitude, lng: geo.coords.longitude });
      setError(null);
    };

    const handleError = (err: GeolocationPositionError) => {
      switch (err.code) {
        case err.PERMISSION_DENIED:
          setError('Permissão de localização negada');
          break;
        case err.POSITION_UNAVAILABLE:
          setError('Posição indisponível');
          break;
        case err.TIMEOUT:
          setError('Tempo esgotado ao obter localização');
          break;
        default:
          setError('Erro ao obter localização');
      }
      setPosition(null);
    };

    const watchId = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [enabled]);

  return { position, error };
};
