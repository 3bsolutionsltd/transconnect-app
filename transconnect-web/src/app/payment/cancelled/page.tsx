'use client';
export const dynamic = 'force-dynamic';

import { useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

function PaymentCancelledContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const paymentId = searchParams.get('paymentId');
  const ref = searchParams.get('ref');

  useEffect(() => {
    // Directly cancel the payment so the user can retry immediately.
    const id = paymentId || ref;
    if (!id) return;
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) return;
    const apiBase = process.env.NEXT_PUBLIC_API_URL || '/api';
    fetch(`${apiBase}/payments/${encodeURIComponent(id)}/cancel`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {/* ignore — stale-PENDING auto-expires after 15 min anyway */});
  }, [paymentId, ref]);

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856C18.448 19 19 18.105 19 17V7c0-1.105-.552-2-1.082-2H6.082C5.552 5 5 5.895 5 7v10c0 1.105.552 2 1.082 2z" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-1">Payment Cancelled</h1>
        <p className="text-gray-500 mb-6">
          You cancelled the payment. No money was charged. Your booking has not been confirmed.
        </p>

        {ref && (
          <p className="text-xs text-gray-400 mb-6 font-mono break-all">Ref: {ref}</p>
        )}

        <div className="flex flex-col gap-3">
          <button
            onClick={() => router.push('/bookings')}
            className="bg-blue-600 text-white rounded-xl py-3 font-semibold hover:bg-blue-700 transition"
          >
            Try Again (My Bookings)
          </button>
          <Link href="/" className="text-gray-500 hover:underline text-sm">
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function PaymentCancelledPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></main>}>
      <PaymentCancelledContent />
    </Suspense>
  );
}
