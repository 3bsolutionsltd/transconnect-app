# 📱 TransConnect React Native Implementation Plan

## 🚀 **Project Kickoff - React Native + TypeScript**

**Decision Confirmed**: React Native + Expo + TypeScript  
**Timeline**: 2-3 weeks to production-ready mobile apps  
**Code Reuse**: 70-80% from existing web platform  

---

## 📋 **Phase 1: Project Setup & Foundation (Days 1-3)**

### **Day 1: Project Initialization**

#### **1.1 Create React Native Project**
```bash
# Navigate to the mobile app directory
cd transconnect-mobile

# Remove existing Flutter setup
rm -rf lib/ pubspec.yaml android/ ios/ test/

# Initialize React Native with Expo
npx create-expo-app@latest . --template blank-typescript --no-install

# Install dependencies
npm install
```

#### **1.2 Essential Dependencies Installation**
```bash
# Navigation
npm install @react-navigation/native @react-navigation/stack @react-navigation/bottom-tabs
npm install react-native-screens react-native-safe-area-context @react-native-masked-view/masked-view

# State Management (Same as Web)
npm install zustand @tanstack/react-query axios

# UI Components & Styling
npm install react-native-elements react-native-vector-icons
npm install nativewind tailwindcss react-native-reanimated

# Device Features
npm install expo-camera expo-barcode-scanner expo-secure-store
npm install expo-notifications expo-location expo-image-picker

# Forms & Validation (Same as Web)
npm install react-hook-form @hookform/resolvers yup

# Date & Time
npm install date-fns

# Development Dependencies
npm install --save-dev @types/react @types/react-native
npm install --save-dev babel-preset-expo tailwindcss
```

#### **1.3 Project Structure Setup**
```
src/
├── components/           # Reusable UI components
│   ├── ui/              # Basic UI elements (Button, Input, Card)
│   ├── forms/           # Form components (LoginForm, BookingForm)
│   ├── navigation/      # Navigation components
│   └── layout/          # Layout components (Header, TabBar)
├── screens/             # Screen components
│   ├── auth/           # Authentication screens
│   ├── home/           # Home and search screens
│   ├── booking/        # Booking flow screens
│   ├── tickets/        # Ticket management screens
│   └── profile/        # Profile and settings screens
├── services/           # API clients (shared with web)
│   ├── api/           # API client configuration
│   ├── auth/          # Authentication services
│   ├── booking/       # Booking services
│   └── storage/       # Local storage services
├── hooks/              # Custom React hooks (shared logic)
├── stores/             # Zustand stores (shared with web)
├── utils/              # Utility functions (shared with web)
├── types/              # TypeScript definitions (shared with web)
├── constants/          # App constants
└── assets/             # Images, fonts, icons
```

### **Day 2: Shared Code Integration**

#### **2.1 Copy Shared Types from Web**
```bash
# Copy TypeScript definitions
cp ../transconnect-web/src/types/* src/types/

# Copy utility functions
cp ../transconnect-web/src/lib/utils.ts src/utils/
cp ../transconnect-web/src/lib/api.ts src/services/api/
```

#### **2.2 Adapt API Client for Mobile**
```typescript
// src/services/api/client.ts
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_BASE_URL = __DEV__ 
  ? 'http://localhost:5000/api'
  : 'https://transconnect-app-44ie.onrender.com/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token (same logic as web)
apiClient.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling (same as web)
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync('auth_token');
      // Navigate to login screen
    }
    return Promise.reject(error);
  }
);
```

#### **2.3 Setup State Management (Shared with Web)**
```typescript
// src/stores/authStore.ts
import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: 'PASSENGER' | 'ADMIN' | 'OPERATOR';
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: false,
  
  login: async (credentials) => {
    set({ isLoading: true });
    try {
      const response = await authApi.login(credentials);
      const { user, token } = response.data;
      
      await SecureStore.setItemAsync('auth_token', token);
      await SecureStore.setItemAsync('user_data', JSON.stringify(user));
      
      set({ user, token, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },
  
  logout: async () => {
    await SecureStore.deleteItemAsync('auth_token');
    await SecureStore.deleteItemAsync('user_data');
    set({ user: null, token: null });
  },
  
  register: async (userData) => {
    set({ isLoading: true });
    try {
      const response = await authApi.register(userData);
      const { user, token } = response.data;
      
      await SecureStore.setItemAsync('auth_token', token);
      await SecureStore.setItemAsync('user_data', JSON.stringify(user));
      
      set({ user, token, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },
}));
```

### **Day 3: Navigation & UI Foundation**

