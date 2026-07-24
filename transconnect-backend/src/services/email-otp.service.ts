import nodemailer from 'nodemailer';

export interface EmailOTPData {
  email: string;
  otp: string;
  agentName?: string;
  type: 'registration' | 'login';
}

export class EmailOTPService {
  private static instance: EmailOTPService;
  private transporter: nodemailer.Transporter | null = null;
  private isConfigured: boolean = false;

  private constructor() {
    // Initialize synchronously to avoid timing issues
    this.initializeTransporter().catch(error => {
      console.error('Email service initialization failed:', error);
    });
  }

  public static getInstance(): EmailOTPService {
    if (!EmailOTPService.instance) {
      EmailOTPService.instance = new EmailOTPService();
    }
    return EmailOTPService.instance;
  }

  private async initializeTransporter(): Promise<void> {
    try {
      const smtpHost =
        process.env.SMTP_HOST ||
        process.env.EMAIL_HOST ||
        process.env.SMTP_SERVER ||
        process.env.MAIL_HOST;

      const smtpPort = parseInt(
        process.env.SMTP_PORT || process.env.EMAIL_PORT || process.env.MAIL_PORT || '587'
      );

      const smtpUser =
        process.env.SMTP_USER ||
        process.env.EMAIL_USER ||
        process.env.SMTP_USERNAME ||
        process.env.EMAIL_USERNAME ||
        process.env.MAIL_USERNAME ||
        process.env.MAIL_USER;

      const smtpPass =
        process.env.SMTP_PASS ||
        process.env.EMAIL_PASS ||
        process.env.SMTP_PASSWORD ||
        process.env.EMAIL_PASSWORD ||
        process.env.MAIL_PASSWORD ||
        process.env.MAIL_PASS;

      const smtpSecure =
        (process.env.SMTP_SECURE || process.env.EMAIL_SECURE || process.env.MAIL_SECURE || '').toLowerCase() ===
        'true';

      if (!smtpHost || !smtpUser || !smtpPass) {
        console.warn('Email configuration incomplete. Email OTP service will be disabled.');
        return;
      }

      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure || smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      this.isConfigured = true;
      console.log('✅ Email OTP service initialized successfully');
      // Best-effort verification: log errors but don't disable the service.
      try {
        await this.transporter.verify();
      } catch (verifyError) {
        console.warn('⚠️ Email SMTP verify failed, but transporter is configured for send attempts:', verifyError);
      }
    } catch (error) {
      console.error('❌ Failed to initialize Email OTP service:', error);
      this.isConfigured = false;
    }
  }

  private getEmailTemplate(data: EmailOTPData): { subject: string; html: string } {
    const { otp, agentName, type } = data;
    const displayName = agentName || 'Agent';
    
    const subject = type === 'registration' 
      ? 'TransConnect - Verify Your Registration'
      : 'TransConnect - Login Verification Code';

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${subject}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
        .otp-box { background: white; border: 2px solid #2563eb; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
        .otp-code { font-size: 32px; font-weight: bold; color: #2563eb; letter-spacing: 8px; margin: 10px 0; }
        .warning { background: #fef3c7; border: 1px solid #f59e0b; border-radius: 6px; padding: 15px; margin: 20px 0; }
        .footer { background: #374151; color: #d1d5db; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 14px; }
        .button { background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚌 TransConnect</h1>
            <p>Agent ${type === 'registration' ? 'Registration' : 'Login'} Verification</p>
        </div>
        
        <div class="content">
            <h2>Hello ${displayName}!</h2>
            
            <p>Your verification code for TransConnect Agent ${type === 'registration' ? 'registration' : 'login'} is:</p>
            
            <div class="otp-box">
                <div style="color: #6b7280; font-size: 14px; margin-bottom: 10px;">VERIFICATION CODE</div>
                <div class="otp-code">${otp}</div>
                <div style="color: #6b7280; font-size: 12px; margin-top: 10px;">This code expires in 10 minutes</div>
            </div>
            
            <div class="warning">
                <strong>⚠️ Security Notice:</strong>
                <ul style="margin: 10px 0 0 0; padding-left: 20px;">
                    <li>Never share this code with anyone</li>
                    <li>TransConnect staff will never ask for this code</li>
                    <li>This code expires in 10 minutes</li>
                </ul>
            </div>
            
            <p>If you didn't request this ${type === 'registration' ? 'registration' : 'login'}, please ignore this email.</p>
            
            <p>Need help? Contact our support team at <strong>support@transconnect.ug</strong></p>
        </div>
        
        <div class="footer">
            <p>© ${new Date().getFullYear()} TransConnect Uganda. All rights reserved.</p>
            <p>This is an automated message. Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>`;

    return { subject, html };
  }

  public async sendOTP(data: EmailOTPData): Promise<{ success: boolean; messageId?: string; error?: string }> {
    // Demo mode - just log the email
    const nodeEnv = process.env.NODE_ENV || 'development';
    const isDemoMode = process.env.DEMO_MODE === 'true' || nodeEnv === 'development' || nodeEnv === 'test';
    
    if (isDemoMode) {
      console.log(`📧 [DEMO MODE] Email OTP to ${data.email}:`);
      console.log(`Subject: TransConnect - ${data.type} Verification`);
      console.log(`OTP Code: ${data.otp}`);
      console.log(`(In production, this would be sent via email)`);
      return { 
        success: true, 
        messageId: 'demo-email-' + Date.now() 
      };
    }

    if (!this.isConfigured || !this.transporter) {
      console.log(`📧 Email OTP would be sent to ${data.email}: ${data.otp}`);
      return { 
        success: false, 
        error: 'Email service not configured. Check SMTP credentials.'
      };
    }

    try {
      const { subject, html } = this.getEmailTemplate(data);
      
      console.log(`📧 Sending Email OTP to ${data.email}...`);
      
      const result = await this.transporter.sendMail({
        from:
          process.env.SMTP_FROM ||
          process.env.EMAIL_FROM ||
          process.env.MAIL_FROM ||
          process.env.SMTP_USER ||
          process.env.EMAIL_USER ||
          process.env.SMTP_USERNAME ||
          process.env.EMAIL_USERNAME ||
          process.env.MAIL_USERNAME ||
          process.env.MAIL_USER,
        to: data.email,
        subject,
        html,
      });

      console.log(`✅ Email OTP sent successfully! Message ID: ${result.messageId}`);
      
      return {
        success: true,
        messageId: result.messageId
      };

    } catch (error: any) {
      console.error('❌ Email OTP sending failed:', error);
      
      return {
        success: false,
        error: error.message || 'Failed to send Email OTP'
      };
    }
  }

  public isReady(): boolean {
    return this.isConfigured && this.transporter !== null;
  }

  public getStatus(): { configured: boolean; error?: string } {
    return {
      configured: this.isConfigured,
      error: !this.isConfigured ? 'Check SMTP_HOST/EMAIL_HOST, SMTP_USER/EMAIL_USER, and SMTP_PASS/EMAIL_PASS (or SMTP_PASSWORD/EMAIL_PASSWORD) environment variables' : undefined
    };
  }
}

export default EmailOTPService;