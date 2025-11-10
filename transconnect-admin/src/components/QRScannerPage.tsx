import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, CheckCircle, XCircle, RefreshCw, Upload } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import jsQR from 'jsqr';

export default function QRScannerPage() {
  const { user } = useAuth();
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [manualCode, setManualCode] = useState('');
  const [scanning, setScanning] = useState(false);
  const [cameraSupported, setCameraSupported] = useState(false);
  const [scanningInterval, setScanningInterval] = useState<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (scanningInterval) {
      clearInterval(scanningInterval);
      setScanningInterval(null);
    }
    
    setScanning(false);
  }, [scanningInterval]);

  useEffect(() => {
    // Check if camera is supported
    setCameraSupported(
      !!(navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function')
    );
    
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const startCamera = async () => {
    try {
      setScanning(true);
      setError('');
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment', // Use back camera
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        
        // Start continuous QR scanning
        const interval = setInterval(() => {
          scanForQRCode();
        }, 1000); // Scan every second
        
        setScanningInterval(interval);
      }
    } catch (err: any) {
      setError('Camera access denied. Please allow camera access or use image upload.');
      setScanning(false);
      console.error('Camera error:', err);
    }
  };

  const scanForQRCode = () => {
    if (!videoRef.current || !canvasRef.current) {
      console.log('Video or canvas ref missing');
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      console.log('Canvas context not available');
      return;
    }

    if (video.readyState !== video.HAVE_ENOUGH_DATA) {
      console.log('Video not ready, readyState:', video.readyState);
      return;
    }

    try {
      // Set canvas size to video size
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw video frame to canvas
      ctx.drawImage(video, 0, 0);

      // Get image data for QR processing
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      console.log('Scanning for QR code...', canvas.width, 'x', canvas.height);

      // Try to decode QR code
      const qrResult = jsQR(imageData.data, imageData.width, imageData.height);

      if (qrResult) {
        console.log('QR Code detected!', qrResult.data);
        // QR code found! Stop scanning first, then validate
        if (scanningInterval) {
          clearInterval(scanningInterval);
          setScanningInterval(null);
        }
        // Validate the QR code
        validateQRCode(qrResult.data);
        // Don't stop camera here - let validateQRCode handle it after validation
      } else {
        console.log('No QR code found in current frame');
      }
    } catch (error) {
      console.error('Error scanning for QR code:', error);
      setError('Error scanning QR code: ' + (error as Error).message);
    }
  };



  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      console.log('No file selected');
      return;
    }

    console.log('File selected:', file.name, file.type);
    setError('Processing image...');

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageData = e.target?.result as string;
      console.log('Image loaded, processing QR...');
      processQRImage(imageData);
    };
    reader.onerror = () => {
      setError('Failed to read image file');
    };
    reader.readAsDataURL(file);
  };

  const processQRImage = async (imageData: string) => {
    try {
      setError('');
      console.log('Processing QR image...');
      
      // Create an image element to load the image data
      const img = new Image();
      img.onload = () => {
        console.log('Image loaded:', img.width, 'x', img.height);
        
        // Create a canvas to process the image
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          setError('Canvas not supported');
          return;
        }

        // Set canvas size to image size
        canvas.width = img.width;
        canvas.height = img.height;

        // Draw image to canvas
        ctx.drawImage(img, 0, 0);

        // Get image data for QR processing
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        console.log('Scanning image for QR codes...');

        // Try to decode QR code
        const qrResult = jsQR(imgData.data, imgData.width, imgData.height);

        if (qrResult) {
          console.log('QR Code found in image!', qrResult.data);
          // QR code found! Validate it
          validateQRCode(qrResult.data);
          stopCamera(); // Stop camera after successful scan
        } else {
          console.log('No QR code found in uploaded image');
          setError('No QR code found in image. Please try again with a clearer image.');
        }
      };

      img.onerror = () => {
        console.error('Failed to load image');
        setError('Failed to load image. Please try a different image.');
      };

      console.log('Setting image source...');
      img.src = imageData;
      
    } catch (err: any) {
      console.error('Error processing QR image:', err);
      setError('Failed to process QR code image: ' + err.message);
    }
  };

  const validateQRCode = async (qrData: string) => {
    try {
      setError('');
      console.log('Validating QR data:', qrData);
      
      // Try to parse the QR data to see what format it is
      let parsedData;
      try {
        parsedData = JSON.parse(qrData);
        console.log('Parsed QR data:', parsedData);
      } catch (parseError) {
        // If it's not JSON, treat it as plain text QR (could be a booking ID)
        console.log('QR data is not JSON, treating as plain text');
        parsedData = { rawData: qrData };
      }

      // Check if this looks like a booking QR (has bookingId and passengerName)
      // OR if it's a route QR that we can try to convert/validate
      if (parsedData.bookingId && parsedData.passengerName) {
        // This is a proper booking QR - validate it
        console.log('Valid booking QR detected, validating...');
      } else if (parsedData.routeId || parsedData.seatNumber) {
        // This is a route selection QR - provide helpful guidance
        setError(`This appears to be a route selection QR code. 
                  To validate a passenger ticket, you need the QR code from a completed booking.
                  Ask the passenger to show their booking confirmation QR code.`);
        stopCamera();
        return;
      } else if (parsedData.rawData) {
        // Plain text QR - might be a booking reference
        console.log('Plain text QR detected, attempting validation...');
      } else {
        // Unknown format
        setError(`QR code format not recognized. 
                  Please scan a valid booking confirmation QR code from TransConnect.`);
        stopCamera();
        return;
      }
      
      const response = await api.post('/qr/validate', {
        qrData: qrData,
        scannedBy: user?.firstName + ' ' + user?.lastName,
        location: 'Bus Terminal'
      });

      setResult(response.data);
      stopCamera(); // Stop camera after successful validation
      
    } catch (err: any) {
      console.error('QR validation error:', err);
      
      // Provide more user-friendly error messages
      if (err.response?.status === 400) {
        setError('This QR code is not a valid TransConnect booking ticket. Please ask the passenger for their booking confirmation QR code.');
      } else if (err.response?.status === 404) {
        setError('Booking not found. This ticket may be expired or invalid.');
      } else {
        setError('Unable to validate ticket. Please check your internet connection and try again.');
      }
      stopCamera();
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">🎫 Ticket Validator</h1>
          <p className="text-gray-600">Scan passenger QR codes to validate tickets and view booking details</p>
        </div>

        {/* Camera Scanner */}
        <div className="bg-white rounded-lg shadow border mb-6">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Camera className="h-5 w-5 mr-2" />
              Camera Scanner
            </h2>
          </div>
          <div className="p-6">
            {!scanning ? (
              <div className="text-center space-y-4">
                {cameraSupported ? (
                  <button 
                    onClick={startCamera}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Camera className="h-5 w-5 mr-2 inline" />
                    Start Camera Scanning
                  </button>
                ) : (
                  <div className="text-gray-500">
                    <Camera className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p>Camera not supported on this device</p>
                  </div>
                )}
                <p className="text-sm text-gray-600">
                  Point camera at passenger's QR code
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative bg-black rounded-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    className="w-full max-w-md mx-auto rounded-lg"
                    autoPlay
                    playsInline
                    muted
                  />
                  <canvas ref={canvasRef} className="hidden" />
                  
                  {/* Scanning overlay */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="border-2 border-green-400 border-dashed w-64 h-64 rounded-lg flex items-center justify-center animate-pulse">
                      <div className="text-white text-center">
                        <div className="text-4xl mb-2">📱</div>
                        <p className="text-sm font-semibold">Point camera at QR code</p>
                        <p className="text-xs mt-1 opacity-80">Auto-scanning active...</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-center space-x-4">
                  <button 
                    onClick={scanForQRCode}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    📸 Manual Capture
                  </button>
                  <button 
                    onClick={stopCamera}
                    className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Stop Camera
                  </button>
                </div>
                <p className="text-center text-white text-sm mt-2">
                  🔄 Auto-scanning active - QR codes will be detected automatically
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Image Upload Scanner */}
        <div className="bg-white rounded-lg shadow border mb-6">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Upload className="h-5 w-5 mr-2" />
              Upload QR Code Image
            </h2>
          </div>
          <div className="p-6">
            <div className="text-center">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Upload className="h-5 w-5 mr-2 inline" />
                Choose QR Code Image
              </button>
              <p className="text-sm text-gray-600 mt-2">
                Upload a screenshot or photo of the QR code
              </p>
            </div>
          </div>
        </div>

        {/* Manual Input Scanner */}
        <div className="bg-white rounded-lg shadow border mb-6">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Manual QR Code Input
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
          
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <h4 className="font-semibold text-yellow-800 mb-2">📱 How to get real booking QR codes:</h4>
            <ol className="text-sm text-yellow-700 space-y-1">
              <li>1. Go to <strong>TransConnect Web Portal</strong></li>
              <li>2. Make a booking and complete payment</li>
              <li>3. Copy QR data from booking success page</li>
              <li>4. Scan that QR data here to validate</li>
            </ol>
            <p className="text-xs text-yellow-600 mt-2">
              Note: Route selection QRs (without passenger name) won't validate - only completed booking QRs work.
            </p>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-white rounded-lg shadow border mt-6">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-900">📋 How to Validate Tickets</h2>
          </div>
          <div className="p-6 text-sm text-gray-600 space-y-3">
            <div className="flex items-start space-x-2">
              <span className="text-blue-600">1️⃣</span>
              <span>Ask passenger to show their <strong>booking confirmation QR code</strong></span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-blue-600">2️⃣</span>
              <span>Click "Start Camera Scanning" and point at the QR code</span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-blue-600">3️⃣</span>
              <span>Valid tickets will show green checkmark with passenger details</span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-blue-600">4️⃣</span>
              <span>Invalid or already scanned tickets will be clearly marked</span>
            </div>
            <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
              <p className="text-blue-800 text-xs">
                <strong>Note:</strong> Only scan QR codes from completed bookings. Route selection QRs are not valid tickets.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}