#### **3.1 Setup Navigation Structure**
```typescript
// src/navigation/AppNavigator.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuthStore } from '../stores/authStore';

import AuthNavigator from './AuthNavigator';
import HomeScreen from '../screens/home/HomeScreen';
import BookingNavigator from './BookingNavigator';
import TicketsScreen from '../screens/tickets/TicketsScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const MainTabNavigator = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarStyle: {
        backgroundColor: '#ffffff',
        borderTopColor: '#e5e7eb',
        paddingBottom: 5,
        height: 60,
      },
    }}
  >
    <Tab.Screen 
      name="Home" 
      component={HomeScreen}
      options={{
        tabBarIcon: ({ color, size }) => (
          <HomeIcon color={color} size={size} />
        ),
      }}
    />
    <Tab.Screen 
      name="Booking" 
      component={BookingNavigator}
      options={{
        tabBarIcon: ({ color, size }) => (
          <SearchIcon color={color} size={size} />
        ),
      }}
    />
    <Tab.Screen 
      name="Tickets" 
      component={TicketsScreen}
      options={{
        tabBarIcon: ({ color, size }) => (
          <TicketIcon color={color} size={size} />
        ),
      }}
    />
    <Tab.Screen 
      name="Profile" 
      component={ProfileScreen}
      options={{
        tabBarIcon: ({ color, size }) => (
          <UserIcon color={color} size={size} />
        ),
      }}
    />
  </Tab.Navigator>
);

export const AppNavigator = () => {
  const { user } = useAuthStore();

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <Stack.Screen name="Main" component={MainTabNavigator} />
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
```

#### **3.2 Create Base UI Components (Adapted from Web)**
```typescript
// src/components/ui/Button.tsx
import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
}) => {
  const buttonStyle = [
    styles.base,
    styles[variant],
    styles[size],
    disabled && styles.disabled,
  ];

  const textStyle = [
    styles.text,
    styles[`${variant}Text`],
    styles[`${size}Text`],
  ];

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#ffffff' : '#3B82F6'} />
      ) : (
        <Text style={textStyle}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  primary: {
    backgroundColor: '#3B82F6',
  },
  secondary: {
    backgroundColor: '#F3F4F6',
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  small: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  medium: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  large: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  primaryText: {
    color: '#ffffff',
  },
  secondaryText: {
    color: '#374151',
  },
  outlineText: {
    color: '#3B82F6',
  },
  smallText: {
    fontSize: 14,
  },
  mediumText: {
    fontSize: 16,
  },
  largeText: {
    fontSize: 18,
  },
});
```

---

## 📋 **Phase 2: Core Features Implementation (Days 4-13)**

### **Days 4-5: Authentication Screens**

#### **4.1 Login Screen**
```typescript
// src/screens/auth/LoginScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import { Button } from '../../components/ui/Button';
import { TextInput } from '../../components/ui/TextInput';
import { useAuthStore } from '../../stores/authStore';

const loginSchema = yup.object({
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
});

export const LoginScreen = ({ navigation }) => {
  const { login, isLoading } = useAuthStore();
  
  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(loginSchema),
  });

  const onSubmit = async (data) => {
    try {
      await login(data);
    } catch (error) {
      Alert.alert('Login Failed', error.response?.data?.message || 'An error occurred');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Sign in to your TransConnect account</Text>

        <View style={styles.form}>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label="Email"
                placeholder="Enter your email"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={errors.email?.message}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label="Password"
                placeholder="Enter your password"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={errors.password?.message}
                secureTextEntry
              />
            )}
          />

          <Button
            title="Sign In"
            onPress={handleSubmit(onSubmit)}
            loading={isLoading}
            style={styles.loginButton}
          />

          <TouchableOpacity
            style={styles.registerLink}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.registerText}>
              Don't have an account? <Text style={styles.registerTextBold}>Sign Up</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};
```

### **Days 6-8: Home & Search Screens**

