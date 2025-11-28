import React, { useState, useEffect, useCallback } from 'react';
import { 
  MapPin, 
  Clock, 
  DollarSign, 
  TrendingUp,
  AlertCircle,
  Eye,
  BarChart3
} from 'lucide-react';

const OperatorRoutes = () => {
  const [routes, setRoutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoute, setSelectedRoute] = useState<any>(null);

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  const loadRoutes = useCallback(async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${API_BASE_URL}/routes`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setRoutes(data.routes || data || []);
      }
    } catch (error) {
      console.error('Error loading routes:', error);
      // Fallback demo data
      setRoutes([
        {
          id: '1',
          origin: 'Kampala',
          destination: 'Jinja',
          via: ['Mukono', 'Lugazi'],
          distance: 87,
          duration: 90,
          price: 15000,
          departureTime: '08:00',
          active: true,
          bus: {
            plateNumber: 'UBK 123A',
            capacity: 14
          },
          bookings: 45,
          revenue: 675000,
          averageOccupancy: 78
        },
        {
          id: '2',
          origin: 'Jinja',
          destination: 'Kampala',
          via: ['Lugazi', 'Mukono'],
          distance: 87,
          duration: 90,
          price: 15000,
          departureTime: '15:00',
          active: true,
          bus: {
            plateNumber: 'UBK 123A',
            capacity: 14
          },
          bookings: 38,
          revenue: 570000,
          averageOccupancy: 65
        },
        {
          id: '3',
          origin: 'Kampala',
          destination: 'Entebbe',
          via: ['Kajjansi'],
          distance: 42,
          duration: 45,
          price: 10000,
          departureTime: '09:30',
          active: true,
          bus: {
            plateNumber: 'UBL 456B',
            capacity: 18
          },
          bookings: 32,
          revenue: 320000,
          averageOccupancy: 58
        }
      ]);
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL]);

  useEffect(() => {
    loadRoutes();
  }, [loadRoutes]);

  const formatCurrency = (amount: number) => `UGX ${amount.toLocaleString()}`;
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getOccupancyColor = (occupancy: number) => {
    if (occupancy >= 80) return 'text-green-600';
    if (occupancy >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getOccupancyBgColor = (occupancy: number) => {
    if (occupancy >= 80) return 'bg-green-100';
    if (occupancy >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/3 animate-pulse"></div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white p-6 rounded-lg shadow animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Routes</h1>
          <p className="text-gray-600">View and monitor your route performance</p>
        </div>
        <div className="text-sm text-gray-500">
          {routes.length} active routes
        </div>
      </div>

      {/* Route Performance Summary */}
      {routes.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance Overview</h2>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-sm text-gray-500">Total Bookings</p>
              <p className="text-2xl font-bold text-gray-900">
                {routes.reduce((sum, route) => sum + (route.bookings || 0), 0)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500">Total Revenue</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(routes.reduce((sum, route) => sum + (route.revenue || 0), 0))}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500">Avg. Occupancy</p>
              <p className="text-2xl font-bold text-blue-600">
                {Math.round(routes.reduce((sum, route) => sum + (route.averageOccupancy || 0), 0) / routes.length)}%
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500">Best Route</p>
              <p className="text-lg font-bold text-purple-600">
                {routes.sort((a, b) => (b.revenue || 0) - (a.revenue || 0))[0]?.origin} → {routes.sort((a, b) => (b.revenue || 0) - (a.revenue || 0))[0]?.destination}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Routes List */}
      <div className="space-y-4">
        {routes.map((route) => (
          <div key={route.id} className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <MapPin className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {route.origin} → {route.destination}
                    </h3>
                    <div className="flex items-center text-sm text-gray-600 space-x-4">
                      <span className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {route.departureTime}
                      </span>
                      <span>{formatDuration(route.duration)}</span>
                      <span>{route.distance} km</span>
                    </div>
                  </div>
                </div>
                
                {route.via && route.via.length > 0 && (
                  <div className="ml-11 mb-3">
                    <p className="text-sm text-gray-500">
                      Via: {route.via.join(' → ')}
                    </p>
                  </div>
                )}
              </div>
              
              <div className="text-right">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  route.active 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {route.active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-500">Price</p>
                <p className="font-semibold text-green-600">{formatCurrency(route.price)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Bus</p>
                <p className="font-medium">{route.bus?.plateNumber}</p>
                <p className="text-xs text-gray-500">{route.bus?.capacity} seats</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Bookings</p>
                <p className="font-semibold text-blue-600">{route.bookings || 0}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Revenue</p>
                <p className="font-semibold text-green-600">{formatCurrency(route.revenue || 0)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Occupancy</p>
                <div className="flex items-center space-x-2">
                  <p className={`font-semibold ${getOccupancyColor(route.averageOccupancy || 0)}`}>
                    {route.averageOccupancy || 0}%
                  </p>
                  <div className={`px-2 py-1 rounded-full text-xs ${getOccupancyBgColor(route.averageOccupancy || 0)}`}>
                    {route.averageOccupancy >= 80 ? 'Excellent' : 
                     route.averageOccupancy >= 60 ? 'Good' : 'Low'}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-500">
                Last updated: {new Date().toLocaleDateString()}
              </div>
              <div className="flex space-x-2">
                <button 
                  onClick={() => setSelectedRoute(route)}
                  className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View Details
                </button>
                <button className="inline-flex items-center px-3 py-1 border border-blue-300 text-sm text-blue-700 rounded-md hover:bg-blue-50 transition-colors">
                  <BarChart3 className="h-4 w-4 mr-1" />
                  Analytics
                </button>
              </div>
            </div>
          </div>
        ))}
        
        {routes.length === 0 && (
          <div className="bg-white p-12 rounded-lg shadow text-center">
            <MapPin className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No routes assigned</h3>
            <p className="text-gray-600 mb-4">
              Contact the admin to set up routes for your buses
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                <div className="text-left">
                  <p className="text-sm text-blue-900 font-medium">Need routes?</p>
                  <p className="text-sm text-blue-700">
                    Contact the system administrator to request route assignments for your registered buses.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Route Details Modal */}
      {selectedRoute && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Route Details</h3>
                <button 
                  onClick={() => setSelectedRoute(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Route Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">From</p>
                      <p className="font-medium">{selectedRoute.origin}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">To</p>
                      <p className="font-medium">{selectedRoute.destination}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Distance</p>
                      <p className="font-medium">{selectedRoute.distance} km</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Duration</p>
                      <p className="font-medium">{formatDuration(selectedRoute.duration)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Departure Time</p>
                      <p className="font-medium">{selectedRoute.departureTime}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Price</p>
                      <p className="font-medium text-green-600">{formatCurrency(selectedRoute.price)}</p>
                    </div>
                  </div>
                  {selectedRoute.via && selectedRoute.via.length > 0 && (
                    <div className="mt-3">
                      <p className="text-gray-500 text-sm">Stops</p>
                      <p className="font-medium">{selectedRoute.via.join(' → ')}</p>
                    </div>
                  )}
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Bus Assignment</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Plate Number</p>
                      <p className="font-medium">{selectedRoute.bus?.plateNumber}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Capacity</p>
                      <p className="font-medium">{selectedRoute.bus?.capacity} seats</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Performance Metrics</h4>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Total Bookings</p>
                      <p className="font-semibold text-blue-600">{selectedRoute.bookings || 0}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Total Revenue</p>
                      <p className="font-semibold text-green-600">{formatCurrency(selectedRoute.revenue || 0)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Avg. Occupancy</p>
                      <p className={`font-semibold ${getOccupancyColor(selectedRoute.averageOccupancy || 0)}`}>
                        {selectedRoute.averageOccupancy || 0}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OperatorRoutes;