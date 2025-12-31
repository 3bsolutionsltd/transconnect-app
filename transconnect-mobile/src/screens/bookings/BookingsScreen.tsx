import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { format, isPast, isFuture, isToday } from 'date-fns';
import { bookingsApi } from '../../services/api';
import { offlineStorage } from '../../services/offlineStorage';

// Memoized booking card component for better performance
const BookingCard = React.memo(({ booking, onPress, getStatusColor, getStatusText }: any) => (
  <TouchableOpacity
    key={booking.id}
    style={styles.bookingCard}
    onPress={() => onPress(booking)}
  >
    <View style={styles.bookingHeader}>
      <Text style={styles.ticketNumber}>#{booking.id.slice(0, 8)}</Text>
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
        <Text style={styles.routeText}>
          {booking.route?.origin || booking.boardingStop} → {booking.route?.destination || booking.alightingStop}
        </Text>
      </View>
      <Text style={styles.operatorText}>{booking.route?.operator?.companyName || 'TransConnect'}</Text>
    </View>

    <View style={styles.travelInfo}>
      <View style={styles.infoRow}>
        <Ionicons name="calendar-outline" size={16} color="#6B7280" />
        <Text style={styles.infoText}>
          {format(new Date(booking.travelDate), 'MMM dd, yyyy')}
        </Text>
      </View>
      <View style={styles.infoRow}>
        <Ionicons name="time-outline" size={16} color="#6B7280" />
        <Text style={styles.infoText}>{booking.route?.departureTime || 'TBA'}</Text>
      </View>
      <View style={styles.infoRow}>
        <Ionicons name="card-outline" size={16} color="#6B7280" />
        <Text style={styles.infoText}>UGX {(booking.totalAmount || 0).toLocaleString()}</Text>
      </View>
    </View>

    <View style={styles.actionRow}>
      {(booking.status === 'CONFIRMED' || booking.status === 'PENDING') && (
        <TouchableOpacity 
          style={styles.viewTicketButton}
          onPress={() => onPress(booking)}
        >
          <Ionicons name="qr-code-outline" size={16} color="#3B82F6" />
          <Text style={styles.viewTicketText}>View Ticket</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity style={styles.detailsButton}>
        <Ionicons name="chevron-forward" size={16} color="#6B7280" />
      </TouchableOpacity>
    </View>
  </TouchableOpacity>
));

export default function BookingsScreen({ navigation }: any) {
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all');
  const [isOffline, setIsOffline] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: bookings, isLoading, error, refetch, isRefreshing } = useQuery({
    queryKey: ['my-bookings'],
    staleTime: 0, // Always consider data stale to enable fresh fetches
    cacheTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    refetchInterval: 30000, // Auto-refresh every 30 seconds when screen is active
    refetchIntervalInBackground: false,
    refetchOnMount: 'always', // Always refetch when component mounts
    queryFn: async () => {
      try {
        const response = await bookingsApi.getBookings();
        const bookingsData = response.data;
        
        // Ensure we always have an array
        const safeBookings = Array.isArray(bookingsData) ? bookingsData : [];
        
        // Save to offline storage after successful fetch
        if (safeBookings.length > 0) {
          await offlineStorage.saveBookings(safeBookings).catch(err => 
            console.log('Cache save failed:', err)
          );
        }
        setIsOffline(false);
        
        return safeBookings;
      } catch (error) {
        // If API call fails, try to load from offline storage
        console.log('API call failed, loading from offline storage');
        const offlineData = await offlineStorage.getBookings();
        if (offlineData.length > 0) {
          setIsOffline(true);
          return offlineData;
        }
        // If both API and offline fail, return empty array (don't throw)
        console.log('No bookings available online or offline');
        setIsOffline(true);
        return [];
      }
    },
  });

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'CONFIRMED':
        return '#10B981';
      case 'PENDING':
        return '#F59E0B';
      case 'COMPLETED':
        return '#6B7280';
      case 'CANCELLED':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const getStatusText = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  };

  const filterBookings = () => {
    if (!bookings || !Array.isArray(bookings)) return [];
    
    let filtered = bookings.filter((booking: any) => {
      const travelDate = new Date(booking.travelDate);
      
      if (filter === 'upcoming') {
        return isFuture(travelDate) || isToday(travelDate);
      } else if (filter === 'past') {
        return isPast(travelDate) && !isToday(travelDate);
      }
      return true;
    });

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((booking: any) => 
        booking.route?.origin?.toLowerCase().includes(query) ||
        booking.route?.destination?.toLowerCase().includes(query) ||
        booking.boardingStop?.toLowerCase().includes(query) ||
        booking.alightingStop?.toLowerCase().includes(query) ||
        booking.id?.toLowerCase().includes(query) ||
        booking.status?.toLowerCase().includes(query)
      );
    }

    return filtered;
  };

  // Calculate statistics
  const stats = useMemo(() => {
    if (!bookings || !Array.isArray(bookings) || bookings.length === 0) {
      return { total: 0, upcoming: 0, past: 0, totalSpent: 0 };
    }
    
    return bookings.reduce((acc: any, booking: any) => {
      const travelDate = new Date(booking.travelDate);
      acc.total++;
      if (isFuture(travelDate) || isToday(travelDate)) {
        acc.upcoming++;
      } else {
        acc.past++;
      }
      if (booking.status === 'CONFIRMED' || booking.status === 'COMPLETED') {
        acc.totalSpent += booking.totalAmount || 0;
      }
      return acc;
    }, { total: 0, upcoming: 0, past: 0, totalSpent: 0 });
  }, [bookings]);

  const filteredBookings = filterBookings();

  if (isLoading && !bookings) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading bookings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const isNetworkError = errorMessage.toLowerCase().includes('network') || 
                          errorMessage.toLowerCase().includes('connection') ||
                          errorMessage.toLowerCase().includes('timeout');
    
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons 
            name={isNetworkError ? "cloud-offline-outline" : "alert-circle-outline"} 
            size={64} 
            color={isNetworkError ? "#F59E0B" : "#EF4444"} 
          />
          <Text style={styles.errorTitle}>
            {isNetworkError ? 'Connection Issue' : 'Error Loading Bookings'}
          </Text>
          <Text style={styles.errorText}>
            {isNetworkError 
              ? 'Unable to connect to the server. Showing cached bookings if available.'
              : 'Something went wrong while loading your bookings. Please try again.'}
          </Text>
          <TouchableOpacity 
            style={styles.retryButton} 
            onPress={() => refetch()}
          >
            <Ionicons name="refresh-outline" size={20} color="#FFFFFF" />
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
          {isNetworkError && (
            <Text style={styles.offlineHint}>
              Check your internet connection and try again
            </Text>
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Bookings</Text>
        {isOffline && (
          <View style={styles.offlineBadge}>
            <Ionicons name="cloud-offline-outline" size={14} color="#F59E0B" />
            <Text style={styles.offlineText}>Offline Mode</Text>
          </View>
        )}
      </View>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color="#9CA3AF" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by route, stop, or booking ID..."
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
            <Ionicons name="close-circle" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Statistics Cards */}
      {bookings && bookings.length > 0 && (
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="calendar-outline" size={24} color="#3B82F6" />
            <Text style={styles.statValue}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total Trips</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="time-outline" size={24} color="#10B981" />
            <Text style={styles.statValue}>{stats.upcoming}</Text>
            <Text style={styles.statLabel}>Upcoming</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="checkmark-circle-outline" size={24} color="#6B7280" />
            <Text style={styles.statValue}>{stats.past}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="cash-outline" size={24} color="#8B5CF6" />
            <Text style={styles.statValue}>₦{stats.totalSpent.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Total Spent</Text>
          </View>
        </View>
      )}
      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'all' && styles.activeFilterTab]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.activeFilterText]}>
            All ({bookings?.length || 0})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'upcoming' && styles.activeFilterTab]}
          onPress={() => setFilter('upcoming')}
        >
          <Text style={[styles.filterText, filter === 'upcoming' && styles.activeFilterText]}>
            Upcoming
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'past' && styles.activeFilterTab]}
          onPress={() => setFilter('past')}
        >
          <Text style={[styles.filterText, filter === 'past' && styles.activeFilterText]}>
            Past
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={refetch} />
        }
      >
        {filteredBookings && filteredBookings.length > 0 ? (
          filteredBookings.map((booking: any) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              onPress={(booking: any) => navigation.navigate('TicketDetail', { booking })}
              getStatusColor={getStatusColor}
              getStatusText={getStatusText}
            />
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons 
              name={searchQuery ? "search-outline" : "receipt-outline"} 
              size={64} 
              color="#D1D5DB" 
            />
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'No results found' :
                filter === 'all' ? 'No bookings yet' :
                filter === 'upcoming' ? 'No upcoming trips' :
                'No past trips'}
            </Text>
            <Text style={styles.emptyText}>
              {searchQuery ? `No bookings match "${searchQuery}". Try adjusting your search.` :
                filter === 'all' ? 'When you book your first trip, it will appear here.' :
                filter === 'upcoming' ? 'You don\'t have any upcoming trips scheduled.' :
                'Your completed trips will appear here.'}
            </Text>
            {searchQuery ? (
              <TouchableOpacity
                style={styles.bookNowButton}
                onPress={() => setSearchQuery('')}
              >
                <Ionicons name="close-circle-outline" size={18} color="#FFFFFF" />
                <Text style={styles.bookNowButtonText}>Clear Search</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.bookNowButton}
                onPress={() => navigation.navigate('Home')}
              >
                <Ionicons name="search" size={18} color="#FFFFFF" />
                <Text style={styles.bookNowButtonText}>
                  {filter === 'all' ? 'Book Your First Trip' : 'Search Routes'}
                </Text>
              </TouchableOpacity>
            )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
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
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  offlineHint: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 12,
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
  offlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  offlineText: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '600',
    marginLeft: 4,
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginRight: 8,
    alignItems: 'center',
  },
  activeFilterTab: {
    backgroundColor: '#EBF8FF',
  },
  filterText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  activeFilterText: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: '#1F2937',
  },
  clearButton: {
    padding: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  bookNowButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 6,
  },
});