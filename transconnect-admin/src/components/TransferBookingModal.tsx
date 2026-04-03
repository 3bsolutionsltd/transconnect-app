import React, { useState, useEffect } from 'react';
import { X, Calendar, MapPin, AlertCircle, CheckCircle } from 'lucide-react';

interface TransferBookingModalProps {
  booking: any;
  onClose: () => void;
  onSuccess: () => void;
}

const TransferBookingModal: React.FC<TransferBookingModalProps> = ({ booking, onClose, onSuccess }) => {
  const [routes, setRoutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    targetRouteId: '',
    targetTravelDate: '',
    reason: 'SCHEDULE_CONFLICT',
    reasonDetails: '',
    autoApprove: true, // Admin can auto-approve
  });

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  // Load available routes
  useEffect(() => {
    const loadRoutes = async () => {
      try {
        const token = localStorage.getItem('admin_token');
        const response = await fetch(`${API_BASE_URL}/routes`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setRoutes(data.routes || []);
        }
      } catch (error) {
        console.error('Error loading routes:', error);
        setRoutes([]);
      }
    };

    loadRoutes();
  }, [API_BASE_URL]);

  const reasons = [
    { value: 'SCHEDULE_CONFLICT', label: 'Schedule Conflict' },
    { value: 'EMERGENCY', label: 'Emergency' },
    { value: 'MISSED_BUS', label: 'Missed Bus' },
    { value: 'PERSONAL_REASONS', label: 'Personal Reasons' },
    { value: 'OTHER', label: 'Other' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${API_BASE_URL}/manager/transfers/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId: booking.id,
          ...formData,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1500);
      } else {
        setError(data.message || 'Failed to create transfer');
      }
    } catch (error) {
      setError('Network error. Please try again.');
      console.error('Transfer creation error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Transfer Booking</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {success ? (
          <div className="p-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Transfer {formData.autoApprove ? 'Completed' : 'Requested'} Successfully!
            </h3>
            <p className="text-gray-600">
              {formData.autoApprove
                ? 'The booking has been transferred immediately.'
                : 'The transfer request has been created and is pending approval.'}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Current Booking Info */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Current Booking</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-500">Passenger:</span>
                  <p className="font-medium">{booking.user?.firstName} {booking.user?.lastName}</p>
                </div>
                <div>
                  <span className="text-gray-500">Route:</span>
                  <p className="font-medium">{booking.route?.origin} → {booking.route?.destination}</p>
                </div>
                <div>
                  <span className="text-gray-500">Travel Date:</span>
                  <p className="font-medium">{new Date(booking.travelDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <span className="text-gray-500">Seat:</span>
                  <p className="font-medium">{booking.seatNumber}</p>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
                <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* New Route Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="inline h-4 w-4 mr-1" />
                Transfer to Route (Optional - leave unchanged for date-only transfer)
              </label>
              <select
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                value={formData.targetRouteId}
                onChange={(e) => handleChange('targetRouteId', e.target.value)}
              >
                <option value="">Keep current route ({booking.route?.origin} → {booking.route?.destination})</option>
                {routes.map((route) => (
                  <option key={route.id} value={route.id}>
                    {route.origin} → {route.destination} (UGX {route.price?.toLocaleString()})
                  </option>
                ))}
              </select>
            </div>

            {/* New Date Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline h-4 w-4 mr-1" />
                New Travel Date (Optional - leave unchanged for route-only transfer)
              </label>
              <input
                type="date"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                value={formData.targetTravelDate}
                onChange={(e) => handleChange('targetTravelDate', e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            {/* Reason Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Transfer Reason *
              </label>
              <select
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                value={formData.reason}
                onChange={(e) => handleChange('reason', e.target.value)}
                required
              >
                {reasons.map((reason) => (
                  <option key={reason.value} value={reason.value}>
                    {reason.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Reason Details */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Details
              </label>
              <textarea
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                rows={3}
                placeholder="Enter any additional notes about this transfer..."
                value={formData.reasonDetails}
                onChange={(e) => handleChange('reasonDetails', e.target.value)}
              />
            </div>

            {/* Auto-Approve Toggle */}
            <div className="flex items-center space-x-3 bg-blue-50 p-4 rounded-lg">
              <input
                type="checkbox"
                id="autoApprove"
                checked={formData.autoApprove}
                onChange={(e) => handleChange('autoApprove', e.target.checked)}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <label htmlFor="autoApprove" className="text-sm text-gray-700">
                <span className="font-medium">Auto-Approve & Execute Immediately</span>
                <p className="text-xs text-gray-500 mt-1">
                  If checked, the transfer will be executed immediately without requiring additional approval.
                </p>
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                disabled={loading || (!formData.targetRouteId && !formData.targetTravelDate)}
              >
                {loading ? 'Processing...' : formData.autoApprove ? 'Execute Transfer' : 'Create Transfer Request'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default TransferBookingModal;
