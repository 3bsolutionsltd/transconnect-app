import twilio from 'twilio';

export interface SMSTemplate {
  booking_confirmation: string;
  payment_success: string;
  payment_failed: string;
  booking_cancelled: string;
  trip_reminder: string;
  bus_delayed: string;
  bus_cancelled: string;
}

export interface SMSData {
  phoneNumber: string;
  message: string;
  template?: keyof SMSTemplate;
  templateData?: Record<string, any>;
}

export class SMSService {
  private static instance: SMSService;
  private client: twilio.Twilio | null = null;
  private fromNumber: string;
  private isConfigured: boolean = false;

  private constructor() {
    this.fromNumber = process.env.TWILIO_PHONE_NUMBER || '';
    this.initializeTwilio();
  }

  public static getInstance(): SMSService {
    if (!SMSService.instance) {
      SMSService.instance = new SMSService();
    }
    return SMSService.instance;
  }

  private initializeTwilio(): void {
    try {
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;

      if (!accountSid || !authToken || !this.fromNumber) {
        console.warn('Twilio configuration incomplete. SMS service will be disabled.');
        return;
      }

      this.client = twilio(accountSid, authToken);
      this.isConfigured = true;
      console.log('✅ Twilio SMS service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Twilio SMS service:', error);
      this.isConfigured = false;
    }
  }

  private templates: SMSTemplate = {
    booking_confirmation: `🎫 TransConnect Booking Confirmed!
Booking ID: {bookingId}
Route: {route}
Date: {date}
Seat: {seat}
Amount: UGX {amount}
Show this SMS as backup ticket.`,

    payment_success: `💳 Payment Successful!
Booking ID: {bookingId}
Amount: UGX {amount}
Route: {route}
Your QR ticket is ready. Check your email for details.`,

    payment_failed: `❌ Payment Failed
Booking ID: {bookingId}
Amount: UGX {amount}
Please try again or contact support.
Booking expires in 15 minutes.`,

    booking_cancelled: `🚫 Booking Cancelled
Booking ID: {bookingId}
Route: {route}
Refund: UGX {refundAmount}
Refund will be processed within 3-5 business days.`,

    trip_reminder: `⏰ Trip Reminder
Route: {route}
Departure: {departureTime}
Boarding: {boardingPoint}
Seat: {seat}
Have your QR ticket ready!`,

    bus_delayed: `🚌 Bus Delayed
Route: {route}
New Departure: {newDepartureTime}
Delay: {delayMinutes} minutes
Apologies for the inconvenience.`,

    bus_cancelled: `🚨 Trip Cancelled
Route: {route}
Date: {date}
Full refund will be processed automatically.
Contact support for rebooking assistance.`
  };

  private formatTemplate(template: keyof SMSTemplate, data: Record<string, any>): string {
    let message = this.templates[template];
    
    // Replace placeholders with actual data
    Object.entries(data).forEach(([key, value]) => {
      const placeholder = `{${key}}`;
      message = message.replace(new RegExp(placeholder, 'g'), String(value));
    });

    return message;
  }

  private formatPhoneNumber(phoneNumber: string): string {
    // Remove any non-digit characters
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    // Handle Ugandan phone numbers
    if (cleaned.startsWith('0') && cleaned.length === 10) {
      cleaned = '256' + cleaned.substring(1); // Convert 07XX to +2567XX
    } else if (cleaned.startsWith('7') && cleaned.length === 9) {
      cleaned = '256' + cleaned; // Add country code
    } else if (!cleaned.startsWith('256') && cleaned.length === 9) {
      cleaned = '256' + cleaned;
    }

    return '+' + cleaned;
  }

