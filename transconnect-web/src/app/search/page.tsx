'use client';
import React, { useState } from 'react';
import { fetchRoutes } from '../../lib/api';
import Link from 'next/link';
import Header from '@/components/Header';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SearchPage() {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState('');
  const [routes, setRoutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const router = useRouter();

  // Load all routes when component mounts
  React.useEffect(() => {
    handleSearch();
  }, []);

  async function handleSearch(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const params: any = {};
      if (origin) params.origin = origin;
      if (destination) params.destination = destination;
      if (date) params.travelDate = date;

      const result = await fetchRoutes(params);
      setRoutes(result || []);
      
      if (!result || result.length === 0) {
        setError(origin || destination 
          ? 'No routes match your search criteria. Try different locations or dates.'
          : 'No routes available at the moment. Please try again later.');
      }
    } catch (err: any) {
      console.error('Search error:', err);
      setError('Unable to load routes. Please check your internet connection and try again.');
      setRoutes([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        {/* Navigation */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors touch-manipulation min-h-[44px] px-2 rounded-lg hover:bg-gray-100 active:bg-gray-200"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back</span>
          </button>
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-800 transition-colors touch-manipulation px-3 py-2 rounded-lg hover:bg-blue-50"
          >
            Home
          </Link>
        </div>

        <div className="card mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-6">Search Routes</h1>
          <form onSubmit={handleSearch} className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-4 sm:gap-4 mb-4 sm:mb-6">
            <input 
              value={origin} 
              onChange={(e) => setOrigin(e.target.value)} 
              placeholder="From (e.g., Kampala)" 
              className="form-input text-base" 
            />
            <input 
              value={destination} 
              onChange={(e) => setDestination(e.target.value)} 
              placeholder="To (e.g., Jinja)" 
              className="form-input text-base" 
            />
            <input 
              type="date" 
              value={date} 
              onChange={(e) => setDate(e.target.value)} 
              className="form-input text-base" 
            />
            <button type="submit" className="btn-primary w-full sm:w-auto touch-manipulation">
              {loading ? 'Searching...' : 'Search Routes'}
            </button>
          </form>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading routes...</span>
          </div>
        ) : (
          <div className="space-y-4">
            {routes.length === 0 && !loading && (
              <div className="card text-center py-8 sm:py-12">
                <div className="text-gray-500 mb-2 text-base sm:text-lg">No routes found</div>
                <div className="text-sm text-gray-400">
                  {origin || destination 
                    ? 'Try different search terms or clear filters to see all available routes'
                    : 'Loading available routes... If this continues, please refresh the page'
                  }
                </div>
                <button 
                  onClick={() => {
                    setOrigin('');
                    setDestination('');
                    setDate('');
                    handleSearch();
                  }}
                  className="mt-4 text-blue-600 hover:text-blue-800 underline"
                >
                  Show all routes
                </button>
              </div>
            )}
            {routes.map((route: any) => (
              <div key={route.id} className="card hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start space-y-4 sm:space-y-0">
                  <div className="flex-1">
                    <div className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-2">
                      {route.origin} → {route.destination}
                      {route.via && (
                        <span className="text-sm font-normal text-blue-600 ml-2">
                          (via {route.via})
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 text-sm text-gray-600 mb-4">
                      <div>
                        <span className="font-medium">Price:</span> UGX {route.price?.toLocaleString()}
                      </div>
                      <div>
                        <span className="font-medium">Duration:</span> {route.duration} mins
                      </div>
                      <div>
                        <span className="font-medium">Departure:</span> {route.departureTime}
                      </div>
                      <div>
                        <span className="font-medium">Distance:</span> {route.distance} km
                      </div>
                    </div>
                    {route.availability && (
                      <div className="text-sm">
                        <span className={`badge ${route.availability.isAvailable ? 'badge-success' : 'badge-danger'}`}>
                          {route.availability.availableSeats} seats available
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3 sm:ml-4">
                    <Link href={`/route/${route.id}`} className="btn-primary w-full sm:w-auto text-center touch-manipulation">
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