#### **6.1 Home Screen (Route Search)**
```typescript
// src/screens/home/HomeScreen.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useQuery } from '@tanstack/react-query';

import { SearchForm } from '../../components/forms/SearchForm';
import { RouteCard } from '../../components/cards/RouteCard';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { useRouteStore } from '../../stores/routeStore';
import { routeApi } from '../../services/api/routeApi';

export const HomeScreen = ({ navigation }) => {
  const [searchParams, setSearchParams] = useState(null);
  const { setSelectedRoute } = useRouteStore();

  const { data: routes, isLoading, error } = useQuery({
    queryKey: ['routes', searchParams],
    queryFn: () => routeApi.searchRoutes(searchParams),
    enabled: !!searchParams,
  });

  const handleSearch = (params) => {
    setSearchParams(params);
  };

  const handleRouteSelect = (route) => {
    setSelectedRoute(route);
    navigation.navigate('Booking', { screen: 'RouteDetails', params: { routeId: route.id } });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Find Your Journey</Text>
        <Text style={styles.subtitle}>Book bus tickets across Uganda</Text>
      </View>

      <SearchForm onSearch={handleSearch} />

      {isLoading && <LoadingSpinner />}

      {routes && (
        <View style={styles.results}>
          <Text style={styles.resultsTitle}>
            {routes.length} routes found
          </Text>
          {routes.map((route) => (
            <RouteCard
              key={route.id}
              route={route}
              onPress={() => handleRouteSelect(route)}
            />
          ))}
        </View>
      )}
    </ScrollView>
  );
};
```

### **Days 9-11: Booking Flow**

#### **9.1 Seat Selection Screen**
```typescript
// src/screens/booking/SeatSelectionScreen.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useQuery, useMutation } from '@tanstack/react-query';

import { SeatMap } from '../../components/booking/SeatMap';
import { SeatLegend } from '../../components/booking/SeatLegend';
import { Button } from '../../components/ui/Button';
import { useBookingStore } from '../../stores/bookingStore';
import { bookingApi } from '../../services/api/bookingApi';

export const SeatSelectionScreen = ({ route, navigation }) => {
  const { routeId } = route.params;
  const { selectedSeats, setSelectedSeats, selectedRoute } = useBookingStore();

  const { data: seatAvailability, isLoading } = useQuery({
    queryKey: ['seats', routeId],
    queryFn: () => bookingApi.getSeatAvailability(routeId),
  });

  const createBookingMutation = useMutation({
    mutationFn: bookingApi.createBooking,
    onSuccess: (booking) => {
      navigation.navigate('Payment', { bookingId: booking.id });
    },
    onError: (error) => {
      Alert.alert('Booking Failed', error.message);
    },
  });

  const handleSeatSelect = (seatNumber) => {
    const newSeats = selectedSeats.includes(seatNumber)
      ? selectedSeats.filter(seat => seat !== seatNumber)
      : [...selectedSeats, seatNumber];
    
    setSelectedSeats(newSeats);
  };

  const handleContinue = () => {
    if (selectedSeats.length === 0) {
      Alert.alert('No Seats Selected', 'Please select at least one seat');
      return;
    }

    createBookingMutation.mutate({
      routeId,
      seats: selectedSeats,
      travelDate: selectedRoute.travelDate,
    });
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Select Your Seats</Text>
        <Text style={styles.subtitle}>
          {selectedRoute.origin} → {selectedRoute.destination}
        </Text>
      </View>

      <SeatLegend />
      
      <SeatMap
        seatAvailability={seatAvailability}
        selectedSeats={selectedSeats}
        onSeatSelect={handleSeatSelect}
      />

      <View style={styles.footer}>
        <View style={styles.summary}>
          <Text style={styles.summaryText}>
            {selectedSeats.length} seat(s) selected
          </Text>
          <Text style={styles.totalPrice}>
            UGX {(selectedSeats.length * selectedRoute.price).toLocaleString()}
          </Text>
        </View>
        
        <Button
          title="Continue to Payment"
          onPress={handleContinue}
          disabled={selectedSeats.length === 0}
          loading={createBookingMutation.isLoading}
        />
      </View>
    </View>
  );
};
```

### **Days 12-13: Payment Integration**

