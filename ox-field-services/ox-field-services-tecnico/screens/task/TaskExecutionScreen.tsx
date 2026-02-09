import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useJsApiLoader, GoogleMap, InfoWindow } from '@react-google-maps/api';
import { techService, ChecklistItem, OrderDetails } from '../../services/tech';
import { useLocationTracking } from '../../hooks/useLocationTracking';
import { useGeolocation } from '../../hooks/useGeolocation';
import { AuthImage } from '../../components/AuthImage';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
const GOOGLE_MAPS_MAP_ID = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || 'DEMO_MAP_ID';

// Status steps for the progression indicator
const STATUS_STEPS = [
  { key: 'SCHEDULED', label: 'Agendado', icon: 'calendar_today' },
  { key: 'EN_ROUTE', label: 'Em Rota', icon: 'directions_car' },
  { key: 'IN_PROGRESS', label: 'No Local', icon: 'location_on' },
  { key: 'COMPLETED', label: 'Concluído', icon: 'check_circle' },
];

const mapContainerStyle = { width: '100%', height: '100%' };

export const TaskExecutionScreen: React.FC = () => {
  const navigate = useNavigate();
  const { taskId: id } = useParams<{ taskId: string }>();
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [checklistLoadFailed, setChecklistLoadFailed] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const advancedMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const myPositionMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);

  const { isLoaded: isMapsLoaded, loadError: mapsLoadError } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    language: 'pt-BR',
    mapIds: [GOOGLE_MAPS_MAP_ID],
  });

  // Rastrear localização quando a OS está em progresso
  const isActive = order?.status === 'IN_PROGRESS' || order?.status === 'EN_ROUTE';
  useLocationTracking(isActive ? id || null : null, true);

  const hasCoordinates = !!(order?.customer?.coordinates?.lat && order?.customer?.coordinates?.lng);
  const { position: myPosition, error: geoError } = useGeolocation(hasCoordinates);

  // AdvancedMarkerElement (replaces deprecated google.maps.Marker)
  useEffect(() => {
    if (!mapInstance || !order?.customer?.coordinates?.lat || !order?.customer?.coordinates?.lng) {
      return;
    }
    const position = {
      lat: order.customer.coordinates.lat,
      lng: order.customer.coordinates.lng,
    };
    let cancelled = false;
    (async () => {
      try {
        const { AdvancedMarkerElement } = (await google.maps.importLibrary('marker')) as google.maps.MarkerLibrary;
        if (cancelled) return;
        const marker = new AdvancedMarkerElement({ map: mapInstance, position });
        if (cancelled) {
          marker.map = null;
          return;
        }
        advancedMarkerRef.current = marker;
      } catch (e) {
        if (!cancelled) {
          console.warn('AdvancedMarkerElement not available, map may need a valid mapId', e);
        }
      }
    })();
    return () => {
      cancelled = true;
      if (advancedMarkerRef.current) {
        advancedMarkerRef.current.map = null;
        advancedMarkerRef.current = null;
      }
    };
  }, [mapInstance, order?.customer?.coordinates?.lat, order?.customer?.coordinates?.lng]);

  // AdvancedMarkerElement for "you are here" (replaces deprecated google.maps.Marker)
  useEffect(() => {
    if (!mapInstance || !myPosition) return;
    let cancelled = false;
    (async () => {
      try {
        const { AdvancedMarkerElement } = (await google.maps.importLibrary('marker')) as google.maps.MarkerLibrary;
        if (cancelled) return;
        const marker = new AdvancedMarkerElement({
          map: mapInstance,
          position: myPosition,
          title: 'Você está aqui',
        });
        if (cancelled) {
          marker.map = null;
          return;
        }
        myPositionMarkerRef.current = marker;
      } catch (e) {
        if (!cancelled) {
          console.warn('AdvancedMarkerElement not available for user position', e);
        }
      }
    })();
    return () => {
      cancelled = true;
      if (myPositionMarkerRef.current) {
        myPositionMarkerRef.current.map = null;
        myPositionMarkerRef.current = null;
      }
    };
  }, [mapInstance, myPosition]);

  // Ajustar bounds para incluir cliente e técnico quando ambos disponíveis
  useEffect(() => {
    if (!mapInstance || !myPosition || !order?.customer?.coordinates?.lat || !order?.customer?.coordinates?.lng) {
      return;
    }
    const bounds = new google.maps.LatLngBounds();
    bounds.extend(myPosition);
    bounds.extend({
      lat: order.customer.coordinates!.lat,
      lng: order.customer.coordinates!.lng,
    });
    mapInstance.fitBounds(bounds, { top: 48, right: 24, bottom: 24, left: 24 });
  }, [mapInstance, myPosition, order?.customer?.coordinates?.lat, order?.customer?.coordinates?.lng]);

  useEffect(() => {
    if (!id) {
      navigate('/agenda');
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        setChecklistLoadFailed(false);

        const [orderData, checklistResult] = await Promise.all([
          techService.getOrder(id),
          techService.getChecklist(id).then((data) => ({ ok: true as const, data })).catch(() => ({ ok: false as const }))
        ]);

        setOrder(orderData);
        setChecklist(checklistResult.ok ? checklistResult.data : []);
        setChecklistLoadFailed(!checklistResult.ok);
        setPhotos(orderData.photos || []);
      } catch (err: any) {
        console.error('Failed to fetch order:', err);
        setError(err.response?.data?.message || 'Erro ao carregar OS');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, navigate]);

  const toggleChecklistItem = async (itemId: string) => {
    if (!id) return;

    const updatedChecklist = checklist.map(item =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    setChecklist(updatedChecklist);

    try {
      await techService.updateChecklist(id, updatedChecklist);
    } catch (err) {
      console.error('Failed to update checklist:', err);
      // Revert on error
      setChecklist(checklist);
    }
  };

  const handleStartRoute = async () => {
    if (!id || !order) return;

    try {
      setActionLoading(true);
      await techService.startRoute(id);
      setOrder((prev) => (prev ? { ...prev, status: 'EN_ROUTE' } : null));
      try {
        const updatedOrder = await techService.getOrder(id);
        setOrder(updatedOrder);
      } catch {
        // Keep optimistic EN_ROUTE so "Iniciar Rota" does not reappear if getOrder fails
      }
    } catch (err: any) {
      console.error('Failed to start route:', err);
      alert(err.response?.data?.message || 'Erro ao iniciar rota');
    } finally {
      setActionLoading(false);
    }
  };

  const handleArrive = async () => {
    if (!id || !order) return;

    try {
      setActionLoading(true);

      // Get current location
      const geoOptions: PositionOptions = {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 15000, // use cached position up to 15s old if fresh fix times out
      };

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            await techService.arriveAtLocation(
              id,
              position.coords.latitude,
              position.coords.longitude
            );
            const updatedOrder = await techService.getOrder(id);
            setOrder(updatedOrder);
          } catch (err: any) {
            console.error('Failed to mark arrival:', err);
            const data = err.response?.data;
            const msg = data?.message;
            const distanceMeters = data?.details?.distanceMeters ?? data?.distanceMeters;
            const requiredRadius = data?.details?.requiredRadius ?? data?.requiredRadius ?? 200;
            if (err.response?.status === 422 && distanceMeters != null) {
              alert(`Você está a ${Math.round(distanceMeters)} metros do endereço. Aproxime-se até ${Math.round(requiredRadius)} metros para marcar chegada.`);
            } else {
              alert(msg || 'Erro ao marcar chegada. Verifique se está próximo ao local (dentro de 200m).');
            }
          } finally {
            setActionLoading(false);
          }
        },
        (err: GeolocationPositionError) => {
          if (err.code === 3) {
            console.warn('Geolocation timeout:', err.message);
            alert('A localização demorou demais. Verifique o sinal (céu aberto ajuda) e tente novamente.');
          } else if (err.code === 1) {
            console.error('Geolocation permission denied:', err);
            alert('Permissão de localização negada. Ative o GPS/localização nas configurações do dispositivo.');
          } else {
            console.error('Geolocation error:', err);
            alert('Não foi possível obter a localização. Verifique se o GPS está ativo e tente novamente.');
          }
          setActionLoading(false);
        },
        geoOptions
      );
    } catch (err) {
      console.error('Failed to get location:', err);
      setActionLoading(false);
    }
  };

  const handlePhotoUpload = async (file: File) => {
    if (!id) return;

    try {
      const photoUrl = await techService.uploadPhoto(id, file, 'BEFORE');
      setPhotos([...photos, photoUrl]);
    } catch (err: any) {
      console.error('Failed to upload photo:', err);
      alert(err.response?.data?.message || 'Erro ao fazer upload da foto');
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handlePhotoUpload(file);
    }
  };

  const getCurrentStepIndex = () => {
    const statusIndex = STATUS_STEPS.findIndex(s => s.key === order?.status);
    return statusIndex >= 0 ? statusIndex : 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-dark flex items-center justify-center">
        <div className="text-center text-slate-400">
          <span className="material-symbols-outlined text-4xl mb-2 animate-spin-cw">sync</span>
          <p className="text-sm">Carregando...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-bg-dark flex items-center justify-center p-4">
        <div className="text-center text-red-400">
          <span className="material-symbols-outlined text-4xl mb-2">error</span>
          <p className="text-sm">{error || 'OS não encontrada'}</p>
          <button
            onClick={() => navigate('/agenda')}
            className="mt-4 px-4 py-2 bg-slate-700 rounded-lg text-white"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  const completedCount = checklist.filter(item => item.completed).length;
  const totalCount = checklist.length;
  const currentStepIndex = getCurrentStepIndex();

  return (
    <div className="min-h-screen bg-bg-dark pb-32">
      <header className="sticky top-0 z-20 flex items-center bg-bg-dark/95 backdrop-blur-sm px-4 py-3 justify-between border-b border-slate-800">
        <button onClick={() => navigate('/agenda')} className="flex size-10 items-center justify-center rounded-full hover:bg-slate-800 transition-colors text-white">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h2 className="text-white text-lg font-bold flex-1 text-center">{order.orderNumber}</h2>
        <div className="size-10"></div>
      </header>

      <div className="p-4 flex flex-col gap-6">
        {/* Status Progression */}
        <div className="bg-surface-dark rounded-xl border border-slate-800 p-4">
          <h3 className="text-sm font-semibold text-slate-400 mb-4">Status da OS</h3>
          <div className="flex items-center justify-between">
            {STATUS_STEPS.map((step, index) => {
              const isActive = index === currentStepIndex;
              const isCompleted = index < currentStepIndex;
              const isFuture = index > currentStepIndex;

              return (
                <React.Fragment key={step.key}>
                  <div className="flex flex-col items-center">
                    <div className={`flex items-center justify-center size-10 rounded-full transition-all ${isCompleted ? 'bg-secondary text-primary' :
                      isActive ? 'bg-accent text-primary ring-4 ring-accent/30' :
                        'bg-slate-700 text-slate-400'
                      }`}>
                      <span className="material-symbols-outlined text-lg">{step.icon}</span>
                    </div>
                    <span className={`text-[10px] mt-1.5 font-medium text-center ${isActive ? 'text-accent' : isCompleted ? 'text-secondary' : 'text-slate-500'
                      }`}>
                      {step.label}
                    </span>
                  </div>
                  {index < STATUS_STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-1 ${isCompleted ? 'bg-secondary' : 'bg-slate-700'
                      }`}></div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Map with Customer Location (Google Maps) */}
        <div className="relative w-full h-56 bg-slate-800 rounded-2xl overflow-hidden border border-slate-700">
          {!hasCoordinates || !GOOGLE_MAPS_API_KEY || mapsLoadError ? (
            <div className="absolute inset-0 bg-slate-700 flex items-center justify-center">
              <span className="text-slate-400 text-sm">Mapa não disponível</span>
            </div>
          ) : !isMapsLoaded ? (
            <div className="absolute inset-0 bg-slate-700 flex items-center justify-center">
              <span className="text-slate-400 text-sm">Carregando mapa...</span>
            </div>
          ) : (
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={{ lat: order.customer.coordinates!.lat, lng: order.customer.coordinates!.lng }}
              zoom={15}
              onLoad={(map) => setMapInstance(map)}
              onUnmount={() => setMapInstance(null)}
              options={{
                mapId: GOOGLE_MAPS_MAP_ID,
                zoomControl: false,
                fullscreenControl: false,
                streetViewControl: false,
                mapTypeControl: false,
              }}
            >
              <InfoWindow
                position={{ lat: order.customer.coordinates!.lat, lng: order.customer.coordinates!.lng }}
              >
                <div className="text-sm">
                  <strong>{order.customer.name}</strong>
                  <br />
                  {order.customer.address}
                </div>
              </InfoWindow>
            </GoogleMap>
          )}
          <div className="absolute bottom-3 left-3 bg-black/70 px-3 py-1.5 rounded-lg backdrop-blur text-xs font-bold text-white max-w-[70%] truncate">
            {order.customer.address}
          </div>
          {geoError && (
            <div className="absolute top-3 left-3 right-3 bg-amber-500/20 border border-amber-500/40 px-3 py-2 rounded-lg backdrop-blur text-xs text-amber-200">
              Ative a localização para ver sua posição
            </div>
          )}
        </div>

        {/* Order Info */}
        <div className="bg-surface-dark rounded-xl border border-slate-800 p-4">
          <h3 className="text-lg font-bold text-white mb-2">{order.title}</h3>
          {order.description && (
            <p className="text-sm text-slate-400 mb-3">{order.description}</p>
          )}
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">schedule</span>
              {order.scheduledStartTime}
            </span>
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">timer</span>
              {order.estimatedDuration} min
            </span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${order.priority === 'HIGH' || order.priority === 'URGENT' ? 'bg-red-500/20 text-red-400' :
              order.priority === 'MEDIUM' ? 'bg-orange-500/20 text-orange-400' :
                'bg-slate-500/20 text-slate-400'
              }`}>
              {order.priority}
            </span>
          </div>
        </div>

        {/* Customer Info */}
        <div className="bg-surface-dark rounded-xl border border-slate-800 p-4">
          <h3 className="text-sm font-semibold text-slate-400 mb-2">Cliente</h3>
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-accent/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-accent">person</span>
            </div>
            <div className="flex-1">
              <p className="text-white font-medium">{order.customer.name}</p>
              <p className="text-slate-400 text-sm">{order.customer.phone}</p>
            </div>
            {order.customer.phone && (
              <a href={`tel:${order.customer.phone}`} className="size-10 rounded-full bg-secondary/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-secondary">call</span>
              </a>
            )}
          </div>
        </div>

        {/* Checklist */}
        {checklistLoadFailed && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-center gap-3">
            <span className="material-symbols-outlined text-amber-400">warning</span>
            <p className="text-sm text-amber-200">O checklist não pôde ser carregado. Você ainda pode concluir o serviço, mas verifique os requisitos manualmente.</p>
          </div>
        )}
        {checklist.length > 0 && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Checklist</h3>
              <span className="text-xs font-medium text-accent bg-accent/10 px-2 py-1 rounded">
                {completedCount}/{totalCount} Feitos
              </span>
            </div>
            <div className="bg-surface-dark rounded-xl border border-slate-800 divide-y divide-slate-800">
              {checklist.map(item => (
                <div
                  key={item.id}
                  onClick={() => toggleChecklistItem(item.id)}
                  className="flex items-center gap-3 p-4 cursor-pointer hover:bg-white/5 transition-colors"
                >
                  <div className={`flex items-center justify-center size-6 rounded-md border ${item.completed
                    ? 'bg-secondary border-secondary text-primary'
                    : 'border-slate-500'
                    }`}>
                    {item.completed && (
                      <span className="material-symbols-outlined text-sm font-bold">check</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <span className={`text-sm font-medium ${item.completed ? 'text-slate-400 line-through' : 'text-white'
                      }`}>
                      {item.description}
                    </span>
                    {item.required && (
                      <span className="ml-2 text-[10px] text-red-400">*</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Photos */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white">Fotos</h3>
            <label className="text-xs font-bold text-accent flex items-center gap-1 cursor-pointer">
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileInput}
                className="hidden"
              />
              <span className="material-symbols-outlined text-sm">add_a_photo</span> ADICIONAR
            </label>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {photos.map((photo, index) => (
              <div
                key={index}
                className="aspect-square bg-slate-800 rounded-lg relative overflow-hidden group"
              >
                <AuthImage src={photo} className="w-full h-full object-cover" alt="Evidence" />
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="material-symbols-outlined text-white">visibility</span>
                </div>
              </div>
            ))}
            <label className="aspect-square bg-slate-800 rounded-lg border-2 border-dashed border-slate-600 flex flex-col items-center justify-center gap-1 hover:border-accent hover:text-accent text-slate-500 transition-all cursor-pointer">
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileInput}
                className="hidden"
              />
              <span className="material-symbols-outlined">add</span>
              <span className="text-[10px] font-bold uppercase">Foto</span>
            </label>
          </div>
        </div>

        <button
          onClick={() => navigate(`/task/${id}/materials`)}
          className="w-full py-4 bg-surface-dark border border-slate-700 rounded-xl flex items-center justify-between px-4 hover:bg-slate-800"
        >
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-accent">inventory_2</span>
            <span className="font-bold text-white">Materiais Utilizados</span>
          </div>
          <span className="material-symbols-outlined text-slate-400">chevron_right</span>
        </button>
      </div>

      {/* Bottom Action Button - Based on Status */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-bg-dark border-t border-slate-800 z-30">
        {order.status === 'SCHEDULED' && (
          <button
            onClick={handleStartRoute}
            disabled={actionLoading}
            className="w-full bg-accent hover:bg-accent/90 text-primary font-bold h-14 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {actionLoading ? (
              <span className="material-symbols-outlined animate-spin-cw">sync</span>
            ) : (
              <>
                <span className="material-symbols-outlined">directions_car</span>
                Iniciar Rota
              </>
            )}
          </button>
        )}
        {order.status === 'EN_ROUTE' && (
          <button
            onClick={handleArrive}
            disabled={actionLoading}
            className="w-full bg-secondary hover:bg-green-400 text-primary font-bold h-14 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {actionLoading ? (
              <span className="material-symbols-outlined animate-spin-cw">sync</span>
            ) : (
              <>
                <span className="material-symbols-outlined">location_on</span>
                Cheguei no Local
              </>
            )}
          </button>
        )}
        {order.status === 'IN_PROGRESS' && (
          <button
            onClick={() => navigate(`/task/${id}/complete`)}
            className="w-full bg-secondary hover:bg-green-400 text-primary font-bold h-14 rounded-xl flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined">check_circle</span>
            Concluir Serviço
          </button>
        )}
        {order.status === 'COMPLETED' && (
          <div className="w-full bg-green-500/20 text-green-400 font-bold h-14 rounded-xl flex items-center justify-center gap-2 border border-green-500/30">
            <span className="material-symbols-outlined">verified</span>
            Serviço Concluído
          </div>
        )}
      </div>
    </div>
  );
};
