import AsyncStorage from '@react-native-async-storage/async-storage';

const BOOKINGS_KEY = '@transconnect_offline_bookings';
const ROUTES_KEY = '@transconnect_offline_routes';
const LAST_SYNC_KEY = '@transconnect_last_sync';
const PENDING_ACTIONS_KEY = '@transconnect_pending_actions';

export interface OfflineBooking {
  id: string;
  userId: string;
  routeId: string;
  travelDate: string;
  boardingStop: string;
  alightingStop: string;
  passengerCount: number;
  totalAmount: number;
  status: string;
  paymentMethod: string;
  route?: any;
  createdAt: string;
  syncedAt?: string;
}

export interface OfflineRoute {
  id: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  duration: number;
  distance: number;
  basePrice: number;
  operator?: any;
  schedule?: any[];
  cachedAt: string;
}

export interface PendingAction {
  id: string;
  type: 'create' | 'update' | 'delete';
  resource: 'booking' | 'profile';
  data: any;
  timestamp: string;
  retries: number;
}

class OfflineStorageService {
  /**
   * Save bookings to offline storage
   */
  async saveBookings(bookings: OfflineBooking[]): Promise<void> {
    try {
      await AsyncStorage.setItem(BOOKINGS_KEY, JSON.stringify(bookings));
      await AsyncStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
      console.log('Bookings saved offline successfully');
    } catch (error) {
      console.error('Error saving bookings offline:', error);
      throw error;
    }
  }

  /**
   * Get all bookings from offline storage
   */
  async getBookings(): Promise<OfflineBooking[]> {
    try {
      const bookingsJson = await AsyncStorage.getItem(BOOKINGS_KEY);
      if (!bookingsJson) {
        return [];
      }
      return JSON.parse(bookingsJson);
    } catch (error) {
      console.error('Error getting offline bookings:', error);
      return [];
    }
  }

  /**
   * Get a single booking by ID from offline storage
   */
  async getBookingById(bookingId: string): Promise<OfflineBooking | null> {
    try {
      const bookings = await this.getBookings();
      return bookings.find(b => b.id === bookingId) || null;
    } catch (error) {
      console.error('Error getting booking by ID:', error);
      return null;
    }
  }

  /**
   * Add or update a single booking in offline storage
   */
  async saveBooking(booking: OfflineBooking): Promise<void> {
    try {
      const bookings = await this.getBookings();
      const existingIndex = bookings.findIndex(b => b.id === booking.id);
      
      if (existingIndex >= 0) {
        bookings[existingIndex] = booking;
      } else {
        bookings.push(booking);
      }

      await this.saveBookings(bookings);
    } catch (error) {
      console.error('Error saving booking:', error);
      throw error;
    }
  }

  /**
   * Delete a booking from offline storage
   */
  async deleteBooking(bookingId: string): Promise<void> {
    try {
      const bookings = await this.getBookings();
      const filteredBookings = bookings.filter(b => b.id !== bookingId);
      await this.saveBookings(filteredBookings);
    } catch (error) {
      console.error('Error deleting booking:', error);
      throw error;
    }
  }

  /**
   * Get the last sync timestamp
   */
  async getLastSyncTime(): Promise<Date | null> {
    try {
      const lastSync = await AsyncStorage.getItem(LAST_SYNC_KEY);
      return lastSync ? new Date(lastSync) : null;
    } catch (error) {
      console.error('Error getting last sync time:', error);
      return null;
    }
  }

