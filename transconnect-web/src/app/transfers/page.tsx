'use client';
export const dynamic = 'force-dynamic';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowLeftRight, Clock, CheckCircle2, XCircle, Ban, CheckCheck, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { transferApi } from '@/lib/api';
import Header from '@/components/Header';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; Icon: any }> = {
  PENDING:   { label: 'Pending Review', color: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-200', Icon: Clock },
  APPROVED:  { label: 'Approved',       color: 'text-green-700',  bg: 'bg-green-50 border-green-200',   Icon: CheckCircle2 },
  REJECTED:  { label: 'Rejected',       color: 'text-red-700',    bg: 'bg-red-50 border-red-200',       Icon: XCircle },
  CANCELLED: { label: 'Cancelled',      color: 'text-gray-600',   bg: 'bg-gray-50 border-gray-200',     Icon: Ban },
  COMPLETED: { label: 'Completed',      color: 'text-blue-700',   bg: 'bg-blue-50 border-blue-200',     Icon: CheckCheck },
};

const REASON_LABELS: Record<string, string> = {
  SCHEDULE_CONFLICT: 'Schedule Conflict',
  EMERGENCY: 'Emergency',
  PERSONAL_PREFERENCE: 'Personal Preference',
  PRICE_DIFFERENCE: 'Price Difference',
  OTHER: 'Other',
};

export default function TransfersPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [transfers, setTransfers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/login');
  }, [isAuthenticated, authLoading]);

  useEffect(() => {
    if (!isAuthenticated) return;
    transferApi.getMyRequests()
      .then((data) => setTransfers(data?.transfers || data || []))
      .catch(() => toast.error('Failed to load transfer requests.'))
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  const handleCancel = async (transfer: any) => {
    if (!confirm('Cancel this transfer request?')) return;
    setCancellingId(transfer.id);
    try {
      await transferApi.cancel(transfer.id);
      setTransfers((prev) => prev.map((t) => t.id === transfer.id ? { ...t, status: 'CANCELLED' } : t));
      toast.success('Transfer request cancelled.');
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to cancel request.');
    } finally {
      setCancellingId(null);
    }
  };

  const toggle = (id: string) => setExpandedId((prev) => (prev === id ? null : id));

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link href="/bookings" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-6">
          <ArrowLeft size={16} /> Back to Bookings
        </Link>

        <h1 className="text-2xl font-bold text-gray-900 mb-6">My Transfer Requests</h1>

        {transfers.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center py-16 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <ArrowLeftRight size={32} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No Transfer Requests</h3>
              <p className="text-sm text-gray-400 mb-6">You haven&apos;t requested any booking transfers yet.</p>
              <Link href="/bookings">
                <Button variant="outline">View My Bookings</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {transfers.map((transfer) => {
              const status = STATUS_CONFIG[transfer.status] || STATUS_CONFIG.PENDING;
              const isExpanded = expandedId === transfer.id;
              const StatusIcon = status.Icon;

              return (
                <Card key={transfer.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    {/* Main row */}
                    <button
                      onClick={() => toggle(transfer.id)}
                      className="w-full text-left p-5 flex items-start justify-between gap-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-1 space-y-2">
                        {/* Route */}
                        <div className="flex items-center gap-2 font-semibold text-gray-900">
                          <span>{transfer.booking?.route?.origin || '—'}</span>
                          <ArrowLeft size={14} className="rotate-180 text-gray-400" />
                          <span>{transfer.booking?.route?.destination || '—'}</span>
                        </div>

                        {/* Dates */}
                        <div className="flex items-center gap-3 text-sm text-gray-500">
                          <span>
                            {transfer.booking?.travelDate
                              ? format(new Date(transfer.booking.travelDate), 'MMM dd, yyyy')
                              : '—'}
                          </span>
                          {transfer.targetTravelDate && (
                            <>
                              <span className="text-gray-300">→</span>
                              <span className="text-blue-600 font-medium">
                                {format(new Date(transfer.targetTravelDate), 'MMM dd, yyyy')}
                              </span>
                            </>
                          )}
                        </div>

                        {/* Status badge */}
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${status.bg} ${status.color}`}>
                          <StatusIcon size={12} />
                          {status.label}
                        </span>
                      </div>
                      {isExpanded ? <ChevronUp size={18} className="text-gray-400 mt-1 flex-shrink-0" /> : <ChevronDown size={18} className="text-gray-400 mt-1 flex-shrink-0" />}
                    </button>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="border-t border-gray-100 px-5 py-4 bg-gray-50 space-y-3">
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-gray-400 text-xs mb-0.5">Reason</p>
                            <p className="text-gray-700 font-medium">{REASON_LABELS[transfer.reason] || transfer.reason}</p>
                          </div>
                          <div>
                            <p className="text-gray-400 text-xs mb-0.5">Submitted</p>
                            <p className="text-gray-700 font-medium">
                              {format(new Date(transfer.createdAt), 'MMM dd, yyyy')}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-400 text-xs mb-0.5">Transfer ID</p>
                            <p className="text-gray-500 font-mono text-xs">#{transfer.id.slice(0, 8)}</p>
                          </div>
                        </div>

                        {transfer.reasonDetails && (
                          <div>
                            <p className="text-gray-400 text-xs mb-0.5">Details</p>
                            <p className="text-gray-700 text-sm">{transfer.reasonDetails}</p>
                          </div>
                        )}

                        {transfer.reviewNote && (
                          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                            <p className="text-xs text-blue-500 mb-1 font-medium">Review Note</p>
                            <p className="text-sm text-blue-700">{transfer.reviewNote}</p>
                          </div>
                        )}

                        {transfer.status === 'PENDING' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-red-200 text-red-600 hover:bg-red-50 w-full"
                            onClick={() => handleCancel(transfer)}
                            disabled={cancellingId === transfer.id}
                          >
                            {cancellingId === transfer.id ? 'Cancelling...' : 'Cancel Request'}
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
