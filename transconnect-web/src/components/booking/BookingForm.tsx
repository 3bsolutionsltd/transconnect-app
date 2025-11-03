'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createBooking } from '../../lib/api';
import { useAuth } from '@/contexts/AuthContext';

type Props = {
  routeId: string;
  price: number;
  selectedSeat?: string | null;
  onSuccess?: (booking: any) => void;
};

export default function BookingForm({ routeId, price, selectedSeat, onSuccess }: Props) {
  const [seatNumber, setSeatNumber] = useState('');
  const [travelDate, setTravelDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  // Update seat number when selectedSeat changes
  React.useEffect(() => {
    if (selectedSeat) {
      setSeatNumber(selectedSeat);
    }
  }, [selectedSeat]);

  async function submitBooking(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    
    if (!isAuthenticated) {
      setError('Please log in to make a booking');
      return;
    }
    
    if (!seatNumber || !travelDate) {
      setError('Please select a seat and choose your travel date');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        routeId,
        seatNumber,
        travelDate
      };

      const token = localStorage.getItem('token');
      const result = await createBooking(token, payload);
      
      if (onSuccess) onSuccess(result);
      
      // Redirect to payment page with booking data
      const bookingData = encodeURIComponent(JSON.stringify(result));
      router.push(`/payment?booking=${bookingData}`);
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || 'Booking failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {!isAuthenticated && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="text-yellow-800 text-sm">
            <strong>Note:</strong> You need to log in to make a booking.
          </div>
          <div className="mt-3 space-x-3">
            <Link href="/login" className="btn-primary inline-block">
              Login
            </Link>
            <Link href="/register" className="btn-outline inline-block">
              Register
            </Link>
          </div>
        </div>
      )}
      
      {isAuthenticated && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-blue-800 text-sm">
            <strong>Booking as:</strong> {user?.firstName} {user?.lastName} ({user?.email})
          </div>
        </div>
      )}
      
      <form onSubmit={submitBooking} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Seat Number
            </label>
            <input 
              value={seatNumber} 
              onChange={(e) => setSeatNumber(e.target.value)} 
              className="form-input" 
              placeholder="Select a seat from the map above"
              readOnly={!!selectedSeat}
            />
            {selectedSeat && (
              <div className="text-sm text-green-600 mt-1">
                ✓ Seat {selectedSeat} selected
              </div>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Travel Date
            </label>
            <input 
              type="date" 
              value={travelDate} 
              onChange={(e) => setTravelDate(e.target.value)} 
              className="form-input"
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
        </div>

        {/* Price Summary */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Seat {seatNumber || '?'}</span>
            <span className="text-lg font-semibold text-gray-900">
              UGX {price?.toLocaleString()}
            </span>
          </div>
          <div className="text-sm text-gray-500 mt-1">
            Total amount to pay
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="text-red-800 text-sm">{error}</div>
          </div>
        )}

        <button 
          type="submit"
          disabled={loading || !isAuthenticated || !seatNumber || !travelDate} 
          className="btn-primary w-full text-lg"
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Processing...
            </span>
          ) : (
            `Complete Booking - UGX ${price?.toLocaleString()}`
          )}
        </button>
      </form>
    </div>
  );
}
