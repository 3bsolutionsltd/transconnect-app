import React, { useState, useRef, useEffect } from 'react';import React, { useState, useRef, useEffect } from 'react';import React, { useState, useRef, useEffect } from 'react';

import { Camera, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

import { useAuth } from '../../contexts/AuthContext';import { Camera, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

import { api } from '../../lib/api';

import { useAuth } from '../../contexts/AuthContext.tsx';import { Button } from '../ui/button';

export default function QRScannerPage() {

  const { user } = useAuth();import { api } from '../../lib/api';import { Camera, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';

  const [scanning, setScanning] = useState(false);

  const [result, setResult] = useState<any>(null);import toast from 'react-hot-toast';import { useAuth } from '../../contexts/AuthContext.tsx';

  const [error, setError] = useState<string>('');

  const [manualCode, setManualCode] = useState('');import { api } from '../../lib/api';

  const videoRef = useRef<HTMLVideoElement>(null);

  const streamRef = useRef<MediaStream | null>(null);export default function QRScannerPage() {import toast from 'react-hot-toast';



  useEffect(() => {  const { user } = useAuth();

    return () => {

      stopCamera();  const [scanning, setScanning] = useState(false);export default function QRScannerPage() {

    };

  }, []);  const [result, setResult] = useState<any>(null);  const { user } = useAuth();



  const startCamera = async () => {  const [error, setError] = useState<string>('');  const [scanning, setScanning] = useState(false);

    try {

      setScanning(true);  const [manualCode, setManualCode] = useState('');  const [result, setResult] = useState<any>(null);

      setError('');

        const videoRef = useRef<HTMLVideoElement>(null);  const [error, setError] = useState<string>('');

      const stream = await navigator.mediaDevices.getUserMedia({

        video: { facingMode: 'environment' }  const canvasRef = useRef<HTMLCanvasElement>(null);  const [manualCode, setManualCode] = useState('');

      });

        const streamRef = useRef<MediaStream | null>(null);  const videoRef = useRef<HTMLVideoElement>(null);

      streamRef.current = stream;

        const canvasRef = useRef<HTMLCanvasElement>(null);

      if (videoRef.current) {

        videoRef.current.srcObject = stream;  useEffect(() => {  const streamRef = useRef<MediaStream | null>(null);

        videoRef.current.play();

      }    return () => {

    } catch (err: any) {

      setError('Camera access denied or not available');      stopCamera();  useEffect(() => {

      setScanning(false);

      console.error('Camera error:', err);    };    return () => {

    }

  };  }, []);      stopCamera();



  const stopCamera = () => {    };

    if (streamRef.current) {

      streamRef.current.getTracks().forEach(track => track.stop());  const startCamera = async () => {  }, []);

      streamRef.current = null;

    }    try {

    setScanning(false);

  };      setScanning(true);  const startCamera = async () => {



  const validateQRCode = async (qrData: string) => {      setError('');    try {

    try {

      setError('');            setScanning(true);

      

      const response = await api.post('/qr/validate', {      const stream = await navigator.mediaDevices.getUserMedia({      setError('');

        qrData: qrData,

        scannedBy: user?.firstName + ' ' + user?.lastName,        video: { facingMode: 'environment' } // Use back camera on mobile      

        location: 'Bus Terminal'

      });      });      const stream = await navigator.mediaDevices.getUserMedia({



      setResult(response.data);              video: { facingMode: 'environment' } // Use back camera on mobile

      

    } catch (err: any) {      streamRef.current = stream;      });

      setError(err.response?.data?.error || 'Failed to validate QR code');

    }            

  };

      if (videoRef.current) {      streamRef.current = stream;

  const handleManualSubmit = (e: React.FormEvent) => {

    e.preventDefault();        videoRef.current.srcObject = stream;      

    if (manualCode.trim()) {

      validateQRCode(manualCode.trim());        videoRef.current.play();      if (videoRef.current) {

    }

  };      }        videoRef.current.srcObject = stream;



  const resetScanner = () => {    } catch (err: any) {        videoRef.current.play();

    setResult(null);

    setError('');      setError('Camera access denied or not available');      }

    setManualCode('');

  };      setScanning(false);    } catch (err: any) {



  return (      console.error('Camera error:', err);      setError('Camera access denied or not available');

    <div className="min-h-screen bg-gray-50 p-6">

      <div className="max-w-2xl mx-auto">    }      setScanning(false);

        <div className="mb-6">

          <h1 className="text-3xl font-bold text-gray-900 mb-2">QR Ticket Scanner</h1>  };      console.error('Camera error:', err);

          <p className="text-gray-600">Scan or validate passenger tickets</p>

        </div>    }



        {/* Camera Scanner */}  const stopCamera = () => {  };

        <div className="bg-white rounded-lg shadow border mb-6">

          <div className="p-6 border-b border-gray-200">    if (streamRef.current) {

            <h2 className="text-lg font-semibold text-gray-900 flex items-center">

              <Camera className="h-5 w-5 mr-2" />      streamRef.current.getTracks().forEach(track => track.stop());  const stopCamera = () => {

              Camera Scanner

            </h2>      streamRef.current = null;    if (streamRef.current) {

          </div>

          <div className="p-6">    }      streamRef.current.getTracks().forEach(track => track.stop());

            {!scanning ? (

              <div className="text-center">    setScanning(false);      streamRef.current = null;

                <button 

                  onClick={startCamera}  };    }

                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors mb-4"

                >    setScanning(false);

                  <Camera className="h-4 w-4 mr-2 inline" />

                  Start Camera  const captureAndScan = async () => {  };

                </button>

                <p className="text-sm text-gray-600">    if (!videoRef.current || !canvasRef.current) return;

                  Click to start camera and scan QR codes

                </p>  const captureAndScan = async () => {

              </div>

            ) : (    const video = videoRef.current;    if (!videoRef.current || !canvasRef.current) return;

              <div className="space-y-4">

                <div className="relative">    const canvas = canvasRef.current;

                  <video

                    ref={videoRef}    const ctx = canvas.getContext('2d');    const video = videoRef.current;

                    className="w-full max-w-md mx-auto rounded-lg"

                    autoPlay    const canvas = canvasRef.current;

                    playsInline

                    muted    if (!ctx) return;    const ctx = canvas.getContext('2d');

                  />

                </div>

                <div className="flex justify-center space-x-4">

                  <button     // Set canvas size to video size    if (!ctx) return;

                    onClick={stopCamera}

                    className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"    canvas.width = video.videoWidth;

                  >

                    Stop Camera    canvas.height = video.videoHeight;    // Set canvas size to video size

                  </button>

                </div>    canvas.width = video.videoWidth;

              </div>

            )}    // Draw video frame to canvas    canvas.height = video.videoHeight;

          </div>

        </div>    ctx.drawImage(video, 0, 0);



        {/* Manual Input */}    // Draw video frame to canvas

        <div className="bg-white rounded-lg shadow border mb-6">

          <div className="p-6 border-b border-gray-200">    // Convert canvas to blob and process    ctx.drawImage(video, 0, 0);

            <h2 className="text-lg font-semibold text-gray-900">Manual QR Code Input</h2>

          </div>    canvas.toBlob(async (blob) => {

          <div className="p-6">

            <form onSubmit={handleManualSubmit} className="space-y-4">      if (!blob) return;    // Convert canvas to blob and process

              <div>

                <label className="block text-sm font-medium text-gray-700 mb-1">    canvas.toBlob(async (blob) => {

                  QR Code Data

                </label>      // For now, we'll use manual input since QR scanning requires additional libraries      if (!blob) return;

                <textarea

                  value={manualCode}      // In a full implementation, you'd use libraries like jsQR or zxing-js

                  onChange={(e) => setManualCode(e.target.value)}

                  placeholder="Paste QR code data here..."      toast.info('QR scanning requires manual input for now');      // For now, we'll use manual input since QR scanning requires additional libraries

                  className="w-full p-3 border border-gray-300 rounded-lg"

                  rows={4}    });      // In a full implementation, you'd use libraries like jsQR or zxing-js

                />

              </div>  };      toast.info('QR scanning requires manual input for now');

              <button 

                type="submit"     });

                disabled={!manualCode.trim()}

                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"  const validateQRCode = async (qrData: string) => {  };

              >

                Validate QR Code    try {

              </button>

            </form>      setError('');  const validateQRCode = async (qrData: string) => {

          </div>

        </div>          try {



        {/* Error Display */}      const response = await api.post('/qr/validate', {      setError('');

        {error && (

          <div className="rounded-lg shadow border mb-6 border-red-200 bg-red-50">        qrData: qrData,      

            <div className="p-6">

              <div className="flex items-center text-red-700">        scannedBy: user?.firstName + ' ' + user?.lastName,      const response = await api.post('/qr/validate', {

                <XCircle className="h-5 w-5 mr-2" />

                <span>{error}</span>        location: 'Bus Terminal' // You could get this from geolocation        qrData: qrData,

              </div>

            </div>      });        scannedBy: user?.firstName + ' ' + user?.lastName,

          </div>

        )}        location: 'Bus Terminal' // You could get this from geolocation



        {/* Results */}      setResult(response.data);      });

        {result && (

          <div className={`rounded-lg shadow border mb-6 ${result.valid ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>      

            <div className="p-6 border-b border-gray-200">

              <h2 className={`text-lg font-semibold flex items-center ${result.valid ? 'text-green-700' : 'text-red-700'}`}>      if (response.data.valid) {      setResult(response.data);

                {result.valid ? <CheckCircle className="h-5 w-5 mr-2" /> : <XCircle className="h-5 w-5 mr-2" />}

                {result.valid ? 'Valid Ticket' : 'Invalid Ticket'}        toast.success(response.data.alreadyScanned ? 'Ticket already scanned' : 'Valid ticket!');      

                {result.alreadyScanned && (

                  <span className="ml-2 text-sm bg-yellow-100 text-yellow-800 px-2 py-1 rounded">      } else {      if (response.data.valid) {

                    Already Scanned

                  </span>        toast.error(response.data.error || 'Invalid ticket');        toast.success(response.data.alreadyScanned ? 'Ticket already scanned' : 'Valid ticket!');

                )}

              </h2>      }      } else {

            </div>

            <div className="p-6">              toast.error(response.data.error || 'Invalid ticket');

              {result.valid && result.bookingDetails && (

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">    } catch (err: any) {      }

                  <div>

                    <div className="text-sm text-gray-600">Passenger</div>      setError(err.response?.data?.error || 'Failed to validate QR code');      

                    <div className="font-semibold">{result.bookingDetails.passengerName}</div>

                  </div>      toast.error('Validation failed');    } catch (err: any) {

                  <div>

                    <div className="text-sm text-gray-600">Route</div>    }      setError(err.response?.data?.error || 'Failed to validate QR code');

                    <div className="font-semibold">{result.bookingDetails.route}</div>

                  </div>  };      toast.error('Validation failed');

                  <div>

                    <div className="text-sm text-gray-600">Seat</div>    }

                    <div className="font-semibold">{result.bookingDetails.seatNumber}</div>

                  </div>  const handleManualSubmit = (e: React.FormEvent) => {  };

                  <div>

                    <div className="text-sm text-gray-600">Travel Date</div>    e.preventDefault();

                    <div className="font-semibold">{new Date(result.bookingDetails.travelDate).toLocaleDateString()}</div>

                  </div>    if (manualCode.trim()) {  const handleManualSubmit = (e: React.FormEvent) => {

                  <div>

                    <div className="text-sm text-gray-600">Bus</div>      validateQRCode(manualCode.trim());    e.preventDefault();

                    <div className="font-semibold">{result.bookingDetails.busPlate}</div>

                  </div>    }    if (manualCode.trim()) {

                  <div>

                    <div className="text-sm text-gray-600">Operator</div>  };      validateQRCode(manualCode.trim());

                    <div className="font-semibold">{result.bookingDetails.operator}</div>

                  </div>    }

                </div>

              )}  const resetScanner = () => {  };



              {result.alreadyScanned && result.scanDetails && (    setResult(null);

                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">

                  <div className="text-sm text-yellow-800">    setError('');  const resetScanner = () => {

                    Previously scanned by: <strong>{result.scanDetails.scannedBy}</strong>

                    <br />    setManualCode('');    setResult(null);

                    Scan time: {new Date(result.scanDetails.scannedAt).toLocaleString()}

                  </div>  };    setError('');

                </div>

              )}    setManualCode('');



              {!result.valid && (  return (  };

                <div className="text-red-700">

                  {result.error || 'Invalid or expired ticket'}    <div className="min-h-screen bg-gray-50 p-6">

                </div>

              )}      <div className="max-w-2xl mx-auto">  return (



              <div className="mt-4">        <div className="mb-6">    <div className="min-h-screen bg-gray-50 p-6">

                <button 

                  onClick={resetScanner}          <h1 className="text-3xl font-bold text-gray-900 mb-2">QR Ticket Scanner</h1>      <div className="max-w-2xl mx-auto">

                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"

                >          <p className="text-gray-600">Scan or validate passenger tickets</p>        <div className="mb-6">

                  <RefreshCw className="h-4 w-4 mr-2 inline" />

                  Scan Another Ticket        </div>          <h1 className="text-3xl font-bold text-gray-900 mb-2">QR Ticket Scanner</h1>

                </button>

              </div>          <p className="text-gray-600">Scan or validate passenger tickets</p>

            </div>

          </div>        {/* Camera Scanner */}        </div>

        )}

        <div className="bg-white rounded-lg shadow border mb-6">

        {/* Instructions */}

        <div className="bg-white rounded-lg shadow border">          <div className="p-6 border-b border-gray-200">        {/* Camera Scanner */}

          <div className="p-6 border-b border-gray-200">

            <h2 className="text-sm font-semibold text-gray-900">Instructions</h2>            <h2 className="text-lg font-semibold text-gray-900 flex items-center">        <Card className="mb-6">

          </div>

          <div className="p-6 text-sm text-gray-600 space-y-2">              <Camera className="h-5 w-5 mr-2" />          <CardHeader>

            <div>• Use manual input to validate QR code data</div>

            <div>• Valid tickets will show passenger and journey details</div>              Camera Scanner            <CardTitle className="flex items-center">

            <div>• Already scanned tickets will be marked but details are still shown</div>

            <div>• Contact support if you encounter invalid tickets</div>            </h2>              <Camera className="h-5 w-5 mr-2" />

          </div>

        </div>          </div>              Camera Scanner

      </div>

    </div>          <div className="p-6">            </CardTitle>

  );

}            {!scanning ? (          </CardHeader>

              <div className="text-center">          <CardContent>

                <button             {!scanning ? (

                  onClick={startCamera}              <div className="text-center">

                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors mb-4"                <Button onClick={startCamera} className="mb-4">

                >                  <Camera className="h-4 w-4 mr-2" />

                  <Camera className="h-4 w-4 mr-2 inline" />                  Start Camera

                  Start Camera                </Button>

                </button>                <p className="text-sm text-gray-600">

                <p className="text-sm text-gray-600">                  Click to start camera and scan QR codes

                  Click to start camera and scan QR codes                </p>

                </p>              </div>

              </div>            ) : (

            ) : (              <div className="space-y-4">

              <div className="space-y-4">                <div className="relative">

                <div className="relative">                  <video

                  <video                    ref={videoRef}

                    ref={videoRef}                    className="w-full max-w-md mx-auto rounded-lg"

                    className="w-full max-w-md mx-auto rounded-lg"                    autoPlay

                    autoPlay                    playsInline

                    playsInline                    muted

                    muted                  />

                  />                  <canvas ref={canvasRef} className="hidden" />

                  <canvas ref={canvasRef} className="hidden" />                </div>

                </div>                <div className="flex justify-center space-x-4">

                <div className="flex justify-center space-x-4">                  <Button onClick={captureAndScan} variant="outline">

                  <button                     Capture & Scan

                    onClick={captureAndScan}                  </Button>

                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"                  <Button onClick={stopCamera} variant="outline">

                  >                    Stop Camera

                    Capture & Scan                  </Button>

                  </button>                </div>

                  <button               </div>

                    onClick={stopCamera}            )}

                    className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"          </CardContent>

                  >        </Card>

                    Stop Camera

                  </button>        {/* Manual Input */}

                </div>        <Card className="mb-6">

              </div>          <CardHeader>

            )}            <CardTitle>Manual QR Code Input</CardTitle>

          </div>          </CardHeader>

        </div>          <CardContent>

            <form onSubmit={handleManualSubmit} className="space-y-4">

        {/* Manual Input */}              <div>

        <div className="bg-white rounded-lg shadow border mb-6">                <label className="block text-sm font-medium text-gray-700 mb-1">

          <div className="p-6 border-b border-gray-200">                  QR Code Data

            <h2 className="text-lg font-semibold text-gray-900">Manual QR Code Input</h2>                </label>

          </div>                <textarea

          <div className="p-6">                  value={manualCode}

            <form onSubmit={handleManualSubmit} className="space-y-4">                  onChange={(e) => setManualCode(e.target.value)}

              <div>                  placeholder="Paste QR code data here..."

                <label className="block text-sm font-medium text-gray-700 mb-1">                  className="w-full p-3 border border-gray-300 rounded-lg"

                  QR Code Data                  rows={4}

                </label>                />

                <textarea              </div>

                  value={manualCode}              <Button type="submit" disabled={!manualCode.trim()}>

                  onChange={(e) => setManualCode(e.target.value)}                Validate QR Code

                  placeholder="Paste QR code data here..."              </Button>

                  className="w-full p-3 border border-gray-300 rounded-lg"            </form>

                  rows={4}          </CardContent>

                />        </Card>

              </div>

              <button         {/* Results */}

                type="submit"         {error && (

                disabled={!manualCode.trim()}          <Card className="mb-6 border-red-200 bg-red-50">

                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"            <CardContent className="pt-6">

              >              <div className="flex items-center text-red-700">

                Validate QR Code                <XCircle className="h-5 w-5 mr-2" />

              </button>                <span>{error}</span>

            </form>              </div>

          </div>            </CardContent>

        </div>          </Card>

        )}

        {/* Results */}

        {error && (        {result && (

          <div className="bg-white rounded-lg shadow border mb-6 border-red-200 bg-red-50">          <Card className={`mb-6 ${result.valid ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>

            <div className="p-6">            <CardHeader>

              <div className="flex items-center text-red-700">              <CardTitle className={`flex items-center ${result.valid ? 'text-green-700' : 'text-red-700'}`}>

                <XCircle className="h-5 w-5 mr-2" />                {result.valid ? <CheckCircle className="h-5 w-5 mr-2" /> : <XCircle className="h-5 w-5 mr-2" />}

                <span>{error}</span>                {result.valid ? 'Valid Ticket' : 'Invalid Ticket'}

              </div>                {result.alreadyScanned && (

            </div>                  <span className="ml-2 text-sm bg-yellow-100 text-yellow-800 px-2 py-1 rounded">

          </div>                    Already Scanned

        )}                  </span>

                )}

        {result && (              </CardTitle>

          <div className={`bg-white rounded-lg shadow border mb-6 ${result.valid ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>            </CardHeader>

            <div className="p-6 border-b border-gray-200">            <CardContent>

              <h2 className={`text-lg font-semibold flex items-center ${result.valid ? 'text-green-700' : 'text-red-700'}`}>              {result.valid && result.bookingDetails && (

                {result.valid ? <CheckCircle className="h-5 w-5 mr-2" /> : <XCircle className="h-5 w-5 mr-2" />}                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {result.valid ? 'Valid Ticket' : 'Invalid Ticket'}                  <div>

                {result.alreadyScanned && (                    <div className="text-sm text-gray-600">Passenger</div>

                  <span className="ml-2 text-sm bg-yellow-100 text-yellow-800 px-2 py-1 rounded">                    <div className="font-semibold">{result.bookingDetails.passengerName}</div>

                    Already Scanned                  </div>

                  </span>                  <div>

                )}                    <div className="text-sm text-gray-600">Route</div>

              </h2>                    <div className="font-semibold">{result.bookingDetails.route}</div>

            </div>                  </div>

            <div className="p-6">                  <div>

              {result.valid && result.bookingDetails && (                    <div className="text-sm text-gray-600">Seat</div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">                    <div className="font-semibold">{result.bookingDetails.seatNumber}</div>

                  <div>                  </div>

                    <div className="text-sm text-gray-600">Passenger</div>                  <div>

                    <div className="font-semibold">{result.bookingDetails.passengerName}</div>                    <div className="text-sm text-gray-600">Travel Date</div>

                  </div>                    <div className="font-semibold">{new Date(result.bookingDetails.travelDate).toLocaleDateString()}</div>

                  <div>                  </div>

                    <div className="text-sm text-gray-600">Route</div>                  <div>

                    <div className="font-semibold">{result.bookingDetails.route}</div>                    <div className="text-sm text-gray-600">Bus</div>

                  </div>                    <div className="font-semibold">{result.bookingDetails.busPlate}</div>

                  <div>                  </div>

                    <div className="text-sm text-gray-600">Seat</div>                  <div>

                    <div className="font-semibold">{result.bookingDetails.seatNumber}</div>                    <div className="text-sm text-gray-600">Operator</div>

                  </div>                    <div className="font-semibold">{result.bookingDetails.operator}</div>

                  <div>                  </div>

                    <div className="text-sm text-gray-600">Travel Date</div>                </div>

                    <div className="font-semibold">{new Date(result.bookingDetails.travelDate).toLocaleDateString()}</div>              )}

                  </div>

                  <div>              {result.alreadyScanned && result.scanDetails && (

                    <div className="text-sm text-gray-600">Bus</div>                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">

                    <div className="font-semibold">{result.bookingDetails.busPlate}</div>                  <div className="text-sm text-yellow-800">

                  </div>                    Previously scanned by: <strong>{result.scanDetails.scannedBy}</strong>

                  <div>                    <br />

                    <div className="text-sm text-gray-600">Operator</div>                    Scan time: {new Date(result.scanDetails.scannedAt).toLocaleString()}

                    <div className="font-semibold">{result.bookingDetails.operator}</div>                  </div>

                  </div>                </div>

                </div>              )}

              )}

              {!result.valid && (

              {result.alreadyScanned && result.scanDetails && (                <div className="text-red-700">

                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">                  {result.error || 'Invalid or expired ticket'}

                  <div className="text-sm text-yellow-800">                </div>

                    Previously scanned by: <strong>{result.scanDetails.scannedBy}</strong>              )}

                    <br />

                    Scan time: {new Date(result.scanDetails.scannedAt).toLocaleString()}              <div className="mt-4">

                  </div>                <Button onClick={resetScanner} variant="outline">

                </div>                  <RefreshCw className="h-4 w-4 mr-2" />

              )}                  Scan Another Ticket

                </Button>

              {!result.valid && (              </div>

                <div className="text-red-700">            </CardContent>

                  {result.error || 'Invalid or expired ticket'}          </Card>

                </div>        )}

              )}

        {/* Instructions */}

              <div className="mt-4">        <Card>

                <button           <CardHeader>

                  onClick={resetScanner}            <CardTitle className="text-sm">Instructions</CardTitle>

                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"          </CardHeader>

                >          <CardContent className="text-sm text-gray-600 space-y-2">

                  <RefreshCw className="h-4 w-4 mr-2 inline" />            <div>• Use the camera to scan QR codes from passenger phones</div>

                  Scan Another Ticket            <div>• Alternatively, manually input QR code data if scanning is not available</div>

                </button>            <div>• Valid tickets will show passenger and journey details</div>

              </div>            <div>• Already scanned tickets will be marked but details are still shown</div>

            </div>            <div>• Contact support if you encounter invalid tickets</div>

          </div>          </CardContent>

        )}        </Card>

      </div>

        {/* Instructions */}    </div>

        <div className="bg-white rounded-lg shadow border">  );

          <div className="p-6 border-b border-gray-200">}
            <h2 className="text-sm font-semibold text-gray-900">Instructions</h2>
          </div>
          <div className="p-6 text-sm text-gray-600 space-y-2">
            <div>• Use the camera to scan QR codes from passenger phones</div>
            <div>• Alternatively, manually input QR code data if scanning is not available</div>
            <div>• Valid tickets will show passenger and journey details</div>
            <div>• Already scanned tickets will be marked but details are still shown</div>
            <div>• Contact support if you encounter invalid tickets</div>
          </div>
        </div>
      </div>
    </div>
  );
}