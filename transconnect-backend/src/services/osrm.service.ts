/**
 * OSRM (Open Source Routing Machine) Service
 * 
 * Free alternative to Google Maps for route distance and duration calculation.
 * Uses public OSRM server - no API key required!
 * 
 * Features:
 * - Route distance calculation
 * - Route duration estimation
 * - Geocoding via Nominatim
 * - 100% free, no billing required
 * - Supports Uganda locations
 */

import axios, { AxiosInstance } from 'axios';

interface RouteDistance {
  origin: string;
  destination: string;
  distanceKm: number;
  distanceText: string;
  durationMinutes: number;
  durationText: string;
  success: boolean;
  error?: string;
}

interface OSRMRouteResponse {
  code: string;
  routes: Array<{
    distance: number; // meters
    duration: number; // seconds
    geometry: any;
  }>;
  waypoints: Array<{
    location: [number, number];
    name: string;
  }>;
}

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
}

export class OSRMService {
  private static instance: OSRMService;
  private client: AxiosInstance;
  private nominatimClient: AxiosInstance;
  
  // Public OSRM demo server - free to use
  private osrmBaseURL = 'http://router.project-osrm.org';
  
  // Nominatim for geocoding (address to coordinates)
  private nominatimBaseURL = 'https://nominatim.openstreetmap.org';

  private constructor() {
    this.client = axios.create({
      baseURL: this.osrmBaseURL,
      timeout: 15000,
      headers: {
        'User-Agent': 'TransConnect-MVP1-Uganda', // Required by Nominatim
      },
    });

    this.nominatimClient = axios.create({
      baseURL: this.nominatimBaseURL,
      timeout: 10000,
      headers: {
        'User-Agent': 'TransConnect-MVP1-Uganda',
      },
    });

    console.log('✅ OSRM service initialized (OpenStreetMap - FREE)');
  }

  public static getInstance(): OSRMService {
    if (!OSRMService.instance) {
      OSRMService.instance = new OSRMService();
    }
    return OSRMService.instance;
  }

  /**
   * Check if OSRM service is available (always true - no API key needed)
   */
  public isEnabled(): boolean {
    return true;
  }

  /**
   * Geocode an address to coordinates using Nominatim
   */
  async geocode(address: string): Promise<{ lat: number; lng: number } | null> {
    try {
      // Add "Uganda" to improve search accuracy
      const searchQuery = address.includes('Uganda') ? address : `${address}, Uganda`;
      
      const response = await this.nominatimClient.get<NominatimResult[]>('/search', {
        params: {
          q: searchQuery,
          format: 'json',
          limit: 1,
        },
      });

      if (response.data && response.data.length > 0) {
        const result = response.data[0];
        return {
          lat: parseFloat(result.lat),
          lng: parseFloat(result.lon),
        };
      }

      return null;
    } catch (error: any) {
      console.error(`Geocoding error for "${address}":`, error.message);
      return null;
    }
  }

  /**
   * Validate if a location exists
   */
  async validateLocation(location: string): Promise<boolean> {
    const coords = await this.geocode(location);
    return coords !== null;
  }

  /**
   * Calculate distance and duration between two locations using OSRM
   */
  async calculateDistance(
    origin: string,
    destination: string,
    mode: 'driving' | 'walking' | 'bicycling' = 'driving'
  ): Promise<RouteDistance> {
    try {
      // Step 1: Geocode both locations
      const [originCoords, destCoords] = await Promise.all([
        this.geocode(origin),
        this.geocode(destination),
      ]);

      if (!originCoords) {
        return {
          origin,
          destination,
          distanceKm: 0,
          distanceText: 'N/A',
          durationMinutes: 0,
          durationText: 'N/A',
          success: false,
          error: `Could not find coordinates for origin: ${origin}`,
        };
      }

      if (!destCoords) {
        return {
          origin,
          destination,
          distanceKm: 0,
          distanceText: 'N/A',
          durationMinutes: 0,
          durationText: 'N/A',
          success: false,
          error: `Could not find coordinates for destination: ${destination}`,
        };
      }

      // Step 2: Get route from OSRM
      // OSRM uses profile-based routing: car, bike, foot
      const profile = mode === 'walking' ? 'foot' : mode === 'bicycling' ? 'bike' : 'car';
      
      const coordinates = `${originCoords.lng},${originCoords.lat};${destCoords.lng},${destCoords.lat}`;
      
      const response = await this.client.get<OSRMRouteResponse>(
        `/route/v1/${profile}/${coordinates}`,
        {
          params: {
            overview: 'false',
            steps: 'false',
          },
        }
      );

      if (response.data.code !== 'Ok' || !response.data.routes || response.data.routes.length === 0) {
        return {
          origin,
          destination,
          distanceKm: 0,
          distanceText: 'N/A',
          durationMinutes: 0,
          durationText: 'N/A',
          success: false,
          error: 'No route found between locations',
        };
      }

      const route = response.data.routes[0];
      
      // Convert meters to kilometers
      const distanceKm = Math.round(route.distance / 1000 * 10) / 10;
      
      // Convert seconds to minutes
      const durationMinutes = Math.round(route.duration / 60);

      // Format text
      const distanceText = `${distanceKm} km`;
      const durationText = this.formatDuration(durationMinutes);

      return {
        origin,
        destination,
        distanceKm,
        distanceText,
        durationMinutes,
        durationText,
        success: true,
      };

    } catch (error: any) {
      console.error(`OSRM calculation error (${origin} → ${destination}):`, error.message);
      
      return {
        origin,
        destination,
        distanceKm: 0,
        distanceText: 'N/A',
        durationMinutes: 0,
        durationText: 'N/A',
        success: false,
        error: error.message || 'Unknown error',
      };
    }
  }

  /**
   * Calculate distances for multiple route pairs (batch processing)
   */
  async calculateDistanceBatch(
    pairs: Array<{ origin: string; destination: string }>,
    mode: 'driving' | 'walking' | 'bicycling' = 'driving'
  ): Promise<RouteDistance[]> {
    const results: RouteDistance[] = [];

    // Process in batches of 3 to avoid overwhelming the free OSRM server
    const batchSize = 3;
    
    for (let i = 0; i < pairs.length; i += batchSize) {
      const batch = pairs.slice(i, i + batchSize);
      
      // Process batch in parallel
      const batchResults = await Promise.all(
        batch.map(pair => this.calculateDistance(pair.origin, pair.destination, mode))
      );
      
      results.push(...batchResults);
      
      // Rate limiting: wait 500ms between batches (Nominatim requires 1 req/sec)
      if (i + batchSize < pairs.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    return results;
  }

  /**
   * Format duration in human-readable format
   */
  private formatDuration(minutes: number): string {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (mins === 0) {
      return `${hours} hour${hours > 1 ? 's' : ''}`;
    }
    
    return `${hours} hour${hours > 1 ? 's' : ''} ${mins} min`;
  }

  /**
   * Get service info
   */
  getInfo(): { name: string; provider: string; cost: string; apiKey: boolean } {
    return {
      name: 'OSRM (OpenStreetMap)',
      provider: 'Open Source Routing Machine',
      cost: 'FREE',
      apiKey: false,
    };
  }
}

// Export singleton instance
export const osrmService = OSRMService.getInstance();
