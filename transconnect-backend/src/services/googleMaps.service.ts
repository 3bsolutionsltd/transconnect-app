import axios, { AxiosInstance } from 'axios';

interface DistanceMatrixRequest {
  origins: string[];
  destinations: string[];
  mode?: 'driving' | 'walking' | 'bicycling' | 'transit';
  units?: 'metric' | 'imperial';
  departureTime?: Date;
}

interface DistanceMatrixElement {
  distance: {
    text: string;
    value: number; // meters
  };
  duration: {
    text: string;
    value: number; // seconds
  };
  status: string;
}

interface DistanceMatrixResponse {
  rows: Array<{
    elements: DistanceMatrixElement[];
  }>;
  status: string;
  origin_addresses: string[];
  destination_addresses: string[];
}

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

export class GoogleMapsService {
  private static instance: GoogleMapsService;
  private apiKey: string;
  private client: AxiosInstance;
  private baseURL = 'https://maps.googleapis.com/maps/api';
  private enabled: boolean;

  private constructor() {
    this.apiKey = process.env.GOOGLE_MAPS_API_KEY || '';
    this.enabled = !!this.apiKey;
    
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
    });

    if (!this.enabled) {
      console.warn('⚠️ Google Maps API key not provided - distance calculation disabled');
    } else {
      console.log('✅ Google Maps service initialized');
    }
  }

  public static getInstance(): GoogleMapsService {
    if (!GoogleMapsService.instance) {
      GoogleMapsService.instance = new GoogleMapsService();
    }
    return GoogleMapsService.instance;
  }

  /**
   * Check if Google Maps service is enabled
   */
  public isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Calculate distance and duration between two locations
   */
  async calculateDistance(
    origin: string,
    destination: string,
    mode: 'driving' | 'walking' | 'bicycling' | 'transit' = 'driving'
  ): Promise<RouteDistance> {
    if (!this.enabled) {
      return {
        origin,
        destination,
        distanceKm: 0,
        distanceText: 'N/A',
        durationMinutes: 0,
        durationText: 'N/A',
        success: false,
        error: 'Google Maps API key not configured',
      };
    }

    try {
      const response = await this.client.get<DistanceMatrixResponse>('/distancematrix/json', {
        params: {
          origins: origin,
          destinations: destination,
          mode,
          units: 'metric',
          key: this.apiKey,
        },
      });

      if (response.data.status !== 'OK') {
        throw new Error(`Google Maps API error: ${response.data.status}`);
      }

      const element = response.data.rows[0]?.elements[0];
      
      if (!element || element.status !== 'OK') {
        throw new Error(`Route not found or invalid: ${element?.status || 'UNKNOWN'}`);
      }

      // Convert meters to kilometers (rounded to 1 decimal)
      const distanceKm = Math.round(element.distance.value / 100) / 10;
      
      // Convert seconds to minutes (rounded to nearest minute)
      const durationMinutes = Math.round(element.duration.value / 60);

      return {
        origin: response.data.origin_addresses[0] || origin,
        destination: response.data.destination_addresses[0] || destination,
        distanceKm,
        distanceText: element.distance.text,
        durationMinutes,
        durationText: element.duration.text,
        success: true,
      };
    } catch (error: any) {
      console.error('Error calculating distance:', error.message);
      return {
        origin,
        destination,
        distanceKm: 0,
        distanceText: 'Error',
        durationMinutes: 0,
        durationText: 'Error',
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Calculate distances for multiple origin-destination pairs
   */
  async calculateDistanceBatch(
    pairs: Array<{ origin: string; destination: string }>
  ): Promise<RouteDistance[]> {
    const results: RouteDistance[] = [];

    // Process in batches to avoid rate limits
    const batchSize = 5;
    for (let i = 0; i < pairs.length; i += batchSize) {
      const batch = pairs.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(pair => this.calculateDistance(pair.origin, pair.destination))
      );
      results.push(...batchResults);

      // Small delay between batches to respect rate limits
      if (i + batchSize < pairs.length) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    return results;
  }

  /**
   * Calculate distance matrix for multiple origins and destinations
   */
  async calculateDistanceMatrix(
    request: DistanceMatrixRequest
  ): Promise<DistanceMatrixResponse> {
    if (!this.enabled) {
      throw new Error('Google Maps API key not configured');
    }

    try {
      const response = await this.client.get<DistanceMatrixResponse>('/distancematrix/json', {
        params: {
          origins: request.origins.join('|'),
          destinations: request.destinations.join('|'),
          mode: request.mode || 'driving',
          units: request.units || 'metric',
          key: this.apiKey,
        },
      });

      if (response.data.status !== 'OK') {
        throw new Error(`Google Maps API error: ${response.data.status}`);
      }

      return response.data;
    } catch (error: any) {
      console.error('Error calculating distance matrix:', error.message);
      throw error;
    }
  }

  /**
   * Geocode an address to get coordinates
   */
  async geocode(address: string): Promise<{ lat: number; lng: number } | null> {
    if (!this.enabled) {
      return null;
    }

    try {
      const response = await this.client.get('/geocode/json', {
        params: {
          address,
          key: this.apiKey,
        },
      });

      if (response.data.status === 'OK' && response.data.results.length > 0) {
        const location = response.data.results[0].geometry.location;
        return {
          lat: location.lat,
          lng: location.lng,
        };
      }

      return null;
    } catch (error: any) {
      console.error('Error geocoding address:', error.message);
      return null;
    }
  }

  /**
   * Validate if a location can be geocoded
   */
  async validateLocation(location: string): Promise<boolean> {
    const coordinates = await this.geocode(location);
    return coordinates !== null;
  }
}

export const googleMapsService = GoogleMapsService.getInstance();
