import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, CheckCircle, XCircle, RefreshCw, Upload, QrCode } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import jsQR from 'jsqr';

const OperatorQRScanner = () => {
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

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

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
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        
        // Wait for video to be ready before starting scan
        videoRef.current.onloadedmetadata = () => {
          // Start scanning after camera is ready
          setTimeout(() => {
            const interval = setInterval(() => {
              scanForQRCode();
            }, 300); // Scan more frequently for better detection
            
            setScanningInterval(interval);
          }, 500);
        };
      }
    } catch (err) {
      console.error('Camera error:', err);
      setError('Camera access denied. Please allow camera access and try again.');
      setScanning(false);
    }
  };

  const scanForQRCode = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (video && canvas && video.videoWidth > 0 && video.videoHeight > 0) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        
        const qrCode = jsQR(imageData.data, imageData.width, imageData.height);
        
        if (qrCode) {
          validateQRCode(qrCode.data);
        }
      }
    }
  };

  const validateQRCode = async (qrData: string) => {
    try {
      setError('');
      
      // Parse QR data
      let parsedData;
      try {
        parsedData = JSON.parse(qrData);
      } catch (e) {
        parsedData = { rawData: qrData };
      }

      // Check if this looks like a booking QR
      if (parsedData.bookingId && parsedData.passengerName) {
        console.log('Valid booking QR detected, validating...');
      } else if (parsedData.routeId || parsedData.seatNumber) {
        setError(`This appears to be a route selection QR code. 
                  To validate a passenger ticket, you need the QR code from a completed booking.
                  Ask the passenger to show their booking confirmation QR code.`);
        stopCamera();
        return;
      } else {
        setError(`QR code format not recognized. 
                  Please scan a valid booking confirmation QR code from TransConnect.`);
        stopCamera();
        return;
      }
      
      const response = await fetch(`${API_BASE_URL}/qr/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          qrData: qrData,
          scannedBy: `${user?.firstName} ${user?.lastName}`,
          location: 'Bus Terminal'
        })
      });

      const data = await response.json();
      setResult(data);
      stopCamera();
      
    } catch (err: any) {
      console.error('QR validation error:', err);
      
      if (err.response?.status === 400) {
        setError('This QR code is not a valid TransConnect booking ticket.');
      } else if (err.response?.status === 404) {
        setError('Booking not found. This ticket may be expired or invalid.');
      } else {
        setError('Unable to validate ticket. Please check your internet connection and try again.');
      }
      stopCamera();
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = canvasRef.current;
          if (canvas) {
            canvas.width = img.width;
            canvas.height = img.height;
            const context = canvas.getContext('2d');
            if (context) {
              context.drawImage(img, 0, 0);
              const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
              const qrCode = jsQR(imageData.data, imageData.width, imageData.height);
              
              if (qrCode) {
                validateQRCode(qrCode.data);
              } else {
                setError('No QR code found in the image. Please try a clearer image.');
              }
            }
          }
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ticket Validator</h1>
          <p className="text-gray-600">Scan passenger QR codes to validate tickets</p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <QrCode className="h-4 w-4" />
          <span>Operator Scanner</span>
        </div>
      </div>

      {/* Camera Scanner */}
      <div className="bg-white rounded-lg shadow border">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Camera Scanner</h2>
        </div>
        <div className="p-6">
          <div className="relative">
            {cameraSupported ? (
              <div className="space-y-4">
                <video
                  ref={videoRef}
                  className="w-full max-w-md mx-auto rounded-lg border-2 border-green-300"
                  style={{ maxHeight: '400px' }}
                />
                <canvas ref={canvasRef} className="hidden" />
                
                <div className="flex justify-center space-x-4">
                  {!scanning ? (
                    <button
                      onClick={startCamera}
                      className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center"
                    >
                      <Camera className="h-5 w-5 mr-2" />
                      Start Camera Scanning
                    </button>
                  ) : (
                    <button
                      onClick={stopCamera}
                      className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors flex items-center"
                    >
                      <XCircle className="h-5 w-5 mr-2" />
                      Stop Scanning
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Camera className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Camera not supported on this device</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* File Upload */}
      <div className="bg-white rounded-lg shadow border">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Upload QR Image</h2>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-center w-full">
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="h-8 w-8 mb-2 text-gray-400" />
                <p className="mb-2 text-sm text-gray-500">
                  <span className="font-semibold">Click to upload</span> QR code image
                </p>
                <p className="text-xs text-gray-500">PNG, JPG, JPEG up to 10MB</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleFileUpload}
              />
            </label>
          </div>
        </div>
      </div>

      {/* Manual Input */}
      <div className="bg-white rounded-lg shadow border">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Manual QR Data Entry</h2>
        </div>
        <div className="p-6">
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <textarea
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="Paste QR code data here..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              rows={3}
            />
            <button
              type="submit"
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
              disabled={!manualCode.trim()}
            >
              Validate QR Data
            </button>
          </form>
        </div>
      </div>

      {/* Results */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <XCircle className="h-6 w-6 text-red-600 mr-3" />
            <div>
              <h3 className="text-lg font-medium text-red-900">Validation Failed</h3>
              <p className="text-red-700 whitespace-pre-line">{error}</p>
            </div>
          </div>
          <div className="mt-4">
            <button
              onClick={resetScanner}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors flex items-center"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Another QR Code
            </button>
          </div>
        </div>
      )}

      {result && result.valid && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <h3 className="text-xl font-semibold text-green-900">✅ Valid Ticket</h3>
              <p className="text-green-700">Passenger can board</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Passenger Details</h4>
              <div className="space-y-1 text-sm">
                <p><strong>Name:</strong> {result.bookingDetails?.passengerName}</p>
                <p><strong>Phone:</strong> {result.bookingDetails?.passengerPhone}</p>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Journey Details</h4>
              <div className="space-y-1 text-sm">
                <p><strong>Route:</strong> {result.bookingDetails?.route}</p>
                <p><strong>Seat:</strong> {result.bookingDetails?.seatNumber}</p>
                <p><strong>Bus:</strong> {result.bookingDetails?.busPlate}</p>
                <p><strong>Operator:</strong> {result.bookingDetails?.operator}</p>
              </div>
            </div>
          </div>

          {result.alreadyScanned && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
              <div className="flex items-center">
                <XCircle className="h-5 w-5 text-yellow-600 mr-2" />
                <span className="text-yellow-800 font-medium">
                  Warning: This ticket was already scanned at {new Date(result.scanDetails?.scannedAt).toLocaleString()}
                </span>
              </div>
            </div>
          )}

          <div className="mt-6">
            <button
              onClick={resetScanner}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Scan Next Ticket
            </button>
          </div>
        </div>
      )}

      {result && !result.valid && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <XCircle className="h-6 w-6 text-red-600 mr-3" />
            <div>
              <h3 className="text-lg font-medium text-red-900">❌ Invalid Ticket</h3>
              <p className="text-red-700">{result.error}</p>
            </div>
          </div>
          <div className="mt-4">
            <button
              onClick={resetScanner}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors flex items-center"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Another QR Code
            </button>
          </div>
        </div>
      )}

      {/* Quick Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start">
          <QrCode className="h-6 w-6 text-blue-600 mr-3 mt-1 flex-shrink-0" />
          <div>
            <h3 className="text-lg font-medium text-blue-900 mb-2">How to Scan Tickets</h3>
            <ol className="text-blue-800 space-y-1 text-sm">
              <li>1. Ask passenger to show their <strong>booking confirmation QR code</strong></li>
              <li>2. Click "Start Camera Scanning" and point at the QR code</li>
              <li>3. Wait for automatic scan or upload QR image file</li>
              <li>4. Check validation result - green = valid, red = invalid</li>
              <li>5. Allow boarding only for valid tickets</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OperatorQRScanner;