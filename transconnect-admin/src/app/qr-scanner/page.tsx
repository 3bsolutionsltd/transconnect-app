'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

export default function QRScannerPage() {
  const { user } = useAuth();
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [manualCode, setManualCode] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      setScanning(true);
      setError('');
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' } // Use back camera on mobile
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err: any) {
      setError('Camera access denied or not available');
      setScanning(false);
      console.error('Camera error:', err);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setScanning(false);
  };

  const captureAndScan = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    // Set canvas size to video size
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0);

    // Convert canvas to blob and process
    canvas.toBlob(async (blob) => {
      if (!blob) return;

      // For now, we'll use manual input since QR scanning requires additional libraries
      // In a full implementation, you'd use libraries like jsQR or zxing-js
      toast.info('QR scanning requires manual input for now');
    });
  };

  const validateQRCode = async (qrData: string) => {
    try {
      setError('');
      
      const response = await api.post('/qr/validate', {
        qrData: qrData,
        scannedBy: user?.firstName + ' ' + user?.lastName,
        location: 'Bus Terminal' // You could get this from geolocation
      });

      setResult(response.data);
      
      if (response.data.valid) {
        toast.success(response.data.alreadyScanned ? 'Ticket already scanned' : 'Valid ticket!');
      } else {
        toast.error(response.data.error || 'Invalid ticket');
      }
      
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to validate QR code');
      toast.error('Validation failed');
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
          <p className="text-gray-600">Scan or validate passenger tickets</p>
        </div>

        {/* Camera Scanner */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Camera className="h-5 w-5 mr-2" />
              Camera Scanner
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!scanning ? (
              <div className="text-center">
                <Button onClick={startCamera} className="mb-4">
                  <Camera className="h-4 w-4 mr-2" />
                  Start Camera
                </Button>
                <p className="text-sm text-gray-600">
                  Click to start camera and scan QR codes
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative">
                  <video
                    ref={videoRef}
                    className="w-full max-w-md mx-auto rounded-lg"
                    autoPlay
                    playsInline
                    muted
                  />
                  <canvas ref={canvasRef} className="hidden" />
                </div>
                <div className="flex justify-center space-x-4">
                  <Button onClick={captureAndScan} variant="outline">
                    Capture & Scan
                  </Button>
                  <Button onClick={stopCamera} variant="outline">
                    Stop Camera
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Manual Input */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Manual QR Code Input</CardTitle>
          </CardHeader>
          <CardContent>
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
              <Button type="submit" disabled={!manualCode.trim()}>
                Validate QR Code
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Results */}
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center text-red-700">
                <XCircle className="h-5 w-5 mr-2" />
                <span>{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {result && (
          <Card className={`mb-6 ${result.valid ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
            <CardHeader>
              <CardTitle className={`flex items-center ${result.valid ? 'text-green-700' : 'text-red-700'}`}>
                {result.valid ? <CheckCircle className="h-5 w-5 mr-2" /> : <XCircle className="h-5 w-5 mr-2" />}
                {result.valid ? 'Valid Ticket' : 'Invalid Ticket'}
                {result.alreadyScanned && (
                  <span className="ml-2 text-sm bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                    Already Scanned
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
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
                <Button onClick={resetScanner} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Scan Another Ticket
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Instructions</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-600 space-y-2">
            <div>• Use the camera to scan QR codes from passenger phones</div>
            <div>• Alternatively, manually input QR code data if scanning is not available</div>
            <div>• Valid tickets will show passenger and journey details</div>
            <div>• Already scanned tickets will be marked but details are still shown</div>
            <div>• Contact support if you encounter invalid tickets</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}