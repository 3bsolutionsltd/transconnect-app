import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface Seat {
  number: string;
  status: 'available' | 'booked' | 'selected';
  position: { row: number; col: number };
}

export default function SeatSelectionScreen({ route, navigation }: any) {
  const { route: routeData, passengers, searchParams } = route.params;
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeSeats();
    
    // Refresh seats when screen comes into focus (in case seats were booked)
    const unsubscribe = navigation.addListener('focus', () => {
      initializeSeats();
    });

    return unsubscribe;
  }, [navigation]);

  const initializeSeats = () => {
    const capacity = routeData?.bus?.capacity || 45;
    // Get array of booked seat numbers from API
    const bookedSeatNumbers = routeData?.availability?.bookedSeatNumbers || [];
    const seatsPerRow = 4;
    const rows = Math.ceil(capacity / seatsPerRow);
    
    const seatArray: Seat[] = [];
    let seatNumber = 1;
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < seatsPerRow; col++) {
        if (seatNumber <= capacity) {
          // Check if this seat number is in the booked seats array
          const isBooked = bookedSeatNumbers.includes(seatNumber.toString()) || 
                          bookedSeatNumbers.includes(seatNumber);
          
          seatArray.push({
            number: seatNumber.toString(),
            status: isBooked ? 'booked' : 'available',
            position: { row, col },
          });
          seatNumber++;
        }
      }
    }
    
    setSeats(seatArray);
    setLoading(false);
  };

  const handleSeatPress = (seatNumber: string) => {
    const seat = seats.find(s => s.number === seatNumber);
    
    if (seat?.status === 'booked') {
      Alert.alert('Unavailable', 'This seat is already booked');
      return;
    }

    if (selectedSeats.includes(seatNumber)) {
      // Deselect seat
      setSelectedSeats(selectedSeats.filter(s => s !== seatNumber));
      setSeats(seats.map(s => 
        s.number === seatNumber ? { ...s, status: 'available' } : s
      ));
    } else {
      // Select seat
      if (selectedSeats.length >= passengers) {
        Alert.alert(
          'Maximum Seats Selected', 
          `You can only select ${passengers} seat(s)`
        );
        return;
      }
      
      setSelectedSeats([...selectedSeats, seatNumber]);
      setSeats(seats.map(s => 
        s.number === seatNumber ? { ...s, status: 'selected' } : s
      ));
    }
  };

  const handleContinue = () => {
    if (selectedSeats.length !== passengers) {
      Alert.alert(
        'Selection Required', 
        `Please select ${passengers} seat(s). Currently selected: ${selectedSeats.length}`
      );
      return;
    }

    navigation.navigate('Payment', {
      route: routeData,
      passengers,
      searchParams,
      selectedSeats: selectedSeats.sort((a, b) => parseInt(a) - parseInt(b)),
      totalAmount: routeData.price * passengers,
    });
  };

  const renderSeat = (seat: Seat) => {
    const getSeatColor = () => {
      switch (seat.status) {
        case 'booked':
          return '#EF4444';
        case 'selected':
          return '#10B981';
        default:
          return '#E5E7EB';
      }
    };

    const getSeatIcon = () => {
      switch (seat.status) {
        case 'booked':
          return 'close-circle';
        case 'selected':
          return 'checkmark-circle';
        default:
          return 'ellipse-outline';
      }
    };

    return (
      <TouchableOpacity
        key={seat.number}
        style={[styles.seat, { backgroundColor: getSeatColor() }]}
        onPress={() => handleSeatPress(seat.number)}
        disabled={seat.status === 'booked'}
      >
        <Ionicons 
          name={getSeatIcon()} 
          size={16} 
          color={seat.status === 'available' ? '#9CA3AF' : '#FFFFFF'} 
        />
        <Text style={[
          styles.seatNumber,
          { color: seat.status === 'available' ? '#4B5563' : '#FFFFFF' }
        ]}>
          {seat.number}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderSeats = () => {
    const seatsPerRow = 4;
    const rows = Math.ceil(seats.length / seatsPerRow);
    const seatRows = [];

    for (let row = 0; row < rows; row++) {
      const rowSeats = seats.slice(row * seatsPerRow, (row + 1) * seatsPerRow);
      
      seatRows.push(
        <View key={row} style={styles.seatRow}>
          <View style={styles.seatColumn}>
            {rowSeats.slice(0, 2).map(seat => renderSeat(seat))}
          </View>
          <View style={styles.aisle} />
          <View style={styles.seatColumn}>
            {rowSeats.slice(2, 4).map(seat => renderSeat(seat))}
          </View>
        </View>
      );
    }

    return seatRows;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading seats...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Seats</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Route Info */}
      <View style={styles.routeCard}>
        <View style={styles.routeHeader}>
          <Text style={styles.routeText}>
            {searchParams.from} → {searchParams.to}
          </Text>
          <Text style={styles.busInfo}>{routeData.bus.plateNumber}</Text>
        </View>
        <View style={styles.selectionInfo}>
          <Text style={styles.selectionText}>
            Selected: {selectedSeats.length} / {passengers}
          </Text>
          <Text style={styles.priceText}>
            UGX {(routeData.price * selectedSeats.length).toLocaleString()}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Legend */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendBox, { backgroundColor: '#E5E7EB' }]} />
            <Text style={styles.legendText}>Available</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendBox, { backgroundColor: '#10B981' }]} />
            <Text style={styles.legendText}>Selected</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendBox, { backgroundColor: '#EF4444' }]} />
            <Text style={styles.legendText}>Booked</Text>
          </View>
        </View>

        {/* Driver Section */}
        <View style={styles.driverSection}>
          <Ionicons name="car-sport" size={24} color="#6B7280" />
          <Text style={styles.driverText}>Driver</Text>
        </View>

        {/* Seats Grid */}
        <View style={styles.seatsContainer}>
          {renderSeats()}
        </View>

        {/* Selected Seats Summary */}
        {selectedSeats.length > 0 && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Selected Seats</Text>
            <Text style={styles.summarySeats}>
              {selectedSeats.sort((a, b) => parseInt(a) - parseInt(b)).join(', ')}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Continue Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            selectedSeats.length !== passengers && styles.continueButtonDisabled
          ]}
          onPress={handleContinue}
          disabled={selectedSeats.length !== passengers}
        >
          <Text style={styles.continueButtonText}>
            Continue to Payment
          </Text>
          <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
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
  routeCard: {
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
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  routeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  busInfo: {
    fontSize: 14,
    color: '#6B7280',
  },
  selectionInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  selectionText: {
    fontSize: 14,
    color: '#6B7280',
  },
  priceText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#3B82F6',
  },
  scrollView: {
    flex: 1,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendBox: {
    width: 20,
    height: 20,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    color: '#6B7280',
  },
  driverSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  driverText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  seatsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  seatRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  seatColumn: {
    flexDirection: 'row',
    gap: 8,
  },
  aisle: {
    width: 40,
  },
  seat: {
    width: 50,
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  seatNumber: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 24,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  summarySeats: {
    fontSize: 16,
    color: '#10B981',
    fontWeight: '600',
  },
  footer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  continueButton: {
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
  },
  continueButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});