'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Clock, QrCode, Download, User, ArrowRight, X, Edit, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getMyBookings, cancelBooking, modifyBookingDate } from '@/lib/api';
import Header from '@/components/Header';
import toast from 'react-hot-toast';

export default function BookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [modifyingId, setModifyingId] = useState<string | null>(null);
  const [newDate, setNewDate] = useState('');
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      loadBookings();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const loadBookings = async () => {
    try {
      const token = localStorage.getItem('token');
      const result = await getMyBookings(token);
      setBookings(result);
    } catch (err: any) {
      console.error('Error loading bookings:', err);
      setError(err.response?.data?.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed': return 'text-green-600 bg-green-50 border-green-200';
      case 'pending': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'cancelled': return 'text-red-600 bg-red-50 border-red-200';
      case 'completed': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const downloadQRCode = (booking: any) => {
    if (booking.qrCode) {
      const link = document.createElement('a');
      link.download = `transconnect-ticket-${booking.id}.png`;
      link.href = booking.qrCode;
      link.click();
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking? This action cannot be undone.')) {
      return;
    }

    setCancellingId(bookingId);
    try {
      const token = localStorage.getItem('token');
      await cancelBooking(bookingId, token);
      
      // Update the booking status locally
      setBookings(prev => prev.map(booking => 
        booking.id === bookingId 
          ? { ...booking, status: 'CANCELLED' }
          : booking
      ));
      
      toast.success('Booking cancelled successfully');
    } catch (err: any) {
      console.error('Error cancelling booking:', err);
      toast.error(err.response?.data?.message || 'Failed to cancel booking');
    } finally {
      setCancellingId(null);
    }
  };

  const handleModifyDate = async (bookingId: string) => {
    if (!newDate) {
      toast.error('Please select a new travel date');
      return;
    }

    if (!confirm('Are you sure you want to modify the travel date? Additional charges may apply.')) {
      return;
    }

    setModifyingId(bookingId);
    try {
      const token = localStorage.getItem('token');
      const updatedBooking = await modifyBookingDate(bookingId, newDate, token);
      
      // Update the booking locally
      setBookings(prev => prev.map(booking => 
        booking.id === bookingId 
          ? { ...booking, travelDate: newDate, status: 'PENDING' }
          : booking
      ));
      
      setNewDate('');
      setModifyingId(null);
      toast.success('Travel date updated successfully');
    } catch (err: any) {
      console.error('Error modifying booking:', err);
      toast.error(err.response?.data?.message || 'Failed to modify booking date');
    } finally {
      setModifyingId(null);
    }
  };

  const canCancelBooking = (booking: any) => {
    const travelDate = new Date(booking.travelDate);
    const now = new Date();
    const hoursUntilTravel = (travelDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    return booking.status === 'CONFIRMED' && hoursUntilTravel > 24;
  };

  const canModifyBooking = (booking: any) => {
    const travelDate = new Date(booking.travelDate);
    const now = new Date();
    const hoursUntilTravel = (travelDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    return (booking.status === 'CONFIRMED' || booking.status === 'PENDING') && hoursUntilTravel > 48;
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Login Required</h2>
            <p className="text-gray-600 mb-6">Please log in to view your bookings</p>
            <div className="space-x-4">
              <Link href="/login" className="btn-primary">
                Login
              </Link>
              <Link href="/register" className="btn-outline">
                Register
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-lg p-6 space-y-3">
                  <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <h1 className="text-3xl font-bold text-gray-900">My Bookings</h1>
            <Button 
              variant="outline" 
              onClick={loadBookings}
              disabled={loading}
              className="flex items-center"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
          <p className="text-gray-600">Manage your bus tickets and travel history</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="text-red-800">{error}</div>
          </div>
        )}

        {/* User Info */}
        <Card className="mb-6">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <User className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <div className="font-medium text-gray-900">{user?.firstName} {user?.lastName}</div>
                  <div className="text-sm text-gray-600">{user?.email}</div>
                </div>
              </div>
              <Link href="/search" className="btn-primary">
                Book New Trip
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Bookings List */}
        {bookings.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Bookings Yet</h3>
              <p className="text-gray-600 mb-6">You haven't made any bookings. Start by searching for routes.</p>
              <Link href="/search" className="btn-primary">
                Search Routes
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <Card key={booking.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <MapPin className="h-5 w-5 text-gray-400 mr-2" />
                        <span className="text-lg font-semibold text-gray-900">
                          {booking.route?.origin} <ArrowRight className="h-4 w-4 inline mx-2" /> {booking.route?.destination}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {new Date(booking.travelDate).toLocaleDateString()}
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {booking.route?.departureTime}
                        </div>
                        <div>
                          Seat: <span className="font-medium">{booking.seatNumber}</span>
                        </div>
                        <div>
                          <span className="font-medium text-green-600">
                            UGX {booking.totalAmount?.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(booking.status)}`}>
                        {booking.status}
                      </span>
                      {booking.qrCode && booking.status !== 'CANCELLED' && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => downloadQRCode(booking)}
                        >
                          <QrCode className="h-4 w-4 mr-1" />
                          QR Code
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {/* Booking Management Actions */}
                  {(canCancelBooking(booking) || canModifyBooking(booking)) && (
                    <div className="border-t pt-4 mt-4">
                      <div className="flex flex-wrap gap-3">
                        {canModifyBooking(booking) && (
                          <div className="flex items-center space-x-2">
                            <input
                              type="date"
                              value={modifyingId === booking.id ? newDate : ''}
                              onChange={(e) => {
                                setNewDate(e.target.value);
                                setModifyingId(booking.id);
                              }}
                              min={new Date().toISOString().split('T')[0]}
                              className="text-sm px-2 py-1 border border-gray-300 rounded"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleModifyDate(booking.id)}
                              disabled={modifyingId === booking.id && !newDate}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              {modifyingId === booking.id ? 'Updating...' : 'Modify Date'}
                            </Button>
                          </div>
                        )}
                        
                        {canCancelBooking(booking) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCancelBooking(booking.id)}
                            disabled={cancellingId === booking.id}
                            className="text-red-600 border-red-300 hover:bg-red-50"
                          >
                            <X className="h-4 w-4 mr-1" />
                            {cancellingId === booking.id ? 'Cancelling...' : 'Cancel Booking'}
                          </Button>
                        )}
                      </div>
                      
                      <div className="mt-2 text-xs text-gray-500">
                        {canCancelBooking(booking) && '• Free cancellation up to 24 hours before travel'}
                        {canModifyBooking(booking) && ' • Date changes allowed up to 48 hours before travel'}
                      </div>
                    </div>
                  )}
                  
                  <div className="text-xs text-gray-500 border-t pt-3">
                    Booking ID: {booking.id} • Booked on {new Date(booking.createdAt).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}