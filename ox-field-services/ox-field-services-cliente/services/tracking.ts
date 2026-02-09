// WebSocket service for real-time tracking

export interface TechnicianLocation {
    lat: number;
    lng: number;
    heading?: number;
    speed?: number;
    updatedAt: string;
}

export interface TrackingUpdate {
    orderId: string;
    status: string;
    technicianLocation?: TechnicianLocation;
    estimatedArrival?: string;
    message?: string;
}

type TrackingCallback = (update: TrackingUpdate) => void;

class TrackingService {
    private ws: WebSocket | null = null;
    private callbacks: Map<string, TrackingCallback[]> = new Map();
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectDelay = 1000;
    private orderId: string | null = null;

    connect(orderId: string): void {
        this.orderId = orderId;
        this.reconnectAttempts = 0;
        this.establishConnection();
    }

    private establishConnection(): void {
        if (!this.orderId) return;

        const token = localStorage.getItem('token');
        const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/api/v1/ws/tracking/${this.orderId}?token=${token}`;

        try {
            this.ws = new WebSocket(wsUrl);

            this.ws.onopen = () => {
                console.log('Tracking WebSocket connected');
                this.reconnectAttempts = 0;
            };

            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    // Backend sends { orderId, technicianId, latitude?, longitude?, timestamp } (lat/lng null when > 200m)
                    const technicianLocation =
                        data.latitude != null && data.longitude != null
                            ? {
                                  lat: data.latitude,
                                  lng: data.longitude,
                                  updatedAt: data.timestamp ?? new Date().toISOString(),
                              }
                            : undefined;
                    const update: TrackingUpdate = {
                        orderId: data.orderId,
                        status: 'EN_ROUTE',
                        technicianLocation,
                    };
                    this.notifyCallbacks(update);
                } catch (err) {
                    console.error('Failed to parse tracking update:', err);
                }
            };

            this.ws.onclose = () => {
                console.log('Tracking WebSocket closed');
                this.attemptReconnect();
            };

            this.ws.onerror = (error) => {
                console.error('Tracking WebSocket error:', error);
            };
        } catch (err) {
            console.error('Failed to create WebSocket:', err);
            this.attemptReconnect();
        }
    }

    private attemptReconnect(): void {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.log('Max reconnection attempts reached');
            return;
        }

        this.reconnectAttempts++;
        const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
        
        console.log(`Attempting reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
        
        setTimeout(() => {
            this.establishConnection();
        }, delay);
    }

    disconnect(): void {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.orderId = null;
        this.callbacks.clear();
    }

    subscribe(orderId: string, callback: TrackingCallback): () => void {
        if (!this.callbacks.has(orderId)) {
            this.callbacks.set(orderId, []);
        }
        this.callbacks.get(orderId)!.push(callback);

        // Return unsubscribe function
        return () => {
            const callbacks = this.callbacks.get(orderId);
            if (callbacks) {
                const index = callbacks.indexOf(callback);
                if (index > -1) {
                    callbacks.splice(index, 1);
                }
            }
        };
    }

    private notifyCallbacks(update: TrackingUpdate): void {
        const callbacks = this.callbacks.get(update.orderId);
        if (callbacks) {
            callbacks.forEach(cb => cb(update));
        }
    }

    isConnected(): boolean {
        return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
    }
}

// Singleton instance
export const trackingService = new TrackingService();

// Polling fallback for when WebSocket is not available. Backend returns technicianLat/Lng only when within 200m.
export const pollTrackingUpdate = async (orderId: string): Promise<TrackingUpdate | null> => {
    try {
        const response = await fetch(`/api/v1/customer/orders/${orderId}/tracking`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) return null;

        const data = await response.json();
        const technicianLocation =
            data.technicianLat != null && data.technicianLng != null
                ? {
                      lat: data.technicianLat,
                      lng: data.technicianLng,
                      updatedAt: new Date().toISOString(),
                  }
                : undefined;
        return {
            orderId: data.orderId ?? orderId,
            status: data.isTracking ? 'EN_ROUTE' : 'SCHEDULED',
            technicianLocation,
            estimatedArrival: data.estimatedArrival,
        };
    } catch (err) {
        console.error('Failed to poll tracking update:', err);
        return null;
    }
};
