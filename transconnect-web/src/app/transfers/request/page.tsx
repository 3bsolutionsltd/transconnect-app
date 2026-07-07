'use client';
export const dynamic = 'force-dynamic';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Bus, Calendar, Clock, ArrowRight, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { transferApi, getMyBookings } from '@/lib/api';
import Header from '@/components/Header';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const REASON_OPTIONS = [
  { value: 'SCHEDULE_CONFLICT', label: 'Schedule Conflict' },
  { value: 'EMERGENCY',         label: 'Emergency' },
  { value: 'PERSONAL_PREFERENCE', label: 'Personal Preference' },
  { value: 'PRICE_DIFFERENCE',  label: 'Price Difference' },
  { value: 'OTHER',             label: 'Other' },
] as const;

type TransferReason = typeof REASON_OPTIONS[number]['value'];

export default function TransferRequestPage() {
  return <TransferRequestContent />;
}

function TransferRequestContent() {
  const router = useRouter();
  // Use window.location.search to read params client-side only (avoids SSR pre-render issue)
  const [bookingId, setBookingId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setBookingId(params.get('bookingId'));
  }, []);
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [booking, setBooking] = useState<any>(null);
  const [loadingBooking, setLoadingBooking] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [targetDate, setTargetDate] = useState('');
  const [reason, setReason] = useState<TransferReason>('SCHEDULE_CONFLICT');
  const [reasonDetails, setReasonDetails] = useState('');
  const [dateError, setDateError] = useState('');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading]);

  useEffect(() => {
    if (!bookingId || !isAuthenticated) return;
    const token = localStorage.getItem('token');
    getMyBookings(token)
      .then((bookings) => {
        const found = bookings.find((b: any) => b.id === bookingId);
        setBooking(found || null);
      })
      .catch(() => setBooking(null))
      .finally(() => setLoadingBooking(false));
  }, [bookingId, isAuthenticated]);

  const validateDate = (value: string) => {
    setTargetDate(value);
    if (!value) { setDateError(''); return; }
    const parsed = new Date(value);
    if (isNaN(parsed.getTime())) {
      setDateError('Enter a valid date');
    } else if (parsed < new Date()) {
      setDateError('Date must be in the future');
    } else {
      setDateError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (dateError || !booking) return;
    setSubmitting(true);
    try {
      await transferApi.request(booking.id, {
        targetTravelDate: targetDate || undefined,
        reason,
        reasonDetails: reasonDetails.trim() || undefined,
      });
      toast.success('Transfer request submitted successfully!');
      router.push('/transfers');
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.response?.data?.message || 'Failed to submit transfer request.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loadingBooking) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-2xl mx-auto px-4 py-12 text-center">
          <p className="text-gray-500 mb-4">Booking not found or not eligible for transfer.</p>
          <Link href="/bookings">
            <Button variant="outline">Back to Bookings</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Back */}
        <Link href="/bookings" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-6">
          <ArrowLeft size={16} /> Back to Bookings
        </Link>

        <h1 className="text-2xl font-bold text-gray-900 mb-6">Request Booking Transfer</h1>

        {/* Current Booking Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Current Booking</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-gray-800 font-medium">
              <Bus size={18} className="text-gray-400" />
              <span>{booking.route?.origin || booking.boardingStop}</span>
              <ArrowRight size={16} className="text-gray-400" />
              <span>{booking.route?.destination || booking.alightingStop}</span>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <Calendar size={15} />
                {format(new Date(booking.travelDate), 'EEE, MMM dd yyyy')}
              </span>
              {booking.route?.departureTime && (
                <span className="flex items-center gap-1">
                  <Clock size={15} />
                  {booking.route.departureTime}
                </span>
              )}
            </div>
            <div className="text-xs text-gray-400">Booking #{booking.id.slice(0, 8)}</div>
          </CardContent>
        </Card>

        {/* Transfer Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Date */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Preferred New Date <span className="font-normal text-gray-400">(optional)</span>
            </label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => validateDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
            {dateError && <p className="text-xs text-red-500 mt-1">{dateError}</p>}
            <p className="text-xs text-gray-400 mt-1">Leave blank to let the operator suggest an alternative.</p>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Reason for Transfer</label>
            <div className="space-y-2">
              {REASON_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    reason === opt.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="reason"
                    value={opt.value}
                    checked={reason === opt.value}
                    onChange={() => setReason(opt.value)}
                    className="text-blue-600"
                  />
                  <span className={`text-sm ${reason === opt.value ? 'text-blue-700 font-medium' : 'text-gray-700'}`}>
                    {opt.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Details */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Additional Details <span className="font-normal text-gray-400">(optional)</span>
            </label>
            <textarea
              value={reasonDetails}
              onChange={(e) => setReasonDetails(e.target.value)}
              rows={3}
              placeholder="Provide any extra information..."
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
            />
          </div>

          {/* Info Banner */}
          <div className="flex gap-3 bg-blue-50 border border-blue-100 rounded-lg p-4">
            <Info size={18} className="text-blue-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-700">
              Transfer requests are reviewed by our team. You&apos;ll be notified once your request is approved or rejected.
            </p>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            disabled={submitting || !!dateError}
            className="w-full py-3 text-base font-semibold"
          >
            {submitting ? 'Submitting...' : 'Submit Transfer Request'}
          </Button>
        </form>
      </div>
    </div>
  );
}
