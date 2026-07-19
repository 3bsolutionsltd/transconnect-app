'use client';
import React, { useEffect, useState } from 'react';
import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Download, Printer, Calendar, MapPin, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Container, Heading, Lead, Section, StyledButton, StyledCard } from '@/components/styled';
import PortalFooter from '@/components/PortalFooter';
import TransConnectLogo from '@/components/branding/TransConnectLogo';

function BookingSuccessContent() {
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

  const handleDownloadQR = async () => {
    if (!booking?.qrCode) return;

    try {
      // Detect iOS Safari
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
      
      if (isIOS || isSafari) {
        // For iOS/Safari, open in new tab as download may not work
        const newWindow = window.open();
        if (newWindow) {
          newWindow.document.write(`
            <html>
              <head><title>TransConnect Ticket</title></head>
              <body style="margin:0;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#f3f4f6;">
                <div style="text-align:center;">
                  <img src="${booking.qrCode}" alt="Ticket QR Code" style="max-width:90vw;max-height:80vh;" />
                  <p style="margin-top:20px;color:#666;">Long-press the image to save it to your device</p>
                </div>
              </body>
            </html>
          `);
          newWindow.document.close();
        }
      } else {
        // For other browsers, try direct download
        const link = document.createElement('a');
        link.download = `transconnect-ticket-${booking.id}.png`;
        link.href = booking.qrCode;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Error downloading QR code:', error);
      alert('Unable to download. Please take a screenshot of the QR code instead.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D9A3]"></div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="tc-heading-4 text-gray-900 mb-4">Booking Not Found</h1>
          <Link href="/search" className="btn-primary">
            Search Routes
          </Link>
        </div>
      </div>
    );
  }

  return (
    <Section variant="gray" className="min-h-screen py-8">
      <Container className="max-w-2xl px-4">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <TransConnectLogo
              usage="light"
              width={120}
              height={34}
              imageClassName="h-7"
              wordmarkClassName="text-2xl"
            />
          </div>
          <CheckCircle className="h-16 w-16 text-[#00D9A3] mx-auto mb-4" />
          <Heading as="h3" className="text-gray-900 mb-2">Booking Confirmed!</Heading>
          <Lead className="text-gray-600 text-base">Your ticket has been generated successfully</Lead>
        </div>

        {/* Booking Details Card */}
        <StyledCard className="mb-6" hover={false}>
          <div className="mb-4">
            <h2 className="tc-heading-4 text-lg flex items-center text-gray-900">
              <MapPin className="h-5 w-5 mr-2" />
              Trip Details
            </h2>
          </div>
          <div className="space-y-4">
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
                <div className="font-semibold">{booking.route?.departureTime || 'TBD'}</div>
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
                <div className="font-semibold text-[#00C28F]">UGX {booking.totalAmount?.toLocaleString()}</div>
              </div>
            </div>
          </div>
        </StyledCard>

        {/* QR Code Card */}
        <StyledCard className="mb-6 text-center" hover={false}>
          <h2 className="tc-heading-4 text-gray-900">Your Digital Ticket</h2>
          <div className="text-center mt-4">
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
              <StyledButton onClick={handleDownloadQR} variant="outline" size="sm" className="!px-5 !py-2.5">
                <Download className="h-4 w-4 mr-2" />
                Download QR
              </StyledButton>
              <StyledButton onClick={handlePrint} variant="outline" size="sm" className="!px-5 !py-2.5">
                <Printer className="h-4 w-4 mr-2" />
                Print Ticket
              </StyledButton>
            </div>
          </div>
        </StyledCard>

        {/* Important Information */}
        <StyledCard className="mb-6" hover={false}>
          <h3 className="font-semibold text-sm text-gray-900">Important Information</h3>
          <div className="text-sm text-gray-600 space-y-2 mt-3">
            <div>• Arrive at the departure point 15 minutes before scheduled time</div>
            <div>• Keep this QR code accessible on your phone or printed copy</div>
            <div>• Contact customer service for any changes or cancellations</div>
            <div>• Booking reference: <span className="font-mono text-gray-900">{booking.id}</span></div>
          </div>
        </StyledCard>

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4">
          <Link href="/search" className="btn-outline">
            Book Another Trip
          </Link>
          <Link href="/bookings" className="btn-primary">
            View My Bookings
          </Link>
        </div>
      </Container>
      <PortalFooter slim />
    </Section>
  );
}

export default function BookingSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D9A3]" /></div>}>
      <BookingSuccessContent />
    </Suspense>
  );
}