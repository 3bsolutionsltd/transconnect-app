import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../contexts/AuthContext';
import LoadingScreen from '../components/LoadingScreen';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

// Main App Screens
import HomeScreen from '../screens/home/HomeScreen';
import SearchScreen from '../screens/search/SearchScreen';
import BookingsScreen from '../screens/bookings/BookingsScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

// Booking Flow Screens
import RouteDetailsScreen from '../screens/booking/RouteDetailsScreen';
import SeatSelectionScreen from '../screens/booking/SeatSelectionScreen';
import PaymentScreen from '../screens/booking/PaymentScreen';
import BookingConfirmationScreen from '../screens/booking/BookingConfirmationScreen';

// Other Screens
import TicketDetailScreen from '../screens/tickets/TicketDetailScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
  </Stack.Navigator>
);

const MainTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName: keyof typeof Ionicons.glyphMap;

        if (route.name === 'Home') {
          iconName = focused ? 'home' : 'home-outline';
        } else if (route.name === 'Search') {
          iconName = focused ? 'search' : 'search-outline';
        } else if (route.name === 'Bookings') {
          iconName = focused ? 'receipt' : 'receipt-outline';
        } else if (route.name === 'Profile') {
          iconName = focused ? 'person' : 'person-outline';
        } else {
          iconName = 'help-outline';
        }

        return <Ionicons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: '#3B82F6',
      tabBarInactiveTintColor: 'gray',
      headerShown: false,
    })}
  >
    <Tab.Screen name="Home" component={HomeScreen} />
    <Tab.Screen name="Search" component={SearchScreen} />
    <Tab.Screen name="Bookings" component={BookingsScreen} />
    <Tab.Screen name="Profile" component={ProfileScreen} />
  </Tab.Navigator>
);

const AppStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="MainTabs" 
      component={MainTabs} 
      options={{ headerShown: false }}
    />
    <Stack.Screen 
      name="RouteDetails" 
      component={RouteDetailsScreen}
      options={{ title: 'Route Details' }}
    />
    <Stack.Screen 
      name="SeatSelection" 
      component={SeatSelectionScreen}
      options={{ title: 'Select Seats' }}
    />
    <Stack.Screen 
      name="Payment" 
      component={PaymentScreen}
      options={{ title: 'Payment' }}
    />
    <Stack.Screen 
      name="BookingConfirmation" 
      component={BookingConfirmationScreen}
      options={{ title: 'Booking Confirmed' }}
    />
    <Stack.Screen 
      name="TicketDetail" 
      component={TicketDetailScreen}
      options={{ title: 'Your Ticket' }}
    />
  </Stack.Navigator>
);

export default function AppNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return isAuthenticated ? <AppStack /> : <AuthStack />;
}