import nodemailer from 'nodemailer';
import { NotificationType } from '@prisma/client';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export class EmailService {
  private static instance: EmailService;
  private transporter: nodemailer.Transporter;

  private constructor() {
    const config: EmailConfig = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER!,
        pass: process.env.SMTP_PASS!,
      },
    };

    this.transporter = nodemailer.createTransport(config);
  }

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  /**
   * Send email notification
   */
  async sendEmail(
    to: string,
    subject: string,
    htmlContent: string,
    textContent?: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const mailOptions = {
        from: {
          name: 'TransConnect',
          address: process.env.SMTP_FROM || process.env.SMTP_USER!,
        },
        to,
        subject,
        html: htmlContent,
        text: textContent || this.stripHtml(htmlContent),
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', result.messageId);
      
      return {
        success: true,
        messageId: result.messageId,
      };
    } catch (error: any) {
      console.error('Error sending email:', error);
      return {
        success: false,
        error: error.message || 'Failed to send email',
      };
    }
  }

  /**
   * Send booking confirmation email
   */
  async sendBookingConfirmation(
    to: string,
    bookingData: {
      bookingId: string;
      passengerName: string;
      route: string;
      date: string;
      time: string;
      seatNumber: string;
      amount: number;
      qrCode: string;
    }
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const template = this.getBookingConfirmationTemplate(bookingData);
    return this.sendEmail(to, template.subject, template.html, template.text);
  }

  /**
   * Send payment confirmation email
   */
  async sendPaymentConfirmation(
    to: string,
    paymentData: {
      bookingId: string;
      passengerName: string;
      amount: number;
      method: string;
      transactionId: string;
      date: string;
    }
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const template = this.getPaymentConfirmationTemplate(paymentData);
    return this.sendEmail(to, template.subject, template.html, template.text);
  }

  /**
   * Send trip reminder email
   */
  async sendTripReminder(
    to: string,
    reminderData: {
      passengerName: string;
      route: string;
      date: string;
      time: string;
      seatNumber: string;
      boardingPoint: string;
    }
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const template = this.getTripReminderTemplate(reminderData);
    return this.sendEmail(to, template.subject, template.html, template.text);
  }

  /**
   * Get booking confirmation email template
   */
  private getBookingConfirmationTemplate(data: any): EmailTemplate {
    const subject = `Booking Confirmed - ${data.bookingId}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Booking Confirmation</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
            .header { text-align: center; color: #1976D2; margin-bottom: 30px; }
            .ticket { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #1976D2; }
            .detail-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 5px 0; border-bottom: 1px dotted #ddd; }
            .qr-section { text-align: center; margin: 30px 0; padding: 20px; background: #e3f2fd; border-radius: 8px; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
            .btn { display: inline-block; padding: 12px 24px; background: #1976D2; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚌 TransConnect</h1>
              <h2>Booking Confirmation</h2>
            </div>
            
            <p>Dear ${data.passengerName},</p>
            <p>Your bus ticket has been successfully booked! Here are your booking details:</p>
            
            <div class="ticket">
              <h3>Booking Details</h3>
              <div class="detail-row">
                <span><strong>Booking ID:</strong></span>
                <span>${data.bookingId}</span>
              </div>
              <div class="detail-row">
                <span><strong>Route:</strong></span>
                <span>${data.route}</span>
              </div>
              <div class="detail-row">
                <span><strong>Date:</strong></span>
                <span>${data.date}</span>
              </div>
              <div class="detail-row">
                <span><strong>Departure Time:</strong></span>
                <span>${data.time}</span>
              </div>
              <div class="detail-row">
                <span><strong>Seat Number:</strong></span>
                <span>${data.seatNumber}</span>
              </div>
              <div class="detail-row">
                <span><strong>Amount Paid:</strong></span>
                <span>UGX ${data.amount.toLocaleString()}</span>
              </div>
            </div>
            
            <div class="qr-section">
              <h3>Your QR Ticket</h3>
              <p>Show this QR code to the conductor when boarding:</p>
              <div style="margin: 20px 0;">
                <strong style="font-size: 18px; letter-spacing: 2px;">${data.qrCode}</strong>
              </div>
              <p><small>Keep this email for your records and show it during your journey.</small></p>
            </div>
            
            <p><strong>Important Notes:</strong></p>
            <ul>
              <li>Arrive at the boarding point at least 15 minutes before departure</li>
              <li>Carry a valid ID for verification</li>
              <li>Your QR code is required for boarding</li>
              <li>No refunds after departure time</li>
            </ul>
            
            <div class="footer">
              <p>Thank you for choosing TransConnect!</p>
              <p>For support, contact us at support@transconnect.ug or call +256-XXX-XXXXX</p>
              <p>&copy; 2025 TransConnect. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
    
    const text = `
Booking Confirmation - TransConnect

Dear ${data.passengerName},

Your bus ticket has been successfully booked!

Booking Details:
- Booking ID: ${data.bookingId}
- Route: ${data.route}
- Date: ${data.date}
- Departure Time: ${data.time}
- Seat Number: ${data.seatNumber}
- Amount Paid: UGX ${data.amount.toLocaleString()}

Your QR Code: ${data.qrCode}

Important Notes:
- Arrive at the boarding point at least 15 minutes before departure
- Carry a valid ID for verification
- Your QR code is required for boarding
- No refunds after departure time

Thank you for choosing TransConnect!
For support: support@transconnect.ug or +256-XXX-XXXXX
    `;

    return { subject, html, text };
  }

  /**
   * Get payment confirmation email template
   */
  private getPaymentConfirmationTemplate(data: any): EmailTemplate {
    const subject = `Payment Confirmed - ${data.transactionId}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
            .header { text-align: center; color: #1976D2; margin-bottom: 30px; }
            .success { background: #d4edda; color: #155724; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: center; }
            .payment-details { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .detail-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 5px 0; border-bottom: 1px dotted #ddd; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>💳 Payment Confirmed</h1>
            </div>
            
            <div class="success">
              <h2>✅ Payment Successful!</h2>
              <p>Your payment has been processed successfully.</p>
            </div>
            
            <p>Dear ${data.passengerName},</p>
            <p>We have received your payment for booking ${data.bookingId}.</p>
            
            <div class="payment-details">
              <h3>Payment Details</h3>
              <div class="detail-row">
                <span><strong>Transaction ID:</strong></span>
                <span>${data.transactionId}</span>
              </div>
              <div class="detail-row">
                <span><strong>Amount:</strong></span>
                <span>UGX ${data.amount.toLocaleString()}</span>
              </div>
              <div class="detail-row">
                <span><strong>Payment Method:</strong></span>
                <span>${data.method}</span>
              </div>
              <div class="detail-row">
                <span><strong>Date:</strong></span>
                <span>${data.date}</span>
              </div>
            </div>
            
            <p>Your booking is now confirmed and you will receive your ticket details separately.</p>
            
            <div style="text-align: center; margin-top: 30px; color: #666; font-size: 12px;">
              <p>Thank you for choosing TransConnect!</p>
              <p>&copy; 2025 TransConnect. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
    
    const text = `
Payment Confirmed - TransConnect

Dear ${data.passengerName},

Your payment has been processed successfully!

Payment Details:
- Transaction ID: ${data.transactionId}
- Amount: UGX ${data.amount.toLocaleString()}
- Payment Method: ${data.method}
- Date: ${data.date}

Your booking ${data.bookingId} is now confirmed.

Thank you for choosing TransConnect!
    `;

    return { subject, html, text };
  }

  /**
   * Get trip reminder email template
   */
  private getTripReminderTemplate(data: any): EmailTemplate {
    const subject = `Trip Reminder - ${data.route} Tomorrow`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; }
            .reminder { background: #fff3cd; color: #856404; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: center; }
            .trip-info { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="reminder">
              <h2>⏰ Trip Reminder</h2>
              <p>Your bus journey is tomorrow!</p>
            </div>
            
            <p>Dear ${data.passengerName},</p>
            <p>This is a friendly reminder about your upcoming trip:</p>
            
            <div class="trip-info">
              <h3>Trip Details</h3>
              <p><strong>Route:</strong> ${data.route}</p>
              <p><strong>Date:</strong> ${data.date}</p>
              <p><strong>Departure Time:</strong> ${data.time}</p>
              <p><strong>Seat Number:</strong> ${data.seatNumber}</p>
              <p><strong>Boarding Point:</strong> ${data.boardingPoint}</p>
            </div>
            
            <p><strong>Reminders:</strong></p>
            <ul>
              <li>Arrive 15 minutes before departure</li>
              <li>Bring your QR code and valid ID</li>
              <li>Check traffic conditions</li>
            </ul>
            
            <p>Have a safe journey!</p>
          </div>
        </body>
      </html>
    `;
    
    const text = `Trip Reminder - ${data.route}

Dear ${data.passengerName},

Your bus journey is tomorrow!

Trip Details:
- Route: ${data.route}
- Date: ${data.date}
- Departure Time: ${data.time}
- Seat Number: ${data.seatNumber}
- Boarding Point: ${data.boardingPoint}

Reminders:
- Arrive 15 minutes before departure
- Bring your QR code and valid ID
- Check traffic conditions

Have a safe journey!`;

    return { subject, html, text };
  }

  /**
   * Strip HTML tags from text
   */
  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }

  /**
   * Verify email configuration
   */
  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log('Email service connection verified');
      return true;
    } catch (error) {
      console.error('Email service connection failed:', error);
      return false;
    }
  }
}