'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Bus, Calendar, Clock, MapPin, QrCode, User } from 'lucide-react';
import Header from '@/components/Header';
import { Badge, Container, Section, StyledCard } from '@/components/styled';
import PortalFooter from '@/components/PortalFooter';
import TransConnectLogo from '@/components/branding/TransConnectLogo';

interface TicketInfo {
  id: string;
  status: string;
  seatNumber: string;
  travelDate: string;
  totalAmount: number;
  boardingStop?: string;
  alightingStop?: string;
  route: { origin: string; destination: string; departureTime: string };
  user: { firstName: string; lastName: string };
  bus?: { plateNumber: string; model: string };
  operator?: { companyName: string };
  qrCode?: string;
}

export default function PublicTicketPage() {
  const params = useParams();
  const bookingId = params?.id as string;
  const [ticket, setTicket] = useState<TicketInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!bookingId) return;

    const fetchTicket = async () => {
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_URL || '/api';
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const res = await fetch(`${apiBase}/bookings/${bookingId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || `Error ${res.status}`);
        }

        setTicket(await res.json());
      } catch (e: any) {
        setError(e.message || 'Ticket not found');
      } finally {
        setLoading(false);
      }
    };

    fetchTicket();
  }, [bookingId]);

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

  if (error || !ticket) {
    return (
      <Section variant="gray" className="min-h-screen py-10">
        <Header />
        <Container className="flex items-center justify-center px-4 pt-12">
          <StyledCard className="max-w-md w-full text-center" hover={false}>
            <QrCode className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-black text-[#14263f] mb-2">Ticket Not Available</h2>
            <p className="text-[#6f86a7] text-sm mb-6">{error || 'This ticket could not be loaded.'}</p>
            <Link href="/login" className="block w-full btn-primary text-center">
              Sign in to view your tickets
            </Link>
          </StyledCard>
        </Container>
        <PortalFooter slim />
      </Section>
    );
  }

  const from = ticket.boardingStop || ticket.route.origin;
  const to = ticket.alightingStop || ticket.route.destination;
  const statusVariant =
    ticket.status === 'CONFIRMED' ? 'success' : ticket.status === 'PENDING' ? 'warning' : 'error';

  return (
    <div className="min-h-screen bg-[#f5f8fe]">
      <Header />
      <Section variant="gray" className="py-10">
        <Container className="max-w-3xl">
          <StyledCard className="!p-0 overflow-hidden" hover={false}>
            <div className="bg-[#214c86] text-white px-6 py-5">
              <div className="flex items-center justify-between mb-1">
                <TransConnectLogo
                  usage="dark"
                  width={92}
                  height={28}
                  imageClassName="h-5"
                  wordmarkClassName="text-base"
                />
                <Badge variant={statusVariant} className="!px-3 !py-1 !text-[10px]">{ticket.status}</Badge>
              </div>
              <p className="text-white/75 text-xs">Digital Bus Ticket</p>
            </div>

            <div className="p-6 border-b border-[#ebf1f8]">
              <div className="grid grid-cols-3 gap-4 items-center">
                <div>
                  <p className="text-xs uppercase text-[#8ca4c4]">From</p>
                  <p className="text-3xl font-black text-[#14263f]">{from}</p>
                </div>
                <div className="text-center">
                  <MapPin className="h-5 w-5 text-[#00D9A3] mx-auto" />
                  <p className="text-xs text-[#8ca4c4] mt-1">Direct Route</p>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase text-[#8ca4c4]">To</p>
                  <p className="text-3xl font-black text-[#0f8c6b]">{to}</p>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 grid grid-cols-2 gap-4 border-b border-[#ebf1f8]">
              <div className="flex items-start gap-2">
                <User className="h-4 w-4 text-[#8ca4c4] mt-0.5" />
                <div>
                  <p className="text-xs text-[#8ca4c4]">Passenger</p>
                  <p className="text-sm font-semibold text-[#14263f]">{ticket.user.firstName} {ticket.user.lastName}</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Calendar className="h-4 w-4 text-[#8ca4c4] mt-0.5" />
                <div>
                  <p className="text-xs text-[#8ca4c4]">Travel Date</p>
                  <p className="text-sm font-semibold text-[#14263f]">
                    {new Date(ticket.travelDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Bus className="h-4 w-4 text-[#8ca4c4] mt-0.5" />
                <div>
                  <p className="text-xs text-[#8ca4c4]">Seat</p>
                  <p className="text-sm font-semibold text-[#14263f]">{ticket.seatNumber}</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Clock className="h-4 w-4 text-[#8ca4c4] mt-0.5" />
                <div>
                  <p className="text-xs text-[#8ca4c4]">Departure</p>
                  <p className="text-sm font-semibold text-[#14263f]">{ticket.route.departureTime}</p>
                </div>
              </div>
            </div>

            {ticket.qrCode && (
              <div className="px-6 py-5 text-center border-b border-[#ebf1f8]">
                <p className="text-xs text-[#8ca4c4] mb-3">Show at boarding gate</p>
                <img src={ticket.qrCode} alt="Ticket QR Code" className="w-44 h-44 mx-auto" />
              </div>
            )}

            <div className="px-6 py-4 bg-[#f8fbff] text-center">
              {ticket.operator && <p className="text-xs text-[#6f86a7]">{ticket.operator.companyName}</p>}
              {ticket.bus && <p className="text-xs text-[#8ca4c4] mt-0.5">Bus: {ticket.bus.plateNumber} • {ticket.bus.model}</p>}
              <p className="text-xs text-[#8ca4c4] mt-2 font-mono">#{bookingId.slice(-8).toUpperCase()}</p>
            </div>
          </StyledCard>
        </Container>
      </Section>
      <PortalFooter slim />
    </div>
  );
}
