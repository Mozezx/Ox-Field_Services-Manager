import { useEffect, useRef } from 'react';
import { techService } from '../services/tech';

/**
 * Hook para atualização periódica de localização do técnico
 * Atualiza a localização a cada 30 segundos quando há uma OS ativa
 */
export const useLocationTracking = (activeOrderId: string | null, isOnline: boolean = true) => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    // Só rastrear se estiver online e tiver uma OS ativa
    if (!isOnline || !activeOrderId) {
      // Limpar intervalos se não houver OS ativa
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      return;
    }

    // Função para atualizar localização
    const updateLocation = () => {
      if (!navigator.geolocation) {
        console.warn('Geolocation não disponível');
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          techService.updateLocation(
            position.coords.latitude,
            position.coords.longitude,
            activeOrderId
          ).catch((err) => {
            console.error('Erro ao atualizar localização:', err);
          });
        },
        (err) => {
          // Code 3 = TIMEOUT - common indoors or with poor GPS; avoid noisy error logs
          if (err.code === 3) {
            console.warn('Geolocation timeout - will retry on next interval');
          } else {
            console.error('Erro ao obter localização:', err);
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 20000,
          maximumAge: 15000
        }
      );
    };

    // Atualizar imediatamente
    updateLocation();

    // Configurar atualização periódica a cada 30 segundos
    intervalRef.current = setInterval(updateLocation, 30000);

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [activeOrderId, isOnline]);
};
