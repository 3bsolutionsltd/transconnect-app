import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';

const UGANDA_CITIES = [
  'Kampala', 'Entebbe', 'Jinja', 'Mbale', 'Gulu', 'Mbarara',
  'Fort Portal', 'Masaka', 'Kasese', 'Lira', 'Soroti', 'Arua',
  'Kabale', 'Hoima', 'Tororo', 'Kitgum', 'Moroto', 'Bushenyi'
];

export default function HomeScreen({ navigation }: any) {
  const [fromLocation, setFromLocation] = useState('');
  const [toLocation, setToLocation] = useState('');
  const [departureDate, setDepartureDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [passengers, setPassengers] = useState(1);
  const [showFromSuggestions, setShowFromSuggestions] = useState(false);
  const [showToSuggestions, setShowToSuggestions] = useState(false);
  const [fromError, setFromError] = useState('');
  const [toError, setToError] = useState('');

  const getFilteredCities = (query: string, exclude?: string) => {
    if (!query) return UGANDA_CITIES.filter(city => city !== exclude);
    return UGANDA_CITIES.filter(
      city => city.toLowerCase().includes(query.toLowerCase()) && city !== exclude
    );
  };

  const handleFromLocationChange = (text: string) => {
    setFromLocation(text);
    setFromError('');
    setShowFromSuggestions(text.length > 0);
  };

  const handleToLocationChange = (text: string) => {
    setToLocation(text);
    setToError('');
    setShowToSuggestions(text.length > 0);
  };

  const selectFromCity = (city: string) => {
    setFromLocation(city);
    setShowFromSuggestions(false);
    setFromError('');
  };

  const selectToCity = (city: string) => {
    setToLocation(city);
    setShowToSuggestions(false);
    setToError('');
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDepartureDate(selectedDate);
    }
  };

  const handleSearchRoutes = () => {
    const trimmedFrom = fromLocation.trim();
    const trimmedTo = toLocation.trim();
    
    let hasError = false;
    
    if (!trimmedFrom) {
      setFromError('Please enter departure location');
      hasError = true;
    }
    
    if (!trimmedTo) {
      setToError('Please enter destination location');
      hasError = true;
    }

    if (trimmedFrom && trimmedTo && trimmedFrom.toLowerCase() === trimmedTo.toLowerCase()) {
      setToError('Destination must be different from departure');
      hasError = true;
    }
    
    if (hasError) return;

    navigation.navigate('Search', {
      from: trimmedFrom,
      to: trimmedTo,
      date: departureDate.toISOString(),
      passengers,
    });
  };

  const incrementPassengers = () => {
    if (passengers < 8) {
      setPassengers(passengers + 1);
    }
  };

  const decrementPassengers = () => {
    if (passengers > 1) {
      setPassengers(passengers - 1);
    }
  };

  const swapLocations = () => {
    const temp = fromLocation;
    setFromLocation(toLocation);
    setToLocation(temp);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Find Your Journey</Text>
          <Text style={styles.subtitle}>Book bus tickets across Uganda</Text>
        </View>

        <View style={styles.searchCard}>
          <View style={styles.locationContainer}>
            <View style={styles.inputGroup}>
              <View style={[styles.locationInput, fromError && styles.inputError]}>
                <Ionicons name="location-outline" size={20} color={fromError ? "#EF4444" : "#3B82F6"} />
                <TextInput
                  style={styles.input}
                  placeholder="From (e.g., Kampala)"
                  placeholderTextColor="#9CA3AF"
                  value={fromLocation}
                  onChangeText={handleFromLocationChange}
                  onFocus={() => setShowFromSuggestions(true)}
                  autoCapitalize="words"
                />
              </View>
              {fromError ? (
                <Text style={styles.errorText}>{fromError}</Text>
              ) : null}
              {showFromSuggestions && fromLocation.length > 0 && (
                <View style={styles.suggestionsContainer}>
                  {getFilteredCities(fromLocation, toLocation).slice(0, 5).map((city) => (
                    <TouchableOpacity
                      key={city}
                      style={styles.suggestionItem}
                      onPress={() => selectFromCity(city)}
                    >
                      <Ionicons name="location-outline" size={16} color="#6B7280" />
                      <Text style={styles.suggestionText}>{city}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <TouchableOpacity style={styles.swapButton} onPress={swapLocations}>
              <Ionicons name="swap-vertical" size={24} color="#6B7280" />
            </TouchableOpacity>

            <View style={styles.inputGroup}>
              <View style={[styles.locationInput, toError && styles.inputError]}>
                <Ionicons name="location" size={20} color={toError ? "#EF4444" : "#EF4444"} />
                <TextInput
                  style={styles.input}
                  placeholder="To (e.g., Mbale)"
                  placeholderTextColor="#9CA3AF"
                  value={toLocation}
                  onChangeText={handleToLocationChange}
                  onFocus={() => setShowToSuggestions(true)}
                  autoCapitalize="words"
                />
              </View>
              {toError ? (
                <Text style={styles.errorText}>{toError}</Text>
              ) : null}
              {showToSuggestions && toLocation.length > 0 && (
                <View style={styles.suggestionsContainer}>
                  {getFilteredCities(toLocation, fromLocation).slice(0, 5).map((city) => (
                    <TouchableOpacity
                      key={city}
                      style={styles.suggestionItem}
                      onPress={() => selectToCity(city)}
                    >
                      <Ionicons name="location" size={16} color="#6B7280" />
                      <Text style={styles.suggestionText}>{city}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>

          <View style={styles.row}>
            <TouchableOpacity
              style={[styles.inputGroup, styles.dateInput]}
              onPress={() => setShowDatePicker(true)}
            >
              <View style={styles.inputWithIcon}>
                <Ionicons name="calendar-outline" size={20} color="#6B7280" />
                <Text style={styles.dateText}>
                  {format(departureDate, 'MMM dd, yyyy')}
                </Text>
              </View>
            </TouchableOpacity>

            <View style={[styles.inputGroup, styles.passengerInput]}>
              <Text style={styles.inputLabel}>Passengers</Text>
              <View style={styles.passengerControls}>
                <TouchableOpacity
                  style={[styles.passengerButton, passengers <= 1 && styles.disabledButton]}
                  onPress={decrementPassengers}
                  disabled={passengers <= 1}
                >
                  <Ionicons name="remove" size={20} color={passengers <= 1 ? '#D1D5DB' : '#3B82F6'} />
                </TouchableOpacity>
                <Text style={styles.passengerCount}>{passengers}</Text>
                <TouchableOpacity
                  style={[styles.passengerButton, passengers >= 8 && styles.disabledButton]}
                  onPress={incrementPassengers}
                  disabled={passengers >= 8}
                >
                  <Ionicons name="add" size={20} color={passengers >= 8 ? '#D1D5DB' : '#3B82F6'} />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <TouchableOpacity style={styles.searchButton} onPress={handleSearchRoutes}>
            <Ionicons name="search" size={20} color="#FFFFFF" />
            <Text style={styles.searchButtonText}>Search Routes</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionGrid}>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => navigation.navigate('Bookings')}
            >
              <Ionicons name="receipt-outline" size={32} color="#3B82F6" />
              <Text style={styles.actionText}>My Tickets</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => navigation.navigate('Bookings')}
            >
              <Ionicons name="time-outline" size={32} color="#10B981" />
              <Text style={styles.actionText}>Recent Trips</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => {
                Alert.alert(
                  'Help & Support',
                  'Contact our support team:\n\nPhone: +256 39451710\nEmail: support@transconnect.app\n\nHours: Mon-Fri 8AM-6PM EAT',
                  [
                    { text: 'Call', onPress: () => Linking.openURL('tel:+25639451710') },
                    { text: 'Email', onPress: () => Linking.openURL('mailto:support@transconnect.app') },
                    { text: 'Close', style: 'cancel' }
                  ]
                );
              }}
            >
              <Ionicons name="help-circle-outline" size={32} color="#F59E0B" />
              <Text style={styles.actionText}>Support</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => {
                Alert.alert(
                  'Special Offers',
                  '🎉 Coming Soon!\n\nStay tuned for exclusive discounts and promotional offers for TransConnect users.',
                  [{ text: 'OK' }]
                );
              }}
            >
              <Ionicons name="gift-outline" size={32} color="#EF4444" />
              <Text style={styles.actionText}>Offers</Text>
            </TouchableOpacity>
          </View>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={departureDate}
            mode="date"
            display="default"
            minimumDate={new Date()}
            onChange={handleDateChange}
          />
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
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  searchCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  locationContainer: {
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 12,
  },
  locationInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#F9FAFB',
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  swapButton: {
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 8,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  dateInput: {
    flex: 1,
    marginRight: 8,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#F9FAFB',
  },
  dateText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  passengerInput: {
    flex: 1,
    marginLeft: 8,
  },
  inputLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  passengerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
  },
  passengerButton: {
    padding: 8,
  },
  disabledButton: {
    opacity: 0.5,
  },
  passengerCount: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginHorizontal: 20,
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    borderRadius: 12,
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  inputError: {
    borderColor: '#EF4444',
    borderWidth: 1.5,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    marginTop: 6,
    marginLeft: 4,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 1000,
    maxHeight: 200,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  suggestionText: {
    fontSize: 15,
    color: '#1F2937',
    marginLeft: 12,
  },
  quickActions: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    width: '48%',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  actionText: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
    marginTop: 8,
    textAlign: 'center',
  },
});