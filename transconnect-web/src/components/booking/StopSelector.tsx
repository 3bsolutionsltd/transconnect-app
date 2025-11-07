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

  // Load boarding stops when component mounts
  useEffect(() => {
    const fetchBoardingStops = async () => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/routes/${routeId}/boarding-stops`
        );
        setBoardingStops(response.data);
      } catch (error) {
        console.error('Error fetching boarding stops:', error);
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
        setAlightingStops(response.data);
      } catch (error) {
        console.error('Error fetching alighting stops:', error);
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
        console.error('Error calculating price:', error);
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
            {boardingStops.map((stop, index) => {
              const isBoarding = stop.stopName === selectedBoarding;
              const isAlighting = stop.stopName === selectedAlighting;
              const isInJourney = selectedBoarding && selectedAlighting && 
                                  boardingStops.findIndex(s => s.stopName === selectedBoarding) <= index &&
                                  index <= alightingStops.findIndex(s => s.stopName === selectedAlighting) + boardingStops.length - alightingStops.length;

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