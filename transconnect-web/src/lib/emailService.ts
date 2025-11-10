/**
 * Email Notification Service for TransConnect App
 * Handles email notifications for critical booking actions
 */

export interface EmailNotificationData {
  userId: string;
  userEmail: string;
  userName: string;
  bookingId: string;
  routeDetails: string;
  amount?: number;
  travelDate?: string;
  seatNumbers?: string;
  additionalInfo?: string;
}

export interface EmailService {
  sendBookingConfirmation: (data: EmailNotificationData) => Promise<void>;
  sendBookingCancellation: (data: EmailNotificationData) => Promise<void>;
  sendPaymentConfirmation: (data: EmailNotificationData & { paymentMethod: string }) => Promise<void>;
  sendPaymentFailure: (data: EmailNotificationData & { reason: string }) => Promise<void>;
  sendTripReminder: (data: EmailNotificationData) => Promise<void>;
}

class EmailNotificationService implements EmailService {
  private apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  private async sendEmail(template: string, data: any): Promise<void> {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${this.apiUrl}/notifications/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify({
          template,
          data
        })
      });

      if (!response.ok) {
        throw new Error(`Email service error: ${response.statusText}`);
      }

      console.log(`Email notification sent: ${template} to ${data.userEmail}`);
    } catch (error) {
      console.error('Failed to send email notification:', error);
      // Don't throw - email failures shouldn't break the user flow
    }
  }

  async sendBookingConfirmation(data: EmailNotificationData): Promise<void> {
    await this.sendEmail('booking-confirmation', {
      ...data,
      subject: `Booking Confirmed - ${data.routeDetails}`,
      bookingUrl: `${window.location.origin}/bookings`,
    });
  }

  async sendBookingCancellation(data: EmailNotificationData): Promise<void> {
    await this.sendEmail('booking-cancellation', {
      ...data,
      subject: `Booking Cancelled - ${data.routeDetails}`,
      supportUrl: `${window.location.origin}/support`,
    });
  }

  async sendPaymentConfirmation(data: EmailNotificationData & { paymentMethod: string }): Promise<void> {
    await this.sendEmail('payment-confirmation', {
      ...data,
      subject: `Payment Confirmed - UGX ${data.amount?.toLocaleString()}`,
      ticketUrl: `${window.location.origin}/tickets/${data.bookingId}`,
    });
  }

  async sendPaymentFailure(data: EmailNotificationData & { reason: string }): Promise<void> {
    await this.sendEmail('payment-failure', {
      ...data,
      subject: `Payment Failed - ${data.routeDetails}`,
      retryUrl: `${window.location.origin}/payment?booking=${data.bookingId}`,
    });
  }

  async sendTripReminder(data: EmailNotificationData): Promise<void> {
    await this.sendEmail('trip-reminder', {
      ...data,
      subject: `Trip Reminder - ${data.routeDetails} Tomorrow`,
      checkInInfo: 'Please arrive 15 minutes before departure time',
    });
  }
}

// Singleton instance
const emailService = new EmailNotificationService();

/**
 * Hook to access email notification service
 */
export const useEmailService = (): EmailService => {
  return emailService;
};

/**
 * Utility functions for email notifications
 */
export const EmailUtils = {
  /**
   * Send email for critical booking action
   */
  async sendCriticalActionEmail(
    action: 'booking-created' | 'booking-cancelled' | 'payment-success' | 'payment-failed',
    data: {
      userEmail: string;
      userName: string;
      bookingId: string;
      routeDetails: string;
      amount?: number;
      paymentMethod?: string;
      reason?: string;
      travelDate?: string;
      seatNumbers?: string;
    }
  ) {
    const emailData: EmailNotificationData = {
      userId: 'current-user', // This would come from auth context
      userEmail: data.userEmail,
      userName: data.userName,
      bookingId: data.bookingId,
      routeDetails: data.routeDetails,
      amount: data.amount,
      travelDate: data.travelDate,
      seatNumbers: data.seatNumbers,
    };

    switch (action) {
      case 'booking-created':
        await emailService.sendBookingConfirmation(emailData);
        break;
      case 'booking-cancelled':
        await emailService.sendBookingCancellation(emailData);
        break;
      case 'payment-success':
        await emailService.sendPaymentConfirmation({
          ...emailData,
          paymentMethod: data.paymentMethod || 'Unknown'
        });
        break;
      case 'payment-failed':
        await emailService.sendPaymentFailure({
          ...emailData,
          reason: data.reason || 'Unknown error'
        });
        break;
    }
  },

  /**
   * Format booking details for email
   */
  formatBookingDetails: (booking: any) => ({
    bookingId: booking.id || 'Unknown',
    routeDetails: `${booking.route?.origin || 'Origin'} → ${booking.route?.destination || 'Destination'}`,
    amount: booking.totalAmount || 0,
    travelDate: booking.travelDate ? new Date(booking.travelDate).toLocaleDateString() : 'Unknown',
    seatNumbers: booking.seatNumber || booking.seatNumbers || 'Unknown',
  }),
};

export default emailService;