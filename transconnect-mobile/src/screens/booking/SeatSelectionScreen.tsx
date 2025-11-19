import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function SeatSelectionScreen({ route, navigation }: any) {
  const { route: routeData, passengers, searchParams } = route.params;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.comingSoonContainer}>
          <Ionicons name="construct-outline" size={64} color="#3B82F6" />
          <Text style={styles.comingSoonTitle}>Seat Selection</Text>
          <Text style={styles.comingSoonText}>
            Interactive seat selection feature is coming soon!
          </Text>
          <Text style={styles.routeInfo}>
            Route: {searchParams.from} → {searchParams.to}
          </Text>
          <Text style={styles.passengerInfo}>
            Passengers: {passengers}
          </Text>
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
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  comingSoonContainer: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 40,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  comingSoonTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  comingSoonText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  routeInfo: {
    fontSize: 16,
    color: '#1F2937',
    marginBottom: 8,
  },
  passengerInfo: {
    fontSize: 16,
    color: '#1F2937',
  },
});