#### **12.1 Payment Screen (Shared Logic with Web)**
```typescript
// src/screens/booking/PaymentScreen.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useMutation } from '@tanstack/react-query';

import { PaymentMethodCard } from '../../components/payment/PaymentMethodCard';
import { MobileMoneyForm } from '../../components/payment/MobileMoneyForm';
import { Button } from '../../components/ui/Button';
import { paymentApi } from '../../services/api/paymentApi'; // Shared with web

const PAYMENT_METHODS = [
  { id: 'MTN_MOBILE_MONEY', name: 'MTN Mobile Money', icon: 'mtn' },
  { id: 'AIRTEL_MONEY', name: 'Airtel Money', icon: 'airtel' },
  { id: 'FLUTTERWAVE', name: 'Card Payment', icon: 'card' },
  { id: 'CASH', name: 'Cash Payment', icon: 'cash' },
];

export const PaymentScreen = ({ route, navigation }) => {
  const { bookingId } = route.params;
  const [selectedMethod, setSelectedMethod] = useState('MTN_MOBILE_MONEY');
  const [phoneNumber, setPhoneNumber] = useState('');

  const paymentMutation = useMutation({
    mutationFn: paymentApi.initiatePayment, // Same API as web
    onSuccess: (payment) => {
      navigation.navigate('PaymentStatus', { 
        paymentId: payment.id,
        bookingId: bookingId 
      });
    },
    onError: (error) => {
      Alert.alert('Payment Failed', error.message);
    },
  });

  const handlePayment = () => {
    if (!phoneNumber && selectedMethod !== 'CASH') {
      Alert.alert('Phone Required', 'Please enter your phone number');
      return;
    }

    paymentMutation.mutate({
      bookingId,
      method: selectedMethod,
      phoneNumber,
    });
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Choose Payment Method</Text>

      {PAYMENT_METHODS.map((method) => (
        <PaymentMethodCard
          key={method.id}
          method={method}
          selected={selectedMethod === method.id}
          onSelect={() => setSelectedMethod(method.id)}
        />
      ))}

      {selectedMethod !== 'CASH' && selectedMethod !== 'FLUTTERWAVE' && (
        <MobileMoneyForm
          phoneNumber={phoneNumber}
          onPhoneNumberChange={setPhoneNumber}
          method={selectedMethod}
        />
      )}

      <Button
        title="Proceed to Pay"
        onPress={handlePayment}
        loading={paymentMutation.isLoading}
        style={styles.payButton}
      />
    </ScrollView>
  );
};
```

---

## 📋 **Phase 3: Native Features & Polish (Days 14-18)**

### **Days 14-15: QR Code & Tickets**

#### **14.1 QR Ticket Display**
```typescript
// src/screens/tickets/TicketDetailScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, Alert, Share } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useMutation } from '@tanstack/react-query';

import { Button } from '../../components/ui/Button';
import { ticketApi } from '../../services/api/ticketApi';

export const TicketDetailScreen = ({ route }) => {
  const { ticket } = route.params;

  const downloadTicketMutation = useMutation({
    mutationFn: ticketApi.downloadTicket,
    onSuccess: (ticketFile) => {
      // Save to device storage
      Alert.alert('Success', 'Ticket saved to your device');
    },
  });

  const handleShare = async () => {
    try {
      await Share.share({
        message: `My TransConnect ticket: ${ticket.route.origin} → ${ticket.route.destination}`,
        title: 'TransConnect Ticket',
      });
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.ticketCard}>
        <View style={styles.header}>
          <Text style={styles.title}>Your Ticket</Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{ticket.status}</Text>
          </View>
        </View>

        <View style={styles.routeInfo}>
          <Text style={styles.route}>
            {ticket.route.origin} → {ticket.route.destination}
          </Text>
          <Text style={styles.date}>
            {new Date(ticket.travelDate).toLocaleDateString()}
          </Text>
          <Text style={styles.time}>{ticket.route.departureTime}</Text>
        </View>

        <View style={styles.qrContainer}>
          <QRCode
            value={ticket.qrCode}
            size={200}
            backgroundColor="white"
            color="black"
          />
        </View>

        <View style={styles.ticketDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Seat Number:</Text>
            <Text style={styles.detailValue}>{ticket.seatNumber}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Bus:</Text>
            <Text style={styles.detailValue}>{ticket.route.bus.plateNumber}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Operator:</Text>
            <Text style={styles.detailValue}>{ticket.route.operator.name}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Amount Paid:</Text>
            <Text style={styles.detailValue}>UGX {ticket.amount.toLocaleString()}</Text>
          </View>
        </View>

        <View style={styles.actions}>
          <Button
            title="Download Ticket"
            onPress={() => downloadTicketMutation.mutate(ticket.id)}
            variant="outline"
            loading={downloadTicketMutation.isLoading}
          />
          <Button
            title="Share Ticket"
            onPress={handleShare}
            variant="secondary"
          />
        </View>
      </View>
    </ScrollView>
  );
};
```

### **Days 16-17: Push Notifications & Offline Storage**

#### **16.1 Push Notification Setup**
```typescript
// src/services/notificationService.ts
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export class NotificationService {
  static async registerForPushNotificationsAsync() {
    let token;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#3B82F6',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        throw new Error('Permission not granted for push notifications');
      }
      
      token = (await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig.extra.eas.projectId,
      })).data;
    }

    return token;
  }

  static async scheduleBookingReminder(booking: Booking) {
    const travelDate = new Date(booking.travelDate);
    const reminderDate = new Date(travelDate.getTime() - 24 * 60 * 60 * 1000); // 24 hours before

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Travel Reminder',
        body: `Your trip to ${booking.route.destination} is tomorrow at ${booking.route.departureTime}`,
        data: { bookingId: booking.id },
      },
      trigger: { date: reminderDate },
    });
  }
}
```