  /**
   * Clear all offline data
   */
  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([BOOKINGS_KEY, ROUTES_KEY, LAST_SYNC_KEY, PENDING_ACTIONS_KEY]);
      console.log('Offline storage cleared');
    } catch (error) {
      console.error('Error clearing offline storage:', error);
      throw error;
    }
  }

  /**
   * Save routes to offline storage
   */
  async saveRoutes(routes: OfflineRoute[]): Promise<void> {
    try {
      const routesWithCache = routes.map(route => ({
        ...route,
        cachedAt: new Date().toISOString(),
      }));
      await AsyncStorage.setItem(ROUTES_KEY, JSON.stringify(routesWithCache));
      console.log('Routes saved offline successfully');
    } catch (error) {
      console.error('Error saving routes offline:', error);
      throw error;
    }
  }

  /**
   * Get all routes from offline storage
   */
  async getRoutes(): Promise<OfflineRoute[]> {
    try {
      const routesJson = await AsyncStorage.getItem(ROUTES_KEY);
      if (!routesJson) {
        return [];
      }
      return JSON.parse(routesJson);
    } catch (error) {
      console.error('Error getting offline routes:', error);
      return [];
    }
  }

  /**
   * Search routes offline (fallback when offline)
   */
  async searchRoutesOffline(origin?: string, destination?: string): Promise<OfflineRoute[]> {
    try {
      const routes = await this.getRoutes();
      if (!origin && !destination) {
        return routes;
      }

      return routes.filter(route => {
        const originMatch = !origin || route.origin.toLowerCase().includes(origin.toLowerCase());
        const destMatch = !destination || route.destination.toLowerCase().includes(destination.toLowerCase());
        return originMatch && destMatch;
      });
    } catch (error) {
      console.error('Error searching offline routes:', error);
      return [];
    }
  }

  /**
   * Add a pending action to queue (for when offline)
   */
  async addPendingAction(action: Omit<PendingAction, 'id' | 'timestamp' | 'retries'>): Promise<void> {
    try {
      const pending = await this.getPendingActions();
      const newAction: PendingAction = {
        ...action,
        id: `pending_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        retries: 0,
      };
      pending.push(newAction);
      await AsyncStorage.setItem(PENDING_ACTIONS_KEY, JSON.stringify(pending));
      console.log('Pending action added:', newAction.type, newAction.resource);
    } catch (error) {
      console.error('Error adding pending action:', error);
      throw error;
    }
  }

  /**
   * Get all pending actions
   */
  async getPendingActions(): Promise<PendingAction[]> {
    try {
      const actionsJson = await AsyncStorage.getItem(PENDING_ACTIONS_KEY);
      if (!actionsJson) {
        return [];
      }
      return JSON.parse(actionsJson);
    } catch (error) {
      console.error('Error getting pending actions:', error);
      return [];
    }
  }

  /**
   * Remove a pending action after successful sync
   */
  async removePendingAction(actionId: string): Promise<void> {
    try {
      const pending = await this.getPendingActions();
      const filtered = pending.filter(a => a.id !== actionId);
      await AsyncStorage.setItem(PENDING_ACTIONS_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error removing pending action:', error);
      throw error;
    }
  }

  /**
   * Increment retry count for a pending action
   */
  async incrementActionRetry(actionId: string): Promise<void> {
    try {
      const pending = await this.getPendingActions();
      const action = pending.find(a => a.id === actionId);
      if (action) {
        action.retries++;
        await AsyncStorage.setItem(PENDING_ACTIONS_KEY, JSON.stringify(pending));
      }
    } catch (error) {
      console.error('Error incrementing action retry:', error);
    }
  }

  /**
   * Check if bookings are available offline
   */
  async hasOfflineData(): Promise<boolean> {
    try {
      const bookings = await this.getBookings();
      return bookings.length > 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get storage size information
   */
  async getStorageInfo(): Promise<{ 
    bookingCount: number; 
    routeCount: number;
    pendingActionsCount: number;
    lastSync: Date | null;
  }> {
    try {
      const bookings = await this.getBookings();
      const routes = await this.getRoutes();
      const pendingActions = await this.getPendingActions();
      const lastSync = await this.getLastSyncTime();
      return {
        bookingCount: bookings.length,
        routeCount: routes.length,
        pendingActionsCount: pendingActions.length,
        lastSync,
      };
    } catch (error) {
      return {
        bookingCount: 0,
        routeCount: 0,
        pendingActionsCount: 0,
        lastSync: null,
      };
    }
  }
}

export const offlineStorage = new OfflineStorageService();
