'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

type Status = 'loading' | 'completed' | 'pending' | 'failed' | 'error';

interface PaymentStatusResponse {
  status: string;
  booking?: {
    id: string;
    seatNumber?: string;
    qrCode?: string;
    route?: { origin: string; destination: string; departureTime: string };
  };
}

function PaymentCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const paymentId = searchParams.get('paymentId');
  const ref = searchParams.get('ref'); // fallback
  const lookupId = paymentId || ref;
  const [status, setStatus] = useState<Status>('loading');
  const [data, setData] = useState<PaymentStatusResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const pollCount = useRef(0);
  const maxPolls = 20; // 20 × 3s = 60s max

  useEffect(() => {
    if (!lookupId) {
      setStatus('error');
      setErrorMsg('No payment reference found in URL.');
      return;
    }

    const poll = async () => {
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_URL || '/api';
        const res = await fetch(`${apiBase}/payments/${encodeURIComponent(lookupId)}/status`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token') ?? ''}` },
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const json: PaymentStatusResponse = await res.json();
        setData(json);

        if (json.status === 'COMPLETED') {
          setStatus('completed');
        } else if (json.status === 'FAILED' || json.status === 'CANCELLED') {
          setStatus('failed');
        } else {
          // Still PENDING — keep polling
          pollCount.current += 1;
          if (pollCount.current >= maxPolls) {
            setStatus('pending'); // timeout — let user know it's still processing
          } else {
            setTimeout(poll, 3000);
          }
        }
      } catch (err) {
        setStatus('error');
        setErrorMsg(err instanceof Error ? err.message : 'Could not reach server.');
      }
    };

    poll();
  }, [ref]);

  // ── Completed ───────────────────────────────────────────────────────────
  if (status === 'completed' && data) {
    return (
      <main className="min-h-screen bg-green-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Payment Successful!</h1>
          <p className="text-gray-500 mb-6">Your ticket has been confirmed.</p>

          {data.booking?.qrCode && (
            <div className="mb-6">
              <img
                src={data.booking.qrCode}
                alt="Ticket QR Code"
                className="mx-auto w-48 h-48 border rounded-lg"
              />
              <p className="text-sm text-gray-500 mt-2">Show this QR code to the conductor</p>
            </div>
          )}

          {data.booking?.route && (
            <div className="bg-gray-50 rounded-xl p-4 text-left mb-6">
              <p className="text-sm text-gray-500">Route</p>
              <p className="font-semibold text-gray-900">
                {data.booking.route.origin} → {data.booking.route.destination}
              </p>
              {data.booking.seatNumber && (
                <p className="text-sm text-gray-600 mt-1">Seat: {data.booking.seatNumber}</p>
              )}
            </div>
          )}

          <div className="flex flex-col gap-3">
            {data.booking?.id && (
              <Link
                href={`/bookings/${data.booking.id}`}
                className="bg-blue-600 text-white rounded-xl py-3 font-semibold hover:bg-blue-700 transition"
              >
                View Ticket
              </Link>
            )}
            <Link href="/bookings" className="text-blue-600 hover:underline text-sm">
              My Bookings
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // ── Failed ──────────────────────────────────────────────────────────────
  if (status === 'failed') {
    return (
      <main className="min-h-screen bg-red-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Payment Failed</h1>
          <p className="text-gray-500 mb-6">Your payment could not be processed. No charge was made.</p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => router.back()}
              className="bg-blue-600 text-white rounded-xl py-3 font-semibold hover:bg-blue-700 transition"
            >
              Try Again
            </button>
            <Link href="/" className="text-gray-500 hover:underline text-sm">
              Back to Home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // ── Still pending after max polls ────────────────────────────────────────
  if (status === 'pending') {
    return (
      <main className="min-h-screen bg-yellow-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Payment Processing</h1>
          <p className="text-gray-500 mb-6">
            Your payment is still being confirmed. Check <strong>My Bookings</strong> in a few minutes — your ticket will appear once confirmed.
          </p>
          <Link href="/bookings" className="bg-blue-600 text-white rounded-xl py-3 px-6 font-semibold hover:bg-blue-700 transition">
            My Bookings
          </Link>
        </div>
      </main>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (status === 'error') {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <h1 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h1>
          <p className="text-gray-500 mb-6">{errorMsg || 'Unable to verify payment status.'}</p>
          <Link href="/bookings" className="bg-blue-600 text-white rounded-xl py-3 px-6 font-semibold hover:bg-blue-700 transition">
            Check My Bookings
          </Link>
        </div>
      </main>
    );
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Confirming your payment…</h1>
        <p className="text-gray-500">Please wait while we verify your payment with PesaPal.</p>
        <div className="mt-4 flex justify-center gap-1">
          <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </main>
  );
}

export default function PaymentCallbackPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></main>}>
      <PaymentCallbackContent />
    </Suspense>
  );
}
