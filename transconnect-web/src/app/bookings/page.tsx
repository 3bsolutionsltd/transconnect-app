'use client';
import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Clock, User, X, CreditCard, CheckCircle, ArrowLeftRight, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getMyBookings, cancelBooking, modifyBookingDate, paymentApi } from '@/lib/api';
import { useNotificationService } from '@/lib/notificationService';
import Header from '@/components/Header';
import PortalFooter from '@/components/PortalFooter';
import ConfirmationDialog from '@/components/ui/ConfirmationDialog';
import toast from 'react-hot-toast';
import { Container, Heading, Section } from '@/components/styled';
import OperatorLogoBadge from '@/components/branding/OperatorLogoBadge';

export default function BookingsPage() {
  const CASH_EXPIRY_GRACE_HOURS = 2;
  const PAGE_SIZE = 5;
  const [bookings, setBookings] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'UPCOMING' | 'COMPLETED' | 'CANCELLED'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [modifyingId, setModifyingId] = useState<string | null>(null);
  const [newDate, setNewDate] = useState('');
  const [checkingStatusId, setCheckingStatusId] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type?: 'warning' | 'danger' | 'info';
  } | null>(null);
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const notificationService = useNotificationService();

  useEffect(() => {
    if (authLoading) return; // Wait for auth to load
    
    if (isAuthenticated) {
      loadBookings();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, authLoading]);

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
      case 'awaiting-cash': return 'text-teal-700 bg-teal-50 border-teal-200';
      case 'pending': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'cancelled': return 'text-red-600 bg-red-50 border-red-200';
      case 'completed': return 'text-[#1a3a5c] bg-[#e8f5f2] border-[#b7eadb]';
      case 'expired': return 'text-gray-500 bg-gray-100 border-gray-300';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const isCashBooking = (booking: any) => {
    return booking?.payment?.method === 'CASH' || booking?.paymentMethod === 'CASH' || booking?.isCashPayment === true;
  };

  const hasCashGraceExpired = (booking: any) => {
    const departure = new Date(booking.travelDate);
    const [hours, minutes] = (booking.route?.departureTime || '00:00').split(':').map(Number);
    departure.setHours(hours, minutes, 0, 0);
    const expiry = new Date(departure.getTime() + CASH_EXPIRY_GRACE_HOURS * 60 * 60 * 1000);
    return expiry < new Date();
  };

  const isBookingExpired = (booking: any) => {
    if (booking.status !== 'PENDING') return false;
    if (isCashBooking(booking)) return hasCashGraceExpired(booking);

    const departure = new Date(booking.travelDate);
    const [hours, minutes] = (booking.route?.departureTime || '00:00').split(':').map(Number);
    departure.setHours(hours, minutes, 0, 0);
    return departure < new Date();
  };

  const getDisplayStatus = (booking: any) => {
    if (isBookingExpired(booking)) return 'EXPIRED';
    if (booking.status === 'PENDING' && isCashBooking(booking)) return 'AWAITING CASH PAYMENT';
    return booking.status;
  };

  const getDisplayStatusColor = (booking: any) => {
    if (isBookingExpired(booking)) return getStatusColor('expired');
    if (booking.status === 'PENDING' && isCashBooking(booking)) return getStatusColor('awaiting-cash');
    return getStatusColor(booking.status);
  };

  const getStatusChipMeta = (booking: any) => {
    const status = getDisplayStatus(booking).toUpperCase();

    if (status.includes('CONFIRMED')) {
      return {
        chip: 'bg-[#ecfdf3] text-[#15803d] border-[#b9efcf]',
        dot: 'bg-[#22c55e]',
      };
    }
    if (status.includes('PENDING') || status.includes('AWAITING')) {
      return {
        chip: 'bg-[#fff8eb] text-[#b45309] border-[#f5deb0]',
        dot: 'bg-[#f59e0b]',
      };
    }
    if (status.includes('CANCELLED') || status.includes('EXPIRED')) {
      return {
        chip: 'bg-[#fff1f2] text-[#be123c] border-[#fecdd3]',
        dot: 'bg-[#fb7185]',
      };
    }
    if (status.includes('COMPLETED')) {
      return {
        chip: 'bg-[#eef4ff] text-[#1d4ed8] border-[#c9dcff]',
        dot: 'bg-[#60a5fa]',
      };
    }

    return {
      chip: 'bg-[#f8fafc] text-[#475569] border-[#e2e8f0]',
      dot: 'bg-[#94a3b8]',
    };
  };

  const downloadQRCode = (booking: any) => {
    if (!booking.qrCode) return;

    try {
      // Detect iOS Safari
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
      
      if (isIOS || isSafari) {
        // For iOS/Safari, open in new tab
        const newWindow = window.open();
        if (newWindow) {
          newWindow.document.write(`
            <html>
              <head><title>TransConnect Ticket - ${booking.id}</title></head>
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
      notificationService.showError('Download Failed', 'Unable to download. Please take a screenshot instead.');
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return;

    const routeDetails = `${booking.route?.origin} → ${booking.route?.destination}`;
    
    setConfirmDialog({
      isOpen: true,
      title: 'Cancel Booking',
      message: `Are you sure you want to cancel your booking for ${routeDetails} on ${new Date(booking.travelDate).toLocaleDateString()}? This action cannot be undone and may be subject to cancellation fees.`,
      type: 'danger',
      onConfirm: async () => {
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
          
          // Show success notification
          notificationService.onBookingCancelled(bookingId, routeDetails);
          notificationService.showSuccess(
            'Booking Cancelled Successfully', 
            `Your booking for ${routeDetails} has been cancelled. A confirmation email has been sent.`
          );
          
          setConfirmDialog(null);
        } catch (err: any) {
          console.error('Error cancelling booking:', err);
          const errorMessage = err.response?.data?.error || err.response?.data?.message || 'Failed to cancel booking';
          notificationService.showError('Cancellation Failed', errorMessage);
        } finally {
          setCancellingId(null);
        }
      }
    });
  };

  const handleModifyDate = async (bookingId: string) => {
    if (!newDate) {
      notificationService.showWarning('Date Required', 'Please select a new travel date');
      return;
    }

    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return;

    const routeDetails = `${booking.route?.origin} → ${booking.route?.destination}`;
    
    setConfirmDialog({
      isOpen: true,
      title: 'Modify Travel Date',
      message: `Are you sure you want to change your travel date for ${routeDetails} to ${new Date(newDate).toLocaleDateString()}? Additional charges may apply and you'll need to confirm payment.`,
      type: 'warning',
      onConfirm: async () => {
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
          
          // Show success notification
          notificationService.showSuccess(
            'Travel Date Updated', 
            `Your travel date for ${routeDetails} has been changed to ${new Date(newDate).toLocaleDateString()}. Please complete payment to confirm.`
          );
          
          setNewDate('');
          setConfirmDialog(null);
        } catch (err: any) {
          console.error('Error modifying booking:', err);
          const errorMessage = err.response?.data?.error || err.response?.data?.message || 'Failed to modify booking date';
          notificationService.showError('Modification Failed', errorMessage);
        } finally {
          setModifyingId(null);
        }
      }
    });
  };

  const canCancelBooking = (booking: any) => {
    const travelDate = new Date(booking.travelDate);
    const now = new Date();
    const hoursUntilTravel = (travelDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    // Allow cancelling expired pending bookings (to clean them up) or future bookings
    if (isBookingExpired(booking)) return true;
    return (booking.status === 'CONFIRMED' && hoursUntilTravel > 24) || 
           (booking.status === 'PENDING' && hoursUntilTravel > 2);
  };

  const canModifyBooking = (booking: any) => {
    const travelDate = new Date(booking.travelDate);
    const now = new Date();
    const hoursUntilTravel = (travelDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    return (booking.status === 'CONFIRMED' || booking.status === 'PENDING') && hoursUntilTravel > 48;
  };

  const handlePayNow = (booking: any) => {
    // Navigate to payment page with booking data
    const bookingData = encodeURIComponent(JSON.stringify(booking));
    window.location.href = `/payment?booking=${bookingData}`;
  };

  const handleCheckStatus = async (booking: any) => {
    if (!booking.payment?.id) return;
    setCheckingStatusId(booking.id);
    try {
      const result = await paymentApi.getStatus(booking.payment.id);
      if (result.status === 'COMPLETED') {
        setBookings(prev => prev.map(b =>
          b.id === booking.id ? { ...b, status: 'CONFIRMED' } : b
        ));
        toast.success('Payment confirmed! Your booking is now confirmed.');
        loadBookings(); // Refresh to get QR code
      } else if (result.status === 'FAILED') {
        setBookings(prev => prev.map(b =>
          b.id === booking.id ? { ...b, status: 'PENDING' } : b
        ));
        toast.error('Payment failed. Please try again.');
      } else {
        toast('Payment is still processing. Please check again in a moment.', { icon: '⏳' });
      }
    } catch {
      toast.error('Could not check payment status. Please try again.');
    } finally {
      setCheckingStatusId(null);
    }
  };

  const canPayBooking = (booking: any) => {
    // Only show Pay Now if booking is PENDING and trip hasn't departed yet
    if (isCashBooking(booking)) return false;
    return booking.status === 'PENDING' && !isBookingExpired(booking);
  };

  const metrics = useMemo(() => {
    const totalBookings = bookings.length;
    const upcoming = bookings.filter((b) => ['PENDING', 'CONFIRMED'].includes((b.status || '').toUpperCase())).length;
    const pending = bookings.filter((b) => (b.status || '').toUpperCase() === 'PENDING').length;
    const totalSpent = bookings.reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0);
    return { totalBookings, upcoming, pending, totalSpent };
  }, [bookings]);

  const visibleBookings = useMemo(() => {
    let rows = [...bookings];

    if (statusFilter === 'UPCOMING') {
      rows = rows.filter((b) => ['PENDING', 'CONFIRMED'].includes((b.status || '').toUpperCase()));
    } else if (statusFilter === 'COMPLETED') {
      rows = rows.filter((b) => (b.status || '').toUpperCase() === 'COMPLETED');
    } else if (statusFilter === 'CANCELLED') {
      rows = rows.filter((b) => (b.status || '').toUpperCase() === 'CANCELLED');
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      rows = rows.filter((b) => {
        const route = `${b.route?.origin || ''} ${b.route?.destination || ''}`.toLowerCase();
        const operator = `${b.route?.operator?.companyName || ''}`.toLowerCase();
        const bookingId = `${b.id || ''}`.toLowerCase();
        return route.includes(q) || operator.includes(q) || bookingId.includes(q);
      });
    }

    return rows;
  }, [bookings, searchTerm, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(visibleBookings.length / PAGE_SIZE));

  const pagedBookings = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return visibleBookings.slice(start, start + PAGE_SIZE);
  }, [visibleBookings, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Sign In Required</h2>
            <p className="text-gray-600 mb-6">Please sign in to view your bookings</p>
            <div className="space-x-4">
              <Link href="/login" className="btn-primary">
                Sign In
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
    <Section variant="gray" className="min-h-screen py-0">
      <Header />
      <Container className="max-w-6xl px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-1.5">
            <Heading as="h3" className="text-gray-900">My Bookings</Heading>
            <Link href="/search">
              <Button className="h-9 bg-[#00a56a] hover:bg-[#008f5c] text-white rounded-lg px-3.5 text-xs font-semibold">
                <Search className="h-3.5 w-3.5 mr-1.5" />
                Search New Route
              </Button>
            </Link>
          </div>
          <p className="text-[#7a8eab] text-sm">Manage your bus tickets and travel history</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="text-red-800">{error}</div>
          </div>
        )}

        {/* Summary + Search */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3.5 mb-4.5">
          <Card className="border border-[#e7eef8] rounded-xl shadow-sm">
            <CardContent className="py-3.5">
              <p className="text-[10px] uppercase font-semibold tracking-wide text-[#8ca4c4]">Total Bookings</p>
              <p className="text-[2rem] leading-none font-black text-[#1d3557] mt-1.5">{metrics.totalBookings}</p>
              <p className="text-xs text-[#8ca4c4]">All time</p>
            </CardContent>
          </Card>
          <Card className="border border-[#e7eef8] rounded-xl shadow-sm">
            <CardContent className="py-3.5">
              <p className="text-[10px] uppercase font-semibold tracking-wide text-[#8ca4c4]">Upcoming</p>
              <p className="text-[2rem] leading-none font-black text-[#00a878] mt-1.5">{metrics.upcoming}</p>
              <p className="text-xs text-[#8ca4c4]">Next trip planned</p>
            </CardContent>
          </Card>
          <Card className="border border-[#e7eef8] rounded-xl shadow-sm">
            <CardContent className="py-3.5">
              <p className="text-[10px] uppercase font-semibold tracking-wide text-[#8ca4c4]">Pending Payment</p>
              <p className="text-[2rem] leading-none font-black text-[#f59e0b] mt-1.5">{metrics.pending}</p>
              <p className="text-xs text-[#8ca4c4]">Action required</p>
            </CardContent>
          </Card>
          <Card className="border border-[#e7eef8] rounded-xl shadow-sm">
            <CardContent className="py-3.5">
              <p className="text-[10px] uppercase font-semibold tracking-wide text-[#8ca4c4]">Total Spent</p>
              <p className="text-[2rem] leading-none font-black text-[#7c3aed] mt-1.5">{Math.round(metrics.totalSpent / 1000)}K</p>
              <p className="text-xs text-[#8ca4c4]">UGX lifetime</p>
            </CardContent>
          </Card>
        </div>

        <div className="bg-white border border-[#e7eef8] rounded-xl p-2.5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2.5 mb-3.5">
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'ALL', label: 'All' },
              { key: 'UPCOMING', label: 'Upcoming' },
              { key: 'COMPLETED', label: 'Completed' },
              { key: 'CANCELLED', label: 'Cancelled' },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setStatusFilter(tab.key as 'ALL' | 'UPCOMING' | 'COMPLETED' | 'CANCELLED')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition-colors ${
                  statusFilter === tab.key
                    ? 'bg-[#214c86] text-white border-[#214c86] shadow-sm'
                    : 'bg-[#f8fbff] text-[#4f6585] border-[#d8e3f1] hover:bg-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="relative lg:w-80">
            <Search className="h-3.5 w-3.5 text-[#9ab0cd] absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search bookings..."
              className="w-full h-8.5 rounded-md border border-[#d8e3f1] bg-white pl-8 pr-3 text-xs text-[#214c86] placeholder:text-[#9ab0cd] focus:outline-none focus:ring-2 focus:ring-[#d9f6ee] focus:border-[#53c6a4]"
            />
          </div>
        </div>

        {/* Bookings Table */}
        {visibleBookings.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Matching Bookings</h3>
              <p className="text-gray-600 mb-6">Try changing your filter or search query.</p>
              <Link href="/search" className="btn-primary">
                Search Routes
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="bg-white border border-[#e7eef8] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-sm">
                <thead className="bg-[#edf3fb] text-[#87a0bf]">
                  <tr>
                    <th className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wide font-semibold">Booking ID</th>
                    <th className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wide font-semibold">Route</th>
                    <th className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wide font-semibold">Operator</th>
                    <th className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wide font-semibold">Date</th>
                    <th className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wide font-semibold">Amount</th>
                    <th className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wide font-semibold">Status</th>
                    <th className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wide font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedBookings.map((booking) => {
                    const canTransfer = booking.status === 'CONFIRMED' || booking.status === 'PENDING';
                    const statusTone = getStatusChipMeta(booking);
                    const bookingCode = `#${String(booking.id || '').slice(-8).toUpperCase()}`;

                    return (
                      <tr
                        key={booking.id}
                        className={`border-t border-[#eef3fa] hover:bg-[#f9fbff] align-top ${
                          getDisplayStatus(booking).toUpperCase().includes('PENDING') ? 'bg-[#fffdf7]' : ''
                        }`}
                      >
                        <td className="px-4 py-3.5">
                          <div className="font-semibold text-[#214c86] text-xs">{bookingCode}</div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="font-semibold text-[#20354f] text-sm flex items-center">
                            <MapPin className="h-3.5 w-3.5 mr-1.5 text-[#95abc7]" />
                            {booking.route?.origin} → {booking.route?.destination}
                          </div>
                          <div className="text-xs text-[#96abc7] mt-1">
                            Seat {booking.seatNumber} • {booking.route?.departureTime || 'TBD'}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-sm text-[#314a67]">
                          <div className="flex items-center gap-2">
                            <OperatorLogoBadge operator={booking.route?.operator} size="sm" />
                            <span>{booking.route?.operator?.companyName || 'TransConnect Partner'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-sm text-[#314a67] whitespace-nowrap">
                          {new Date(booking.travelDate).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="px-4 py-3.5 text-sm font-bold text-[#0b7a5c] whitespace-nowrap">
                          UGX {Number(booking.totalAmount || 0).toLocaleString()}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusTone.chip}`}>
                            <span className={`h-1.5 w-1.5 rounded-full mr-1.5 ${statusTone.dot}`} />
                            {getDisplayStatus(booking)}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex flex-wrap gap-1.5">
                            <Link href={`/bookings/${booking.id}`}>
                              <Button size="sm" className="h-7 rounded-md bg-[#244977] hover:bg-[#1b3c67] text-white px-2.5 text-[11px]">
                                View Ticket
                              </Button>
                            </Link>

                            {canPayBooking(booking) && (
                              <Button
                                onClick={() => handlePayNow(booking)}
                                size="sm"
                                className="h-7 rounded-md bg-[#f59e0b] hover:bg-[#d48806] text-white px-2.5 text-[11px]"
                              >
                                Pay Now
                              </Button>
                            )}

                            {booking.status === 'PENDING' && booking.payment?.id && !isCashBooking(booking) && (
                              <Button
                                onClick={() => handleCheckStatus(booking)}
                                disabled={checkingStatusId === booking.id}
                                variant="outline"
                                size="sm"
                                className="h-7 rounded-md border-[#b8cbdf] text-[#3e5f83] hover:bg-[#f1f6fc] px-2.5 text-[11px]"
                              >
                                {checkingStatusId === booking.id ? 'Checking...' : 'Check Status'}
                              </Button>
                            )}

                            {canTransfer && (
                              <Link href={`/transfers/request?bookingId=${booking.id}`}>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 rounded-md border-[#d5c6f9] text-[#7c3aed] hover:bg-[#f7f2ff] px-2.5 text-[11px]"
                                >
                                  <ArrowLeftRight className="h-3.5 w-3.5 mr-1" />
                                  Transfer
                                </Button>
                              </Link>
                            )}

                            {canCancelBooking(booking) && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleCancelBooking(booking.id)}
                                disabled={cancellingId === booking.id}
                                className="h-7 rounded-md border-[#f6c6cc] text-[#d94858] hover:bg-[#fff1f2] px-2.5 text-[11px]"
                              >
                                <X className="h-3.5 w-3.5 mr-1" />
                                {cancellingId === booking.id ? 'Cancelling...' : 'Cancel'}
                              </Button>
                            )}
                          </div>

                          {(booking.status === 'PENDING' && isCashBooking(booking) && !isBookingExpired(booking)) && (
                            <p className="text-[11px] text-teal-700 mt-2">
                              Awaiting cash payment until {CASH_EXPIRY_GRACE_HOURS} hours after departure.
                            </p>
                          )}
                          {isBookingExpired(booking) && (
                            <p className="text-[11px] text-gray-500 mt-2">
                              Booking expired after departure without payment.
                            </p>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-2.5 border-t border-[#eef3fa] bg-[#fcfdff]">
              <p className="text-xs text-[#8ca4c4]">
                Showing {pagedBookings.length} of {visibleBookings.length} bookings
              </p>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="h-7 px-2.5 border-[#d8e3f1] text-[#4f6585] text-xs"
                >
                  <ChevronLeft className="h-3.5 w-3.5 mr-1" />
                  Prev
                </Button>

                <span className="inline-flex items-center justify-center h-7 min-w-7 px-2 rounded-md bg-[#214c86] text-white text-xs font-semibold">
                  {currentPage}
                </span>

                <span className="inline-flex items-center justify-center h-7 min-w-7 px-2 rounded-md border border-[#d8e3f1] text-[#4f6585] text-xs font-semibold">
                  {totalPages}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="h-7 px-2.5 border-[#d8e3f1] text-[#4f6585] text-xs"
                >
                  Next
                  <ChevronRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        )}

      {/* Confirmation Dialog */}
      {confirmDialog && (
        <ConfirmationDialog
          isOpen={confirmDialog.isOpen}
          onClose={() => setConfirmDialog(null)}
          onConfirm={confirmDialog.onConfirm}
          title={confirmDialog.title}
          message={confirmDialog.message}
          type={confirmDialog.type}
          confirmText={confirmDialog.type === 'danger' ? 'Cancel Booking' : 'Confirm'}
          loading={cancellingId !== null || modifyingId !== null}
        />
      )}
      </Container>
      <PortalFooter slim />
    </Section>
  );
}