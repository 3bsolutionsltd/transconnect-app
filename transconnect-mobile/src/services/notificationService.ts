import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PUSH_TOKEN_KEY = '@transconnect_push_token';

// Configure how notifications are handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class NotificationService {
  /**
   * Request notification permissions from the user
   */
  async requestPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Push notification permission denied');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  /**
   * Get or register for a push notification token
   * Note: Remote push notifications don't work in Expo Go (SDK 53+)
   * Use development build for full push notification support
   */
  async registerForPushNotifications(): Promise<string | null> {
    try {
      // Check if we have permission
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.log('Push notification permission not granted');
        return null;
      }

      // Configure Android channel if needed (works in Expo Go)
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#3B82F6',
        });
      }

      // Try to get push token (will fail in Expo Go, that's ok)
      try {
        const token = (await Notifications.getExpoPushTokenAsync()).data;
        await AsyncStorage.setItem(PUSH_TOKEN_KEY, token);
        console.log('Push token registered:', token);
        return token;
      } catch (tokenError) {
        // Expected to fail in Expo Go - local notifications still work
        console.log('Remote push notifications unavailable (Expo Go limitation)');
        console.log('Local notifications will still work for scheduled reminders');
        return null;
      }
    } catch (error) {
      console.error('Error setting up notifications:', error);
      return null;
    }
  }

  /**
   * Get the stored push token
   */
  async getStoredToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(PUSH_TOKEN_KEY);
    } catch (error) {
      console.error('Error getting stored token:', error);
      return null;
    }
  }

  /**
   * Schedule a local notification
   */
  async scheduleNotification(
    title: string,
    body: string,
    trigger?: Notifications.NotificationTriggerInput,
    data?: any
  ): Promise<string | null> {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: data || {},
          sound: true,
        },
        trigger: trigger || null, // null means send immediately
      });

      console.log('Notification scheduled:', notificationId);
      return notificationId;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return null;
    }
  }

  /**
   * Cancel a scheduled notification
   */
  async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      console.log('Notification cancelled:', notificationId);
    } catch (error) {
      console.error('Error cancelling notification:', error);
    }
  }

  /**
   * Cancel all scheduled notifications
   */
  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('All notifications cancelled');
    } catch (error) {
      console.error('Error cancelling all notifications:', error);
    }
  }

  /**
   * Get all scheduled notifications
   */
  async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  }

  /**
   * Schedule a trip reminder notification
   */
  async scheduleTripReminder(
    travelDate: string,
    origin: string,
    destination: string,
    departureTime: string
  ): Promise<string | null> {
    try {
      // Calculate trigger time (1 day before travel)
      const travelDateTime = new Date(travelDate);
      const reminderTime = new Date(travelDateTime);
      reminderTime.setDate(reminderTime.getDate() - 1);
      reminderTime.setHours(9, 0, 0, 0); // 9 AM the day before

      // Only schedule if the reminder time is in the future
      if (reminderTime > new Date()) {
        return await this.scheduleNotification(
          'Trip Reminder',
          `Your trip from ${origin} to ${destination} is tomorrow at ${departureTime}. Don't forget to arrive 30 minutes early!`,
          { date: reminderTime },
          { type: 'trip_reminder', travelDate, origin, destination }
        );
      }

      return null;
    } catch (error) {
      console.error('Error scheduling trip reminder:', error);
      return null;
    }
  }

  /**
   * Schedule a boarding reminder notification
   */
  async scheduleBoardingReminder(
    travelDate: string,
    departureTime: string,
    origin: string,
    destination: string
  ): Promise<string | null> {
    try {
      // Parse travel date and time
      const [hours, minutes] = departureTime.split(':').map(Number);
      const departureDateTime = new Date(travelDate);
      departureDateTime.setHours(hours, minutes, 0, 0);

      // Schedule notification 2 hours before departure
      const reminderTime = new Date(departureDateTime);
      reminderTime.setHours(reminderTime.getHours() - 2);

      // Only schedule if the reminder time is in the future
      if (reminderTime > new Date()) {
        return await this.scheduleNotification(
          'Boarding Soon!',
          `Your bus from ${origin} to ${destination} departs in 2 hours. Time to head to the station!`,
          { date: reminderTime },
          { type: 'boarding_reminder', travelDate, origin, destination }
        );
      }

      return null;
    } catch (error) {
      console.error('Error scheduling boarding reminder:', error);
      return null;
    }
  }

  /**
   * Send a booking confirmation notification
   */
  async sendBookingConfirmation(
    origin: string,
    destination: string,
    travelDate: string,
    bookingRef: string
  ): Promise<string | null> {
    return await this.scheduleNotification(
      'Booking Confirmed! ✓',
      `Your trip from ${origin} to ${destination} on ${travelDate} has been confirmed. Ref: ${bookingRef}`,
      null, // Send immediately
      { type: 'booking_confirmation', bookingRef }
    );
  }

  /**
   * Send a payment success notification
   */
  async sendPaymentSuccess(
    amount: number,
    bookingRef: string
  ): Promise<string | null> {
    return await this.scheduleNotification(
      'Payment Successful',
      `Your payment of UGX ${amount.toLocaleString()} has been processed. Booking Ref: ${bookingRef}`,
      null,
      { type: 'payment_success', bookingRef }
    );
  }

  /**
   * Schedule all trip notifications for a booking
   * Returns an object with notification IDs
   */
  async scheduleAllTripNotifications(
    travelDate: string,
    departureTime: string,
    origin: string,
    destination: string,
    bookingRef: string
  ): Promise<{ confirmationId: string | null; tripReminderId: string | null; boardingReminderId: string | null }> {
    console.log('📅 Scheduling all trip notifications for:', bookingRef);
    
    const confirmationId = await this.sendBookingConfirmation(
      origin,
      destination,
      travelDate,
      bookingRef
    );

    const tripReminderId = await this.scheduleTripReminder(
      travelDate,
      origin,
      destination,
      departureTime
    );

    const boardingReminderId = await this.scheduleBoardingReminder(
      travelDate,
      departureTime,
      origin,
      destination
    );

    console.log('✅ Trip notifications scheduled:', {
      confirmation: confirmationId ? 'sent' : 'failed',
      tripReminder: tripReminderId ? 'scheduled' : 'not applicable',
      boardingReminder: boardingReminderId ? 'scheduled' : 'not applicable'
    });

    return {
      confirmationId,
      tripReminderId,
      boardingReminderId
    };
  }

  /**
   * Add notification response listener
   */
  addNotificationResponseListener(
    callback: (response: Notifications.NotificationResponse) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationResponseReceivedListener(callback);
  }

  /**
   * Add notification received listener (when app is in foreground)
   */
  addNotificationReceivedListener(
    callback: (notification: Notifications.Notification) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationReceivedListener(callback);
  }
}

export const notificationService = new NotificationService();
