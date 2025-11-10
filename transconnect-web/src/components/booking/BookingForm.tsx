'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createBooking } from '../../lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useNotificationService } from '@/lib/notificationService';
import StopSelector from './StopSelector';

type Props = {
  routeId: string;
  price: number;
  selectedSeats?: string[];
  defaultTravelDate?: string;
  onSuccess?: (booking: any) => void;
};

export default function BookingForm({ routeId, price, selectedSeats = [], defaultTravelDate, onSuccess }: Props) {
  const [travelDate, setTravelDate] = useState(defaultTravelDate || '');
  const [passengerDetails, setPassengerDetails] = useState<Array<{name: string, phone: string}>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Route stops state
  const [boardingStop, setBoardingStop] = useState<string>('');
  const [alightingStop, setAlightingStop] = useState<string>('');
  const [dynamicPrice, setDynamicPrice] = useState<number>(price);
  
  const { user, isAuthenticated } = useAuth();
  const notificationService = useNotificationService();
  const router = useRouter();

  // Initialize passenger details when seats change
  React.useEffect(() => {
    if (selectedSeats.length > 0) {
      setPassengerDetails(selectedSeats.map((_, index) => ({
        name: index === 0 ? `${user?.firstName || ''} ${user?.lastName || ''}`.trim() : '',
        phone: index === 0 ? user?.phone || '' : ''
      })));
    }
  }, [selectedSeats, user]);

  // Update travel date when default changes
  React.useEffect(() => {
    if (defaultTravelDate && !travelDate) {
      setTravelDate(defaultTravelDate);
    }
  }, [defaultTravelDate, travelDate]);

  const calculateTotal = () => {
    const effectivePrice = dynamicPrice > 0 ? dynamicPrice : price;
    return selectedSeats.length * effectivePrice;
  };

  const handleStopsSelected = (boarding: string, alighting: string, calculatedPrice: number) => {
    setBoardingStop(boarding);
    setAlightingStop(alighting);
    setDynamicPrice(calculatedPrice);
  };

  async function submitBooking(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    
    if (!isAuthenticated) {
      setError('Please log in to make a booking');
      return;
    }
    
    if (selectedSeats.length === 0 || !travelDate) {
      setError('Please select at least one seat and choose your travel date');
      return;
    }

    // Validate passenger details
    for (let i = 0; i < selectedSeats.length; i++) {
      if (!passengerDetails[i]?.name.trim()) {
        setError(`Please enter passenger name for seat ${selectedSeats[i]}`);
        return;
      }
    }

    setLoading(true);
    try {
      // Create booking payload with stops support
      const passengers = selectedSeats.map((seatNumber, index) => ({
        firstName: passengerDetails[index].name.split(' ')[0] || passengerDetails[index].name,
        lastName: passengerDetails[index].name.split(' ').slice(1).join(' ') || '',
        phone: passengerDetails[index].phone || user?.phone || ''
      }));

      const payload = {
        routeId,
        seatNumbers: selectedSeats,
        travelDate,
        passengers,
        ...(boardingStop && alightingStop && {
          boardingStop,
          alightingStop
        })
      };

      const result = await createBooking(localStorage.getItem('token'), payload);
      
      // Show success notifications
      const routeDetails = boardingStop && alightingStop 
        ? `${boardingStop} → ${alightingStop}` 
        : `${selectedSeats.length} seat${selectedSeats.length > 1 ? 's' : ''} booked`;
      
      // Handle API response - it returns an object with bookings array and summary
      const primaryBooking = result.bookings ? result.bookings[0] : result;
      const bookingId = primaryBooking?.id || 'Unknown';
      
      notificationService.onBookingCreated(bookingId, routeDetails);
      notificationService.onQrTicketReady(bookingId);
      
      if (onSuccess) onSuccess(result);
      
        // Use the summary data for payment page (includes totalAmount and route info)
        const effectivePrice = dynamicPrice > 0 ? dynamicPrice : price;
        const bookingForPayment = {
          id: bookingId,
          totalAmount: result.summary?.totalAmount || (selectedSeats.length * effectivePrice),
          route: {
            origin: boardingStop || 'Origin',
            destination: alightingStop || 'Destination'
          },
          travelDate: travelDate,
          seatNumber: selectedSeats.join(', '),
          passengers: passengers.map((p, i) => ({
            name: p.name,
            seatNumber: selectedSeats[i]
          })),
          pricePerSeat: effectivePrice,
          boardingStop: boardingStop,
          alightingStop: alightingStop
        };      // Redirect to payment page with booking data
      const bookingData = encodeURIComponent(JSON.stringify(bookingForPayment));
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
      
      <form onSubmit={submitBooking} className="space-y-6">
        {/* Travel Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Travel Date
          </label>
          <input 
            type="date" 
            value={travelDate} 
            onChange={(e) => setTravelDate(e.target.value)} 
            className="form-input w-full"
            min={new Date().toISOString().split('T')[0]}
            required
          />
        </div>

        {/* Route Stops Selection - Always Visible */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-4">
            Select Boarding and Destination Points
          </label>
          
          <StopSelector
            routeId={routeId}
            onStopsSelected={handleStopsSelected}
          />
          
          {boardingStop && alightingStop && (
            <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-medium text-green-800 mb-2">✅ Journey Selected</h4>
              <div className="text-sm text-green-700 space-y-1">
                <p><span className="font-medium">From:</span> {boardingStop}</p>
                <p><span className="font-medium">To:</span> {alightingStop}</p>
                <p><span className="font-medium">Price per seat:</span> UGX {dynamicPrice.toLocaleString()} 
                  {dynamicPrice !== price && (
                    <span className="text-green-600 ml-2">
                      (Save UGX {(price - dynamicPrice).toLocaleString()})
                    </span>
                  )}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Selected Seats Summary */}
        {selectedSeats.length > 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              Selected Seats ({selectedSeats.length})
            </h4>
            <div className="flex flex-wrap gap-2">
              {selectedSeats.map((seat, index) => (
                <span key={seat} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                  #{index + 1}: Seat {seat}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Passenger Details */}
        {selectedSeats.length > 0 && (
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-gray-900">
              Passenger Details ({selectedSeats.length} {selectedSeats.length === 1 ? 'passenger' : 'passengers'})
            </h4>
            
            {selectedSeats.map((seat, index) => (
              <div key={seat} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="text-sm font-medium text-gray-700">
                    Passenger {index + 1} - Seat {seat}
                  </h5>
                  {index === 0 && (
                    <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                      Primary (You)
                    </span>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={passengerDetails[index]?.name || ''}
                      onChange={(e) => {
                        const newDetails = [...passengerDetails];
                        newDetails[index] = { ...newDetails[index], name: e.target.value };
                        setPassengerDetails(newDetails);
                      }}
                      className="form-input w-full"
                      placeholder="Enter passenger name"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={passengerDetails[index]?.phone || ''}
                      onChange={(e) => {
                        const newDetails = [...passengerDetails];
                        newDetails[index] = { ...newDetails[index], phone: e.target.value };
                        setPassengerDetails(newDetails);
                      }}
                      className="form-input w-full"
                      placeholder="Phone number (optional)"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Price Summary */}
        {selectedSeats.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Booking Summary</h4>
            <div className="space-y-2">
              {selectedSeats.map((seat, index) => (
                <div key={seat} className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">
                    Seat {seat} - {passengerDetails[index]?.name || 'Passenger ' + (index + 1)}
                  </span>
                  <span className="font-medium">
                    UGX {(dynamicPrice > 0 ? dynamicPrice : price).toLocaleString()}
                    {dynamicPrice > 0 && dynamicPrice !== price && (
                      <span className="text-green-600 text-xs ml-1">
                        (Full route: UGX {price.toLocaleString()})
                      </span>
                    )}
                  </span>
                </div>
              ))}
              <div className="border-t border-gray-300 pt-2 mt-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-900">
                    Total ({selectedSeats.length} {selectedSeats.length === 1 ? 'seat' : 'seats'})
                  </span>
                  <span className="text-lg font-semibold text-gray-900">
                    UGX {calculateTotal().toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="text-red-800 text-sm">{error}</div>
          </div>
        )}

        <button 
          type="submit"
          disabled={loading || !isAuthenticated || selectedSeats.length === 0 || !travelDate} 
          className="btn-primary w-full text-lg"
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Processing Bookings...
            </span>
          ) : selectedSeats.length > 0 ? (
            `Complete Booking${selectedSeats.length > 1 ? 's' : ''} - UGX ${calculateTotal().toLocaleString()}`
          ) : (
            'Select Seats to Continue'
          )}
        </button>
      </form>
    </div>
  );
}
