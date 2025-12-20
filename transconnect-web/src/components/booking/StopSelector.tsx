import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface RouteStop {
  id: string;
  stopName: string;
  distanceFromOrigin: number;
  priceFromOrigin: number;
  order: number;
  estimatedTime: string;
}

interface RouteDetails {
  origin: string;
  destination: string;
  distance: number;
  price: number;
  departureTime: string;
}

interface StopSelectorProps {
  routeId: string;
  onStopsSelected: (boardingStop: string, alightingStop: string, price: number) => void;
}

const StopSelector: React.FC<StopSelectorProps> = ({ routeId, onStopsSelected }) => {
  const [boardingStops, setBoardingStops] = useState<RouteStop[]>([]);
  const [alightingStops, setAlightingStops] = useState<RouteStop[]>([]);
  const [selectedBoarding, setSelectedBoarding] = useState<string>('');
  const [selectedAlighting, setSelectedAlighting] = useState<string>('');
  const [calculatedPrice, setCalculatedPrice] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [routeDetails, setRouteDetails] = useState<RouteDetails | null>(null);

  // Fetch route details to get actual origin and destination
  useEffect(() => {
    const fetchRouteDetails = async () => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/routes/${routeId}`
        );
        setRouteDetails(response.data);
      } catch (error) {
        console.error('Error fetching route details:', error);
      }
    };

    if (routeId) {
      fetchRouteDetails();
    }
  }, [routeId]);

  // Generate fallback stops using actual route data
  const generateFallbackStops = (): RouteStop[] => {
    if (!routeDetails) {
      // Absolute fallback if route details aren't loaded yet
      return [
        { id: '1', stopName: 'Origin', distanceFromOrigin: 0, priceFromOrigin: 0, order: 1, estimatedTime: '08:00' },
        { id: '2', stopName: 'Destination', distanceFromOrigin: 100, priceFromOrigin: 20000, order: 2, estimatedTime: '10:00' }
      ];
    }

    const stops: RouteStop[] = [];
    const departureTime = routeDetails.departureTime || '08:00';
    const [hours, minutes] = departureTime.split(':').map(Number);
    
    // Calculate estimated arrival time (add duration in hours, rough estimate)
    const durationHours = Math.max(1, Math.round(routeDetails.distance / 60)); // Assume 60km/h average
    const arrivalHours = (hours + durationHours) % 24;
    const arrivalTime = `${arrivalHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

    // Add origin stop
    stops.push({
      id: '1',
      stopName: routeDetails.origin,
      distanceFromOrigin: 0,
      priceFromOrigin: 0,
      order: 1,
      estimatedTime: departureTime
    });

    // Add destination stop
    stops.push({
      id: '2',
      stopName: routeDetails.destination,
      distanceFromOrigin: routeDetails.distance,
      priceFromOrigin: routeDetails.price,
      order: 2,
      estimatedTime: arrivalTime
    });

    return stops;
  };

  // Load boarding stops when component mounts
  useEffect(() => {
    const fetchBoardingStops = async () => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/routes/${routeId}/boarding-stops`
        );
        
        // Check if API returned empty results and use fallback
        if (!response.data || response.data.length === 0) {
          console.log('API returned empty results, generating stops from route data');
          const fallbackStops = generateFallbackStops();
          setBoardingStops(fallbackStops.slice(0, -1)); // All except last for boarding
        } else {
          setBoardingStops(response.data);
        }
      } catch (error) {
        console.error('Error fetching boarding stops:', error);
        
        // Fallback: Generate stops for any route if API fails
        console.log('API error, generating fallback stops from route data');
        const fallbackStops = generateFallbackStops();
        setBoardingStops(fallbackStops.slice(0, -1)); // All except last for boarding
      }
    };

    if (routeId) {
      fetchBoardingStops();
    }
  }, [routeId]);

  // Load alighting stops when boarding stop is selected
  useEffect(() => {
    const fetchAlightingStops = async () => {
      if (!selectedBoarding) {
        setAlightingStops([]);
        return;
      }

      try {
        setLoading(true);
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/routes/${routeId}/alighting-stops/${encodeURIComponent(selectedBoarding)}`
        );
        
        // Check if API returned empty results and use fallback
        if (!response.data || response.data.length === 0) {
          console.log('API returned empty alighting stops, using fallback data');
          const allStops = generateFallbackStops();
          
          // Find boarding stop and return all stops after it
          const boardingIndex = allStops.findIndex(stop => stop.stopName === selectedBoarding);
          if (boardingIndex >= 0) {
            setAlightingStops(allStops.slice(boardingIndex + 1));
          } else {
            setAlightingStops([]);
          }
        } else {
          setAlightingStops(response.data);
        }
      } catch (error) {
        console.error('Error fetching alighting stops:', error);
        
        // Fallback: Generate alighting stops based on boarding selection
        console.log('API error, using fallback alighting stops');
        const allStops = generateFallbackStops();
        
        // Find boarding stop and return all stops after it
        const boardingIndex = allStops.findIndex(stop => stop.stopName === selectedBoarding);
        if (boardingIndex >= 0) {
          setAlightingStops(allStops.slice(boardingIndex + 1));
        } else {
          setAlightingStops([]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAlightingStops();
    setSelectedAlighting(''); // Reset alighting selection
  }, [routeId, selectedBoarding]);

  // Calculate price when both stops are selected
  useEffect(() => {
    const calculatePrice = async () => {
      if (!selectedBoarding || !selectedAlighting) {
        setCalculatedPrice(0);
        return;
      }

      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/routes/${routeId}/stops/calculate-price`,
          {
            params: {
              boardingStop: selectedBoarding,
              alightingStop: selectedAlighting
            }
          }
        );
        
        const price = response.data.price;
        setCalculatedPrice(price);
        onStopsSelected(selectedBoarding, selectedAlighting, price);
      } catch (error) {
        console.error('Error calculating price from API, using fallback calculation:', error);
        
        // Fallback price calculation using local stops data
        const allStops = generateFallbackStops();
        const boardingStop = allStops.find(s => s.stopName === selectedBoarding);
        const alightingStop = allStops.find(s => s.stopName === selectedAlighting);
        
        if (boardingStop && alightingStop) {
          // Calculate price difference between stops
          const price = Math.max(0, alightingStop.priceFromOrigin - boardingStop.priceFromOrigin);
          console.log(`Price calculation: ${alightingStop.stopName} (${alightingStop.priceFromOrigin}) - ${boardingStop.stopName} (${boardingStop.priceFromOrigin}) = ${price}`);
          setCalculatedPrice(price);
          onStopsSelected(selectedBoarding, selectedAlighting, price);
        }
      }
    };

    calculatePrice();
  }, [routeId, selectedBoarding, selectedAlighting, onStopsSelected]);

  return (
    <div className="space-y-6 bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Select Your Journey Points
      </h3>

      {/* Boarding Stop Selection */}
      <div>
        <label htmlFor="boarding" className="block text-sm font-medium text-gray-700 mb-2">
          Boarding Point
        </label>
        <select
          id="boarding"
          value={selectedBoarding}
          onChange={(e) => setSelectedBoarding(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Select boarding point...</option>
          {boardingStops.map((stop) => (
            <option key={stop.id} value={stop.stopName}>
              {stop.stopName} - {stop.estimatedTime} ({stop.distanceFromOrigin}km)
            </option>
          ))}
        </select>
      </div>

      {/* Alighting Stop Selection */}
      <div>
        <label htmlFor="alighting" className="block text-sm font-medium text-gray-700 mb-2">
          Destination Point
        </label>
        <select
          id="alighting"
          value={selectedAlighting}
          onChange={(e) => setSelectedAlighting(e.target.value)}
          disabled={!selectedBoarding || loading}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
        >
          <option value="">
            {loading ? 'Loading destinations...' : 'Select destination...'}
          </option>
          {alightingStops.map((stop) => (
            <option key={stop.id} value={stop.stopName}>
              {stop.stopName} - {stop.estimatedTime} ({stop.distanceFromOrigin}km)
            </option>
          ))}
        </select>
      </div>

      {/* Journey Summary */}
      {selectedBoarding && selectedAlighting && (
        <div className="bg-blue-50 p-4 rounded-md">
          <h4 className="font-medium text-blue-900 mb-2">Journey Summary</h4>
          <div className="space-y-1 text-sm text-blue-700">
            <p><span className="font-medium">From:</span> {selectedBoarding}</p>
            <p><span className="font-medium">To:</span> {selectedAlighting}</p>
            <p><span className="font-medium">Distance:</span> {
              (() => {
                const boarding = boardingStops.find(s => s.stopName === selectedBoarding);
                const alighting = alightingStops.find(s => s.stopName === selectedAlighting);
                if (boarding && alighting) {
                  return `${alighting.distanceFromOrigin - boarding.distanceFromOrigin}km`;
                }
                return 'Calculating...';
              })()
            }</p>
            <p className="text-lg font-bold text-blue-900">
              <span className="font-medium">Price:</span> UGX {calculatedPrice.toLocaleString()}
            </p>
          </div>
        </div>
      )}

      {/* Route Map Visualization */}
      {boardingStops.length > 0 && (
        <div className="mt-6">
          <h4 className="font-medium text-gray-900 mb-3">Route Map</h4>
          <div className="flex flex-col space-y-2">
            {/* Show all stops (boarding stops + destination) */}
            {generateFallbackStops().map((stop, index) => {
              const allStops = generateFallbackStops();
              const isBoarding = stop.stopName === selectedBoarding;
              const isAlighting = stop.stopName === selectedAlighting;
              const boardingIndex = allStops.findIndex(s => s.stopName === selectedBoarding);
              const alightingIndex = allStops.findIndex(s => s.stopName === selectedAlighting);
              const isInJourney = selectedBoarding && selectedAlighting && 
                                  boardingIndex >= 0 && alightingIndex >= 0 &&
                                  index >= boardingIndex && index <= alightingIndex;

              return (
                <div
                  key={stop.id}
                  className={`flex items-center p-2 rounded ${
                    isBoarding ? 'bg-green-100 border-l-4 border-green-500' :
                    isAlighting ? 'bg-red-100 border-l-4 border-red-500' :
                    isInJourney ? 'bg-blue-50' : 'bg-gray-50'
                  }`}
                >
                  <div className={`w-3 h-3 rounded-full mr-3 ${
                    isBoarding ? 'bg-green-500' :
                    isAlighting ? 'bg-red-500' :
                    isInJourney ? 'bg-blue-500' : 'bg-gray-300'
                  }`}></div>
                  <div className="flex-1">
                    <span className="font-medium">{stop.stopName}</span>
                    <span className="text-sm text-gray-500 ml-2">
                      {stop.estimatedTime} • {stop.distanceFromOrigin}km • UGX {stop.priceFromOrigin.toLocaleString()}
                    </span>
                  </div>
                  {isBoarding && (
                    <span className="text-xs bg-green-500 text-white px-2 py-1 rounded">BOARDING</span>
                  )}
                  {isAlighting && (
                    <span className="text-xs bg-red-500 text-white px-2 py-1 rounded">ALIGHTING</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default StopSelector;