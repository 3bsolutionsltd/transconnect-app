import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useNotificationService } from '@/lib/notificationService';
import SeatMap from './SeatMap';
import StopSelector from './StopSelector';

interface Route {
  id: string;
  origin: string;
  destination: string;
  price: number;
  departureTime: string;
  duration: number;
  operator: {
    companyName: string;
    approved: boolean;
  };
  bus: {
    plateNumber: string;
    model: string;
    capacity: number;
    amenities: string[];
  };
  stops?: Array<{
    id: string;
    stopName: string;
    distanceFromOrigin: number;
    priceFromOrigin: number;
    order: number;
    estimatedTime: string;
  }>;
}

interface Passenger {
  firstName: string;
  lastName: string;
  phone: string;
  idNumber?: string;
}

interface EnhancedBookingFormProps {
  route: Route;
  travelDate: string;
  onBookingComplete: (bookingData: any) => void;
}

const EnhancedBookingForm: React.FC<EnhancedBookingFormProps> = ({
  route,
  travelDate,
  onBookingComplete
}) => {
  const router = useRouter();
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [boardingStop, setBoardingStop] = useState<string>('');
  const [alightingStop, setAlightingStop] = useState<string>('');
  const [dynamicPrice, setDynamicPrice] = useState<number>(route.price);
  const [loading, setLoading] = useState<boolean>(false);
  const [useStops, setUseStops] = useState<boolean>(false);
  const [availableSeats, setAvailableSeats] = useState<string[]>([]);
  const [bookedSeats, setBookedSeats] = useState<string[]>([]);

  // Initialize passengers array when seats are selected
  useEffect(() => {
    if (selectedSeats.length > passengers.length) {
      const newPassengers = [...passengers];
      for (let i = passengers.length; i < selectedSeats.length; i++) {
        newPassengers.push({
          firstName: '',
          lastName: '',
          phone: ''
        });
      }
      setPassengers(newPassengers);
    } else if (selectedSeats.length < passengers.length) {
      setPassengers(passengers.slice(0, selectedSeats.length));
    }
  }, [selectedSeats.length]);

  // Fetch seat availability
  useEffect(() => {
    const fetchSeatAvailability = async () => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/bookings/route/${route.id}/seats?travelDate=${travelDate}`
        );
        setAvailableSeats(response.data.availableSeats);
        setBookedSeats(response.data.bookedSeats || []);
      } catch (error) {
        console.error('Error fetching seat availability:', error);
      }
    };

    fetchSeatAvailability();
  }, [route.id, travelDate]);

  const handleStopsSelected = (boarding: string, alighting: string, price: number) => {
    setBoardingStop(boarding);
    setAlightingStop(alighting);
    setDynamicPrice(price);
  };

  const handlePassengerChange = (index: number, field: keyof Passenger, value: string) => {
    const updatedPassengers = [...passengers];
    updatedPassengers[index] = {
      ...updatedPassengers[index],
      [field]: value
    };
    setPassengers(updatedPassengers);
  };

  const validateForm = (): boolean => {
    const notificationService = useNotificationService();
    
    if (selectedSeats.length === 0) {
      notificationService.showWarning('Seat Selection Required', 'Please select at least one seat to continue with your booking');
      return false;
    }

    if (useStops && (!boardingStop || !alightingStop)) {
      notificationService.showWarning('Stop Selection Required', 'Please select both boarding and alighting stops for your journey');
      return false;
    }

    for (let i = 0; i < passengers.length; i++) {
      const passenger = passengers[i];
      if (!passenger.firstName || !passenger.lastName || !passenger.phone) {
        notificationService.showWarning('Passenger Details Required', `Please fill in all details for passenger ${i + 1}`);
        return false;
      }
      
      // Basic phone validation
      if (!/^\+?[\d\s\-\(\)]+$/.test(passenger.phone)) {
        notificationService.showWarning('Invalid Phone Number', `Please enter a valid phone number for passenger ${i + 1}`);
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      const bookingData = {
        routeId: route.id,
        seatNumbers: selectedSeats,
        travelDate,
        passengers,
        ...(useStops && boardingStop && alightingStop && {
          boardingStop,
          alightingStop
        })
      };

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/bookings`,
        bookingData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      onBookingComplete(response.data);
    } catch (error: any) {
      console.error('Booking error:', error);
      const notificationService = useNotificationService();
      notificationService.showError('Booking Failed', error.response?.data?.error || 'Failed to create booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = dynamicPrice * selectedSeats.length;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Route Information Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {route.origin} → {route.destination}
            </h2>
            <p className="text-gray-600">
              {new Date(travelDate).toLocaleDateString()} • {route.departureTime}
            </p>
          </div>
          <div className="text-right">
            <p className="text-lg font-semibold text-blue-600">
              {route.operator.companyName}
              {route.operator.approved && (
                <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                  VERIFIED
                </span>
              )}
            </p>
            <p className="text-sm text-gray-600">
              {route.bus.plateNumber} • {route.bus.model} • {route.bus.capacity} seats
            </p>
          </div>
        </div>

        {/* Stop Selection Toggle */}
        {route.stops && route.stops.length > 0 && (
          <div className="mb-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={useStops}
                onChange={(e) => {
                  setUseStops(e.target.checked);
                  if (!e.target.checked) {
                    setBoardingStop('');
                    setAlightingStop('');
                    setDynamicPrice(route.price);
                  }
                }}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">
                Select specific boarding and alighting points (optional)
              </span>
            </label>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left Column - Seat Selection & Stop Selection */}
        <div className="space-y-6">
          {/* Stop Selection */}
          {useStops && route.stops && route.stops.length > 0 && (
            <StopSelector
              routeId={route.id}
              onStopsSelected={handleStopsSelected}
            />
          )}

          {/* Seat Selection */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Select Seats (Max 4)
            </h3>
            <SeatMap
              capacity={route.bus.capacity}
              bookedSeats={bookedSeats}
              selectedSeats={selectedSeats}
              onSelect={setSelectedSeats}
              maxSeats={4}
            />
            <div className="mt-4 text-sm text-gray-600">
              <p>Selected seats: {selectedSeats.join(', ') || 'None'}</p>
              <p>Available seats: {availableSeats.length}/{route.bus.capacity}</p>
            </div>
          </div>
        </div>

        {/* Right Column - Passenger Details & Booking Summary */}
        <div className="space-y-6">
          {/* Passenger Details */}
          {selectedSeats.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Passenger Details
              </h3>
              <div className="space-y-6">
                {passengers.map((passenger, index) => (
                  <div key={index} className="border-b border-gray-200 pb-4">
                    <h4 className="font-medium text-gray-900 mb-3">
                      Passenger {index + 1} - Seat {selectedSeats[index]}
                    </h4>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          First Name *
                        </label>
                        <input
                          type="text"
                          value={passenger.firstName}
                          onChange={(e) => handlePassengerChange(index, 'firstName', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Last Name *
                        </label>
                        <input
                          type="text"
                          value={passenger.lastName}
                          onChange={(e) => handlePassengerChange(index, 'lastName', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Phone Number *
                        </label>
                        <input
                          type="tel"
                          value={passenger.phone}
                          onChange={(e) => handlePassengerChange(index, 'phone', e.target.value)}
                          placeholder="+256 XXX XXX XXX"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          ID Number (Optional)
                        </label>
                        <input
                          type="text"
                          value={passenger.idNumber || ''}
                          onChange={(e) => handlePassengerChange(index, 'idNumber', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Booking Summary */}
          {selectedSeats.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Booking Summary
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span>Route:</span>
                  <span className="font-medium">
                    {useStops && boardingStop && alightingStop 
                      ? `${boardingStop} → ${alightingStop}`
                      : `${route.origin} → ${route.destination}`
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Date & Time:</span>
                  <span className="font-medium">
                    {new Date(travelDate).toLocaleDateString()} {route.departureTime}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Seats:</span>
                  <span className="font-medium">{selectedSeats.join(', ')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Passengers:</span>
                  <span className="font-medium">{selectedSeats.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Price per seat:</span>
                  <span className="font-medium">UGX {dynamicPrice.toLocaleString()}</span>
                </div>
                <div className="border-t border-gray-200 pt-3 flex justify-between text-lg font-bold">
                  <span>Total Amount:</span>
                  <span className="text-blue-600">UGX {totalAmount.toLocaleString()}</span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="mt-6">
                <button
                  type="submit"
                  disabled={loading || selectedSeats.length === 0}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
                >
                  {loading ? 'Creating Booking...' : `Book ${selectedSeats.length} Seat${selectedSeats.length > 1 ? 's' : ''}`}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedBookingForm;