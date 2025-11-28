import React, { useState, useEffect, useCallback } from 'react';
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Filter,
  Search,
  Eye
} from 'lucide-react';

const OperatorBookings = () => {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<any>(null);

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  const loadBookings = useCallback(async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${API_BASE_URL}/operator-management/bookings`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setBookings(data.bookings || []);
      }
    } catch (error) {
      console.error('Error loading bookings:', error);
      // Fallback demo data
      setBookings([
        {
          id: '1',
          user: { firstName: 'John', lastName: 'Doe', phone: '+256701234567' },
          route: { origin: 'Kampala', destination: 'Jinja' },
          seatNumber: 'A1',
          totalAmount: 15000,
          status: 'CONFIRMED',
          createdAt: new Date().toISOString(),
          travelDate: new Date(Date.now() + 86400000).toISOString()
        },
        {
          id: '2',
          user: { firstName: 'Jane', lastName: 'Smith', phone: '+256707654321' },
          route: { origin: 'Jinja', destination: 'Kampala' },
          seatNumber: 'B3',
          totalAmount: 15000,
          status: 'PENDING',
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          travelDate: new Date(Date.now() + 172800000).toISOString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  const updateBookingStatus = async (bookingId: string, newStatus: string, reason?: string) => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${API_BASE_URL}/operator-management/bookings/${bookingId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus, reason })
      });

      if (response.ok) {
        loadBookings(); // Reload bookings
      }
    } catch (error) {
      console.error('Error updating booking status:', error);
    }
  };

  const filteredBookings = bookings.filter(booking => {
    const matchesFilter = filter === 'all' || booking.status.toLowerCase() === filter.toLowerCase();
    const matchesSearch = searchTerm === '' || 
      booking.user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.route.origin.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.route.destination.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'pending': return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'cancelled': return <XCircle className="h-5 w-5 text-red-500" />;
      default: return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatCurrency = (amount: number) => `UGX ${amount.toLocaleString()}`;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/3 animate-pulse"></div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white p-6 rounded-lg shadow animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
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
          <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
          <p className="text-gray-600">Manage bookings for your bus routes</p>
        </div>
        <div className="text-sm text-gray-500">
          {filteredBookings.length} bookings
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by passenger name or route..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select 
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bookings List */}
      <div className="space-y-4">
        {filteredBookings.map((booking) => (
          <div key={booking.id} className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                {getStatusIcon(booking.status)}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {booking.user.firstName} {booking.user.lastName}
                  </h3>
                  <p className="text-sm text-gray-600">{booking.user.phone}</p>
                </div>
              </div>
              <div className="text-right">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(booking.status)}`}>
                  {booking.status}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-500">Route</p>
                <p className="font-medium">{booking.route.origin} → {booking.route.destination}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Seat</p>
                <p className="font-medium">{booking.seatNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Amount</p>
                <p className="font-medium text-green-600">{formatCurrency(booking.totalAmount)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Travel Date</p>
                <p className="font-medium">{new Date(booking.travelDate).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-500">
                Booked: {new Date(booking.createdAt).toLocaleString()}
              </div>
              <div className="flex space-x-2">
                <button 
                  onClick={() => setSelectedBooking(booking)}
                  className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View Details
                </button>
                {booking.status === 'PENDING' && (
                  <>
                    <button 
                      onClick={() => updateBookingStatus(booking.id, 'CONFIRMED')}
                      className="inline-flex items-center px-3 py-1 border border-green-300 text-sm text-green-700 rounded-md hover:bg-green-50 transition-colors"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Confirm
                    </button>
                    <button 
                      onClick={() => updateBookingStatus(booking.id, 'CANCELLED', 'Cancelled by operator')}
                      className="inline-flex items-center px-3 py-1 border border-red-300 text-sm text-red-700 rounded-md hover:bg-red-50 transition-colors"
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {filteredBookings.length === 0 && (
          <div className="bg-white p-12 rounded-lg shadow text-center">
            <Calendar className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
            <p className="text-gray-600">
              {searchTerm || filter !== 'all' 
                ? 'Try adjusting your search or filter criteria' 
                : 'No bookings available for your routes yet'}
            </p>
          </div>
        )}
      </div>

      {/* Booking Details Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Booking Details</h3>
                <button 
                  onClick={() => setSelectedBooking(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Passenger</p>
                  <p className="font-medium">
                    {selectedBooking.user.firstName} {selectedBooking.user.lastName}
                  </p>
                  <p className="text-sm text-gray-600">{selectedBooking.user.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Route & Seat</p>
                  <p className="font-medium">
                    {selectedBooking.route.origin} → {selectedBooking.route.destination}
                  </p>
                  <p className="text-sm text-gray-600">Seat {selectedBooking.seatNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Payment</p>
                  <p className="font-medium text-green-600">
                    {formatCurrency(selectedBooking.totalAmount)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(selectedBooking.status)}`}>
                    {selectedBooking.status}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OperatorBookings;