'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { MapPin, Calendar, User, Bus, QrCode, CheckCircle, Clock } from 'lucide-react';

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
      <div className="min-h-screen bg-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full text-center">
          <QrCode className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Ticket Not Available</h2>
          <p className="text-gray-500 text-sm mb-6">{error || 'This ticket could not be loaded.'}</p>
          <Link href="/login" className="block w-full bg-blue-600 text-white py-2 rounded-lg font-medium text-center">
            Log in to view your tickets
          </Link>
        </div>
      </div>
    );
  }

  const from = ticket.boardingStop || ticket.route.origin;
  const to = ticket.alightingStop || ticket.route.destination;
  const statusColor =
    ticket.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' :
    ticket.status === 'PENDING'   ? 'bg-yellow-100 text-yellow-700' :
    'bg-gray-100 text-gray-600';

  return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 px-6 py-5 text-white">
          <div className="flex items-center justify-between mb-1">
            <span className="text-lg font-bold">TransConnect</span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusColor}`}>
              {ticket.status}
            </span>
          </div>
          <p className="text-blue-200 text-xs">Bus Ticket</p>
        </div>

        {/* Route */}
        <div className="px-6 py-5 border-b">
          <div className="flex items-center gap-3">
            <div className="flex-1 text-center">
              <p className="text-xs text-gray-400 mb-1">From</p>
              <p className="font-bold text-gray-900">{from}</p>
            </div>
            <MapPin className="h-5 w-5 text-blue-400 flex-shrink-0" />
            <div className="flex-1 text-center">
              <p className="text-xs text-gray-400 mb-1">To</p>
              <p className="font-bold text-gray-900">{to}</p>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="px-6 py-4 grid grid-cols-2 gap-4 border-b">
          <div className="flex items-start gap-2">
            <User className="h-4 w-4 text-gray-400 mt-0.5" />
            <div>
              <p className="text-xs text-gray-400">Passenger</p>
              <p className="text-sm font-semibold text-gray-800">
                {ticket.user.firstName} {ticket.user.lastName}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Calendar className="h-4 w-4 text-gray-400 mt-0.5" />
            <div>
              <p className="text-xs text-gray-400">Travel Date</p>
              <p className="text-sm font-semibold text-gray-800">
                {new Date(ticket.travelDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Bus className="h-4 w-4 text-gray-400 mt-0.5" />
            <div>
              <p className="text-xs text-gray-400">Seat</p>
              <p className="text-sm font-semibold text-gray-800">{ticket.seatNumber}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Clock className="h-4 w-4 text-gray-400 mt-0.5" />
            <div>
              <p className="text-xs text-gray-400">Departure</p>
              <p className="text-sm font-semibold text-gray-800">{ticket.route.departureTime}</p>
            </div>
          </div>
        </div>

        {/* QR Code */}
        {ticket.qrCode && (
          <div className="px-6 py-5 text-center border-b">
            <p className="text-xs text-gray-400 mb-3">Show to conductor</p>
            <img src={ticket.qrCode} alt="Ticket QR Code" className="w-36 h-36 mx-auto" />
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 text-center">
          {ticket.operator && (
            <p className="text-xs text-gray-500">{ticket.operator.companyName}</p>
          )}
          {ticket.bus && (
            <p className="text-xs text-gray-400 mt-0.5">Bus: {ticket.bus.plateNumber}</p>
          )}
          <p className="text-xs text-gray-400 mt-2 font-mono">#{bookingId.slice(-8).toUpperCase()}</p>
        </div>
      </div>
    </div>
  );
}