### **Day 18: Testing & Performance**

#### **18.1 Performance Optimization**
```typescript
// src/utils/performance.ts
import { InteractionManager } from 'react-native';

export const withDelayedCallback = (callback: () => void) => {
  InteractionManager.runAfterInteractions(callback);
};

// Lazy loading for screens
export const withLazyLoading = (importFunc: () => Promise<any>) => {
  const LazyComponent = React.lazy(importFunc);
  
  return (props: any) => (
    <React.Suspense fallback={<LoadingSpinner />}>
      <LazyComponent {...props} />
    </React.Suspense>
  );
};

// Image optimization
export const optimizeImage = (uri: string, width: number) => {
  if (uri.includes('localhost') || uri.includes('transconnect')) {
    return `${uri}?w=${width}&q=80`;
  }
  return uri;
};
```

---

## 📋 **Phase 4: Deployment & Store Submission (Days 19-21)**

### **Day 19: Build Configuration**

#### **19.1 App Configuration**
```json
// app.json
{
  "expo": {
    "name": "TransConnect",
    "slug": "transconnect-mobile",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/app-icon.png",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/images/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#3B82F6"
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.transconnect.mobile",
      "buildNumber": "1"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon.png",
        "backgroundColor": "#FFFFFF"
      },
      "package": "com.transconnect.mobile",
      "versionCode": 1
    },
    "web": {
      "favicon": "./assets/images/favicon.png"
    },
    "plugins": [
      "expo-camera",
      "expo-barcode-scanner",
      "expo-notifications",
      "expo-location"
    ]
  }
}
```

### **Days 20-21: Store Preparation & Submission**

#### **20.1 App Store Assets**
- **App Icon**: 1024x1024 PNG
- **Screenshots**: iPhone (6.5", 5.5") and Android (5.5", 7")
- **App Description**: TransConnect mobile app description
- **Keywords**: Bus booking, Uganda transport, mobile tickets
- **Privacy Policy**: Updated for mobile app

#### **20.2 Build & Submit**
```bash
# Install EAS CLI
npm install -g @expo/eas-cli

# Configure EAS
eas login
eas build:configure

# Build for both platforms
eas build --platform all

# Submit to stores
eas submit --platform ios
eas submit --platform android
```

---

## 🎯 **Success Metrics & Validation**

### **Technical Validation**
- ✅ **API Integration**: All endpoints working correctly
- ✅ **Authentication**: Login/register/logout flow
- ✅ **Booking Flow**: Search → Select → Pay → Ticket
- ✅ **QR System**: Generate, display, and validate QR codes
- ✅ **Offline Storage**: Tickets accessible without internet
- ✅ **Push Notifications**: Booking confirmations and reminders

### **Performance Benchmarks**
- ✅ **App Launch**: < 3 seconds
- ✅ **Screen Navigation**: < 500ms
- ✅ **API Responses**: < 2 seconds
- ✅ **Bundle Size**: < 50MB
- ✅ **Memory Usage**: < 150MB

### **Business Validation**
- ✅ **Feature Parity**: 100% compatibility with web platform
- ✅ **Code Reuse**: 70-80% shared business logic
- ✅ **User Experience**: Intuitive mobile-first design
- ✅ **Revenue Integration**: All payment methods working

---

## 🎉 **Project Completion Checklist**

### **Week 1 Deliverables**
- [ ] Project setup and configuration
- [ ] Shared code integration
- [ ] Navigation structure
- [ ] Authentication screens
- [ ] Basic UI components

### **Week 2 Deliverables**
- [ ] Home and search functionality
- [ ] Booking flow implementation
- [ ] Payment integration
- [ ] QR ticket system
- [ ] Push notifications

### **Week 3 Deliverables**
- [ ] Performance optimization
- [ ] Offline capabilities
- [ ] Testing and bug fixes
- [ ] Store submission
- [ ] Production deployment

---

## 🚀 **Ready to Launch**

This React Native implementation plan leverages:

✅ **70-80% Code Reuse** from existing web platform  
✅ **Familiar Technology Stack** for faster development  
✅ **Native Performance** with excellent user experience  
✅ **Complete Feature Set** matching web functionality  
✅ **Production-Ready Architecture** for scalability  

**Timeline**: 3 weeks to App Store and Google Play Store  
**Budget**: Reduced by 60% compared to Flutter approach  
**Team**: Same developers working on web platform  

Let's begin with Phase 1 - Project Setup! 🚀