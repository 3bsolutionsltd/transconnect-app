'use client';
import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Download, Printer, Calendar, MapPin, Clock, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function BookingSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const bookingData = searchParams.get('booking');
    if (bookingData) {
      try {
        const parsedBooking = JSON.parse(decodeURIComponent(bookingData));
        setBooking(parsedBooking);
      } catch (error) {
        console.error('Error parsing booking data:', error);
        router.push('/search');
      }
    } else {
      router.push('/search');
    }
    setLoading(false);
  }, [searchParams, router]);

  const handleDownloadQR = () => {
    if (booking?.qrCode) {
      const link = document.createElement('a');
      link.download = `transconnect-ticket-${booking.id}.png`;
      link.href = booking.qrCode;
      link.click();
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Booking Not Found</h1>
          <Link href="/search" className="btn-primary">
            Search Routes
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Success Header */}
        <div className="text-center mb-8">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Booking Confirmed!</h1>
          <p className="text-gray-600">Your ticket has been generated successfully</p>
        </div>

        {/* Booking Details Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <MapPin className="h-5 w-5 mr-2" />
              Trip Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-600">Route</div>
                <div className="font-semibold">{booking.route?.origin} → {booking.route?.destination}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Travel Date</div>
                <div className="font-semibold">{new Date(booking.travelDate).toLocaleDateString()}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Departure Time</div>
                <div className="font-semibold">{booking.route?.departureTime}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Seat Number</div>
                <div className="font-semibold">{booking.seatNumber}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Passenger</div>
                <div className="font-semibold">{user?.firstName} {user?.lastName}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Total Amount</div>
                <div className="font-semibold text-green-600">UGX {booking.totalAmount?.toLocaleString()}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* QR Code Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-center">Your Digital Ticket</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="bg-white p-6 rounded-lg inline-block border-2 border-gray-200">
              {booking.qrCode ? (
                <img 
                  src={booking.qrCode} 
                  alt="Booking QR Code" 
                  className="w-48 h-48 mx-auto"
                />
              ) : (
                <div className="w-48 h-48 bg-gray-100 flex items-center justify-center">
                  <span className="text-gray-500">QR Code</span>
                </div>
              )}
            </div>
            <p className="text-sm text-gray-600 mt-4 max-w-md mx-auto">
              Show this QR code to the conductor when boarding. 
              Keep this ticket safe and accessible on your phone.
            </p>
            
            {/* Action Buttons */}
            <div className="flex justify-center space-x-4 mt-6">
              <Button onClick={handleDownloadQR} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Download QR
              </Button>
              <Button onClick={handlePrint} variant="outline">
                <Printer className="h-4 w-4 mr-2" />
                Print Ticket
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Important Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-sm">Important Information</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-600 space-y-2">
            <div>• Arrive at the departure point 15 minutes before scheduled time</div>
            <div>• Keep this QR code accessible on your phone or printed copy</div>
            <div>• Contact customer service for any changes or cancellations</div>
            <div>• Booking reference: <span className="font-mono text-gray-900">{booking.id}</span></div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4">
          <Link href="/search" className="btn-outline">
            Book Another Trip
          </Link>
          <Link href="/bookings" className="btn-primary">
            View My Bookings
          </Link>
        </div>
      </div>
    </div>
  );
}