import React, { useState } from 'react';
import { Camera, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.tsx';
import { api } from '../lib/api.ts';

export default function QRScannerPage() {
  const { user } = useAuth();
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [manualCode, setManualCode] = useState('');

  const validateQRCode = async (qrData: string) => {
    try {
      setError('');
      
      const response = await api.post('/qr/validate', {
        qrData: qrData,
        scannedBy: user?.firstName + ' ' + user?.lastName,
        location: 'Bus Terminal'
      });

      setResult(response.data);
      
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to validate QR code');
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      validateQRCode(manualCode.trim());
    }
  };

  const resetScanner = () => {
    setResult(null);
    setError('');
    setManualCode('');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">QR Ticket Scanner</h1>
          <p className="text-gray-600">Validate passenger tickets</p>
        </div>

        {/* Manual Input */}
        <div className="bg-white rounded-lg shadow border mb-6">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Camera className="h-5 w-5 mr-2" />
              QR Code Validation
            </h2>
          </div>
          <div className="p-6">
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  QR Code Data
                </label>
                <textarea
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="Paste QR code data here..."
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  rows={4}
                />
              </div>
              <button 
                type="submit" 
                disabled={!manualCode.trim()}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
              >
                Validate QR Code
              </button>
            </form>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="rounded-lg shadow border mb-6 border-red-200 bg-red-50">
            <div className="p-6">
              <div className="flex items-center text-red-700">
                <XCircle className="h-5 w-5 mr-2" />
                <span>{error}</span>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className={`rounded-lg shadow border mb-6 ${result.valid ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
            <div className="p-6 border-b border-gray-200">
              <h2 className={`text-lg font-semibold flex items-center ${result.valid ? 'text-green-700' : 'text-red-700'}`}>
                {result.valid ? <CheckCircle className="h-5 w-5 mr-2" /> : <XCircle className="h-5 w-5 mr-2" />}
                {result.valid ? 'Valid Ticket' : 'Invalid Ticket'}
                {result.alreadyScanned && (
                  <span className="ml-2 text-sm bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                    Already Scanned
                  </span>
                )}
              </h2>
            </div>
            <div className="p-6">
              {result.valid && result.bookingDetails && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">Passenger</div>
                    <div className="font-semibold">{result.bookingDetails.passengerName}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Route</div>
                    <div className="font-semibold">{result.bookingDetails.route}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Seat</div>
                    <div className="font-semibold">{result.bookingDetails.seatNumber}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Travel Date</div>
                    <div className="font-semibold">{new Date(result.bookingDetails.travelDate).toLocaleDateString()}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Bus</div>
                    <div className="font-semibold">{result.bookingDetails.busPlate}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Operator</div>
                    <div className="font-semibold">{result.bookingDetails.operator}</div>
                  </div>
                </div>
              )}

              {result.alreadyScanned && result.scanDetails && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <div className="text-sm text-yellow-800">
                    Previously scanned by: <strong>{result.scanDetails.scannedBy}</strong>
                    <br />
                    Scan time: {new Date(result.scanDetails.scannedAt).toLocaleString()}
                  </div>
                </div>
              )}

              {!result.valid && (
                <div className="text-red-700">
                  {result.error || 'Invalid or expired ticket'}
                </div>
              )}

              <div className="mt-4">
                <button 
                  onClick={resetScanner}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <RefreshCw className="h-4 w-4 mr-2 inline" />
                  Scan Another Ticket
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Test Data */}
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">Test QR Code Data</h3>
          <p className="text-blue-800 text-sm mb-3">Copy and paste this test data to try the scanner:</p>
          <div className="bg-white p-3 rounded border text-sm font-mono break-all">
            {`{"bookingId":"demo_12345","passengerName":"John Doe","route":"Kampala → Jinja","seatNumber":"A12","travelDate":"2025-11-07T08:00:00.000Z","busPlate":"UAH-001A","operator":"Swift Safaris","timestamp":"2025-11-06T12:00:00.000Z","signature":"demo_signature"}`}
          </div>
          <p className="text-blue-700 text-xs mt-2">
            Expected result: ❌ Invalid (Booking not found) - this confirms the validation system is working!
          </p>
        </div>

        {/* Instructions */}
        <div className="bg-white rounded-lg shadow border mt-6">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-900">Instructions</h2>
          </div>
          <div className="p-6 text-sm text-gray-600 space-y-2">
            <div>• Paste QR code data in the text area above</div>
            <div>• Valid tickets will show passenger and journey details</div>
            <div>• Already scanned tickets will be marked but details are still shown</div>
            <div>• Contact support if you encounter invalid tickets</div>
          </div>
        </div>
      </div>
    </div>
  );
}