import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

class NotificationService {
  static final NotificationService _instance = NotificationService._internal();
  factory NotificationService() => _instance;
  NotificationService._internal();

  final FirebaseMessaging _firebaseMessaging = FirebaseMessaging.instance;
  final FlutterLocalNotificationsPlugin _localNotifications = FlutterLocalNotificationsPlugin();

  String? _fcmToken;
  String? get fcmToken => _fcmToken;

  /// Initialize notification service
  Future<void> initialize() async {
    // Request permission for notifications
    NotificationSettings settings = await _firebaseMessaging.requestPermission(
      alert: true,
      announcement: false,
      badge: true,
      carPlay: false,
      criticalAlert: false,
      provisional: false,
      sound: true,
    );

    print('Notification permission status: ${settings.authorizationStatus}');

    if (settings.authorizationStatus == AuthorizationStatus.authorized) {
      await _initializeLocalNotifications();
      await _initializeFCM();
    }
  }

  /// Initialize local notifications
  Future<void> _initializeLocalNotifications() async {
    const AndroidInitializationSettings initializationSettingsAndroid =
        AndroidInitializationSettings('@mipmap/ic_launcher');

    const DarwinInitializationSettings initializationSettingsIOS =
        DarwinInitializationSettings(
          requestAlertPermission: true,
          requestBadgePermission: true,
          requestSoundPermission: true,
        );

    const InitializationSettings initializationSettings =
        InitializationSettings(
          android: initializationSettingsAndroid,
          iOS: initializationSettingsIOS,
        );

    await _localNotifications.initialize(
      initializationSettings,
      onDidReceiveNotificationResponse: _onNotificationTapped,
    );

    // Create notification channel for Android
    const AndroidNotificationChannel channel = AndroidNotificationChannel(
      'transconnect_notifications',
      'TransConnect Notifications',
      description: 'Notifications for booking updates, payment status, and trip reminders',
      importance: Importance.high,
    );

    await _localNotifications
        .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(channel);
  }

  /// Initialize Firebase Cloud Messaging
  Future<void> _initializeFCM() async {
    // Get FCM token
    _fcmToken = await _firebaseMessaging.getToken();
    print('FCM Token: $_fcmToken');

    // Send token to backend
    if (_fcmToken != null) {
      await _registerTokenWithBackend(_fcmToken!);
    }

    // Listen for token refresh
    _firebaseMessaging.onTokenRefresh.listen((newToken) {
      _fcmToken = newToken;
      _registerTokenWithBackend(newToken);
    });

    // Handle background messages
    FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

    // Handle foreground messages
    FirebaseMessaging.onMessage.listen(_handleForegroundMessage);

    // Handle notification taps when app is in background
    FirebaseMessaging.onMessageOpenedApp.listen(_handleNotificationTap);

    // Handle notification tap when app is terminated
    RemoteMessage? initialMessage = await _firebaseMessaging.getInitialMessage();
    if (initialMessage != null) {
      _handleNotificationTap(initialMessage);
    }
  }

  /// Register FCM token with backend
  Future<void> _registerTokenWithBackend(String token) async {
    try {
      // Get stored auth token
      // You'll need to implement your auth token storage
      final authToken = await _getStoredAuthToken();
      
      if (authToken == null) {
        print('No auth token available, skipping FCM token registration');
        return;
      }

      final response = await http.post(
        Uri.parse('${_getBaseUrl()}/api/notifications/register-token'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $authToken',
        },
        body: json.encode({
          'token': token,
          'platform': _getPlatform(),
        }),
      );

      if (response.statusCode == 200) {
        print('FCM token registered successfully');
      } else {
        print('Failed to register FCM token: ${response.statusCode}');
      }
    } catch (error) {
      print('Error registering FCM token: $error');
    }
  }

  /// Handle foreground messages
  void _handleForegroundMessage(RemoteMessage message) {
    print('Foreground message received: ${message.messageId}');
    
    // Show local notification for foreground messages
    _showLocalNotification(
      title: message.notification?.title ?? 'TransConnect',
      body: message.notification?.body ?? 'You have a new notification',
      data: message.data,
    );
  }

  /// Handle notification tap
  void _handleNotificationTap(RemoteMessage message) {
    print('Notification tapped: ${message.messageId}');
    
    // Navigate based on notification data
    final data = message.data;
    if (data.containsKey('type')) {
      _navigateBasedOnNotificationType(data['type'], data);
    }
  }

  /// Show local notification
  Future<void> _showLocalNotification({
    required String title,
    required String body,
    Map<String, dynamic>? data,
  }) async {
    const AndroidNotificationDetails androidPlatformChannelSpecifics =
        AndroidNotificationDetails(
          'transconnect_notifications',
          'TransConnect Notifications',
          channelDescription: 'Notifications for booking updates, payment status, and trip reminders',
          importance: Importance.high,
          priority: Priority.high,
          ticker: 'TransConnect',
          icon: '@mipmap/ic_launcher',
        );

    const DarwinNotificationDetails iOSPlatformChannelSpecifics =
        DarwinNotificationDetails(
          presentAlert: true,
          presentBadge: true,
          presentSound: true,
        );

    const NotificationDetails platformChannelSpecifics = NotificationDetails(
      android: androidPlatformChannelSpecifics,
      iOS: iOSPlatformChannelSpecifics,
    );

    await _localNotifications.show(
      DateTime.now().millisecondsSinceEpoch ~/ 1000,
      title,
      body,
      platformChannelSpecifics,
      payload: data != null ? json.encode(data) : null,
    );
  }

