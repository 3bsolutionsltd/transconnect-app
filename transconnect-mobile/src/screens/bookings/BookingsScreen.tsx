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

export default function BookingsScreen({ navigation }: any) {
  // Mock booking data - will be replaced with real API data
  const bookings = [
    {
      id: '1',
      from: 'Kampala',
      to: 'Mbale',
      date: '2024-01-15',
      time: '08:30',
      status: 'confirmed',
      ticketNumber: 'TC001234',
      operator: 'Swift Safaris',
      price: 25000,
    },
    {
      id: '2',
      from: 'Jinja', 
      to: 'Kampala',
      date: '2024-01-10',
      time: '14:00',
      status: 'completed',
      ticketNumber: 'TC001233',
      operator: 'Gateway Bus',
      price: 15000,
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return '#10B981';
      case 'completed':
        return '#6B7280';
      case 'cancelled':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const getStatusText = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Bookings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {bookings.length > 0 ? (
          bookings.map((booking) => (
            <TouchableOpacity
              key={booking.id}
              style={styles.bookingCard}
              onPress={() => navigation.navigate('TicketDetail', { booking })}
            >
              <View style={styles.bookingHeader}>
                <Text style={styles.ticketNumber}>#{booking.ticketNumber}</Text>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(booking.status) + '20' }
                ]}>
                  <Text style={[
                    styles.statusText,
                    { color: getStatusColor(booking.status) }
                  ]}>
                    {getStatusText(booking.status)}
                  </Text>
                </View>
              </View>

              <View style={styles.routeInfo}>
                <View style={styles.routeRow}>
                  <Text style={styles.routeText}>{booking.from} → {booking.to}</Text>
                </View>
                <Text style={styles.operatorText}>{booking.operator}</Text>
              </View>

              <View style={styles.travelInfo}>
                <View style={styles.infoRow}>
                  <Ionicons name="calendar-outline" size={16} color="#6B7280" />
                  <Text style={styles.infoText}>{booking.date}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="time-outline" size={16} color="#6B7280" />
                  <Text style={styles.infoText}>{booking.time}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="card-outline" size={16} color="#6B7280" />
                  <Text style={styles.infoText}>UGX {booking.price.toLocaleString()}</Text>
                </View>
              </View>

              <View style={styles.actionRow}>
                {booking.status === 'confirmed' && (
                  <TouchableOpacity 
                    style={styles.viewTicketButton}
                    onPress={() => navigation.navigate('TicketDetail', { booking })}
                  >
                    <Ionicons name="qr-code-outline" size={16} color="#3B82F6" />
                    <Text style={styles.viewTicketText}>View Ticket</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.detailsButton}>
                  <Text style={styles.detailsButtonText}>Details</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No bookings yet</Text>
            <Text style={styles.emptyText}>
              When you book your first trip, it will appear here.
            </Text>
            <TouchableOpacity
              style={styles.bookNowButton}
              onPress={() => navigation.navigate('Home')}
            >
              <Text style={styles.bookNowButtonText}>Book Your First Trip</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
  },
  bookingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  ticketNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  routeInfo: {
    marginBottom: 12,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  operatorText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  travelInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  viewTicketButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF8FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 8,
  },
  viewTicketText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '600',
    marginLeft: 4,
  },
  detailsButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  detailsButtonText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  bookNowButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  bookNowButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});