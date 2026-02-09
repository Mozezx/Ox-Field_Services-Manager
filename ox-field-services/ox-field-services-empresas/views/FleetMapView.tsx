import React, { useState, useEffect, useCallback } from 'react';
import { useJsApiLoader, GoogleMap, Marker, InfoWindow } from '@react-google-maps/api';
import { Loader2, MapPin, RefreshCw } from 'lucide-react';
import { empresaService, FleetLocationEntry } from '../services/empresa';

const DEFAULT_CENTER = { lat: 38.7223, lng: -9.1393 }; // Portugal
const DEFAULT_ZOOM = 8;
const MAP_CONTAINER_STYLE = { width: '100%', height: '100%', minHeight: 'calc(100vh - 8rem)' };

const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

export const FleetMapView: React.FC = () => {
  const [locations, setLocations] = useState<FleetLocationEntry[]>([]);
  const [locationsLoading, setLocationsLoading] = useState(true);
  const [locationsError, setLocationsError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey || '',
  });

  const fetchLocations = useCallback(async () => {
    try {
      setLocationsLoading(true);
      setLocationsError(null);
      const data = await empresaService.getFleetLocations();
      setLocations(data);
    } catch (err) {
      console.error('Failed to fetch fleet locations:', err);
      setLocationsError('Não foi possível carregar as localizações dos técnicos.');
      setLocations([]);
    } finally {
      setLocationsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isLoaded) fetchLocations();
  }, [isLoaded, fetchLocations]);

  if (!apiKey) {
    return (
      <div className="p-8 max-w-7xl mx-auto animate-fade-in">
        <h1 className="text-3xl font-bold text-white mb-2">Live Fleet Monitoring Map</h1>
        <p className="text-secondary mb-4">Mapa de localização dos técnicos.</p>
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-6 text-center max-w-lg mx-auto">
          <p className="text-amber-400 font-medium mb-2">Chave da API não configurada.</p>
          <p className="text-secondary text-sm">Crie o ficheiro <code className="bg-white/10 px-1 rounded">.env</code> na pasta do projeto com: <code className="block mt-2 bg-white/10 px-2 py-1 rounded text-left text-xs">VITE_GOOGLE_MAPS_API_KEY=sua_chave</code></p>
          <p className="text-secondary text-sm mt-3">Reinicie o servidor (npm run dev) após alterar o .env.</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="p-8 max-w-7xl mx-auto animate-fade-in">
        <h1 className="text-3xl font-bold text-white mb-2">Live Fleet Monitoring Map</h1>
        <p className="text-secondary mb-4">Mapa de localização dos técnicos.</p>
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 text-center max-w-lg mx-auto">
          <p className="text-red-400 font-medium mb-2">Erro ao carregar o Google Maps.</p>
          <p className="text-secondary text-sm mb-2">Confirme no Google Cloud Console:</p>
          <ul className="text-left text-secondary text-sm list-disc list-inside space-y-1">
            <li>Maps JavaScript API está ativada</li>
            <li>Faturação do projeto está ativa</li>
            <li>Restrições da chave: adicione <code className="bg-white/10 px-1 rounded">http://localhost:3000/*</code> e <code className="bg-white/10 px-1 rounded">http://localhost:3001/*</code></li>
          </ul>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="p-8 max-w-7xl mx-auto animate-fade-in">
        <h1 className="text-3xl font-bold text-white mb-2">Live Fleet Monitoring Map</h1>
        <p className="text-secondary mb-4">A carregar mapa...</p>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="animate-spin text-primary" size={48} />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-6 py-4 border-b border-white/10 bg-surface/30">
        <div>
          <h1 className="text-2xl font-bold text-white">Live Fleet Monitoring Map</h1>
          <p className="text-secondary text-sm mt-0.5">Localização em tempo real dos técnicos.</p>
        </div>
        <button
          type="button"
          onClick={fetchLocations}
          disabled={locationsLoading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/20 text-primary border border-primary/40 hover:bg-primary/30 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={18} className={locationsLoading ? 'animate-spin' : ''} />
          Atualizar
        </button>
      </div>

      {locationsError && (
        <div className="mx-6 mt-4 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-amber-400 text-sm">
          {locationsError}
        </div>
      )}

      <div className="flex-1 relative px-6 py-4 min-h-0">
        <div className="rounded-xl overflow-hidden border border-white/10 bg-surface/50" style={MAP_CONTAINER_STYLE}>
          <GoogleMap
            mapContainerStyle={MAP_CONTAINER_STYLE}
            center={locations.length > 0 ? { lat: locations[0].latitude, lng: locations[0].longitude } : DEFAULT_CENTER}
            zoom={locations.length === 1 ? 14 : DEFAULT_ZOOM}
            options={{
              streetViewControl: false,
              mapTypeControl: true,
              fullscreenControl: true,
              zoomControl: true,
            }}
          >
            {locations.map((entry) => (
              <React.Fragment key={entry.technicianId}>
                <Marker
                  position={{ lat: entry.latitude, lng: entry.longitude }}
                  onClick={() => setSelectedId(entry.technicianId)}
                />
                {selectedId === entry.technicianId && (
                  <InfoWindow
                    position={{ lat: entry.latitude, lng: entry.longitude }}
                    onCloseClick={() => setSelectedId(null)}
                  >
                    <div className="p-1 min-w-[160px]">
                      <div className="flex items-center gap-2 text-gray-800 font-semibold">
                        <MapPin size={16} className="text-primary shrink-0" />
                        {entry.name}
                      </div>
                      <p className="text-xs text-gray-600 mt-1">Técnico</p>
                    </div>
                  </InfoWindow>
                )}
              </React.Fragment>
            ))}
          </GoogleMap>
        </div>

        {!locationsLoading && locations.length === 0 && !locationsError && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-surface/95 border border-white/10 rounded-xl px-6 py-4 shadow-lg">
              <p className="text-secondary">Nenhum técnico com localização disponível.</p>
            </div>
          </div>
        )}

        {locationsLoading && (
          <div className="absolute top-6 right-10 flex items-center gap-2 bg-surface/90 border border-white/10 rounded-lg px-3 py-2 text-sm text-secondary">
            <Loader2 size={16} className="animate-spin" />
            A carregar posições...
          </div>
        )}
      </div>
    </div>
  );
};
