import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { bookingsApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { offlineStorage } from '../../services/offlineStorage';
import { notificationService } from '../../services/notificationService';
import { format } from 'date-fns';

type PaymentMethod = 'mtn' | 'airtel' | 'card' | 'cash';

export default function PaymentScreen({ route, navigation }: any) {
  const { route: routeData, passengers, searchParams, selectedSeats, totalAmount } = route.params;
  const { user } = useAuth();
  
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>('cash');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'success' | 'failed'>('pending');

  const paymentMethods = [
    {
      id: 'mtn' as PaymentMethod,
      name: 'MTN Mobile Money',
      icon: 'phone-portrait-outline',
      color: '#FFCB05',
      textColor: '#000000',
      description: 'Pay with MTN MoMo',
    },
    {
      id: 'airtel' as PaymentMethod,
      name: 'Airtel Money',
      icon: 'phone-portrait-outline',
      color: '#ED1C24',
      textColor: '#FFFFFF',
      description: 'Pay with Airtel Money',
    },
    {
      id: 'cash' as PaymentMethod,
      name: 'Cash / Over the Counter',
      icon: 'cash-outline',
      color: '#10B981',
      textColor: '#FFFFFF',
      description: 'Pay at our office or agent',
    },
    {
      id: 'card' as PaymentMethod,
      name: 'Debit/Credit Card',
      icon: 'card-outline',
      color: '#3B82F6',
      textColor: '#FFFFFF',
      description: 'Visa, Mastercard',
    },
  ];

  const handlePayment = async () => {
    if (!selectedMethod) {
      Alert.alert('Error', 'Please select a payment method');
      return;
    }

    if ((selectedMethod === 'mtn' || selectedMethod === 'airtel') && !phoneNumber) {
      Alert.alert('Error', 'Please enter your phone number');
      return;
    }

    if (phoneNumber && !/^256\d{9}$/.test(phoneNumber.replace(/\s/g, ''))) {
      Alert.alert('Error', 'Please enter a valid phone number (e.g., 256701234567)');
      return;
    }

    // Check for duplicate bookings
    try {
      const existingBookings = await offlineStorage.getBookings();
      const travelDateString = typeof searchParams.date === 'string' 
        ? searchParams.date 
        : new Date(searchParams.date).toISOString().split('T')[0];
      
      const duplicateBooking = existingBookings.find(booking => 
        booking.routeId === routeData.id &&
        booking.travelDate.split('T')[0] === travelDateString &&
        booking.status !== 'CANCELLED'
      );

      if (duplicateBooking) {
        Alert.alert(
          'Duplicate Booking',
          `You already have a booking for this route on ${format(new Date(travelDateString), 'MMM dd, yyyy')}. Please check your bookings.`,
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'View Booking', 
              onPress: () => {
                navigation.navigate('Bookings');
              }
            }
          ]
        );
        return;
      }
    } catch (err) {
      console.log('Error checking for duplicates:', err);
    }

    setLoading(true);
    setShowPaymentModal(true);
    setPaymentStatus('pending');

    try {
      // Map payment method to backend format
      const methodMap: Record<PaymentMethod, string> = {
        mtn: 'MTN_MOBILE_MONEY',
        airtel: 'AIRTEL_MONEY',
        card: 'FLUTTERWAVE',
        cash: 'CASH',
      };

      // Format travel date to ISO string
      const travelDate = typeof searchParams.date === 'string' 
        ? searchParams.date 
        : new Date(searchParams.date).toISOString();

      // Generate passenger data - if passengers is a number, create array of passenger objects
      const passengerCount = typeof passengers === 'number' ? passengers : 1;
      const passengerData = Array.from({ length: passengerCount }, (_, i) => ({
        firstName: user?.firstName || user?.name?.split(' ')[0] || 'Passenger',
        lastName: user?.lastName || user?.name?.split(' ')[1] || `${i + 1}`,
      }));

      // Create booking
      const bookingData = {
        routeId: routeData.id,
        seatNumbers: selectedSeats,
        travelDate,
        passengers: passengerData,
        boardingStop: searchParams.from,
        alightingStop: searchParams.to,
      };

      const response = await bookingsApi.createBooking(bookingData);
      const createdBooking = response.data.bookings?.[0] || response.data;
      
      // Save booking to offline storage immediately
      await offlineStorage.saveBooking(createdBooking);
      
      // Handle cash payments differently - no payment API call needed
      if (selectedMethod === 'cash') {
        setPaymentStatus('success');
        setLoading(false);

        // Send booking confirmation notification
        await notificationService.sendBookingConfirmation(
          searchParams.from,
          searchParams.to,
          format(new Date(travelDate), 'MMM dd, yyyy'),
          createdBooking.id.slice(0, 8)
        );

        // Schedule trip reminder
        await notificationService.scheduleTripReminder(
          travelDate,
          searchParams.from,
          searchParams.to,
          routeData.departureTime
        );

        setTimeout(() => {
          setShowPaymentModal(false);
          navigation.navigate('BookingConfirmation', {
            booking: createdBooking,
            route: routeData,
            searchParams,
            paymentRef: 'CASH-' + createdBooking.id,
            isCashPayment: true,
          });
        }, 1500);
        return;
      }
      
      // For online payments (MTN, Airtel, Card), initiate payment
      const paymentData = {
        bookingId: createdBooking.id,
        method: methodMap[selectedMethod],
        phoneNumber: phoneNumber.replace(/\s/g, ''),
      };

      // Call payment API
      const paymentResponse = await bookingsApi.initiatePayment(paymentData);
      
      // Check if payment completed immediately (demo mode)
      if (paymentResponse.data.status === 'COMPLETED') {
        setPaymentStatus('success');
        setLoading(false);

        // Send payment success notification
        await notificationService.sendPaymentSuccess(
          routeData.price * selectedSeats.length,
          paymentResponse.data.payment.reference
        );

        // Send booking confirmation notification
        await notificationService.sendBookingConfirmation(
          searchParams.from,
          searchParams.to,
          format(new Date(travelDate), 'MMM dd, yyyy'),
          paymentResponse.data.booking.id.slice(0, 8)
        );

        // Schedule trip reminder
        await notificationService.scheduleTripReminder(
          travelDate,
          searchParams.from,
          searchParams.to,
          routeData.departureTime
        );

        setTimeout(() => {
          setShowPaymentModal(false);
          navigation.navigate('BookingConfirmation', {
            booking: paymentResponse.data.booking,
            route: routeData,
            searchParams,
            paymentRef: paymentResponse.data.payment.reference,
          });
        }, 1500);
      } else {
        // Payment pending - simulate processing
        await new Promise(resolve => setTimeout(resolve, 3000));

        setPaymentStatus('success');
        setLoading(false);

        setTimeout(() => {
          setShowPaymentModal(false);
          navigation.navigate('BookingConfirmation', {
            booking: createdBooking,
            route: routeData,
            searchParams,
            paymentRef: paymentResponse.data.reference,
          });
        }, 1500);
      }

    } catch (error: any) {
      setPaymentStatus('failed');
      setLoading(false);
      
      // Check for specific error types
      let errorMessage = 'Unable to process payment. Please try again.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      // Handle seat already booked error
      if (errorMessage.toLowerCase().includes('seat') && 
          (errorMessage.toLowerCase().includes('booked') || 
           errorMessage.toLowerCase().includes('taken') ||
           errorMessage.toLowerCase().includes('unavailable'))) {
        setTimeout(() => {
          setShowPaymentModal(false);
          Alert.alert(
            'Seats Unavailable',
            'One or more selected seats have been booked by another user. Please select different seats.',
            [
              {
                text: 'Select Again',
                onPress: () => navigation.goBack()
              }
            ]
          );
        }, 1500);
        return;
      }
      
      // Handle duplicate booking error
      if (errorMessage.toLowerCase().includes('duplicate') || 
          errorMessage.toLowerCase().includes('already booked')) {
        setTimeout(() => {
          setShowPaymentModal(false);
          Alert.alert(
            'Duplicate Booking',
            errorMessage,
            [
              { text: 'Cancel', style: 'cancel' },
              { 
                text: 'View Bookings', 
                onPress: () => navigation.navigate('Bookings')
              }
            ]
          );
        }, 1500);
        return;
      }
      
      setTimeout(() => {
        setShowPaymentModal(false);
        Alert.alert(
          'Payment Failed',
          errorMessage,
          [
            { text: 'OK' }
          ]
        );
      }, 1500);
    }
  };

  const renderPaymentMethod = (method: typeof paymentMethods[0]) => {
    const isSelected = selectedMethod === method.id;
    
    return (
      <TouchableOpacity
        key={method.id}
        style={[
          styles.paymentMethod,
          isSelected && styles.paymentMethodSelected,
        ]}
        onPress={() => setSelectedMethod(method.id)}
      >
        <View style={styles.paymentMethodContent}>
          <View
            style={[
              styles.paymentIcon,
              { backgroundColor: method.color },
            ]}
          >
            <Ionicons name={method.icon} size={24} color={method.textColor} />
          </View>
          <Text style={styles.paymentMethodName}>{method.name}</Text>
        </View>
        <View
          style={[
            styles.radio,
            isSelected && styles.radioSelected,
          ]}
        >
          {isSelected && <View style={styles.radioDot} />}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Booking Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.sectionTitle}>Booking Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Route</Text>
            <Text style={styles.summaryValue}>
              {searchParams.from} → {searchParams.to}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Bus</Text>
            <Text style={styles.summaryValue}>{routeData.bus.plateNumber}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Seats</Text>
            <Text style={styles.summaryValue}>{selectedSeats.join(', ')}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Passengers</Text>
            <Text style={styles.summaryValue}>{passengers}</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>
              UGX {totalAmount.toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Payment Methods */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Payment Method</Text>
          {paymentMethods.map(method => renderPaymentMethod(method))}
        </View>

        {/* Phone Number Input (for mobile money) */}
        {(selectedMethod === 'mtn' || selectedMethod === 'airtel') && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Phone Number</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="phone-portrait-outline" size={20} color="#6B7280" />
              <TextInput
                style={styles.input}
                placeholder="256701234567"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
                maxLength={12}
              />
            </View>
            <Text style={styles.inputHint}>
              Enter your {selectedMethod === 'mtn' ? 'MTN' : 'Airtel'} Mobile Money number
            </Text>
          </View>
        )}

        {/* Card Input (placeholder for now) */}
        {selectedMethod === 'card' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Card Details</Text>
            <View style={styles.comingSoonBox}>
              <Ionicons name="information-circle-outline" size={20} color="#3B82F6" />
              <Text style={styles.comingSoonText}>
                Card payments coming soon. Please use Mobile Money for now.
              </Text>
            </View>
          </View>
        )}

        {/* Security Notice */}
        <View style={styles.securityNotice}>
          <Ionicons name="shield-checkmark-outline" size={24} color="#10B981" />
          <View style={styles.securityTextContainer}>
            <Text style={styles.securityTitle}>Secure Payment</Text>
            <Text style={styles.securityText}>
              Your payment information is encrypted and secure
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Pay Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.payButton,
            (!selectedMethod || (selectedMethod === 'card')) && styles.payButtonDisabled,
          ]}
          onPress={handlePayment}
          disabled={!selectedMethod || loading || selectedMethod === 'card'}
        >
          {loading ? (
            <>
              <ActivityIndicator color="#FFFFFF" />
              <Text style={styles.payButtonText}>Processing...</Text>
            </>
          ) : (
            <>
              <Text style={styles.payButtonText}>
                Pay UGX {totalAmount.toLocaleString()}
              </Text>
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Payment Modal */}
      <Modal
        visible={showPaymentModal}
        transparent
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {paymentStatus === 'pending' && (
              <>
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text style={styles.modalTitle}>Processing Payment</Text>
                <Text style={styles.modalText}>
                  {selectedMethod === 'mtn' 
                    ? 'Please approve the payment on your phone...' 
                    : selectedMethod === 'airtel'
                    ? 'Please enter your Airtel Money PIN...'
                    : 'Processing your payment...'}
                </Text>
              </>
            )}
            {paymentStatus === 'success' && (
              <>
                <View style={styles.successIcon}>
                  <Ionicons name="checkmark-circle" size={64} color="#10B981" />
                </View>
                <Text style={styles.modalTitle}>Payment Successful!</Text>
                <Text style={styles.modalText}>Your booking has been confirmed</Text>
              </>
            )}
            {paymentStatus === 'failed' && (
              <>
                <View style={styles.errorIcon}>
                  <Ionicons name="close-circle" size={64} color="#EF4444" />
                </View>
                <Text style={styles.modalTitle}>Payment Failed</Text>
                <Text style={styles.modalText}>Please try again</Text>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginHorizontal: 20,
    marginTop: 16,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#3B82F6',
  },
  paymentMethodsCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  paymentMethod: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    marginBottom: 12,
  },
  paymentMethodSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  paymentMethodContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  paymentIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentMethodName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    borderColor: '#3B82F6',
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#3B82F6',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  inputHint: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
  },
  comingSoonBox: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  comingSoonText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#1E40AF',
  },
  phoneInputContainer: {
    marginTop: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  phoneInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  securityNotice: {
    flexDirection: 'row',
    backgroundColor: '#F0FDF4',
    padding: 16,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  securityTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  securityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#166534',
    marginBottom: 4,
  },
  securityText: {
    fontSize: 12,
    color: '#15803D',
  },
  footer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  payButton: {
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
  },
  payButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  payButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    minWidth: 280,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  modalText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  successIcon: {
    marginBottom: 8,
  },
  errorIcon: {
    marginBottom: 8,
  },
});