'use client';
import React, { useState, useEffect } from 'react';
import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, Smartphone, CheckCircle, Clock, AlertCircle, Banknote } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotificationService } from '@/lib/notificationService';
import { paymentApi } from '@/lib/api';

function PaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();
  const notificationService = useNotificationService();
  
  const [bookingData, setBookingData] = useState<any>(null);
  const [selectedMethod, setSelectedMethod] = useState('CASH');
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

        // Live check: fetch current booking status from the API
        // (URL param status is stale — set at booking creation time)
        import('@/lib/api').then(({ getBookingStatus, authApi }) => {
          getBookingStatus(parsed.id, authApi.getToken())
            .then((live: any) => {
              if (live?.status === 'CONFIRMED' || live?.status === 'COMPLETED') {
                const successData = encodeURIComponent(
                  JSON.stringify({ ...parsed, ...live })
                );
                router.replace(`/booking-success?booking=${successData}`);
              } else {
                setBookingData(parsed);
              }
            })
            .catch(() => setBookingData(parsed)); // fallback: show payment page on API error
        });
      } catch (error) {
        router.push('/search');
      }
    } else {
      router.push('/search');
    }
  }, [searchParams, router, user, loading]);

  const paymentMethods = [
    { id: 'PESAPAL', name: 'PesaPal (MTN MoMo / Airtel / Card)', icon: CreditCard, color: 'text-purple-600', description: 'Pay via PesaPal — supports MTN Mobile Money, Airtel Money, Visa & Mastercard' },
    { id: 'CASH', name: 'Cash Payment (Over the Counter)', icon: Banknote, color: 'text-green-600', description: 'Pay at operator office or at boarding' },
  ];

  const handlePayment = async () => {
    if (!user) {
      setErrorMessage('Please sign in to complete payment');
      setPaymentStatus('failed');
      return;
    }

    if (!phoneNumber && selectedMethod !== 'PESAPAL' && selectedMethod !== 'CASH') {
      notificationService.showWarning('Phone Number Required', 'Please enter your phone number to proceed with payment');
      return;
    }

    setProcessing(true);
    setPaymentStatus('processing');

    try {
      // Always initiate through backend so payment method/status is persisted.
      const paymentRequest = {
        bookingId: bookingData.id as string,
        method: selectedMethod,
        ...(phoneNumber ? { phoneNumber } : {}),
        // Pass total for multi-seat bookings (backend uses it instead of single-booking amount)
        ...(bookingData.totalAmount ? { totalAmount: bookingData.totalAmount } : {})
      };

      const response = await paymentApi.initiate(paymentRequest);
      
      if (response && response.paymentId) {
        setPaymentId(response.paymentId);

        // Redirect-based providers (PesaPal, Flutterwave hosted) return a checkoutUrl
        if (response.checkoutUrl) {
          window.location.href = response.checkoutUrl;
          return;
        }
        
        // Cash flow remains pending until operator marks it paid.
        if (selectedMethod === 'CASH' && response.status === 'PENDING') {
          setPaymentStatus('success');
          notificationService.showSuccess('Cash Payment Registered', 'Please pay at the operator office or boarding point.');

          setTimeout(() => {
            const successData = encodeURIComponent(JSON.stringify({
              ...bookingData,
              paymentStatus: 'PENDING',
              paymentMethod: 'CASH',
              paymentId: response.paymentId,
              paymentRef: response.paymentReference,
              isCashPayment: true,
              qrCode: response.qrCode || bookingData.qrCode
            }));
            router.push(`/booking-success?booking=${successData}`);
          }, 1200);
        } else if (response.status === 'COMPLETED') {
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
        errorMsg = 'Please sign in to complete payment';
        setErrorMessage(errorMsg);
        setTimeout(() => router.push('/login'), 2000);
      } else if (error.response?.status === 403) {
        errorMsg = 'Authentication failed. Please sign in again.';
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
                {selectedMethod === 'CASH' ? (
                  <div className="space-y-3">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h4 className="font-semibold text-green-900 mb-3 flex items-center">
                        <Banknote className="h-5 w-5 mr-2" />
                        Cash Payment Instructions
                      </h4>
                      <ul className="text-sm text-green-800 space-y-2">
                        <li className="flex items-start">
                          <span className="mr-2">✓</span>
                          <span>Visit the bus operator office before departure</span>
                        </li>
                        <li className="flex items-start">
                          <span className="mr-2">✓</span>
                          <span>Show your booking reference to the cashier</span>
                        </li>
                        <li className="flex items-start">
                          <span className="mr-2">✓</span>
                          <span>Complete payment and receive your ticket</span>
                        </li>
                        <li className="flex items-start">
                          <span className="mr-2">✓</span>
                          <span>You can also pay at the boarding point</span>
                        </li>
                      </ul>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-sm text-blue-800">
                        <strong>Note:</strong> Your booking is confirmed. Payment will be completed at the operator office or when you board the bus.
                      </p>
                    </div>
                  </div>
                ) : selectedMethod === 'PESAPAL' ? (
                  <div className="space-y-4">
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <h4 className="font-semibold text-purple-900 mb-2 flex items-center">
                        <CreditCard className="h-5 w-5 mr-2" />
                        PesaPal Secure Checkout
                      </h4>
                      <p className="text-sm text-purple-800">
                        You will be redirected to the PesaPal secure payment page where you can pay by card, bank transfer, or mobile money.
                      </p>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-sm text-blue-800">
                        <strong>Note:</strong> After completing payment on PesaPal, you will be returned here automatically.
                      </p>
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

export default function PaymentPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>}>
      <PaymentContent />
    </Suspense>
  );
}