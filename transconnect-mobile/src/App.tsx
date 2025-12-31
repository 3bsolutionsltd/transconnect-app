import React, { useState, useEffect, useRef, Component } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';

import AppNavigator from './navigation/AppNavigator';
import { AuthProvider } from './contexts/AuthContext';
import SplashScreen from './screens/SplashScreen';
import { notificationService } from './services/notificationService';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        // Don't retry on 404 or auth errors
        if (error?.response?.status === 404 || error?.response?.status === 401) {
          return false;
        }
        return failureCount < 2;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

// Error Boundary Component
class ErrorBoundary extends Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('App Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={errorStyles.container}>
          <Text style={errorStyles.title}>Something went wrong</Text>
          <Text style={errorStyles.message}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </Text>
          <TouchableOpacity
            style={errorStyles.button}
            onPress={() => this.setState({ hasError: false, error: null })}
          >
            <Text style={errorStyles.buttonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const errorStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F3F4F6',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    console.log('🚀 App starting up...');
    
    // Register for push notifications (non-blocking, delayed)
    setTimeout(() => {
      const registerNotifications = async () => {
        try {
          console.log('📲 Registering notifications...');
          const token = await Promise.race([
            notificationService.registerForPushNotifications(),
            new Promise((resolve) => setTimeout(() => resolve(null), 5000)) // 5 second timeout
          ]);
          
          if (token) {
            console.log('✅ Remote push notifications enabled');
            console.log('Push token:', token);
          } else {
            console.log('📱 Local notifications enabled (Expo Go limitation)');
          }
        } catch (error) {
          console.log('⚠️ Notification setup failed (non-critical):', error);
        }
      };

      registerNotifications();
    }, 1000); // Delay by 1 second to not block startup

    // Listen for notifications while app is in foreground
    notificationListener.current = notificationService.addNotificationReceivedListener(
      (notification) => {
        console.log('Notification received:', notification);
        const data = notification.request.content.data;
        
        // Handle payment confirmation notifications
        if (data.action === 'REFRESH_BOOKING' || data.bookingStatus === 'CONFIRMED') {
          console.log('Payment confirmed - invalidating bookings cache to trigger refresh');
          queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
        }
      }
    );

    // Listen for notification responses (when user taps a notification)
    responseListener.current = notificationService.addNotificationResponseListener(
      (response) => {
        console.log('Notification response:', response);
        const data = response.notification.request.content.data;
        
        // Refresh bookings when tapping payment confirmation notification
        if (data.action === 'REFRESH_BOOKING' || data.bookingStatus === 'CONFIRMED') {
          console.log('Refreshing bookings after payment confirmation');
          queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
        }
        
        // TODO: Handle navigation based on notification type
        if (data.type === 'booking_confirmation' || data.type === 'trip_reminder') {
          // Navigate to booking details
          console.log('Should navigate to booking:', data.bookingRef);
        }
      }
    );

    // Cleanup listeners on unmount
    return () => {
      try {
        if (notificationListener.current) {
          notificationListener.current.remove();
        }
        if (responseListener.current) {
          responseListener.current.remove();
        }
      } catch (error) {
        console.log('Notification cleanup error (expected in Expo Go):', error);
      }
    };
  }, []);

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <NavigationContainer>
              <AppNavigator />
              <StatusBar style="auto" />
            </NavigationContainer>
          </AuthProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}