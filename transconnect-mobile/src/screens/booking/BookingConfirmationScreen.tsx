import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import QRCode from 'react-native-qrcode-svg';
import { notificationService } from '../../services/notificationService';

export default function BookingConfirmationScreen({ route, navigation }: any) {
  const { booking, route: routeData, searchParams, paymentRef, isCashPayment } = route.params;
  const [qrData, setQrData] = useState('');

  useEffect(() => {
    // Generate QR code data
    const qrCodeData = JSON.stringify({
      bookingId: booking?.id,
      seatNumber: booking?.seatNumber,
      route: `${searchParams.from} → ${searchParams.to}`,
      date: searchParams.date,
      reference: paymentRef,
    });
    setQrData(qrCodeData);

    // Schedule trip reminder notifications
    scheduleNotifications();
  }, [booking]);

  const scheduleNotifications = async () => {
    try {
      console.log('🔔 Scheduling trip notifications...');
      
      const notificationIds = await notificationService.scheduleAllTripNotifications(
        searchParams.date,
        routeData?.departureTime || '09:00',
        searchParams.from,
        searchParams.to,
        paymentRef
      );

      console.log('✅ Notifications scheduled:', notificationIds);
    } catch (error) {
      console.error('❌ Error scheduling notifications:', error);
      // Don't block the user if notifications fail
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `TransConnect Booking\n\nRoute: ${searchParams.from} → ${searchParams.to}\nSeat: ${booking?.seatNumber}\nReference: ${paymentRef}\n\nShow this QR code when boarding.`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleViewTicket = () => {
    navigation.navigate('TicketDetail', {
      booking,
      route: routeData,
      searchParams,
      paymentRef,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Success Header */}
        <View style={styles.successHeader}>
          <View style={styles.checkmarkCircle}>
            <Ionicons name="checkmark" size={60} color="#FFFFFF" />
          </View>
          <Text style={styles.successTitle}>Booking Confirmed!</Text>
          <Text style={styles.successSubtitle}>
            {isCashPayment 
              ? 'Please pay at our office or agent location'
              : 'Your payment has been processed successfully'}
          </Text>
        </View>

        {/* QR Code Card */}
        <View style={styles.qrCard}>
          <Text style={styles.qrTitle}>Your Ticket QR Code</Text>
          <Text style={styles.qrSubtitle}>Show this when boarding</Text>
          
          <View style={styles.qrContainer}>
            {qrData ? (
              <QRCode
                value={qrData}
                size={200}
                backgroundColor="white"
                color="black"
              />
            ) : (
              <View style={styles.qrPlaceholder}>
                <Ionicons name="qr-code-outline" size={80} color="#D1D5DB" />
              </View>
            )}
          </View>

          <Text style={styles.reference}>Ref: {paymentRef}</Text>
        </View>

        {/* Booking Details Card */}
        <View style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>Trip Details</Text>
          
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Ionicons name="location" size={20} color="#3B82F6" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Route</Text>
              <Text style={styles.detailValue}>
                {searchParams.from} → {searchParams.to}
              </Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Ionicons name="calendar" size={20} color="#3B82F6" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Travel Date</Text>
              <Text style={styles.detailValue}>
                {searchParams.date ? format(new Date(searchParams.date), 'EEEE, MMM dd, yyyy') : 'Date pending'}
              </Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Ionicons name="time" size={20} color="#3B82F6" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Departure Time</Text>
              <Text style={styles.detailValue}>{routeData?.departureTime || 'TBA'}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Ionicons name="person" size={20} color="#3B82F6" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Seat Number</Text>
              <Text style={styles.detailValue}>{booking?.seatNumber || 'N/A'}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Ionicons name="bus" size={20} color="#3B82F6" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Bus</Text>
              <Text style={styles.detailValue}>{routeData?.bus?.plateNumber || routeData?.busPlate || 'TBA'}</Text>
            </View>
          </View>

          {isCashPayment && (
            <View style={styles.cashNotice}>
              <Ionicons name="information-circle" size={20} color="#F59E0B" />
              <Text style={styles.cashNoticeText}>
                Please pay at our office before your travel date. Your booking will be confirmed upon payment.
              </Text>
            </View>
          )}
        </View>

        {/* Trip Reminder Info */}
        <View style={styles.reminderInfo}>
          <Ionicons name="notifications-outline" size={20} color="#3B82F6" />
          <View style={styles.reminderTextContainer}>
            <Text style={styles.reminderTitle}>Trip Reminders Set</Text>
            <Text style={styles.reminderText}>
              We'll notify you 1 day before and 2 hours before your departure time.
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.primaryButton} onPress={handleViewTicket}>
            <Ionicons name="ticket-outline" size={20} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>View Full Ticket</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={handleShare}>
            <Ionicons name="share-social-outline" size={20} color="#3B82F6" />
            <Text style={styles.secondaryButtonText}>Share Ticket</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.outlineButton} 
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.outlineButtonText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  successHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  checkmarkCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  qrCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  qrTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  qrSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
  },
  qrContainer: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  qrPlaceholder: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reference: {
    marginTop: 16,
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    fontFamily: 'monospace',
  },
  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detailIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  cashNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  cashNoticeText: {
    flex: 1,
    fontSize: 14,
    color: '#92400E',
    marginLeft: 8,
  },
  reminderInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EFF6FF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    gap: 12,
  },
  reminderTextContainer: {
    flex: 1,
  },
  reminderTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  reminderText: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  actions: {
    gap: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryButtonText: {
    color: '#3B82F6',
    fontSize: 16,
    fontWeight: '600',
  },
  outlineButton: {
    borderWidth: 2,
    borderColor: '#E5E7EB',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
  },
});