import React, { useState, useEffect, useCallback } from 'react';
import {
  Search, Filter, Download, RefreshCw, CheckCircle,
  Calendar, MapPin, ChevronLeft, ChevronRight,
  DollarSign, Clock, AlertCircle
} from 'lucide-react';

const API_BASE_URL = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '') + '/api';

const STATUS_COLORS: Record<string, string> = {
  CONFIRMED: 'bg-green-100 text-green-700 border-green-200',
  PENDING:   'bg-yellow-100 text-yellow-700 border-yellow-200',
  CANCELLED: 'bg-red-100 text-red-700 border-red-200',
  COMPLETED: 'bg-blue-100 text-blue-700 border-blue-200',
};

const PAYMENT_COLORS: Record<string, string> = {
  COMPLETED: 'bg-green-100 text-green-700',
  PENDING:   'bg-yellow-100 text-yellow-700',
  FAILED:    'bg-red-100 text-red-700',
};

export default function MasterBookings() {
  const token = localStorage.getItem('admin_token');
  const currentUser = JSON.parse(localStorage.getItem('admin_user') || 'null');

  // Data
  const [bookings, setBookings]   = useState<any[]>([]);
  const [stats, setStats]         = useState<any>({});
  const [operators, setOperators] = useState<any[]>([]);
  const [agents, setAgents]       = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');

  // Filters
  const [search, setSearch]             = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [operatorFilter, setOperatorFilter] = useState('');
  const [dateFrom, setDateFrom]         = useState('');
  const [dateTo, setDateTo]             = useState('');

  // Pagination
  const [page, setPage]       = useState(1);
  const [pagination, setPagination] = useState<any>({});

  // Action state
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [expandedId, setExpandedId]     = useState<string | null>(null);
  const [assigningId, setAssigningId]   = useState<string | null>(null);
  const [ledgerLoadingId, setLedgerLoadingId] = useState<string | null>(null);
  const [ledgerNotesSavingId, setLedgerNotesSavingId] = useState<string | null>(null);
  const [assignmentDrafts, setAssignmentDrafts] = useState<Record<string, { agentId: string; note: string }>>({});
  const [ledgerNotes, setLedgerNotes] = useState<Record<string, string>>({});
  const [ledgerByBooking, setLedgerByBooking] = useState<Record<string, any[]>>({});

  const fetchBookings = useCallback(async (resetPage = false) => {
    const currentPage = resetPage ? 1 : page;
    if (resetPage) setPage(1);

    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: '50',
        ...(search        && { search }),
        ...(statusFilter  && { status: statusFilter }),
        ...(paymentFilter && { paymentStatus: paymentFilter }),
        ...(operatorFilter && { operatorId: operatorFilter }),
        ...(dateFrom      && { dateFrom }),
        ...(dateTo        && { dateTo }),
      });

      const res = await fetch(`${API_BASE_URL}/bookings/admin/all?${params}`, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setBookings(data.bookings || []);
      setStats(data.stats || {});
      setPagination(data.pagination || {});
    } catch (e: any) {
      setError(e.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, paymentFilter, operatorFilter, dateFrom, dateTo, token]);

  const fetchOperators = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/operators`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const payload = await res.json();
        setOperators(Array.isArray(payload) ? payload : (payload.operators || []));
      }
    } catch {}
  }, [token]);

  const fetchAgents = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/agents/admin/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const payload = await res.json();
        setAgents(payload.agents || []);
      }
    } catch {}
  }, [token]);

  // Intentionally run once on mount; subsequent loads are user-triggered via Apply/Refresh.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchBookings(); fetchOperators(); fetchAgents(); }, []);
  // Intentionally fetch only when page changes to keep filter application explicit.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchBookings(); }, [page]);

  const handleConfirm = async (bookingId: string) => {
    setConfirmingId(bookingId);
    try {
      const res = await fetch(`${API_BASE_URL}/bookings/admin/confirm-payment/${bookingId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error(await res.text());
      fetchBookings();
    } catch (e: any) {
      alert('Failed to confirm: ' + e.message);
    } finally {
      setConfirmingId(null);
    }
  };

  const handleAssignAgent = async (bookingId: string) => {
    const draft = assignmentDrafts[bookingId];
    if (!draft?.agentId) {
      alert('Select an agent first');
      return;
    }

    setAssigningId(bookingId);
    try {
      const res = await fetch(`${API_BASE_URL}/bookings/${bookingId}/assign-agent`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      });
      if (!res.ok) throw new Error(await res.text());
      setAssignmentDrafts(prev => ({ ...prev, [bookingId]: { agentId: '', note: '' } }));
      await fetchBookings();
      await fetchLedger(bookingId);
    } catch (e: any) {
      alert('Failed to assign agent: ' + e.message);
    } finally {
      setAssigningId(null);
    }
  };

  const fetchLedger = async (bookingId: string) => {
    setLedgerLoadingId(bookingId);
    try {
      const res = await fetch(`${API_BASE_URL}/bookings/${bookingId}/ledger`, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error(await res.text());
      const payload = await res.json();
      setLedgerByBooking(prev => ({ ...prev, [bookingId]: payload.entries || [] }));
    } catch (e: any) {
      alert('Failed to load booking ledger: ' + e.message);
    } finally {
      setLedgerLoadingId(current => current === bookingId ? null : current);
    }
  };

  const handleAddLedgerNote = async (bookingId: string) => {
    const note = ledgerNotes[bookingId]?.trim();
    if (!note) {
      alert('Enter a note first');
      return;
    }

    setLedgerNotesSavingId(bookingId);
    try {
      const res = await fetch(`${API_BASE_URL}/bookings/${bookingId}/ledger`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ note }),
      });
      if (!res.ok) throw new Error(await res.text());
      setLedgerNotes(prev => ({ ...prev, [bookingId]: '' }));
      await fetchLedger(bookingId);
    } catch (e: any) {
      alert('Failed to add ledger note: ' + e.message);
    } finally {
      setLedgerNotesSavingId(null);
    }
  };

  const exportCSV = () => {
    const rows = [
      ['ID', 'Passenger', 'Phone', 'Route', 'Date', 'Seat', 'Status', 'Payment', 'Amount', 'Operator'],
      ...bookings.map(b => [
        b.id,
        `${b.user?.firstName} ${b.user?.lastName}`,
        b.user?.phone || '',
        `${b.route?.origin} → ${b.route?.destination}`,
        new Date(b.travelDate).toLocaleDateString(),
        b.seatNumber,
        b.status,
        b.payment?.status || 'NO PAYMENT',
        b.payment?.amount || b.totalAmount,
        b.route?.operator?.companyName || '',
      ]),
    ];
    const csv  = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `bookings-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Operations Bookings</h1>
          <p className="text-sm text-gray-500 mt-1">
            {currentUser?.role === 'OPERATOR_FIELD_OPERATOR'
              ? 'Operator-scoped booking operations'
              : 'All bookings across all operators · operations view'}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => fetchBookings()}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Download className="h-4 w-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Bookings', value: stats.total || 0, icon: Calendar, color: 'text-blue-600 bg-blue-50' },
          { label: 'Confirmed',      value: stats.byStatus?.CONFIRMED || 0, icon: CheckCircle, color: 'text-green-600 bg-green-50' },
          { label: 'Pending',        value: stats.byStatus?.PENDING || 0, icon: Clock, color: 'text-yellow-600 bg-yellow-50' },
          { label: 'Confirmed Revenue (UGX)',  value: `${((stats.totalRevenue || 0) / 1000).toFixed(0)}K`, icon: DollarSign, color: 'text-purple-600 bg-purple-50' },
        ].map(card => (
          <div key={card.label} className="bg-white rounded-xl border p-4 flex items-center gap-3">
            <div className={`p-2 rounded-lg ${card.color}`}>
              <card.icon className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-gray-900">{card.value}</div>
              <div className="text-xs text-gray-500">{card.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <Filter className="h-4 w-4" /> Filters
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="lg:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && fetchBookings(true)}
              placeholder="Search by passenger name, phone, or booking ID"
              className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="text-sm border rounded-lg px-3 py-2">
            <option value="">All Statuses</option>
            {['PENDING','CONFIRMED','CANCELLED','COMPLETED'].map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <select value={paymentFilter} onChange={e => setPaymentFilter(e.target.value)}
            className="text-sm border rounded-lg px-3 py-2">
            <option value="">All Payments</option>
            {['PENDING','COMPLETED','FAILED'].map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <select value={operatorFilter} onChange={e => setOperatorFilter(e.target.value)}
            className="text-sm border rounded-lg px-3 py-2">
            <option value="">All Operators</option>
            {operators.map((op: any) => (
              <option key={op.id} value={op.id}>{op.companyName}</option>
            ))}
          </select>

          <button
            onClick={() => fetchBookings(true)}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Apply
          </button>
        </div>

        <div className="flex gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500">From</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              className="text-sm border rounded-lg px-2 py-1" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500">To</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              className="text-sm border rounded-lg px-2 py-1" />
          </div>
          {(search || statusFilter || paymentFilter || operatorFilter || dateFrom || dateTo) && (
            <button
              onClick={() => {
                setSearch(''); setStatusFilter(''); setPaymentFilter('');
                setOperatorFilter(''); setDateFrom(''); setDateTo('');
                setTimeout(() => fetchBookings(true), 0);
              }}
              className="text-sm text-red-600 hover:underline"
            >
              Clear all filters
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        {error && (
          <div className="p-4 bg-red-50 border-b flex items-center gap-2 text-red-700 text-sm">
            <AlertCircle className="h-4 w-4" /> {error}
          </div>
        )}

        {loading ? (
          <div className="py-16 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3" />
            <p className="text-sm text-gray-500">Loading bookings…</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="py-16 text-center text-gray-500">
            <Calendar className="h-10 w-10 mx-auto mb-3 text-gray-300" />
            <p>No bookings match your filters.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    {['Booking','Passenger','Route','Travel Date','Seat','Status','Payment Method/Status','Amount','Operator','Assignment / Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {bookings.map(booking => (
                    <React.Fragment key={booking.id}>
                      <tr
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => setExpandedId(expandedId === booking.id ? null : booking.id)}
                      >
                        {/* Booking ID */}
                        <td className="px-4 py-3 font-mono text-xs text-gray-500">
                          #{booking.id.slice(-8).toUpperCase()}
                        </td>

                        {/* Passenger */}
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">
                            {booking.user?.firstName} {booking.user?.lastName}
                          </div>
                          <div className="text-xs text-gray-500">{booking.user?.phone}</div>
                        </td>

                        {/* Route */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 text-gray-900">
                            <MapPin className="h-3 w-3 text-blue-500 flex-shrink-0" />
                            <span className="whitespace-nowrap">
                              {booking.route?.origin} → {booking.route?.destination}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500">{booking.route?.departureTime}</div>
                        </td>

                        {/* Date */}
                        <td className="px-4 py-3 whitespace-nowrap text-gray-700">
                          {new Date(booking.travelDate).toLocaleDateString('en-GB', {
                            day: '2-digit', month: 'short', year: 'numeric'
                          })}
                        </td>

                        {/* Seat */}
                        <td className="px-4 py-3 text-center font-medium">{booking.seatNumber}</td>

                        {/* Booking Status */}
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[booking.status] || 'bg-gray-100 text-gray-600'}`}>
                            {booking.status}
                          </span>
                        </td>

                        {/* Payment Status */}
                        <td className="px-4 py-3">
                          {booking.payment ? (
                            <div>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PAYMENT_COLORS[booking.payment.status] || 'bg-gray-100 text-gray-600'}`}>
                                {booking.payment.status}
                              </span>
                              <div className="text-xs text-gray-400 mt-0.5">{booking.payment.method?.replace('_', ' ')}</div>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">No payment</span>
                          )}
                        </td>

                        {/* Amount */}
                        <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">
                          UGX {(booking.payment?.amount || booking.totalAmount || 0).toLocaleString()}
                        </td>

                        {/* Operator */}
                        <td className="px-4 py-3 text-gray-600 text-xs">
                          {booking.route?.operator?.companyName || '—'}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                          <div className="space-y-2">
                            {booking.assignments?.[0] ? (
                              <div className="text-xs text-gray-700">
                                Assigned to <span className="font-medium">{booking.assignments[0].agent?.name}</span>
                              </div>
                            ) : (
                              <div className="text-xs text-gray-400">Not assigned</div>
                            )}
                            <div className="flex items-center gap-2">
                            {booking.status === 'PENDING' && (
                              <button
                                onClick={() => handleConfirm(booking.id)}
                                disabled={confirmingId === booking.id}
                                className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                              >
                                <CheckCircle className="h-3 w-3" />
                                {confirmingId === booking.id ? '…' : 'Confirm Cash'}
                              </button>
                            )}
                            </div>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded row */}
                      {expandedId === booking.id && (
                        <tr className="bg-blue-50">
                          <td colSpan={10} className="px-6 py-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="text-gray-500 block text-xs mb-1">Full Booking ID</span>
                                <span className="font-mono text-xs">{booking.id}</span>
                              </div>
                              <div>
                                <span className="text-gray-500 block text-xs mb-1">Email</span>
                                <span>{booking.user?.email || '—'}</span>
                              </div>
                              <div>
                                <span className="text-gray-500 block text-xs mb-1">Boarding → Alighting</span>
                                <span>{booking.boardingStop || booking.route?.origin} → {booking.alightingStop || booking.route?.destination}</span>
                              </div>
                              <div>
                                <span className="text-gray-500 block text-xs mb-1">Bus Plate</span>
                                <span>{booking.route?.bus?.plateNumber || '—'}</span>
                              </div>
                              {booking.payment && (
                                <div>
                                  <span className="text-gray-500 block text-xs mb-1">Payment Reference</span>
                                  <span className="font-mono text-xs">{booking.payment.reference}</span>
                                </div>
                              )}
                              <div>
                                <span className="text-gray-500 block text-xs mb-1">Booked On</span>
                                <span>{new Date(booking.createdAt).toLocaleString()}</span>
                              </div>
                              <div>
                                <span className="text-gray-500 block text-xs mb-1">Current Assignment</span>
                                <span>{booking.assignments?.[0]?.agent?.name || 'Unassigned'}</span>
                              </div>
                            </div>

                            <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-6">
                              <div className="bg-white rounded-lg border p-4">
                                <h3 className="text-sm font-semibold text-gray-900 mb-3">Assign to Agent / Brand Ambassador</h3>
                                <div className="space-y-3">
                                  <select
                                    value={assignmentDrafts[booking.id]?.agentId || ''}
                                    onChange={(e) => setAssignmentDrafts(prev => ({
                                      ...prev,
                                      [booking.id]: { agentId: e.target.value, note: prev[booking.id]?.note || '' },
                                    }))}
                                    className="w-full px-3 py-2 border rounded-lg text-sm"
                                  >
                                    <option value="">Select agent</option>
                                    {agents.map((agent: any) => (
                                      <option key={agent.id} value={agent.id}>
                                        {agent.name} · {agent.phone}
                                      </option>
                                    ))}
                                  </select>
                                  <textarea
                                    rows={3}
                                    value={assignmentDrafts[booking.id]?.note || ''}
                                    onChange={(e) => setAssignmentDrafts(prev => ({
                                      ...prev,
                                      [booking.id]: { agentId: prev[booking.id]?.agentId || '', note: e.target.value },
                                    }))}
                                    placeholder="Optional assignment note"
                                    className="w-full px-3 py-2 border rounded-lg text-sm"
                                  />
                                  <button
                                    onClick={() => handleAssignAgent(booking.id)}
                                    disabled={assigningId === booking.id}
                                    className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                  >
                                    {assigningId === booking.id ? 'Assigning…' : 'Assign Agent'}
                                  </button>
                                </div>
                              </div>

                              <div className="bg-white rounded-lg border p-4">
                                <div className="flex items-center justify-between mb-3">
                                  <h3 className="text-sm font-semibold text-gray-900">Booking Ledger</h3>
                                  <button
                                    onClick={() => fetchLedger(booking.id)}
                                    className="text-sm text-blue-600 hover:underline"
                                  >
                                    Refresh ledger
                                  </button>
                                </div>
                                <div className="space-y-3">
                                  <textarea
                                    rows={3}
                                    value={ledgerNotes[booking.id] || ''}
                                    onChange={(e) => setLedgerNotes(prev => ({ ...prev, [booking.id]: e.target.value }))}
                                    placeholder="Add follow-up note for this booking"
                                    className="w-full px-3 py-2 border rounded-lg text-sm"
                                  />
                                  <button
                                    onClick={() => handleAddLedgerNote(booking.id)}
                                    disabled={ledgerNotesSavingId === booking.id}
                                    className="px-3 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-black disabled:opacity-50"
                                  >
                                    {ledgerNotesSavingId === booking.id ? 'Saving…' : 'Add Ledger Note'}
                                  </button>

                                  <div className="max-h-56 overflow-y-auto space-y-2">
                                    {ledgerLoadingId === booking.id ? (
                                      <div className="text-sm text-gray-500">Loading ledger…</div>
                                    ) : (ledgerByBooking[booking.id] || []).length > 0 ? (
                                      (ledgerByBooking[booking.id] || []).map((entry: any) => (
                                        <div key={entry.id} className="border rounded-lg p-3 bg-gray-50">
                                          <div className="flex items-center justify-between gap-2">
                                            <span className="text-xs font-semibold text-gray-900">{entry.action.replace(/_/g, ' ')}</span>
                                            <span className="text-xs text-gray-500">{new Date(entry.createdAt).toLocaleString()}</span>
                                          </div>
                                          <div className="text-xs text-gray-500 mt-1">{entry.actorUser ? `${entry.actorUser.firstName} ${entry.actorUser.lastName}` : entry.actorRole}</div>
                                          {entry.note && <div className="text-sm text-gray-700 mt-2">{entry.note}</div>}
                                        </div>
                                      ))
                                    ) : (
                                      <div className="text-sm text-gray-500">No ledger entries yet.</div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="px-4 py-3 border-t flex items-center justify-between text-sm text-gray-600">
                <span>
                  Showing {((pagination.page - 1) * pagination.limit) + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage(p => p - 1)}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded border hover:bg-gray-100 disabled:opacity-40"
                  >
                    <ChevronLeft className="h-5 w-5" />
                    <span>Previous</span>
                  </button>
                  <span>Page {pagination.page} / {pagination.totalPages}</span>
                  <button
                    disabled={page >= pagination.totalPages}
                    onClick={() => setPage(p => p + 1)}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded border hover:bg-gray-100 disabled:opacity-40"
                  >
                    <span>Next</span>
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
