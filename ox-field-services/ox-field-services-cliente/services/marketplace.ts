import client from './client';

/**
 * Resultado da busca de empresas no marketplace.
 * Cada empresa é ordenada pela proximidade do técnico mais próximo.
 */
export interface CompanySearchResult {
    tenantId: string;
    companyName: string;
    logoUrl?: string;
    rating: number;
    totalReviews: number;
    nearestTechnicianDistanceKm: number;
    estimatedArrivalMinutes: number;
    hasAvailability: boolean;
}

/**
 * Parâmetros para busca de empresas no marketplace.
 */
export interface SearchCompaniesParams {
    category: string;
    latitude: number;
    longitude: number;
    date: string; // formato: yyyy-MM-dd
}

/**
 * Public marketplace listing (service ad).
 */
export interface MarketplaceListing {
    listingId: string;
    tenantId: string;
    categoryId: string;
    title: string;
    description?: string;
    priceFrom?: number;
    imageUrl?: string;
    categoryName: string;
    categoryCode: string;
    companyName: string;
    logoUrl?: string;
    rating: number;
    totalReviews: number;
}

/**
 * Marketplace category (for filters).
 */
export interface MarketplaceCategory {
    code: string;
    name: string;
}

/**
 * Paginated listings response.
 */
export interface ListingsPage {
    content: MarketplaceListing[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
}

/**
 * Serviço de Marketplace.
 * Busca empresas disponíveis para um serviço, ordenadas por proximidade.
 */
export const marketplaceService = {
    /**
     * Busca empresas disponíveis para uma categoria de serviço.
     * Retorna lista ordenada pela proximidade do técnico mais próximo.
     * 
     * @param params - Parâmetros de busca (categoria, localização, data)
     * @returns Lista de empresas ordenadas por proximidade
     */
    searchCompanies: async (params: SearchCompaniesParams): Promise<CompanySearchResult[]> => {
        const response = await client.get<CompanySearchResult[]>('/marketplace/companies', {
            params: {
                category: params.category.toUpperCase(),
                latitude: params.latitude,
                longitude: params.longitude,
                date: params.date
            }
        });
        return response.data;
    },

    /**
     * Formata a distância para exibição.
     * @param distanceKm - Distância em quilômetros
     * @returns String formatada (ex: "2.3 km" ou "500 m")
     */
    formatDistance: (distanceKm: number): string => {
        if (distanceKm < 1) {
            return `${Math.round(distanceKm * 1000)} m`;
        }
        return `${distanceKm.toFixed(1)} km`;
    },

    /**
     * Formata o tempo estimado de chegada.
     * @param minutes - Tempo em minutos
     * @returns String formatada (ex: "~15 min" ou "~1h 30min")
     */
    formatArrivalTime: (minutes: number): string => {
        if (minutes < 60) {
            return `~${minutes} min`;
        }
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (mins === 0) {
            return `~${hours}h`;
        }
        return `~${hours}h ${mins}min`;
    },

    /**
     * Formata o rating para exibição.
     * @param rating - Rating (0-5)
     * @returns String formatada (ex: "4.8")
     */
    formatRating: (rating: number): string => {
        return rating.toFixed(1);
    },

    /**
     * List active marketplace listings (public).
     */
    getListings: async (params?: {
        categoryCode?: string;
        tenantId?: string;
        search?: string;
        page?: number;
        size?: number;
    }): Promise<ListingsPage> => {
        const response = await client.get<ListingsPage>('/marketplace/listings', {
            params: {
                categoryCode: params?.categoryCode,
                tenantId: params?.tenantId,
                search: params?.search,
                page: params?.page ?? 0,
                size: params?.size ?? 50
            }
        });
        return response.data;
    },

    /**
     * List distinct categories that have at least one active listing.
     */
    getCategories: async (): Promise<MarketplaceCategory[]> => {
        const response = await client.get<MarketplaceCategory[]>('/marketplace/categories');
        return response.data;
    }
};
