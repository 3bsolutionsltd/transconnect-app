import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { format, isSameDay } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { bookingsApi } from '../../services/api';
import { offlineStorage } from '../../services/offlineStorage';

export default function RouteDetailsScreen({ route, navigation }: any) {
  const { route: routeData, passengers, searchParams } = route.params || {};
  const [hasDuplicateBooking, setHasDuplicateBooking] = useState(false);

  // Validate required data
  useEffect(() => {
    console.log('RouteDetailsScreen mounted with params:', {
      hasRouteData: !!routeData,
      hasPassengers: !!passengers,
      hasSearchParams: !!searchParams,
      routeData: routeData ? {
        id: routeData.id,
        origin: routeData.origin,
        destination: routeData.destination,
        operatorName: routeData.operatorName,
        departureTime: routeData.departureTime
      } : null
    });

    if (!routeData || !passengers || !searchParams) {
      console.error('Missing required params:', { routeData: !!routeData, passengers, searchParams });
      Alert.alert(
        'Error',
        'Missing route information. Please try searching again.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
      return;
    }

    if (!routeData.departureTime || !routeData.operatorName) {
      console.error('Invalid route data:', routeData);
      Alert.alert(
        'Error',
        'Invalid route data. Please try searching again.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
      return;
    }
  }, []);

  // Return early if data is invalid to prevent crashes
  if (!routeData || !passengers || !searchParams) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorText}>Unable to load route details</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Fetch user's existing bookings to check for duplicates
  const { data: userBookings } = useQuery({
    queryKey: ['my-bookings-check'],
    queryFn: async () => {
      try {
        const response = await bookingsApi.getBookings();
        return response.data;
      } catch (error) {
        console.log('Error fetching bookings:', error);
        const offlineData = await offlineStorage.getBookings();
        return offlineData;
      }
    },
  });

  useEffect(() => {
    checkForDuplicateBooking();
  }, [userBookings]);

  const checkForDuplicateBooking = () => {
    if (!userBookings || userBookings.length === 0) {
      console.log('No existing bookings found');
      return;
    }

    console.log('Checking for duplicates:', {
      searchFrom: searchParams.from,
      searchTo: searchParams.to,
      searchDate: searchParams.date,
      routeOperatorId: routeData.operator?.id,
      routeOperatorName: routeData.operator?.companyName || routeData.operatorName,
      totalBookings: userBookings.length
    });

    const searchDate = searchParams.date ? new Date(searchParams.date) : new Date();
    
    // Check if user has existing booking for same route, operator, and date
    const duplicate = userBookings.find((booking: any) => {
      console.log('Checking booking:', {
        id: booking.id,
        status: booking.status,
        origin: booking.route?.origin || booking.boardingStop,
        destination: booking.route?.destination || booking.alightingStop,
        operatorId: booking.route?.operator?.id || booking.operatorId,
        operatorName: booking.route?.operator?.companyName || booking.operatorName,
        departureDate: booking.departureDate,
        createdAt: booking.createdAt
      });

      // Handle date comparison - use departureDate or createdAt
      let bookingDate;
      if (booking.departureDate) {
        bookingDate = new Date(booking.departureDate);
      } else if (booking.createdAt) {
        bookingDate = new Date(booking.createdAt);
      } else {
        // If no date info, consider it potentially duplicate (err on side of warning user)
        console.log('⚠️ No date info in booking, treating as potential duplicate');
        bookingDate = searchDate;
      }
      
      // More flexible route matching (case-insensitive)
      const bookingOrigin = (booking.route?.origin || booking.boardingStop || '').toLowerCase().trim();
      const bookingDestination = (booking.route?.destination || booking.alightingStop || '').toLowerCase().trim();
      const searchFrom = (searchParams.from || '').toLowerCase().trim();
      const searchTo = (searchParams.to || '').toLowerCase().trim();
      
      const isSameRoute = bookingOrigin === searchFrom && bookingDestination === searchTo;
      
      // Flexible operator matching
      const bookingOperatorId = booking.route?.operator?.id || booking.operatorId;
      const routeOperatorId = routeData.operator?.id || routeData.operatorId;
      const bookingOperatorName = (booking.route?.operator?.companyName || booking.operatorName || '').toLowerCase();
      const routeOperatorName = (routeData.operator?.companyName || routeData.operatorName || '').toLowerCase();
      
      const isSameOperator = bookingOperatorId === routeOperatorId || 
                            bookingOperatorName === routeOperatorName;
      
      const isSameDate = isSameDay(bookingDate, searchDate);
      const isActive = booking.status === 'CONFIRMED' || booking.status === 'PENDING';

      const isDuplicate = isSameRoute && isSameDate && isActive;
      
      if (isDuplicate) {
        console.log('⚠️ DUPLICATE FOUND:', {
          isSameRoute,
          isSameOperator,
          isSameDate,
          isActive
        });
      }

      return isDuplicate;
    });

    console.log('Duplicate check result:', !!duplicate);
    setHasDuplicateBooking(!!duplicate);
  };

  const handleBookNow = () => {
    if (hasDuplicateBooking) {
      Alert.alert(
        'Existing Booking Found',
        `You already have a booking for ${searchParams.from} → ${searchParams.to} with ${routeData.operator?.companyName || routeData.operatorName} on ${format(new Date(searchParams.date), 'MMM dd, yyyy')}.\n\nDo you want to proceed with another booking?`,
        [
          { text: 'View My Bookings', onPress: () => navigation.navigate('Bookings') },
          { text: 'Book Anyway', onPress: proceedToSeatSelection },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    } else {
      proceedToSeatSelection();
    }
  };

  const proceedToSeatSelection = () => {
    navigation.navigate('SeatSelection', {
      route: routeData,
      passengers,
      searchParams,
    });
  };

  const totalPrice = (routeData.price || 0) * passengers;
  
  // Safe accessors with fallbacks
  const operatorName = routeData.operatorName || routeData.operator?.companyName || 'Unknown Operator';
  const busType = routeData.busType || routeData.bus?.model || 'Standard Bus';
  const departureTime = routeData.departureTime || 'TBD';
  const arrivalTime = routeData.arrivalTime || 'TBD';
  const duration = routeData.duration || 'N/A';
  const availableSeats = routeData.availableSeats ?? routeData.bus?.capacity ?? 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {hasDuplicateBooking && (
          <View style={styles.warningBanner}>
            <Ionicons name="alert-circle" size={20} color="#F59E0B" />
            <Text style={styles.warningText}>
              You already have a booking for this route and date
            </Text>
          </View>
        )}
        
        <View style={styles.headerCard}>
          <View style={styles.operatorHeader}>
            <Text style={styles.operatorName}>{operatorName}</Text>
            <View style={styles.busTypeContainer}>
              <Text style={styles.busType}>{busType}</Text>
            </View>
          </View>

          <View style={styles.routeInfo}>
            <Text style={styles.routeText}>
              {searchParams.from} → {searchParams.to}
            </Text>
            <Text style={styles.dateText}>
              {searchParams.date ? format(new Date(searchParams.date), 'EEEE, MMM dd, yyyy') : 'Date not set'}
            </Text>
          </View>
        </View>

        <View style={styles.journeyCard}>
          <Text style={styles.sectionTitle}>Journey Details</Text>
          
          <View style={styles.journeyInfo}>
            <View style={styles.journeyPoint}>
              <View style={styles.timePoint}>
                <Ionicons name="radio-button-on" size={16} color="#10B981" />
                <View style={styles.timeInfo}>
                  <Text style={styles.journeyTime}>{departureTime}</Text>
                  <Text style={styles.journeyLocation}>{searchParams.from}</Text>
                </View>
              </View>
            </View>

            <View style={styles.journeyLine}>
              <View style={styles.verticalLine} />
              <Text style={styles.durationText}>{duration}</Text>
            </View>

            <View style={styles.journeyPoint}>
              <View style={styles.timePoint}>
                <Ionicons name="location" size={16} color="#EF4444" />
                <View style={styles.timeInfo}>
                  <Text style={styles.journeyTime}>{arrivalTime}</Text>
                  <Text style={styles.journeyLocation}>{searchParams.to}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.detailsCard}>
          <Text style={styles.sectionTitle}>Bus Information</Text>
          
          <View style={styles.detailRow}>
            <Ionicons name="bus-outline" size={20} color="#6B7280" />
            <Text style={styles.detailLabel}>Bus Type</Text>
            <Text style={styles.detailValue}>{routeData.busType}</Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="people-outline" size={20} color="#6B7280" />
            <Text style={styles.detailLabel}>Available Seats</Text>
            <Text style={styles.detailValue}>{routeData.availableSeats} seats</Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="shield-checkmark-outline" size={20} color="#6B7280" />
            <Text style={styles.detailLabel}>Safety Rating</Text>
            <View style={styles.ratingContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Ionicons
                  key={star}
                  name="star"
                  size={16}
                  color={star <= 4 ? "#F59E0B" : "#D1D5DB"}
                />
              ))}
            </View>
          </View>
        </View>

        <View style={styles.facilitiesCard}>
          <Text style={styles.sectionTitle}>Facilities</Text>
          
          <View style={styles.facilitiesGrid}>
            <View style={styles.facilityItem}>
              <Ionicons name="wifi-outline" size={24} color="#10B981" />
              <Text style={styles.facilityText}>Free WiFi</Text>
            </View>

            <View style={styles.facilityItem}>
              <Ionicons name="snow-outline" size={24} color="#3B82F6" />
              <Text style={styles.facilityText}>AC</Text>
            </View>

            <View style={styles.facilityItem}>
              <Ionicons name="tv-outline" size={24} color="#8B5CF6" />
              <Text style={styles.facilityText}>Entertainment</Text>
            </View>

            <View style={styles.facilityItem}>
              <Ionicons name="cafe-outline" size={24} color="#F59E0B" />
              <Text style={styles.facilityText}>Refreshments</Text>
            </View>
          </View>
        </View>

        <View style={styles.pricingCard}>
          <Text style={styles.sectionTitle}>Pricing</Text>
          
          <View style={styles.priceBreakdown}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>
                Base fare × {passengers} passenger{passengers > 1 ? 's' : ''}
              </Text>
              <Text style={styles.priceValue}>UGX {totalPrice.toLocaleString()}</Text>
            </View>

            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Service fee</Text>
              <Text style={styles.priceValue}>UGX 0</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalValue}>UGX {totalPrice.toLocaleString()}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <View style={styles.priceInfo}>
          <Text style={styles.bottomPrice}>UGX {totalPrice.toLocaleString()}</Text>
          <Text style={styles.bottomPriceSubtext}>for {passengers} passenger{passengers > 1 ? 's' : ''}</Text>
        </View>
        
        <TouchableOpacity style={styles.bookButton} onPress={handleBookNow}>
          <Text style={styles.bookButtonText}>Select Seats</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
    marginHorizontal: 16,
    marginTop: 8,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: '#92400E',
    marginLeft: 8,
    fontWeight: '500',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 16,
    paddingBottom: 100,
  },
  headerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  operatorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  operatorName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  busTypeContainer: {
    backgroundColor: '#EBF8FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  busType: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '600',
  },
  routeInfo: {
    marginTop: 8,
  },
  routeText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  dateText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  journeyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  journeyInfo: {
    paddingLeft: 8,
  },
  journeyPoint: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timePoint: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeInfo: {
    marginLeft: 12,
  },
  journeyTime: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  journeyLocation: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  journeyLine: {
    alignItems: 'center',
    marginVertical: 12,
    position: 'relative',
  },
  verticalLine: {
    width: 2,
    height: 40,
    backgroundColor: '#D1D5DB',
    marginLeft: 8,
  },
  durationText: {
    position: 'absolute',
    left: 30,
    fontSize: 12,
    color: '#6B7280',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
  },
  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailLabel: {
    flex: 1,
    fontSize: 16,
    color: '#4B5563',
    marginLeft: 12,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  ratingContainer: {
    flexDirection: 'row',
  },
  facilitiesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  facilitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  facilityItem: {
    alignItems: 'center',
    width: '48%',
    marginBottom: 16,
  },
  facilityText: {
    fontSize: 14,
    color: '#4B5563',
    marginTop: 8,
    textAlign: 'center',
  },
  pricingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  priceBreakdown: {
    marginTop: 8,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  priceLabel: {
    fontSize: 16,
    color: '#4B5563',
  },
  priceValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#1E40AF',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
    marginVertical: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#059669',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  priceInfo: {
    flex: 1,
  },
  bottomPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  bottomPriceSubtext: {
    fontSize: 12,
    color: '#6B7280',
  },
  bookButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});