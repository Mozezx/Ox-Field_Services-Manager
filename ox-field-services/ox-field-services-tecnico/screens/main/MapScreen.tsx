import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useJsApiLoader,
  GoogleMap,
  InfoWindow,
  DirectionsService,
  DirectionsRenderer,
} from '@react-google-maps/api';
import { BottomNav } from '../../components/BottomNav';
import { techService, AgendaItem } from '../../services/tech';
import { authService } from '../../services/auth';
import { useGeolocation } from '../../hooks/useGeolocation';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
const GOOGLE_MAPS_MAP_ID = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || 'DEMO_MAP_ID';
const mapContainerStyle = { width: '100%', height: '100%' };
const defaultCenter = { lat: -23.5505, lng: -46.6333 };

export const MapScreen: React.FC = () => {
  const navigate = useNavigate();
  const [agenda, setAgenda] = useState<AgendaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<AgendaItem | null>(null);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const advancedMarkersRef = useRef<{
    myMarker: google.maps.marker.AdvancedMarkerElement | null;
    destinationMarkers: Map<string, google.maps.marker.AdvancedMarkerElement>;
  }>({ myMarker: null, destinationMarkers: new Map() });

  const user = authService.getStoredUser();
  const { position: myPosition, error: geoError } = useGeolocation(true);

  const { isLoaded: isMapsLoaded, loadError: mapsLoadError } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    language: 'pt-BR',
    mapIds: [GOOGLE_MAPS_MAP_ID],
  });

  // Fetch agenda and filter items with coordinates
  useEffect(() => {
    const fetchAgenda = async () => {
      if (user?.status?.toLowerCase() === 'pending') {
        setLoading(false);
        setAgenda([]);
        setError(null);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const data = await techService.getAgenda();
        setAgenda(data);
      } catch (err: any) {
        if (err.response?.status === 401) {
          const tokenPresent = typeof localStorage !== 'undefined' && !!localStorage.getItem('token');
          console.warn('Agenda 401 Unauthorized: token present =', tokenPresent);
          authService.logout();
          return;
        }
        console.error('Failed to fetch agenda:', err);
        setError(err.response?.data?.message || 'Erro ao carregar agenda');
        setAgenda([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAgenda();
  }, [user?.status]);

  // Destinations with coordinates, ordered: active (EN_ROUTE/IN_PROGRESS) first, then SCHEDULED by time
  const destinations = useMemo(() => {
    const withCoords = agenda.filter(
      (item) =>
        item.customer?.coordinates?.lat != null &&
        item.customer?.coordinates?.lng != null
    );
    const active = withCoords.filter(
      (i) => i.status === 'EN_ROUTE' || i.status === 'IN_PROGRESS'
    );
    const scheduled = withCoords
      .filter((i) => i.status === 'SCHEDULED')
      .sort(
        (a, b) =>
          (a.scheduledStartTime || '').localeCompare(b.scheduledStartTime || '')
      );
    return [...active, ...scheduled];
  }, [agenda]);

  // Directions request: origin = myPosition or first destination, waypoints = middle stops, destination = last
  const directionsRequest = useMemo(() => {
    if (destinations.length === 0) return null;
    const coords = destinations.map((d) => d.customer!.coordinates!);

    if (destinations.length === 1) {
      if (!myPosition) return null; // No route without origin
      return {
        origin: myPosition,
        destination: coords[0],
        travelMode: google.maps.TravelMode.DRIVING,
      } as google.maps.DirectionsRequest;
    }

    const origin = myPosition ?? coords[0];
    const waypoints = myPosition
      ? coords.slice(0, -1).map((c) => ({ location: c, stopover: true }))
      : coords.slice(1, -1).map((c) => ({ location: c, stopover: true }));
    const destination = coords[coords.length - 1];

    return {
      origin,
      destination,
      waypoints: waypoints.length > 0 ? waypoints : undefined,
      optimizeWaypoints: !myPosition && waypoints.length > 1,
      travelMode: google.maps.TravelMode.DRIVING,
    } as google.maps.DirectionsRequest;
  }, [destinations, myPosition]);

  const handleDirectionsCallback = (
    result: google.maps.DirectionsResult | null,
    status: google.maps.DirectionsStatus
  ) => {
    if (status === google.maps.DirectionsStatus.OK && result) {
      setDirections(result);
    } else {
      setDirections(null);
    }
  };

  useEffect(() => {
    if (!directionsRequest) setDirections(null);
  }, [directionsRequest]);

  // AdvancedMarkerElement (replaces deprecated google.maps.Marker)
  useEffect(() => {
    if (!mapInstance || !isMapsLoaded) return;
    const refs = advancedMarkersRef.current;
    let cancelled = false;
    const listenerKeys: google.maps.MapsEventListener[] = [];

    (async () => {
      try {
        const { AdvancedMarkerElement } = (await google.maps.importLibrary('marker')) as google.maps.MarkerLibrary;
        if (cancelled) return;

        // Clear existing markers
        if (refs.myMarker) {
          refs.myMarker.map = null;
          refs.myMarker = null;
        }
        refs.destinationMarkers.forEach((m) => {
          m.map = null;
        });
        refs.destinationMarkers.clear();

        // "You are here" marker
        if (myPosition) {
          const myMarker = new AdvancedMarkerElement({ map: mapInstance, position: myPosition, title: 'Você está aqui' });
          if (cancelled) {
            myMarker.map = null;
            return;
          }
          refs.myMarker = myMarker;
        }

        // Destination markers with click -> setSelectedMarker
        for (const item of destinations) {
          const pos = item.customer?.coordinates;
          if (pos?.lat == null || pos?.lng == null) continue;
          const position = { lat: pos.lat, lng: pos.lng };
          const marker = new AdvancedMarkerElement({ map: mapInstance, position });
          if (cancelled) {
            marker.map = null;
            return;
          }
          refs.destinationMarkers.set(item.id, marker);
          const key = marker.addListener('click', () => {
            setSelectedMarker((prev) => (prev?.id === item.id ? null : item));
          });
          listenerKeys.push(key);
        }
      } catch (e) {
        if (!cancelled) {
          console.warn('AdvancedMarkerElement not available, map may need a valid mapId', e);
        }
      }
    })();

    return () => {
      cancelled = true;
      listenerKeys.forEach((k) => google.maps.event.removeListener(k));
      if (refs.myMarker) {
        refs.myMarker.map = null;
        refs.myMarker = null;
      }
      refs.destinationMarkers.forEach((m) => {
        m.map = null;
      });
      refs.destinationMarkers.clear();
    };
  }, [mapInstance, isMapsLoaded, myPosition, destinations]);

  const mapCenter = useMemo(() => {
    if (destinations.length === 0 && myPosition) return myPosition;
    if (destinations.length > 0) {
      const first = destinations[0].customer!.coordinates!;
      if (myPosition) {
        return {
          lat: (first.lat + myPosition.lat) / 2,
          lng: (first.lng + myPosition.lng) / 2,
        };
      }
      return first;
    }
    return defaultCenter;
  }, [destinations, myPosition]);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-dark flex flex-col">
        <header className="flex items-center px-4 py-3 bg-bg-dark border-b border-white/5">
          <h2 className="text-lg font-bold text-white">Rotas do Dia</h2>
        </header>
        <div className="flex-1 flex items-center justify-center text-slate-400">
          <span className="material-symbols-outlined text-4xl animate-spin-cw">sync</span>
          <p className="ml-2 text-sm">Carregando...</p>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-dark flex flex-col pb-24">
      <header className="flex items-center px-4 py-3 bg-bg-dark border-b border-white/5 sticky top-0 z-20">
        <h2 className="text-lg font-bold text-white">Rotas do Dia</h2>
      </header>

      <div className="flex-1 relative min-h-[400px]">
        {!GOOGLE_MAPS_API_KEY || mapsLoadError ? (
          <div className="absolute inset-0 bg-slate-800 flex items-center justify-center">
            <p className="text-slate-400 text-sm px-4">
              Configure VITE_GOOGLE_MAPS_API_KEY para exibir o mapa
            </p>
          </div>
        ) : destinations.length === 0 ? (
          <div className="absolute inset-0 bg-slate-800 flex items-center justify-center">
            <p className="text-slate-400 text-sm px-4 text-center">
              Nenhum destino com endereço disponível hoje
            </p>
          </div>
        ) : !isMapsLoaded ? (
          <div className="absolute inset-0 bg-slate-800 flex items-center justify-center">
            <span className="text-slate-400 text-sm">Carregando mapa...</span>
          </div>
        ) : (
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={mapCenter}
            zoom={12}
            onLoad={setMapInstance}
            options={{
              mapId: GOOGLE_MAPS_MAP_ID,
              zoomControl: true,
              fullscreenControl: false,
              streetViewControl: false,
              mapTypeControl: true,
            }}
          >
            {directionsRequest && (
              <DirectionsService
                options={directionsRequest}
                callback={handleDirectionsCallback}
              />
            )}
            {directions && <DirectionsRenderer directions={directions} />}

            {selectedMarker?.customer?.coordinates && (
              <InfoWindow
                position={{
                  lat: selectedMarker.customer.coordinates.lat,
                  lng: selectedMarker.customer.coordinates.lng,
                }}
                onCloseClick={() => setSelectedMarker(null)}
              >
                <div className="text-sm">
                  <strong>{selectedMarker.orderNumber}</strong> - {selectedMarker.title}
                  <br />
                  <span className="text-slate-600">{selectedMarker.customer?.name}</span>
                  <br />
                  <span className="text-slate-500 text-xs">{selectedMarker.customer?.address}</span>
                  <br />
                  <button
                    className="mt-2 text-xs font-bold text-accent hover:underline"
                    onClick={() => navigate(`/task/${selectedMarker.id}`)}
                  >
                    Abrir OS
                  </button>
                </div>
              </InfoWindow>
            )}
          </GoogleMap>
        )}

        {geoError && (
          <div className="absolute top-3 left-3 right-3 bg-amber-500/20 border border-amber-500/40 px-3 py-2 rounded-lg text-xs text-amber-200">
            Ative a localização para ver sua posição e rotas
          </div>
        )}

        {error && (
          <div className="absolute top-3 left-3 right-3 bg-red-500/20 border border-red-500/40 px-3 py-2 rounded-lg text-xs text-red-200">
            {error}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};
