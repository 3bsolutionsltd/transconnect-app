import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { format, addMinutes, parseISO } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { routesApi } from '../../services/api';
import { offlineStorage } from '../../services/offlineStorage';

interface Route {
  id: string;
  origin: string;
  destination: string;
  via?: string;
  distance: number;
  duration: number;
  price: number;
  departureTime: string;
  operatorId: string;
  busId: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  operator: {
    id: string;
    companyName: string;
    approved: boolean;
  };
  bus: {
    id: string;
    plateNumber: string;
    model: string;
    capacity: number;
    amenities: string[];
  };
  stops: any;
  availability?: {
    totalSeats: number;
    bookedSeats: number;
    availableSeats: number;
    isAvailable: boolean;
  };
}

export default function SearchScreen({ route, navigation }: any) {
  const { from, to, date, passengers } = route.params || {};
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'price' | 'time' | 'duration'>('price');
  const [filterBy, setFilterBy] = useState<'all' | 'morning' | 'afternoon' | 'evening'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [expandedRoute, setExpandedRoute] = useState<string | null>(null);

  const {
    data: routes,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['routes', from, to, date],
    queryFn: async () => {
      try {
        const trimmedFrom = from?.trim();
        const trimmedTo = to?.trim();
        
        // Handle date safely
        const searchDate = date ? (typeof date === 'string' ? date : new Date(date).toISOString().split('T')[0]) : format(new Date(), 'yyyy-MM-dd');
        
        console.log('Searching routes:', { from: trimmedFrom, to: trimmedTo, date: searchDate });
        const response = await routesApi.searchRoutes({
          from: trimmedFrom,
          to: trimmedTo,
          date: searchDate,
        });
        const routeData = response.data?.routes || response.data;
        
        // Ensure we always have an array
        const safeRoutes = Array.isArray(routeData) ? routeData : [];
        console.log('Routes found:', safeRoutes.length);
        
        // Cache routes for offline access
        if (safeRoutes.length > 0) {
          await offlineStorage.saveRoutes(safeRoutes).catch(err => 
            console.log('Failed to cache routes:', err)
          );
        }
        
        return safeRoutes;
      } catch (err: any) {
        console.error('Route search error:', err.response?.data || err.message);
        
        // Try to load from offline storage if network error
        if (!err.response && err.message?.toLowerCase().includes('network')) {
          console.log('Network error detected, trying offline cache...');
          const offlineRoutes = await offlineStorage.searchRoutesOffline(from, to);
          if (offlineRoutes.length > 0) {
            console.log('Loaded', offlineRoutes.length, 'routes from cache');
            return offlineRoutes;
          }
        }
        
        throw err;
      }
    },
    enabled: !!from && !!to && !!date,
  });

  const handleRouteSelect = (routeId: string) => {
    setSelectedRoute(routeId);
    const selectedRouteData = routes?.find((r: Route) => r.id === routeId);
    
    navigation.navigate('RouteDetails', {
      route: selectedRouteData,
      passengers,
      searchParams: { from, to, date },
    });
  };

  const handleRetry = () => {
    refetch();
  };

  // Utility functions
  const getTimeCategory = (time: string) => {
    const hour = parseInt(time.split(':')[0]);
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    return 'evening';
  };

  const calculateArrivalTime = (departureTime: string, durationMinutes: number) => {
    const [hours, minutes] = departureTime.split(':').map(Number);
    const departureDate = new Date();
    departureDate.setHours(hours, minutes, 0, 0);
    const arrivalDate = addMinutes(departureDate, durationMinutes);
    return format(arrivalDate, 'HH:mm');
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getFilteredAndSortedRoutes = () => {
    if (!routes || !Array.isArray(routes)) return [];
    
    let filtered = routes.filter((route: Route) => {
      if (filterBy === 'all') return true;
      return getTimeCategory(route.departureTime) === filterBy;
    });

    return filtered.sort((a: Route, b: Route) => {
      switch (sortBy) {
        case 'price':
          return a.price - b.price;
        case 'time':
          return a.departureTime.localeCompare(b.departureTime);
        case 'duration':
          return a.duration - b.duration;
        default:
          return 0;
      }
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Searching for routes...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const isNotFound = errorMessage.includes('404') || errorMessage.includes('not found');
    const isNetworkError = errorMessage.toLowerCase().includes('network') || errorMessage.toLowerCase().includes('fetch');
    
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons 
            name={isNotFound ? "search-outline" : isNetworkError ? "cloud-offline-outline" : "alert-circle-outline"} 
            size={64} 
            color={isNotFound ? "#F59E0B" : isNetworkError ? "#F59E0B" : "#EF4444"} 
          />
          <Text style={styles.errorTitle}>
            {isNotFound ? 'No routes available' : isNetworkError ? 'Connection Issue' : 'Error Occurred'}
          </Text>
          <Text style={styles.errorText}>
            {isNotFound 
              ? `No buses currently run from ${from} to ${to}.` 
              : isNetworkError
              ? 'Unable to connect to the server. Please check your internet connection and try again.'
              : 'Something went wrong while searching for routes. Please try again.'}
          </Text>
          {isNotFound && (
            <View style={styles.suggestionsBox}>
              <Text style={styles.suggestionsTitle}>Try these popular routes:</Text>
              <Text style={styles.suggestionItem}>• Kampala → Jinja</Text>
              <Text style={styles.suggestionItem}>• Kampala → Mbarara</Text>
              <Text style={styles.suggestionItem}>• Kampala → Arua</Text>
              <Text style={styles.suggestionItem}>• Kampala → Lira</Text>
            </View>
          )}
          <View style={styles.errorActions}>
            <TouchableOpacity 
              style={styles.retryButton} 
              onPress={handleRetry}
            >
              <Ionicons name="refresh-outline" size={20} color="#FFFFFF" />
              <Text style={styles.retryButtonText}>Retry Search</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backButtonText}>Search Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchInfo}>
          <View style={styles.routeInfo}>
            <Text style={styles.routeText}>{from} → {to}</Text>
            <Text style={styles.dateText}>{date ? format(new Date(date), 'MMM dd, yyyy') : 'Date not set'}</Text>
          </View>
          <Text style={styles.passengerText}>{passengers} passenger{passengers > 1 ? 's' : ''}</Text>
        </View>
      </View>

      {/* Filter and Sort Bar */}
      <View style={styles.filterBar}>
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setShowFilters(true)}
        >
          <Ionicons name="options-outline" size={20} color="#3B82F6" />
          <Text style={styles.filterText}>Filter & Sort</Text>
        </TouchableOpacity>
        
        <Text style={styles.resultsCount}>
          {getFilteredAndSortedRoutes().length} of {routes?.length || 0} routes
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {routes && routes.length > 0 ? (
          getFilteredAndSortedRoutes().length > 0 ? (
          <View style={styles.resultsContainer}>
            {getFilteredAndSortedRoutes().map((routeItem: Route) => {
              const arrivalTime = calculateArrivalTime(routeItem.departureTime, routeItem.duration);
              const durationStr = formatDuration(routeItem.duration);
              const availableSeats = routeItem.availability?.availableSeats || routeItem.bus.capacity;
              const isExpanded = expandedRoute === routeItem.id;
              
              return (
                <View key={routeItem.id} style={styles.routeCard}>
                  <TouchableOpacity
                    style={[
                      styles.routeMainContent,
                      selectedRoute === routeItem.id && styles.selectedRouteCard,
                    ]}
                    onPress={() => handleRouteSelect(routeItem.id)}
                  >
                    {/* Operator Header */}
                    <View style={styles.routeHeader}>
                      <View style={styles.operatorInfo}>
                        <Text style={styles.operatorName}>{routeItem.operator.companyName}</Text>
                        <View style={styles.busInfo}>
                          <Ionicons name="bus-outline" size={14} color="#6B7280" />
                          <Text style={styles.busDetails}>{routeItem.bus.model} • {routeItem.bus.plateNumber}</Text>
                        </View>
                      </View>
                      <View style={styles.priceContainer}>
                        <Text style={styles.price}>UGX {routeItem.price.toLocaleString()}</Text>
                        <Text style={styles.pricePerPerson}>per person</Text>
                      </View>
                    </View>

                    {/* Time and Route Info */}
                    <View style={styles.timeContainer}>
                      <View style={styles.timeGroup}>
                        <Text style={styles.time}>{routeItem.departureTime}</Text>
                        <Text style={styles.location}>{routeItem.origin}</Text>
                      </View>

                      <View style={styles.routeVisualization}>
                        <View style={styles.routeLine}>
                          <View style={styles.routeDot} />
                          <View style={styles.routePath} />
                          <View style={styles.routeDot} />
                        </View>
                        <View style={styles.routeInfo}>
                          <Text style={styles.duration}>{durationStr}</Text>
                          <Text style={styles.distance}>{routeItem.distance}km</Text>
                        </View>
                      </View>

                      <View style={styles.timeGroup}>
                        <Text style={styles.time}>{arrivalTime}</Text>
                        <Text style={styles.location}>{routeItem.destination}</Text>
                      </View>
                    </View>

                    {/* Seats and Amenities */}
                    <View style={styles.routeFooter}>
                      <View style={styles.seatsInfo}>
                        <Ionicons 
                          name={availableSeats > 10 ? "checkmark-circle" : availableSeats > 5 ? "warning" : "close-circle"} 
                          size={16} 
                          color={availableSeats > 10 ? "#10B981" : availableSeats > 5 ? "#F59E0B" : "#EF4444"} 
                        />
                        <Text style={[
                          styles.seatsText,
                          { color: availableSeats > 10 ? "#10B981" : availableSeats > 5 ? "#F59E0B" : "#EF4444" }
                        ]}>
                          {availableSeats} seats available
                        </Text>
                      </View>
                      
                      <TouchableOpacity 
                        style={styles.expandButton}
                        onPress={() => setExpandedRoute(isExpanded ? null : routeItem.id)}
                      >
                        <Text style={styles.expandText}>Details</Text>
                        <Ionicons 
                          name={isExpanded ? "chevron-up" : "chevron-down"} 
                          size={16} 
                          color="#3B82F6" 
                        />
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <View style={styles.expandedContent}>
                      <View style={styles.amenitiesSection}>
                        <Text style={styles.sectionTitle}>Bus Amenities</Text>
                        <View style={styles.amenitiesList}>
                          {(Array.isArray(routeItem.bus.amenities) 
                            ? routeItem.bus.amenities 
                            : JSON.parse(routeItem.bus.amenities || '[]')
                          ).map((amenity: string, index: number) => (
                            <View key={index} style={styles.amenityItem}>
                              <Ionicons name="checkmark-circle-outline" size={16} color="#10B981" />
                              <Text style={styles.amenityText}>{amenity}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                      
                      <View style={styles.detailsGrid}>
                        <View style={styles.detailItem}>
                          <Ionicons name="people-outline" size={16} color="#6B7280" />
                          <Text style={styles.detailLabel}>Capacity</Text>
                          <Text style={styles.detailValue}>{routeItem.bus.capacity} seats</Text>
                        </View>
                        
                        <View style={styles.detailItem}>
                          <Ionicons name="speedometer-outline" size={16} color="#6B7280" />
                          <Text style={styles.detailLabel}>Distance</Text>
                          <Text style={styles.detailValue}>{routeItem.distance}km</Text>
                        </View>
                        
                        <View style={styles.detailItem}>
                          <Ionicons name="time-outline" size={16} color="#6B7280" />
                          <Text style={styles.detailLabel}>Duration</Text>
                          <Text style={styles.detailValue}>{durationStr}</Text>
                        </View>
                        
                        <View style={styles.detailItem}>
                          <Ionicons name="calendar-outline" size={16} color="#6B7280" />
                          <Text style={styles.detailLabel}>Departure</Text>
                          <Text style={styles.detailValue}>{routeItem.departureTime}</Text>
                        </View>
                      </View>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
          ) : (
            <View style={styles.noResultsContainer}>
              <Ionicons name="filter-outline" size={64} color="#D1D5DB" />
              <Text style={styles.noResultsTitle}>No matching routes</Text>
              <Text style={styles.noResultsText}>
                No routes match your current filters. Try adjusting your filters or sorting options.
              </Text>
              <TouchableOpacity 
                style={styles.modifySearchButton}
                onPress={() => {
                  setFilterBy('all');
                  setSortBy('price');
                }}
              >
                <Text style={styles.modifySearchButtonText}>Clear Filters</Text>
              </TouchableOpacity>
            </View>
          )
        ) : (
          <View style={styles.noResultsContainer}>
            <Ionicons name="bus-outline" size={64} color="#D1D5DB" />
            <Text style={styles.noResultsTitle}>No routes found</Text>
            <Text style={styles.noResultsText}>
              No buses available for {from} to {to} on {date ? format(new Date(date), 'MMM dd, yyyy') : 'selected date'}.
              Try searching for a different date or route.
            </Text>
            <TouchableOpacity 
              style={styles.modifySearchButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.modifySearchButtonText}>Modify Search</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Filter Modal */}
      <Modal
        visible={showFilters}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFilters(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filter & Sort Routes</Text>
            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Sort Options */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Sort By</Text>
              {[{ key: 'price', label: 'Price (Low to High)', icon: 'pricetag-outline' },
                { key: 'time', label: 'Departure Time', icon: 'time-outline' },
                { key: 'duration', label: 'Journey Duration', icon: 'speedometer-outline' }].map((option) => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.filterOption,
                    sortBy === option.key && styles.selectedFilterOption
                  ]}
                  onPress={() => setSortBy(option.key as any)}
                >
                  <Ionicons 
                    name={option.icon as any} 
                    size={20} 
                    color={sortBy === option.key ? '#3B82F6' : '#6B7280'} 
                  />
                  <Text style={[
                    styles.filterOptionText,
                    sortBy === option.key && styles.selectedFilterText
                  ]}>
                    {option.label}
                  </Text>
                  {sortBy === option.key && (
                    <Ionicons name="checkmark" size={20} color="#3B82F6" />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Filter Options */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Filter by Time</Text>
              {[{ key: 'all', label: 'All Times', icon: 'time-outline' },
                { key: 'morning', label: 'Morning (6AM - 12PM)', icon: 'sunny-outline' },
                { key: 'afternoon', label: 'Afternoon (12PM - 5PM)', icon: 'partly-sunny-outline' },
                { key: 'evening', label: 'Evening (5PM - 11PM)', icon: 'moon-outline' }].map((option) => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.filterOption,
                    filterBy === option.key && styles.selectedFilterOption
                  ]}
                  onPress={() => setFilterBy(option.key as any)}
                >
                  <Ionicons 
                    name={option.icon as any} 
                    size={20} 
                    color={filterBy === option.key ? '#3B82F6' : '#6B7280'} 
                  />
                  <Text style={[
                    styles.filterOptionText,
                    filterBy === option.key && styles.selectedFilterText
                  ]}>
                    {option.label}
                  </Text>
                  {filterBy === option.key && (
                    <Ionicons name="checkmark" size={20} color="#3B82F6" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity 
              style={styles.applyButton}
              onPress={() => setShowFilters(false)}
            >
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  searchInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  routeInfo: {
    flex: 1,
  },
  routeText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  dateText: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
  },
  passengerText: {
    fontSize: 14,
    color: '#64748B',
  },
  filterBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  filterText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
  resultsCount: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F8FAFC',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  errorActions: {
    width: '100%',
    gap: 12,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#1F2937',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 16,
  },
  resultsContainer: {
    flex: 1,
  },
  routeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  routeMainContent: {
    padding: 20,
  },
  selectedRouteCard: {
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  operatorInfo: {
    flex: 1,
  },
  operatorName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  busInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  busDetails: {
    fontSize: 13,
    color: '#64748B',
    marginLeft: 4,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 20,
    fontWeight: '800',
    color: '#059669',
  },
  pricePerPerson: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  timeGroup: {
    flex: 1,
    alignItems: 'center',
  },
  time: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  location: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
    textAlign: 'center',
  },
  routeVisualization: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  routeLine: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 8,
  },
  routeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3B82F6',
  },
  routePath: {
    flex: 1,
    height: 2,
    backgroundColor: '#CBD5E1',
    marginHorizontal: 8,
  },
  routeInfo: {
    alignItems: 'center',
  },
  duration: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  distance: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  routeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  seatsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seatsText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
  },
  expandText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
    marginRight: 4,
  },
  expandedContent: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#FAFBFC',
  },
  amenitiesSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  amenitiesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  amenityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 4,
  },
  amenityText: {
    fontSize: 13,
    color: '#1E293B',
    marginLeft: 4,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  detailItem: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 12,
    color: '#64748B',
    marginLeft: 6,
    flex: 1,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noResultsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 16,
    marginBottom: 8,
  },
  noResultsText: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  modifySearchButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  modifySearchButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  suggestionsBox: {
    backgroundColor: '#FEF3C7',
    padding: 16,
    borderRadius: 12,
    marginVertical: 16,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  suggestionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 8,
  },
  suggestionItem: {
    fontSize: 14,
    color: '#78350F',
    marginVertical: 3,
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  filterSection: {
    marginTop: 24,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  selectedFilterOption: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  filterOptionText: {
    fontSize: 15,
    color: '#1E293B',
    marginLeft: 12,
    flex: 1,
  },
  selectedFilterText: {
    color: '#3B82F6',
    fontWeight: '500',
  },
  modalFooter: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  applyButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});