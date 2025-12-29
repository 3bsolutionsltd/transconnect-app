import React, { useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Share,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { format } from 'date-fns';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import ViewShot from 'react-native-view-shot';

export default function TicketDetailScreen({ route, navigation }: any) {
  const { booking } = route.params;
  const viewShotRef = useRef<ViewShot>(null);

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'CONFIRMED':
        return '#10B981';
      case 'PENDING':
        return '#F59E0B';
      case 'CANCELLED':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const getStatusText = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  };

  const handleShare = async () => {
    try {
      const message = `TransConnect Ticket
Booking ID: ${booking.id.slice(0, 8)}
Route: ${booking.route?.origin || booking.boardingStop} → ${booking.route?.destination || booking.alightingStop}
Date: ${format(new Date(booking.travelDate), 'MMM dd, yyyy')}
Time: ${booking.route?.departureTime || 'TBA'}
Amount: UGX ${(booking.totalAmount || 0).toLocaleString()}
Status: ${getStatusText(booking.status)}`;

      await Share.share({
        message,
        title: 'TransConnect Ticket',
      });
    } catch (error) {
      console.error('Error sharing ticket:', error);
    }
  };

  const handleDownload = async () => {
    try {
      if (!viewShotRef.current) {
        Alert.alert('Error', 'Unable to capture ticket. Please try again.');
        return;
      }

      // Capture the ticket as an image
      const uri = await viewShotRef.current.capture();
      
      // Create a filename with booking ID
      const filename = `TransConnect_Ticket_${booking.id.slice(0, 8)}.jpg`;
      const fileUri = `${FileSystem.documentDirectory}${filename}`;
      
      // Copy to a permanent location
      await FileSystem.copyAsync({
        from: uri,
        to: fileUri,
      });

      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync();
      
      if (isAvailable) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'image/jpeg',
          dialogTitle: 'Save Your Ticket',
          UTI: 'public.jpeg',
        });
        
        Alert.alert('Success', 'Ticket saved! You can now access it offline.');
      } else {
        Alert.alert('Success', `Ticket saved to: ${fileUri}`);
      }
    } catch (error) {
      console.error('Error downloading ticket:', error);
      Alert.alert('Error', 'Failed to download ticket. Please try again.');
    }
  };

  const handleHelp = () => {
    Alert.alert(
      'Need Help?',
      'Contact our support team:\n\nPhone: +256 39451710\nEmail: support@transconnect.app',
      [{ text: 'OK' }]
    );
  };

  // Generate QR code data with booking info
  const qrData = JSON.stringify({
    bookingId: booking.id,
    userId: booking.userId,
    routeId: booking.routeId,
    travelDate: booking.travelDate,
    seats: booking.seats || booking.passengerCount,
    status: booking.status,
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ticket Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <ViewShot ref={viewShotRef} options={{ format: 'jpg', quality: 0.9 }}>
          <View style={styles.ticketCard}>
            <View style={styles.ticketHeader}>
              <Text style={styles.ticketTitle}>Your Ticket</Text>
              <View style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(booking.status) }
              ]}>
                <Text style={styles.statusText}>
                  {getStatusText(booking.status)}
                </Text>
              </View>
            </View>

            <View style={styles.qrContainer}>
              <QRCode
                value={qrData}
                size={200}
                backgroundColor="#FFFFFF"
                color="#000000"
              />
              <Text style={styles.ticketNumber}>#{booking.id.slice(0, 8).toUpperCase()}</Text>
            </View>

          <View style={styles.ticketDetails}>
            <View style={styles.routeHeader}>
              <Text style={styles.routeText}>
                {booking.route?.origin || booking.boardingStop} → {booking.route?.destination || booking.alightingStop}
              </Text>
              <Text style={styles.operatorText}>
                {booking.route?.operator?.companyName || 'TransConnect'}
              </Text>
            </View>

            <View style={styles.detailsGrid}>
              <View style={styles.detailItem}>
                <Ionicons name="calendar-outline" size={20} color="#6B7280" />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Travel Date</Text>
                  <Text style={styles.detailValue}>
                    {format(new Date(booking.travelDate), 'EEEE, MMM dd, yyyy')}
                  </Text>
                </View>
              </View>

              <View style={styles.detailItem}>
                <Ionicons name="time-outline" size={20} color="#6B7280" />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Departure Time</Text>
                  <Text style={styles.detailValue}>{booking.route?.departureTime || 'TBA'}</Text>
                </View>
              </View>

              <View style={styles.detailItem}>
                <Ionicons name="location-outline" size={20} color="#6B7280" />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Boarding Point</Text>
                  <Text style={styles.detailValue}>{booking.boardingStop}</Text>
                </View>
              </View>

              <View style={styles.detailItem}>
                <Ionicons name="location-outline" size={20} color="#6B7280" />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Alighting Point</Text>
                  <Text style={styles.detailValue}>{booking.alightingStop}</Text>
                </View>
              </View>

              <View style={styles.detailItem}>
                <Ionicons name="people-outline" size={20} color="#6B7280" />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Passengers</Text>
                  <Text style={styles.detailValue}>{booking.passengerCount || booking.seats?.length || 1}</Text>
                </View>
              </View>

              <View style={styles.detailItem}>
                <Ionicons name="card-outline" size={20} color="#6B7280" />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Amount Paid</Text>
                  <Text style={styles.detailValue}>UGX {(booking.totalAmount || 0).toLocaleString()}</Text>
                </View>
              </View>

              <View style={styles.detailItem}>
                <Ionicons name="receipt-outline" size={20} color="#6B7280" />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Payment Method</Text>
                  <Text style={styles.detailValue}>
                    {booking.paymentMethod === 'CASH' ? 'Cash/Over the Counter' : booking.paymentMethod?.replace(/_/g, ' ')}
                  </Text>
                </View>
              </View>

              <View style={styles.detailItem}>
                <Ionicons name="information-circle-outline" size={20} color="#6B7280" />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Booking ID</Text>
                  <Text style={styles.detailValue}>{booking.id.slice(0, 16)}...</Text>
                </View>
              </View>
            </View>
          </View>

          {booking.status === 'CONFIRMED' && (
            <View style={styles.instructions}>
              <Text style={styles.instructionsTitle}>✓ Important Instructions</Text>
              <Text style={styles.instructionsText}>
                • Present this QR code to the conductor when boarding{'\n'}
                • Arrive at the station 30 minutes before departure{'\n'}
                • Keep your phone charged for ticket verification{'\n'}
                • Contact support if you face any issues
              </Text>
            </View>
          )}

          {booking.status === 'PENDING' && booking.paymentMethod === 'CASH' && (
            <View style={[styles.instructions, { backgroundColor: '#FEF3C7' }]}>
              <Text style={[styles.instructionsTitle, { color: '#92400E' }]}>⏳ Payment Pending</Text>
              <Text style={[styles.instructionsText, { color: '#92400E' }]}>
                Please complete your payment at the operator's office or designated payment point. Show this ticket to the cashier.{'\n\n'}
                Your booking will be confirmed once payment is verified.
              </Text>
            </View>
          )}
          </View>
        </ViewShot>

        <View style={styles.actionButtonsContainer}>
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
              <Ionicons name="share-outline" size={20} color="#3B82F6" />
              <Text style={styles.shareButtonText}>Share</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.downloadButton} onPress={handleDownload}>
              <Ionicons name="download-outline" size={20} color="#10B981" />
              <Text style={styles.downloadButtonText}>Download</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.supportButton} onPress={handleHelp}>
          <Ionicons name="help-circle-outline" size={20} color="#6B7280" />
          <Text style={styles.supportButtonText}>Need Help?</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
  },
  ticketCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6.84,
    elevation: 8,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  ticketTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 20,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  ticketNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
  },
  ticketDetails: {
    marginBottom: 24,
  },
  routeHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  routeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  operatorText: {
    fontSize: 16,
    color: '#6B7280',
  },
  detailsGrid: {
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailContent: {
    marginLeft: 12,
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  instructions: {
    backgroundColor: '#FEF3C7',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 14,
    color: '#92400E',
    lineHeight: 20,
  },
  actionButtonsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF8FF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  shareButtonText: {
    color: '#3B82F6',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  downloadButtonText: {
    color: '#10B981',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  supportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: 12,
  },
  supportButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});