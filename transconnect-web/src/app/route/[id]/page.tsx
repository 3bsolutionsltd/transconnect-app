'use client';
import React, { useEffect, useState } from 'react';
import { fetchRouteById } from '../../../lib/api';
import SeatMap from '../../../components/booking/SeatMap';
import BookingForm from '../../../components/booking/BookingForm';
import { useRouter } from 'next/navigation';
import { ArrowLeft, MapPin, Clock, Route } from 'lucide-react';
import Link from 'next/link';

export default function RoutePage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [route, setRoute] = useState<any>(null);
  const [bookedSeats, setBookedSeats] = useState<string[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [travelDate, setTravelDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        // Pass travel date to get accurate seat availability
        const data = await fetchRouteById(id, { travelDate });
        setRoute(data);
        
        // Update booked seats based on the travel date
        if (data.availability && Array.isArray(data.availability.bookedSeatNumbers)) {
          setBookedSeats(data.availability.bookedSeatNumbers.map((n: any) => n.toString()));
        } else {
          // No bookings for this date
          setBookedSeats([]);
        }
        
        // Clear selected seats when date changes to avoid conflicts
        setSelectedSeats([]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, travelDate]);

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="flex items-center space-x-2">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="text-gray-600">Loading route details...</span>
      </div>
    </div>
  );
  
  if (!route) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="card text-center max-w-md">
        <div className="text-gray-500 mb-4 text-lg font-medium">Route not found</div>
        <div className="text-sm text-gray-400 mb-6">The route you're looking for doesn't exist or has been removed.</div>
        <div className="space-y-3">
          <button
            onClick={() => router.back()}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Go Back</span>
          </button>
          <Link
            href="/search"
            className="w-full block px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
          >
            Search Routes
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* Navigation Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.back()}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back</span>
            </button>
            <div className="text-sm text-gray-500">
              <Link href="/" className="hover:text-gray-700">Home</Link>
              <span className="mx-2">›</span>
              <Link href="/search" className="hover:text-gray-700">Search</Link>
              <span className="mx-2">›</span>
              <span className="text-gray-900">Route Details</span>
            </div>
          </div>
          <Link
            href="/search"
            className="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
          >
            Search Other Routes
          </Link>
        </div>

        {/* Route Header */}
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
                <MapPin className="h-8 w-8 text-blue-600" />
                <span>{route.origin}</span>
                <span className="text-gray-400">→</span>
                <span>{route.destination}</span>
              </h1>
              <p className="text-gray-600 mt-2">Select your seat and complete your booking</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-blue-600">UGX {route.price?.toLocaleString()}</div>
              <div className="text-sm text-gray-500">per seat</div>
            </div>
          </div>
          
          {/* Operator Information Banner */}
          {route.operator && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                    {route.operator.companyName.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-blue-900">{route.operator.companyName}</div>
                    <div className="text-sm text-blue-700">Licensed Bus Operator</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2 bg-green-100 px-3 py-1 rounded-full">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-green-700">Verified</span>
                </div>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            <div className="flex items-center space-x-3">
              <Clock className="h-5 w-5 text-gray-400" />
              <div>
                <div className="text-xs text-gray-500 uppercase">Duration</div>
                <div className="font-medium">{Math.floor(route.duration / 60)}h {route.duration % 60}m</div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Route className="h-5 w-5 text-gray-400" />
              <div>
                <div className="text-xs text-gray-500 uppercase">Distance</div>
                <div className="font-medium">{route.distance} km</div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Clock className="h-5 w-5 text-gray-400" />
              <div>
                <div className="text-xs text-gray-500 uppercase">Departure</div>
                <div className="font-medium">{route.departureTime}</div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <MapPin className="h-5 w-5 text-gray-400" />
              <div>
                <div className="text-xs text-gray-500 uppercase">Bus Model</div>
                <div className="font-medium">{route.bus?.model}</div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <MapPin className="h-5 w-5 text-gray-400" />
              <div>
                <div className="text-xs text-gray-500 uppercase">Plate Number</div>
                <div className="font-medium">{route.bus?.plateNumber}</div>
              </div>
            </div>
          </div>

          {/* Route availability info */}
          {route.availability && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Available Seats:</span>
                <span className="font-medium text-green-600">
                  {route.availability.availableSeats} of {route.availability.totalSeats}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Travel Date Selection */}
        <div className="card mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Travel Date</h2>
          <div className="max-w-md">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              When do you want to travel?
            </label>
            <input
              type="date"
              value={travelDate}
              onChange={(e) => setTravelDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="form-input w-full"
            />
            <div className="text-sm text-gray-500 mt-2">
              Seat availability will update based on your selected date
            </div>
          </div>
        </div>

        {/* Seat Selection */}
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Select Your Seats</h2>
            {loading && (
              <div className="flex items-center space-x-2 text-blue-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm">Updating availability...</span>
              </div>
            )}
          </div>
          
          <SeatMap 
            capacity={route.bus.capacity} 
            bookedSeats={bookedSeats} 
            selectedSeats={selectedSeats} 
            maxSeats={4}
            onSelect={(seats) => setSelectedSeats(seats)} 
          />
        </div>

        {/* Booking Form */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Complete Your Booking</h2>
          <BookingForm 
            routeId={route.id} 
            price={route.price} 
            selectedSeats={selectedSeats}
            defaultTravelDate={travelDate}
            onSuccess={(b) => router.push('/profile')} 
          />
        </div>
      </div>
    </div>
  );
}
