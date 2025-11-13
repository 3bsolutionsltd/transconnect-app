'use client';
import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/layout/Header';
import { ArrowLeft, MapPin, Calendar, Clock, User, Phone, CreditCard, QrCode, Download } from 'lucide-react';
import Link from 'next/link';

interface BookingDetails {
  id: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  travelDate: string;
  seatNumber: string;
  totalAmount: number;
  bookingDate: string;
  qrCode?: string;
  route: {
    id: string;
    origin: string;
    destination: string;
    departureTime: string;
    duration: number;
    operator: {
      companyName: string;
      contactNumber: string;
    };
    bus: {
      plateNumber: string;
      model: string;
    };
  };
  user: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  payment?: {
    id: string;
    status: string;
    method: string;
    reference: string;
    paidAt: string;
  };
}

export default function BookingDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const bookingId = params?.id as string;

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    fetchBookingDetails();
  }, [isAuthenticated, bookingId]);

  const fetchBookingDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bookings/${bookingId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch booking details');
      }

      const data = await response.json();
      setBooking(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load booking details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'text-green-600 bg-green-50 border-green-200';
      case 'PENDING': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'CANCELLED': return 'text-red-600 bg-red-50 border-red-200';
      case 'COMPLETED': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const downloadQRCode = () => {
    if (!booking?.qrCode) return;
    
    // Generate QR code download (implementation would depend on your QR generation library)
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    // QR code generation logic here
    
    const link = document.createElement('a');
    link.download = `TransConnect-Ticket-${booking.id}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto p-4 sm:p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto p-4 sm:p-6">
          <div className="text-center py-12">
            <div className="text-red-600 mb-4">
              <QrCode className="h-16 w-16 mx-auto mb-4" />
              <h2 className="text-2xl font-bold">Booking Not Found</h2>
              <p className="text-gray-600 mt-2">{error || 'The booking you\'re looking for doesn\'t exist or you don\'t have access to it.'}</p>
            </div>
            <div className="mt-6 space-x-4">
              <Link href="/bookings" className="btn-primary">
                View All Bookings
              </Link>
              <Link href="/search" className="btn-outline">
                Book New Trip
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Booking Details</h1>
              <p className="text-gray-600">#{booking.id.slice(-8).toUpperCase()}</p>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full border text-sm font-medium ${getStatusColor(booking.status)}`}>
            {booking.status}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Booking Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Trip Details */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Trip Information</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <MapPin className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">
                        {booking.route.origin} → {booking.route.destination}
                      </p>
                      <p className="text-sm text-gray-600">{booking.route.operator.companyName}</p>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {new Date(booking.travelDate).toLocaleDateString('en-GB', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{booking.route.departureTime}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Seat Number:</span>
                      <span className="ml-2 font-medium">{booking.seatNumber}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Bus:</span>
                      <span className="ml-2 font-medium">{booking.route.bus.plateNumber}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Passenger Details */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Passenger Information</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <User className="h-5 w-5 text-gray-400" />
                  <span className="font-medium">{booking.user.firstName} {booking.user.lastName}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-600">{booking.user.phone}</span>
                </div>
              </div>
            </div>

            {/* Payment Information */}
            {booking.payment && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Details</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount:</span>
                    <span className="font-semibold">UGX {booking.totalAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Method:</span>
                    <span>{booking.payment.method}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Reference:</span>
                    <span className="font-mono text-sm">{booking.payment.reference}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      booking.payment.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 
                      booking.payment.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {booking.payment.status}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* QR Code & Actions */}
          <div className="space-y-6">
            {/* QR Code */}
            {booking.status === 'CONFIRMED' && (
              <div className="bg-white rounded-lg shadow-sm p-6 text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Ticket</h3>
                <div className="bg-gray-100 rounded-lg p-6 mb-4">
                  <QrCode className="h-32 w-32 mx-auto text-gray-400 mb-2" />
                  <p className="text-xs text-gray-600">QR Code for Boarding</p>
                </div>
                <button
                  onClick={downloadQRCode}
                  className="btn-outline w-full mb-2"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Ticket
                </button>
                <p className="text-xs text-gray-600">
                  Show this QR code to the conductor when boarding
                </p>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
              <div className="space-y-3">
                <Link href="/bookings" className="btn-outline w-full">
                  All Bookings
                </Link>
                <Link href="/search" className="btn-primary w-full">
                  Book Another Trip
                </Link>
                {booking.status === 'PENDING' && (
                  <button className="btn-secondary w-full">
                    Cancel Booking
                  </button>
                )}
              </div>
            </div>

            {/* Booking Timeline */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium">Booking Created</p>
                    <p className="text-xs text-gray-600">
                      {new Date(booking.bookingDate).toLocaleString()}
                    </p>
                  </div>
                </div>
                {booking.payment?.status === 'COMPLETED' && (
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium">Payment Confirmed</p>
                      <p className="text-xs text-gray-600">
                        {new Date(booking.payment.paidAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}