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
  const router = useRouter();

  async function handleSearch(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const params: any = {};
      if (origin) params.origin = origin;
      if (destination) params.destination = destination;
      if (date) params.travelDate = date;

      const result = await fetchRoutes(params);
      setRoutes(result);
    } catch (err) {
      console.error(err);
      setRoutes([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-4xl mx-auto p-6">
        {/* Navigation */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back</span>
          </button>
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-800 transition-colors"
          >
            Home
          </Link>
        </div>

        <div className="card mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Search Routes</h1>
          <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <input 
              value={origin} 
              onChange={(e) => setOrigin(e.target.value)} 
              placeholder="From (e.g., Kampala)" 
              className="form-input" 
            />
            <input 
              value={destination} 
              onChange={(e) => setDestination(e.target.value)} 
              placeholder="To (e.g., Jinja)" 
              className="form-input" 
            />
            <input 
              type="date" 
              value={date} 
              onChange={(e) => setDate(e.target.value)} 
              className="form-input" 
            />
            <button type="submit" className="btn-primary">
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
            {routes.length === 0 && (
              <div className="card text-center py-12">
                <div className="text-gray-500 mb-2">No routes found</div>
                <div className="text-sm text-gray-400">Try searching for "Kampala" to "Jinja" or clear filters to see all routes</div>
              </div>
            )}
            {routes.map((route: any) => (
              <div key={route.id} className="card hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="text-xl font-semibold text-gray-900 mb-2">
                      {route.origin} → {route.destination}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-4">
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
                  <div className="flex items-center gap-3">
                    <Link href={`/route/${route.id}`} className="btn-primary">
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
