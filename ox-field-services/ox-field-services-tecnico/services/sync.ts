import client from './client';

// Types for offline sync
export interface SyncAction {
    id: string;
    type: 'UPDATE_ORDER_STATUS' | 'UPDATE_CHECKLIST' | 'ADD_PHOTO' | 'ADD_SIGNATURE' | 'ADD_MATERIALS' | 'UPDATE_LOCATION';
    payload: any;
    timestamp: string;
    retryCount: number;
}

export interface SyncResult {
    id: string;
    success: boolean;
    error?: string;
}

// IndexedDB setup for offline storage
const DB_NAME = 'ox-tech-offline';
const DB_VERSION = 1;
const STORES = {
    ACTIONS: 'pendingActions',
    AGENDA: 'cachedAgenda',
    ORDERS: 'cachedOrders'
};

class OfflineDatabase {
    private db: IDBDatabase | null = null;

    async init(): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                
                // Pending actions store
                if (!db.objectStoreNames.contains(STORES.ACTIONS)) {
                    db.createObjectStore(STORES.ACTIONS, { keyPath: 'id' });
                }
                
                // Cached agenda store
                if (!db.objectStoreNames.contains(STORES.AGENDA)) {
                    db.createObjectStore(STORES.AGENDA, { keyPath: 'id' });
                }
                
                // Cached orders store
                if (!db.objectStoreNames.contains(STORES.ORDERS)) {
                    db.createObjectStore(STORES.ORDERS, { keyPath: 'id' });
                }
            };
        });
    }

    private getStore(storeName: string, mode: IDBTransactionMode = 'readonly'): IDBObjectStore {
        if (!this.db) throw new Error('Database not initialized');
        const transaction = this.db.transaction(storeName, mode);
        return transaction.objectStore(storeName);
    }

    async addAction(action: SyncAction): Promise<void> {
        return new Promise((resolve, reject) => {
            const store = this.getStore(STORES.ACTIONS, 'readwrite');
            const request = store.add(action);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        });
    }

    async getActions(): Promise<SyncAction[]> {
        return new Promise((resolve, reject) => {
            const store = this.getStore(STORES.ACTIONS);
            const request = store.getAll();
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    }

    async removeAction(id: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const store = this.getStore(STORES.ACTIONS, 'readwrite');
            const request = store.delete(id);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        });
    }

    async updateAction(action: SyncAction): Promise<void> {
        return new Promise((resolve, reject) => {
            const store = this.getStore(STORES.ACTIONS, 'readwrite');
            const request = store.put(action);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        });
    }

    async cacheAgenda(agenda: any[]): Promise<void> {
        const store = this.getStore(STORES.AGENDA, 'readwrite');
        // Clear existing
        store.clear();
        // Add new items
        for (const item of agenda) {
            store.add(item);
        }
    }

    async getCachedAgenda(): Promise<any[]> {
        return new Promise((resolve, reject) => {
            const store = this.getStore(STORES.AGENDA);
            const request = store.getAll();
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    }

    async cacheOrder(order: any): Promise<void> {
        return new Promise((resolve, reject) => {
            const store = this.getStore(STORES.ORDERS, 'readwrite');
            const request = store.put(order);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        });
    }

    async getCachedOrder(id: string): Promise<any | null> {
        return new Promise((resolve, reject) => {
            const store = this.getStore(STORES.ORDERS);
            const request = store.get(id);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result || null);
        });
    }
}

// Singleton instance
const offlineDb = new OfflineDatabase();

// Sync service
export const syncService = {
    // Initialize the offline database
    init: async (): Promise<void> => {
        await offlineDb.init();
    },

    // Check if online
    isOnline: (): boolean => {
        return navigator.onLine;
    },

    // Queue an action for sync
    queueAction: async (type: SyncAction['type'], payload: any): Promise<string> => {
        const action: SyncAction = {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type,
            payload,
            timestamp: new Date().toISOString(),
            retryCount: 0
        };

        await offlineDb.addAction(action);
        
        // Try to sync immediately if online
        if (navigator.onLine) {
            syncService.syncNow();
        }

        return action.id;
    },

    // Get pending actions count
    getPendingCount: async (): Promise<number> => {
        const actions = await offlineDb.getActions();
        return actions.length;
    },

    // Get all pending actions
    getPendingActions: async (): Promise<SyncAction[]> => {
        return offlineDb.getActions();
    },

    // Sync all pending actions
    syncNow: async (): Promise<SyncResult[]> => {
        const actions = await offlineDb.getActions();
        const results: SyncResult[] = [];

        for (const action of actions) {
            try {
                // Send to batch endpoint
                await client.post('/sync/batch', {
                    actions: [action]
                });

                // Remove successful action
                await offlineDb.removeAction(action.id);
                results.push({ id: action.id, success: true });
            } catch (error: any) {
                // Increment retry count
                action.retryCount++;
                
                if (action.retryCount >= 3) {
                    // Remove after 3 retries
                    await offlineDb.removeAction(action.id);
                    results.push({ 
                        id: action.id, 
                        success: false, 
                        error: 'Max retries exceeded' 
                    });
                } else {
                    // Update action with new retry count
                    await offlineDb.updateAction(action);
                    results.push({ 
                        id: action.id, 
                        success: false, 
                        error: error.message 
                    });
                }
            }
        }

        return results;
    },

    // Pull latest data from server
    pullData: async (): Promise<{ agenda: any[]; notifications: any[] }> => {
        const response = await client.get('/sync/pull');
        
        // Cache the data locally
        if (response.data.agenda) {
            await offlineDb.cacheAgenda(response.data.agenda);
        }

        return response.data;
    },

    // Get cached agenda (for offline use)
    getCachedAgenda: async (): Promise<any[]> => {
        return offlineDb.getCachedAgenda();
    },

    // Cache order details
    cacheOrder: async (order: any): Promise<void> => {
        await offlineDb.cacheOrder(order);
    },

    // Get cached order
    getCachedOrder: async (id: string): Promise<any | null> => {
        return offlineDb.getCachedOrder(id);
    },

    // Setup online/offline listeners
    setupListeners: (onOnline: () => void, onOffline: () => void): () => void => {
        window.addEventListener('online', onOnline);
        window.addEventListener('offline', onOffline);

        // Return cleanup function
        return () => {
            window.removeEventListener('online', onOnline);
            window.removeEventListener('offline', onOffline);
        };
    }
};

// Auto-initialize when imported
syncService.init().catch(console.error);
