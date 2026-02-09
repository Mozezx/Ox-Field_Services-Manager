import client from './client';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

/**
 * Serviço de geocodificação para buscar endereços reais.
 *
 * Se VITE_GOOGLE_MAPS_API_KEY estiver definida: usa Google Places (Autocomplete + Place Details).
 * Caso contrário: usa o backend como proxy (Nominatim/OpenStreetMap).
 */

export interface GeocodingResult {
    place_id: number;
    display_name: string;
    lat: string;
    lon: string;
    address: {
        house_number?: string;
        road?: string;
        neighbourhood?: string;
        suburb?: string;
        city?: string;
        state?: string;
        postcode?: string;
        country?: string;
    };
}

export interface AddressSuggestion {
    id: string;
    displayName: string;
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    latitude: number;
    longitude: number;
    source: 'nominatim' | 'google' | 'manual';
}

declare global {
    interface Window {
        google?: typeof google;
        __googleMapsLoaded?: () => void;
    }
}

let googleMapsLoadPromise: Promise<typeof google> | null = null;

function loadGoogleMapsScript(): Promise<typeof google> {
    if (typeof window === 'undefined' || !window.google?.maps?.places) {
        if (!googleMapsLoadPromise) {
            if (!GOOGLE_MAPS_API_KEY) {
                return Promise.reject(new Error('VITE_GOOGLE_MAPS_API_KEY não configurada'));
            }
            googleMapsLoadPromise = new Promise((resolve, reject) => {
                if (window.google?.maps?.places) {
                    resolve(window.google);
                    return;
                }
                const script = document.createElement('script');
                script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
                script.async = true;
                script.defer = true;
                script.onload = () => {
                    if (window.google?.maps?.places) {
                        resolve(window.google);
                    } else {
                        reject(new Error('Google Maps Places não carregou'));
                    }
                };
                script.onerror = () => reject(new Error('Falha ao carregar Google Maps'));
                document.head.appendChild(script);
            });
        }
        return googleMapsLoadPromise;
    }
    return Promise.resolve(window.google!);
}

function googlePlaceToSuggestion(place: google.maps.places.PlaceResult): AddressSuggestion | null {
    const ac = place.address_components || [];
    const geo = place.geometry?.location;
    if (!geo) return null;

    const get = (type: string) => ac.find(c => c.types.includes(type))?.long_name || '';
    const getShort = (type: string) => ac.find(c => c.types.includes(type))?.short_name || '';

    const streetNumber = get('street_number');
    const route = get('route');
    const street = [streetNumber, route].filter(Boolean).join(' ') || place.name || place.formatted_address || '';

    return {
        id: place.place_id || String(Math.random()),
        displayName: place.formatted_address || place.name || street,
        street: street || place.formatted_address || '',
        city: get('locality') || get('administrative_area_level_2'),
        state: getShort('administrative_area_level_1'),
        postalCode: get('postal_code'),
        country: get('country'),
        latitude: typeof geo.lat === 'function' ? geo.lat() : geo.lat,
        longitude: typeof geo.lng === 'function' ? geo.lng() : geo.lng,
        source: 'google'
    };
}

/**
 * Busca endereços via Google Places (Autocomplete + Place Details).
 */
async function searchAddressesGoogle(query: string): Promise<AddressSuggestion[]> {
    const g = await loadGoogleMapsScript();
    const autocomplete = new g.maps.places.AutocompleteService();
    const predictions = await new Promise<google.maps.places.AutocompletePrediction[]>((resolve, reject) => {
        autocomplete.getPlacePredictions(
            { input: query.trim(), types: ['address'] },
            (list, status) => {
                if (status !== g.maps.places.PlacesServiceStatus.OK || !list) {
                    resolve([]);
                    return;
                }
                resolve(list);
            }
        );
    });

    if (predictions.length === 0) return [];

    const div = document.createElement('div');
    const placesService = new g.maps.places.PlacesService(div);

    const details = await Promise.all(
        predictions.slice(0, 5).map(
            (p) =>
                new Promise<AddressSuggestion | null>((resolve) => {
                    placesService.getDetails(
                        { placeId: p.place_id, fields: ['place_id', 'formatted_address', 'address_components', 'geometry', 'name'] },
                        (place, status) => {
                            if (status !== g.maps.places.PlacesServiceStatus.OK || !place) {
                                resolve(null);
                                return;
                            }
                            resolve(googlePlaceToSuggestion(place));
                        }
                    );
                })
        )
    );

    return details.filter((s): s is AddressSuggestion => s !== null);
}

/**
 * Serviço de geocodificação usando múltiplas fontes
 */
export const geocodingService = {
    /**
     * Busca endereços baseado em uma query de texto.
     * Usa Google Places se VITE_GOOGLE_MAPS_API_KEY estiver definida; senão usa o backend (Nominatim).
     * @param query - Texto de busca (ex: "Rua das Flores, São Paulo")
     * @returns Lista de sugestões de endereços
     */
    searchAddresses: async (query: string): Promise<AddressSuggestion[]> => {
        if (!query || query.trim().length < 3) {
            return [];
        }

        if (GOOGLE_MAPS_API_KEY) {
            try {
                return await searchAddressesGoogle(query);
            } catch (error) {
                console.error('Error searching addresses (Google):', error);
                throw new Error('Erro ao buscar endereços no Google Maps. Verifique a chave da API.');
            }
        }

        try {
            const response = await client.get<AddressSuggestion[]>('/geocoding/search', {
                params: { query }
            });

            return response.data.map(addr => ({
                ...addr,
                source: 'nominatim' as const
            }));
        } catch (error) {
            console.error('Error searching addresses:', error);
            throw new Error('Erro ao buscar endereços. Tente novamente.');
        }
    },


    /**
     * Formata o endereço completo para exibição.
     */
    formatFullAddress: (suggestion: AddressSuggestion): string => {
        const parts = [];
        if (suggestion.street) parts.push(suggestion.street);
        if (suggestion.city) parts.push(suggestion.city);
        if (suggestion.state) parts.push(suggestion.state);
        if (suggestion.postalCode) parts.push(suggestion.postalCode);
        
        return parts.length > 0 ? parts.join(', ') : suggestion.displayName;
    },

    /**
     * Geocodifica um endereço manual (obtém coordenadas).
     * Útil quando o usuário cadastra um endereço que não foi encontrado na busca.
     * Usa o backend como proxy para evitar problemas de CORS.
     */
    geocodeAddress: async (street: string, city: string, state: string, postalCode?: string): Promise<{ latitude: number; longitude: number } | null> => {
        try {
            // Usar endpoint do backend (evita CORS)
            const response = await client.get<{ latitude: number | null; longitude: number | null }>('/geocoding/geocode', {
                params: {
                    street,
                    city,
                    state,
                    ...(postalCode && { postalCode })
                }
            });

            if (response.data.latitude && response.data.longitude) {
                return {
                    latitude: response.data.latitude,
                    longitude: response.data.longitude
                };
            }

            return null;
        } catch (error) {
            console.error('Error geocoding address:', error);
            return null;
        }
    }
};
