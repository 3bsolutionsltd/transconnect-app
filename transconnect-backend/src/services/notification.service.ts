import { PrismaClient, NotificationType, NotificationChannel, NotificationStatus } from '@prisma/client';
import { FirebaseService } from './firebase.service';
import { EmailService } from './email.service';
import { SMSService } from './sms.service';

const prisma = new PrismaClient();

interface NotificationData {
  userId: string;
  type: NotificationType;
  channels: NotificationChannel[];
  title: string;
  body: string;
  data?: Record<string, any>;
  recipient?: string; // Override default recipient
  subject?: string; // For email notifications
}

interface NotificationTemplate {
  title: string;
  body: string;
  subject?: string;
  variables: string[];
}

export class NotificationService {
  private static instance: NotificationService;
  private firebaseService: FirebaseService;
  private emailService: EmailService;
  private smsService: SMSService;

  private constructor() {
    this.firebaseService = FirebaseService.getInstance();
    this.emailService = EmailService.getInstance();
    this.smsService = SMSService.getInstance();
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Send notification through specified channels
   */
  async sendNotification(data: NotificationData): Promise<{
    success: boolean;
    results: Array<{ channel: NotificationChannel; success: boolean; error?: string; messageId?: string }>;
  }> {
    const results: Array<{ channel: NotificationChannel; success: boolean; error?: string; messageId?: string }> = [];
    let overallSuccess = true;

    // Get user preferences
    const user = await prisma.user.findUnique({
      where: { id: data.userId },
      include: {
        notificationPreferences: true,
        deviceTokens: {
          where: { isActive: true },
        },
      },
    });

    if (!user) {
      return {
        success: false,
        results: [{ channel: 'EMAIL' as NotificationChannel, success: false, error: 'User not found' }],
      };
    }

    // Check user preferences
    const preferences = user.notificationPreferences;
    const allowedChannels = data.channels.filter(channel => {
      if (!preferences) return true; // Allow all if no preferences set
      
      switch (channel) {
        case 'EMAIL':
          return preferences.email;
        case 'PUSH':
          return preferences.push;
        case 'SMS':
          return preferences.sms;
        case 'IN_APP':
          return true; // Always allow in-app notifications
        default:
          return true;
      }
    });

    // Process each allowed channel
    for (const channel of allowedChannels) {
      try {
        let result: { success: boolean; messageId?: string; error?: string };

        switch (channel) {
          case 'EMAIL':
            result = await this.sendEmailNotification(user.email, data);
            break;

          case 'PUSH':
            const tokens = user.deviceTokens.map(dt => dt.token);
            if (tokens.length > 0) {
              result = await this.sendPushNotification(tokens, data);
            } else {
              result = { success: false, error: 'No device tokens found' };
            }
            break;

          case 'SMS':
            result = await this.sendSMSNotification(data.recipient || user.phone, data);
            break;

          case 'IN_APP':
            result = await this.createInAppNotification(data);
            break;

          default:
            result = { success: false, error: 'Unsupported channel' };
        }

        // Store notification record
        await this.storeNotificationRecord(user.id, channel, data, result);

        results.push({
          channel,
          success: result.success,
          error: result.error,
          messageId: result.messageId,
        });

        if (!result.success) {
          overallSuccess = false;
        }

      } catch (error: any) {
        console.error(`Error sending ${channel} notification:`, error);
        results.push({
          channel,
          success: false,
          error: error.message,
        });
        overallSuccess = false;
      }
    }

    return {
      success: overallSuccess,
      results,
    };
  }

  /**
   * Send booking confirmation notification
   */
  async sendBookingConfirmation(bookingData: {
    userId: string;
    bookingId: string;
    passengerName: string;
    route: string;
    date: string;
    time: string;
    seatNumber: string;
    amount: number;
    qrCode: string;
  }): Promise<void> {
    await this.sendNotification({
      userId: bookingData.userId,
      type: 'BOOKING_CONFIRMATION',
      channels: ['EMAIL', 'SMS', 'PUSH', 'IN_APP'],
      title: 'Booking Confirmed!',
      body: `Your ticket for ${bookingData.route} on ${bookingData.date} has been confirmed. Seat ${bookingData.seatNumber}.`,
      subject: `Booking Confirmed - ${bookingData.bookingId}`,
      data: {
        bookingId: bookingData.bookingId,
        route: bookingData.route,
        date: bookingData.date,
        time: bookingData.time,
        seatNumber: bookingData.seatNumber,
        amount: bookingData.amount.toString(),
        qrCode: bookingData.qrCode,
      },
    });
  }

  /**
   * Send payment confirmation notification
   */
  async sendPaymentConfirmation(paymentData: {
    userId: string;
    bookingId: string;
    passengerName: string;
    amount: number;
    method: string;
    transactionId: string;
  }): Promise<void> {
    await this.sendNotification({
      userId: paymentData.userId,
      type: 'PAYMENT_SUCCESS',
      channels: ['EMAIL', 'SMS', 'PUSH', 'IN_APP'],
      title: 'Payment Successful!',
      body: `Your payment of UGX ${paymentData.amount.toLocaleString()} via ${paymentData.method} was successful.`,
      subject: `Payment Confirmed - ${paymentData.transactionId}`,
      data: {
        bookingId: paymentData.bookingId,
        amount: paymentData.amount.toString(),
        method: paymentData.method,
        transactionId: paymentData.transactionId,
      },
    });
  }

  /**
   * Send payment failed notification
   */
  async sendPaymentFailed(paymentData: {
    userId: string;
    bookingId: string;
    amount: number;
    method: string;
    reason: string;
  }): Promise<void> {
    await this.sendNotification({
      userId: paymentData.userId,
      type: 'PAYMENT_FAILED',
      channels: ['EMAIL', 'SMS', 'PUSH', 'IN_APP'],
      title: 'Payment Failed',
      body: `Your payment of UGX ${paymentData.amount.toLocaleString()} could not be processed. ${paymentData.reason}`,
      subject: 'Payment Failed - Action Required',
      data: {
        bookingId: paymentData.bookingId,
        amount: paymentData.amount.toString(),
        method: paymentData.method,
        reason: paymentData.reason,
      },
    });
  }

  /**
   * Send trip reminder notification
   */
  async sendTripReminder(reminderData: {
    userId: string;
    passengerName: string;
    route: string;
    date: string;
    time: string;
    seatNumber: string;
    boardingPoint: string;
  }): Promise<void> {
    await this.sendNotification({
      userId: reminderData.userId,
      type: 'TRIP_REMINDER',
      channels: ['EMAIL', 'PUSH', 'SMS'],
      title: 'Trip Reminder',
      body: `Your trip ${reminderData.route} is tomorrow at ${reminderData.time}. Seat ${reminderData.seatNumber}.`,
      subject: `Trip Reminder - ${reminderData.route} Tomorrow`,
      data: {
        route: reminderData.route,
        date: reminderData.date,
        time: reminderData.time,
        seatNumber: reminderData.seatNumber,
        boardingPoint: reminderData.boardingPoint,
      },
    });
  }

  /**
   * Send push notification
   */
  private async sendPushNotification(
    tokens: string[],
    data: NotificationData
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (tokens.length === 1) {
      return await this.firebaseService.sendToDevice(
        tokens[0],
        data.title,
        data.body,
        data.data ? Object.fromEntries(Object.entries(data.data).map(([k, v]) => [k, String(v)])) : undefined
      );
    } else {
      const result = await this.firebaseService.sendToMultipleDevices(
        tokens,
        data.title,
        data.body,
        data.data ? Object.fromEntries(Object.entries(data.data).map(([k, v]) => [k, String(v)])) : undefined
      );
      return {
        success: result.successCount > 0,
        messageId: `${result.successCount}/${tokens.length} sent`,
        error: result.failureCount > 0 ? `${result.failureCount} failures` : undefined,
      };
    }
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(
    email: string,
    data: NotificationData
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    // Use specific email methods for better templates
    if (data.type === 'BOOKING_CONFIRMATION' && data.data) {
      return await this.emailService.sendBookingConfirmation(email, {
        bookingId: data.data.bookingId,
        passengerName: data.data.passengerName || 'Passenger',
        route: data.data.route,
        date: data.data.date,
        time: data.data.time,
        seatNumber: data.data.seatNumber,
        amount: parseInt(data.data.amount),
        qrCode: data.data.qrCode,
      });
    } else if (data.type === 'PAYMENT_SUCCESS' && data.data) {
      return await this.emailService.sendPaymentConfirmation(email, {
        bookingId: data.data.bookingId,
        passengerName: data.data.passengerName || 'Passenger',
        amount: parseInt(data.data.amount),
        method: data.data.method,
        transactionId: data.data.transactionId,
        date: new Date().toLocaleDateString(),
      });
    } else if (data.type === 'TRIP_REMINDER' && data.data) {
      return await this.emailService.sendTripReminder(email, {
        passengerName: data.data.passengerName || 'Passenger',
        route: data.data.route,
        date: data.data.date,
        time: data.data.time,
        seatNumber: data.data.seatNumber,
        boardingPoint: data.data.boardingPoint,
      });
    } else {
      // Generic email
      const htmlContent = `
        <h2>${data.title}</h2>
        <p>${data.body}</p>
        ${data.data ? '<pre>' + JSON.stringify(data.data, null, 2) + '</pre>' : ''}
      `;
      return await this.emailService.sendEmail(email, data.subject || data.title, htmlContent);
    }
  }

  /**
   * Send SMS notification using Twilio SMS service
   */
  private async sendSMSNotification(
    phoneNumber: string,
    data: NotificationData
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // Use specific SMS templates based on notification type
      switch (data.type) {
        case 'BOOKING_CONFIRMATION':
          if (data.data) {
            return await this.smsService.sendBookingConfirmation(phoneNumber, data.data);
          }
          break;
        
        case 'PAYMENT_SUCCESS':
          if (data.data) {
            return await this.smsService.sendPaymentSuccess(phoneNumber, data.data);
          }
          break;
        
        case 'PAYMENT_FAILED':
          if (data.data) {
            return await this.smsService.sendPaymentFailed(phoneNumber, data.data);
          }
          break;
        
        case 'TRIP_REMINDER':
          if (data.data) {
            return await this.smsService.sendTripReminder(phoneNumber, data.data);
          }
          break;
        
        case 'BUS_DELAYED':
          if (data.data) {
            return await this.smsService.sendBusDelay(phoneNumber, data.data);
          }
          break;
        
        case 'BUS_CANCELLED':
          if (data.data) {
            return await this.smsService.sendBusCancellation(phoneNumber, data.data);
          }
          break;
        
        default:
          // For general notifications, use the basic SMS method
          const message = `${data.title}\n\n${data.body}`;
          return await this.smsService.sendSMS({
            phoneNumber,
            message
          });
      }
      
      // Fallback for cases where specific data is missing
      const message = `TransConnect: ${data.title}\n\n${data.body}`;
      return await this.smsService.sendSMS({
        phoneNumber,
        message
      });
      
    } catch (error: any) {
      console.error('SMS notification failed:', error);
      return {
        success: false,
        error: error.message || 'Failed to send SMS notification'
      };
    }
  }

  /**
   * Create in-app notification
   */
  private async createInAppNotification(
    data: NotificationData
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId: data.userId,
          templateId: 'default', // You can create actual templates
          type: data.type,
          channel: 'IN_APP',
          recipient: data.recipient || '',
          subject: data.subject,
          title: data.title,
          body: data.body,
          data: data.data || {},
          status: 'SENT',
          sentAt: new Date(),
        },
      });

      return {
        success: true,
        messageId: notification.id,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Store notification record
   */
  private async storeNotificationRecord(
    userId: string,
    channel: NotificationChannel,
    data: NotificationData,
    result: { success: boolean; messageId?: string; error?: string }
  ): Promise<void> {
    try {
      await prisma.notification.create({
        data: {
          userId,
          templateId: 'default',
          type: data.type,
          channel,
          recipient: data.recipient || '',
          subject: data.subject,
          title: data.title,
          body: data.body,
          data: data.data || {},
          status: result.success ? 'SENT' : 'FAILED',
          sentAt: result.success ? new Date() : undefined,
          errorMessage: result.error,
        },
      });
    } catch (error) {
      console.error('Error storing notification record:', error);
    }
  }

  /**
   * Get user notifications
   */
  async getUserNotifications(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{
    notifications: any[];
    pagination: { page: number; limit: number; total: number; pages: number };
  }> {
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          type: true,
          channel: true,
          title: true,
          body: true,
          data: true,
          status: true,
          sentAt: true,
          readAt: true,
          createdAt: true,
        },
      }),
      prisma.notification.count({
        where: { userId },
      }),
    ]);

    return {
      notifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<boolean> {
    try {
      await prisma.notification.updateMany({
        where: {
          id: notificationId,
          userId,
          readAt: null,
        },
        data: {
          readAt: new Date(),
        },
      });
      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }

  /**
   * Register device token
   */
  async registerDeviceToken(
    userId: string,
    token: string,
    platform: 'ANDROID' | 'IOS' | 'WEB'
  ): Promise<boolean> {
    try {
      // Validate token first
      const isValid = await this.firebaseService.validateToken(token);
      if (!isValid) {
        console.error('Invalid device token provided');
        return false;
      }

      // Upsert device token
      await prisma.deviceToken.upsert({
        where: { token },
        update: {
          userId,
          platform,
          isActive: true,
          lastUsed: new Date(),
        },
        create: {
          userId,
          token,
          platform,
          isActive: true,
          lastUsed: new Date(),
        },
      });

      return true;
    } catch (error) {
      console.error('Error registering device token:', error);
      return false;
    }
  }

  /**
   * Update notification preferences
   */
  async updateNotificationPreferences(
    userId: string,
    preferences: {
      email?: boolean;
      sms?: boolean;
      push?: boolean;
      marketing?: boolean;
    }
  ): Promise<boolean> {
    try {
      await prisma.userNotificationPreference.upsert({
        where: { userId },
        update: preferences,
        create: {
          userId,
          email: preferences.email ?? true,
          sms: preferences.sms ?? true,
          push: preferences.push ?? true,
          marketing: preferences.marketing ?? false,
        },
      });

      return true;
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      return false;
    }
  }
}