  /// Handle local notification tap
  void _onNotificationTapped(NotificationResponse notificationResponse) {
    if (notificationResponse.payload != null) {
      try {
        final data = json.decode(notificationResponse.payload!);
        if (data['type'] != null) {
          _navigateBasedOnNotificationType(data['type'], data);
        }
      } catch (error) {
        print('Error parsing notification payload: $error');
      }
    }
  }

  /// Navigate based on notification type
  void _navigateBasedOnNotificationType(String type, Map<String, dynamic> data) {
    // Implement navigation logic based on notification type
    switch (type) {
      case 'BOOKING_CONFIRMATION':
        // Navigate to booking details
        _navigateToBookingDetails(data['bookingId']);
        break;
      case 'PAYMENT_SUCCESS':
      case 'PAYMENT_FAILED':
        // Navigate to payment status
        _navigateToPaymentStatus(data['paymentId']);
        break;
      case 'TRIP_REMINDER':
        // Navigate to trip details
        _navigateToTripDetails(data['bookingId']);
        break;
      case 'BUS_DELAYED':
      case 'BUS_CANCELLED':
        // Navigate to trip updates
        _navigateToTripUpdates(data['bookingId']);
        break;
      case 'RIDE_MATCHED':
        // Navigate to ride details
        _navigateToRideDetails(data['rideId']);
        break;
      case 'PROMOTIONAL':
        // Navigate to offers
        _navigateToOffers();
        break;
      default:
        // Navigate to notifications list
        _navigateToNotifications();
        break;
    }
  }

  // Navigation helper methods (implement based on your routing)
  void _navigateToBookingDetails(String? bookingId) {
    // Implement navigation to booking details
    print('Navigate to booking details: $bookingId');
  }

  void _navigateToPaymentStatus(String? paymentId) {
    // Implement navigation to payment status
    print('Navigate to payment status: $paymentId');
  }

  void _navigateToTripDetails(String? bookingId) {
    // Implement navigation to trip details
    print('Navigate to trip details: $bookingId');
  }

  void _navigateToTripUpdates(String? bookingId) {
    // Implement navigation to trip updates
    print('Navigate to trip updates: $bookingId');
  }

  void _navigateToRideDetails(String? rideId) {
    // Implement navigation to ride details
    print('Navigate to ride details: $rideId');
  }

  void _navigateToOffers() {
    // Implement navigation to offers
    print('Navigate to offers');
  }

  void _navigateToNotifications() {
    // Implement navigation to notifications list
    print('Navigate to notifications');
  }

  // Helper methods
  Future<String?> _getStoredAuthToken() async {
    // Implement your auth token retrieval logic
    // This could be from SharedPreferences, Secure Storage, etc.
    return null;
  }

  String _getBaseUrl() {
    // Return your API base URL
    return 'http://localhost:5000'; // Replace with your actual API URL
  }

  String _getPlatform() {
    // Return platform type
    return 'ANDROID'; // or 'IOS' based on Platform.isIOS
  }

  /// Subscribe to topic for broadcast notifications
  Future<void> subscribeToTopic(String topic) async {
    await _firebaseMessaging.subscribeToTopic(topic);
    print('Subscribed to topic: $topic');
  }

  /// Unsubscribe from topic
  Future<void> unsubscribeFromTopic(String topic) async {
    await _firebaseMessaging.unsubscribeFromTopic(topic);
    print('Unsubscribed from topic: $topic');
  }

  /// Update notification preferences
  Future<void> updateNotificationPreferences({
    required bool email,
    required bool sms,
    required bool push,
    required bool marketing,
  }) async {
    try {
      final authToken = await _getStoredAuthToken();
      
      if (authToken == null) {
        print('No auth token available');
        return;
      }

      final response = await http.put(
        Uri.parse('${_getBaseUrl()}/api/notifications/preferences'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $authToken',
        },
        body: json.encode({
          'email': email,
          'sms': sms,
          'push': push,
          'marketing': marketing,
        }),
      );

      if (response.statusCode == 200) {
        print('Notification preferences updated successfully');
      } else {
        print('Failed to update notification preferences: ${response.statusCode}');
      }
    } catch (error) {
      print('Error updating notification preferences: $error');
    }
  }

  /// Get notification preferences
  Future<Map<String, bool>?> getNotificationPreferences() async {
    try {
      final authToken = await _getStoredAuthToken();
      
      if (authToken == null) {
        print('No auth token available');
        return null;
      }

      final response = await http.get(
        Uri.parse('${_getBaseUrl()}/api/notifications/preferences'),
        headers: {
          'Authorization': 'Bearer $authToken',
        },
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return Map<String, bool>.from(data['preferences']);
      } else {
        print('Failed to get notification preferences: ${response.statusCode}');
        return null;
      }
    } catch (error) {
      print('Error getting notification preferences: $error');
      return null;
    }
  }
}

/// Background message handler (must be top-level function)
@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  print('Background message received: ${message.messageId}');
  
  // Handle background message
  // You can show local notification or update app state
}