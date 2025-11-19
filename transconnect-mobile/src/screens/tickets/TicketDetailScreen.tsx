import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';

export default function TicketDetailScreen({ route, navigation }: any) {
  const { booking } = route.params;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.ticketCard}>
          <View style={styles.ticketHeader}>
            <Text style={styles.ticketTitle}>Your Ticket</Text>
            <View style={[
              styles.statusBadge,
              { backgroundColor: booking.status === 'confirmed' ? '#10B981' : '#6B7280' }
            ]}>
              <Text style={styles.statusText}>
                {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
              </Text>
            </View>
          </View>

          <View style={styles.qrContainer}>
            <QRCode
              value={booking.ticketNumber}
              size={150}
              backgroundColor="#FFFFFF"
              color="#000000"
            />
            <Text style={styles.ticketNumber}>{booking.ticketNumber}</Text>
          </View>

          <View style={styles.ticketDetails}>
            <View style={styles.routeHeader}>
              <Text style={styles.routeText}>{booking.from} → {booking.to}</Text>
              <Text style={styles.operatorText}>{booking.operator}</Text>
            </View>

            <View style={styles.detailsGrid}>
              <View style={styles.detailItem}>
                <Ionicons name="calendar-outline" size={20} color="#6B7280" />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Date</Text>
                  <Text style={styles.detailValue}>{booking.date}</Text>
                </View>
              </View>

              <View style={styles.detailItem}>
                <Ionicons name="time-outline" size={20} color="#6B7280" />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Departure</Text>
                  <Text style={styles.detailValue}>{booking.time}</Text>
                </View>
              </View>

              <View style={styles.detailItem}>
                <Ionicons name="card-outline" size={20} color="#6B7280" />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Amount Paid</Text>
                  <Text style={styles.detailValue}>UGX {booking.price.toLocaleString()}</Text>
                </View>
              </View>

              <View style={styles.detailItem}>
                <Ionicons name="receipt-outline" size={20} color="#6B7280" />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Booking ID</Text>
                  <Text style={styles.detailValue}>{booking.id}</Text>
                </View>
              </View>
            </View>
          </View>

          {booking.status === 'confirmed' && (
            <View style={styles.instructions}>
              <Text style={styles.instructionsTitle}>Important Instructions</Text>
              <Text style={styles.instructionsText}>
                • Present this QR code to the conductor when boarding{'\n'}
                • Arrive at the station 30 minutes before departure{'\n'}
                • Keep your phone charged for ticket verification{'\n'}
                • Contact support if you face any issues
              </Text>
            </View>
          )}

          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.shareButton}>
              <Ionicons name="share-outline" size={20} color="#3B82F6" />
              <Text style={styles.shareButtonText}>Share</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.downloadButton}>
              <Ionicons name="download-outline" size={20} color="#10B981" />
              <Text style={styles.downloadButtonText}>Download</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.supportButton}>
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