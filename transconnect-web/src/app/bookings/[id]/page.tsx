'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Header from '@/components/Header';
import PortalFooter from '@/components/PortalFooter';
import { Calendar, Clock, Download, Mail, MapPin, Phone, QrCode, Share2 } from 'lucide-react';
import Link from 'next/link';
import { Container, Section, StyledCard, StyledButton, Badge } from '@/components/styled';
import TransConnectLogo from '@/components/branding/TransConnectLogo';

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
    status: string;
    method: string;
    reference: string;
    paidAt: string;
  };
}

export default function BookingDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const bookingId = params?.id as string;

  useEffect(() => {
    fetchBookingDetails();
  }, [bookingId]);

  const fetchBookingDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const apiBase = process.env.NEXT_PUBLIC_API_URL || '/api';
      const response = await fetch(`${apiBase}/bookings/${bookingId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 401) {
        router.push('/login');
        return;
      }

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || `Error ${response.status}`);
      }

      setBooking(await response.json());
    } catch (err: any) {
      setError(err.message || 'Failed to load booking details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f8fe]">
        <Header />
        <div className="flex items-center justify-center h-72">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#00D9A3]" />
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-[#f5f8fe]">
        <Header />
        <Container className="py-12">
          <StyledCard hover={false} className="text-center max-w-xl mx-auto">
            <QrCode className="h-14 w-14 text-gray-300 mx-auto mb-4" />
            <h2 className="text-3xl font-black text-[#14263f]">Booking Not Found</h2>
            <p className="text-[#6f86a7] mt-2">{error || 'This booking could not be loaded.'}</p>
            <div className="mt-6 flex justify-center gap-3">
              <Link href="/bookings" className="btn-primary">View All Bookings</Link>
              <Link href="/search" className="btn-outline">Search Routes</Link>
            </div>
          </StyledCard>
        </Container>
      </div>
    );
  }

  const statusVariant =
    booking.status === 'CONFIRMED' ? 'success' : booking.status === 'PENDING' ? 'warning' : 'error';

  return (
    <div className="min-h-screen bg-[#f5f8fe]">
      <Header />
      <Container className="py-5">
        <div className="text-xs text-[#8ca4c4] mb-5">
          <Link href="/" className="hover:text-[#214c86]">Home</Link> {'>'} <Link href="/bookings" className="hover:text-[#214c86]">My Bookings</Link> {'>'} #{booking.id.slice(-8).toUpperCase()}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4">
          <main className="space-y-4">
            <StyledCard hover={false} className="!p-5 bg-[#0f9f6f] text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-black">Booking Confirmed</h1>
                  <p className="text-white/85 text-sm mt-1">Your ticket is ready • Booking ID: #{booking.id.slice(-8).toUpperCase()}</p>
                </div>
                <div className="text-right text-xs">
                  <p className="uppercase">Booked On</p>
                  <p className="text-sm font-semibold">{new Date(booking.bookingDate).toLocaleDateString()}</p>
                </div>
              </div>
            </StyledCard>

            <StyledCard hover={false} className="!p-0 overflow-hidden">
              <div className="px-5 py-4 border-b border-[#ebf1f8] flex items-center justify-between">
                <h2 className="text-2xl font-black text-[#14263f]">Trip Details</h2>
                <Badge variant={statusVariant}>Confirmed</Badge>
              </div>

              <div className="p-5">
                <div className="rounded-xl bg-[#f0f5fd] p-5 mb-4">
                  <div className="grid grid-cols-3 gap-4 items-center">
                    <div>
                      <p className="text-xs text-[#8ca4c4] uppercase">From</p>
                      <p className="text-4xl font-black text-[#14263f]">{booking.route.origin}</p>
                      <p className="text-sm text-[#6f86a7]">{booking.route.departureTime}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-[#0f8c6b] font-semibold">{Math.floor((booking.route.duration || 390) / 60)}h {(booking.route.duration || 390) % 60}m</p>
                      <div className="h-[2px] bg-[#2a5d95] my-2" />
                      <p className="text-xs text-[#8ca4c4]">Direct • No stops</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-[#8ca4c4] uppercase">To</p>
                      <p className="text-4xl font-black text-[#0f8c6b]">{booking.route.destination}</p>
                      <p className="text-sm text-[#6f86a7]">Arrival est.</p>
                    </div>
                  </div>
                </div>

                <div className="divide-y divide-[#edf2f9] text-sm">
                  <div className="py-2 flex justify-between"><span className="text-[#8ca4c4]">Operator</span><span className="font-semibold text-[#14263f]">{booking.route.operator.companyName}</span></div>
                  <div className="py-2 flex justify-between"><span className="text-[#8ca4c4]">Bus Type</span><span className="font-semibold text-[#14263f]">{booking.route.bus.model}</span></div>
                  <div className="py-2 flex justify-between"><span className="text-[#8ca4c4]">Seat Number</span><span className="font-semibold text-[#214c86]">{booking.seatNumber}</span></div>
                  <div className="py-2 flex justify-between"><span className="text-[#8ca4c4]">Passenger</span><span className="font-semibold text-[#14263f]">{booking.user.firstName} {booking.user.lastName}</span></div>
                </div>
              </div>
            </StyledCard>

            <StyledCard hover={false} className="!p-0 overflow-hidden">
              <div className="px-5 py-4 border-b border-[#ebf1f8]"><h3 className="text-2xl font-black text-[#14263f]">Payment Summary</h3></div>
              <div className="p-5 divide-y divide-[#edf2f9]">
                <div className="py-2 flex justify-between text-sm"><span className="text-[#8ca4c4]">Ticket Price</span><span className="font-semibold">UGX {booking.totalAmount.toLocaleString()}</span></div>
                <div className="py-2 flex justify-between text-sm"><span className="text-[#8ca4c4]">Service Fee</span><span className="font-semibold">UGX 2,000</span></div>
                <div className="py-2 flex justify-between text-2xl font-black text-[#0f8c6b]"><span>Total Paid</span><span>UGX {booking.totalAmount.toLocaleString()}</span></div>
                {booking.payment && <div className="py-2 text-xs text-[#0f8c6b]">Paid via {booking.payment.method} • Ref: {booking.payment.reference}</div>}
              </div>
            </StyledCard>
          </main>

          <aside className="space-y-4">
            <StyledCard hover={false} className="!p-0 overflow-hidden">
              <div className="bg-[#214c86] text-white px-5 py-4 text-center">
                <div className="flex justify-center mb-2">
                  <TransConnectLogo
                    usage="dark"
                    width={98}
                    height={30}
                    imageClassName="h-5"
                    wordmarkClassName="text-base"
                  />
                </div>
                <p className="text-xs uppercase text-[#bdd1ef]">Digital Ticket</p>
                <p className="text-4xl font-black">#{booking.id.slice(-8).toUpperCase()}</p>
              </div>
              <div className="p-4 text-center">
                {booking.qrCode ? (
                  <img src={booking.qrCode} alt="ticket qr code" className="w-44 h-44 mx-auto" />
                ) : (
                  <QrCode className="h-40 w-40 text-[#c8d5e8] mx-auto" />
                )}
                <p className="text-xs text-[#8ca4c4] mt-3">Show this at boarding gate</p>
              </div>

              <div className="grid grid-cols-3 border-t border-[#edf2f9] text-center py-3">
                <div>
                  <p className="text-[11px] text-[#8ca4c4] uppercase">Seat</p>
                  <p className="text-xl font-black text-[#214c86]">{booking.seatNumber}</p>
                </div>
                <div>
                  <p className="text-[11px] text-[#8ca4c4] uppercase">Departs</p>
                  <p className="text-xl font-black text-[#14263f]">{booking.route.departureTime}</p>
                </div>
                <div>
                  <p className="text-[11px] text-[#8ca4c4] uppercase">Class</p>
                  <p className="text-xl font-black text-[#0f8c6b]">Luxury</p>
                </div>
              </div>

              <div className="p-3 grid grid-cols-2 gap-2">
                <button className="btn-outline !py-2 inline-flex justify-center items-center gap-2"><Download className="h-4 w-4" /> Download PDF</button>
                <button className="btn-primary !py-2 inline-flex justify-center items-center gap-2"><Share2 className="h-4 w-4" /> Share Ticket</button>
              </div>
            </StyledCard>

            <StyledCard hover={false} className="!p-4">
              <h4 className="font-bold text-[#14263f] mb-3">Manage Booking</h4>
              <div className="space-y-2">
                <button className="w-full rounded-xl bg-[#f5efff] text-[#7c3aed] py-2.5 text-sm font-semibold">Transfer to Someone Else</button>
                <button className="w-full rounded-xl bg-[#fff1f2] text-[#ef4444] py-2.5 text-sm font-semibold">Cancel Booking</button>
              </div>
            </StyledCard>

            <StyledCard hover={false} className="!p-4 bg-[#eef5ff]">
              <h4 className="font-bold text-[#214c86] mb-1">Need Help?</h4>
              <p className="text-xs text-[#6f86a7] mb-3">Having issues with this booking? Our support team is available 24/7.</p>
              <a href={`tel:${booking.route.operator.contactNumber || ''}`} className="w-full rounded-xl border border-[#214c86] text-[#214c86] py-2.5 text-sm font-semibold inline-flex justify-center items-center gap-2">
                <Phone className="h-4 w-4" /> Contact Support
              </a>
              <a href={`mailto:${booking.user.email || ''}`} className="w-full rounded-xl border border-[#c9d7ea] text-[#4f6585] py-2.5 text-sm font-semibold inline-flex justify-center items-center gap-2 mt-2">
                <Mail className="h-4 w-4" /> Email Receipt
              </a>
            </StyledCard>
          </aside>
        </div>
      </Container>
      <PortalFooter slim />
    </div>
  );
}
