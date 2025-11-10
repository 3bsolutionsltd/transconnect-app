'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, Smartphone, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotificationService } from '@/lib/notificationService';
import { paymentApi } from '@/lib/api';

export default function PaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();
  const notificationService = useNotificationService();
  
  const [bookingData, setBookingData] = useState<any>(null);
  const [selectedMethod, setSelectedMethod] = useState('MTN_MOBILE_MONEY');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [processing, setProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'processing' | 'success' | 'failed'>('pending');
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    // Don't redirect while still loading auth state
    if (loading) return;
    
    // Check if user is authenticated
    if (!user) {
      router.push('/login');
      return;
    }

    const booking = searchParams.get('booking');
    if (booking) {
      try {
        const parsed = JSON.parse(decodeURIComponent(booking));
        setBookingData(parsed);
      } catch (error) {
        router.push('/search');
      }
    } else {
      router.push('/search');
    }
  }, [searchParams, router, user, loading]);

  const paymentMethods = [
    { id: 'MTN_MOBILE_MONEY', name: 'MTN Mobile Money', icon: Smartphone, color: 'text-yellow-600' },
    { id: 'AIRTEL_MONEY', name: 'Airtel Money', icon: Smartphone, color: 'text-red-600' },
    { id: 'FLUTTERWAVE', name: 'Card Payment', icon: CreditCard, color: 'text-blue-600' },
  ];

  const handlePayment = async () => {
    if (!user) {
      setErrorMessage('Please log in to complete payment');
      setPaymentStatus('failed');
      return;
    }

    if (!phoneNumber && selectedMethod !== 'FLUTTERWAVE') {
      alert('Please enter your phone number');
      return;
    }

    setProcessing(true);
    setPaymentStatus('processing');

    try {
      // Call actual payment API
      const paymentRequest = {
        bookingId: bookingData.id,
        method: selectedMethod,
        phoneNumber: phoneNumber
      };

      const response = await paymentApi.initiate(paymentRequest);
      
      if (response && response.paymentId) {
        setPaymentId(response.paymentId);
        
        // For demo mode, payment should complete immediately
        if (response.status === 'COMPLETED') {
          setPaymentStatus('success');
          
          // Show payment success notification
          const paymentMethodName = paymentMethods.find(m => m.id === selectedMethod)?.name || selectedMethod;
          notificationService.onPaymentSuccess(bookingData.totalAmount, paymentMethodName);
          
          // Wait a moment to show success, then redirect
          setTimeout(() => {
            const successData = encodeURIComponent(JSON.stringify({
              ...bookingData,
              paymentStatus: 'COMPLETED',
              paymentMethod: selectedMethod,
              paymentId: response.paymentId,
              qrCode: response.qrCode // Include QR code from payment response
            }));
            router.push(`/booking-success?booking=${successData}`);
          }, 2000);
        } else {
          // Payment is still pending, could implement polling here
          const errorMsg = 'Payment is still processing. Please check back later.';
          setErrorMessage(errorMsg);
          setPaymentStatus('failed');
          notificationService.onPaymentFailed(errorMsg);
        }
      } else {
        const errorMsg = 'Payment failed. Please try again.';
        setErrorMessage(errorMsg);
        setPaymentStatus('failed');
        notificationService.onPaymentFailed(errorMsg);
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      
      // Handle specific error types
      let errorMsg = '';
      if (error.response?.status === 401) {
        errorMsg = 'Please log in to complete payment';
        setErrorMessage(errorMsg);
        setTimeout(() => router.push('/login'), 2000);
      } else if (error.response?.status === 403) {
        errorMsg = 'Authentication failed. Please log in again.';
        setErrorMessage(errorMsg);
        setTimeout(() => router.push('/login'), 2000);
      } else {
        errorMsg = error.response?.data?.error || error.message || 'Payment failed. Please try again.';
        setErrorMessage(errorMsg);
      }
      
      // Show payment failed notification
      notificationService.onPaymentFailed(errorMsg);
      setPaymentStatus('failed');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusIcon = () => {
    switch (paymentStatus) {
      case 'processing':
        return <Clock className="h-8 w-8 text-blue-500 animate-pulse" />;
      case 'success':
        return <CheckCircle className="h-8 w-8 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-8 w-8 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusMessage = () => {
    switch (paymentStatus) {
      case 'processing':
        return 'Processing your payment...';
      case 'success':
        return 'Payment successful! Redirecting...';
      case 'failed':
        return errorMessage || 'Payment failed. Please try again.';
      default:
        return '';
    }
  };

  if (loading || !bookingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Payment</h1>
          <p className="text-gray-600">Secure your bus ticket with payment</p>
        </div>

        {/* Booking Summary */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Booking Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Route:</span>
                <span className="font-medium">{bookingData.route?.origin} → {bookingData.route?.destination}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Date:</span>
                <span className="font-medium">{new Date(bookingData.travelDate).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Seat:</span>
                <span className="font-medium">{bookingData.seatNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Passenger:</span>
                <span className="font-medium">{user?.firstName} {user?.lastName}</span>
              </div>
              <div className="border-t pt-3 flex justify-between text-lg font-semibold">
                <span>Total Amount:</span>
                <span className="text-green-600">UGX {bookingData.totalAmount?.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Status */}
        {paymentStatus !== 'pending' && (
          <Card className="mb-6">
            <CardContent className="text-center py-8">
              {getStatusIcon()}
              <p className="mt-4 text-lg font-medium">{getStatusMessage()}</p>
              {paymentStatus === 'failed' && (
                <Button 
                  onClick={() => setPaymentStatus('pending')} 
                  className="mt-4"
                  variant="outline"
                >
                  Try Again
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Payment Methods */}
        {paymentStatus === 'pending' && (
          <>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Select Payment Method</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {paymentMethods.map((method) => {
                    const Icon = method.icon;
                    return (
                      <div
                        key={method.id}
                        className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                          selectedMethod === method.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedMethod(method.id)}
                      >
                        <div className="flex items-center">
                          <Icon className={`h-5 w-5 mr-3 ${method.color}`} />
                          <span className="font-medium">{method.name}</span>
                          {selectedMethod === method.id && (
                            <CheckCircle className="h-5 w-5 ml-auto text-blue-500" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Payment Details */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Payment Details</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedMethod === 'FLUTTERWAVE' ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Card Number
                      </label>
                      <input
                        type="text"
                        placeholder="1234 5678 9012 3456"
                        className="form-input"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Expiry Date
                        </label>
                        <input
                          type="text"
                          placeholder="MM/YY"
                          className="form-input"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          CVV
                        </label>
                        <input
                          type="text"
                          placeholder="123"
                          className="form-input"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="256701234567"
                      className="form-input"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      You will receive a payment prompt on this number
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment Button */}
            <Button
              onClick={handlePayment}
              disabled={processing}
              className="w-full btn-primary text-lg py-3"
            >
              {processing ? (
                <span className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Processing Payment...
                </span>
              ) : (
                `Pay UGX ${bookingData.totalAmount?.toLocaleString()}`
              )}
            </Button>
          </>
        )}

        {/* Security Notice */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>🔒 Your payment information is secure and encrypted</p>
        </div>
      </div>
    </div>
  );
}