  public async sendSMS(data: SMSData): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.isConfigured || !this.client) {
      console.log(`📱 SMS would be sent to ${data.phoneNumber}: ${data.message}`);
      return { 
        success: false, 
        error: 'SMS service not configured. Check Twilio credentials.' 
      };
    }

    try {
      const formattedPhone = this.formatPhoneNumber(data.phoneNumber);
      
      // Use template if provided
      const message = data.template && data.templateData
        ? this.formatTemplate(data.template, data.templateData)
        : data.message;

      console.log(`📱 Sending SMS to ${formattedPhone}...`);
      
      const result = await this.client.messages.create({
        body: message,
        from: this.fromNumber,
        to: formattedPhone
      });

      console.log(`✅ SMS sent successfully! Message ID: ${result.sid}`);
      
      return {
        success: true,
        messageId: result.sid
      };

    } catch (error: any) {
      console.error('❌ SMS sending failed:', error);
      
      return {
        success: false,
        error: error.message || 'Failed to send SMS'
      };
    }
  }

  // Convenience methods for common notifications
  public async sendBookingConfirmation(phoneNumber: string, bookingData: any): Promise<{ success: boolean; messageId?: string; error?: string }> {
    return this.sendSMS({
      phoneNumber,
      message: '', // Will be overridden by template
      template: 'booking_confirmation',
      templateData: {
        bookingId: bookingData.id,
        route: `${bookingData.route?.origin} → ${bookingData.route?.destination}`,
        date: new Date(bookingData.departureDate).toLocaleDateString(),
        seat: bookingData.seatNumber,
        amount: bookingData.totalAmount?.toLocaleString()
      }
    });
  }

  public async sendPaymentSuccess(phoneNumber: string, paymentData: any): Promise<{ success: boolean; messageId?: string; error?: string }> {
    return this.sendSMS({
      phoneNumber,
      message: '',
      template: 'payment_success',
      templateData: {
        bookingId: paymentData.bookingId,
        amount: paymentData.amount?.toLocaleString(),
        route: paymentData.route
      }
    });
  }

  public async sendPaymentFailed(phoneNumber: string, paymentData: any): Promise<{ success: boolean; messageId?: string; error?: string }> {
    return this.sendSMS({
      phoneNumber,
      message: '',
      template: 'payment_failed',
      templateData: {
        bookingId: paymentData.bookingId,
        amount: paymentData.amount?.toLocaleString()
      }
    });
  }

  public async sendBookingCancellation(phoneNumber: string, bookingData: any): Promise<{ success: boolean; messageId?: string; error?: string }> {
    return this.sendSMS({
      phoneNumber,
      message: '',
      template: 'booking_cancelled',
      templateData: {
        bookingId: bookingData.id,
        route: `${bookingData.route?.origin} → ${bookingData.route?.destination}`,
        refundAmount: bookingData.refundAmount?.toLocaleString()
      }
    });
  }

  public async sendTripReminder(phoneNumber: string, tripData: any): Promise<{ success: boolean; messageId?: string; error?: string }> {
    return this.sendSMS({
      phoneNumber,
      message: '',
      template: 'trip_reminder',
      templateData: {
        route: `${tripData.route?.origin} → ${tripData.route?.destination}`,
        departureTime: new Date(tripData.departureDate).toLocaleString(),
        boardingPoint: tripData.boardingPoint,
        seat: tripData.seatNumber
      }
    });
  }

  public async sendBusDelay(phoneNumber: string, delayData: any): Promise<{ success: boolean; messageId?: string; error?: string }> {
    return this.sendSMS({
      phoneNumber,
      message: '',
      template: 'bus_delayed',
      templateData: {
        route: delayData.route,
        newDepartureTime: new Date(delayData.newDepartureTime).toLocaleString(),
        delayMinutes: delayData.delayMinutes
      }
    });
  }

  public async sendBusCancellation(phoneNumber: string, cancellationData: any): Promise<{ success: boolean; messageId?: string; error?: string }> {
    return this.sendSMS({
      phoneNumber,
      message: '',
      template: 'bus_cancelled',
      templateData: {
        route: cancellationData.route,
        date: new Date(cancellationData.date).toLocaleDateString()
      }
    });
  }

  // Test method
  public async sendTestSMS(phoneNumber: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    return this.sendSMS({
      phoneNumber,
      message: `🧪 TransConnect SMS Test
This is a test message from TransConnect MVP1.
SMS notifications are working!
Time: ${new Date().toLocaleString()}`
    });
  }

  // Configuration check
  public isReady(): boolean {
    return this.isConfigured && this.client !== null;
  }

  public getStatus(): { configured: boolean; fromNumber: string; error?: string } {
    return {
      configured: this.isConfigured,
      fromNumber: this.fromNumber,
      error: !this.isConfigured ? 'Check TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER environment variables' : undefined
    };
  }
}

export default SMSService;