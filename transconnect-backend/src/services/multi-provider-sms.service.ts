import SMSService from './sms.service';
import ESMSAfricaService from './esms-africa.service';

export interface MultiProviderSMSData {
  phoneNumber: string;
  message: string;
  template?: string;
  templateData?: Record<string, any>;
  preferredProvider?: 'esms' | 'twilio' | 'auto';
}

export interface SMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
  provider: string;
  cost?: string;
  fallbackUsed?: boolean;
}

export class MultiProviderSMSService {
  private static instance: MultiProviderSMSService;
  private esmsService: ESMSAfricaService;
  private twilioService: SMSService;

  private constructor() {
    this.esmsService = ESMSAfricaService.getInstance();
    this.twilioService = SMSService.getInstance();
    console.log('📱 Multi-Provider SMS Service initialized');
    console.log(`   - eSMS Africa: ${this.esmsService.isReady() ? '✅ Ready' : '❌ Not configured'}`);
    console.log(`   - Twilio: ${this.twilioService.isReady() ? '✅ Ready' : '❌ Not configured'}`);
  }

  public static getInstance(): MultiProviderSMSService {
    if (!MultiProviderSMSService.instance) {
      MultiProviderSMSService.instance = new MultiProviderSMSService();
    }
    return MultiProviderSMSService.instance;
  }

  private getEstimatedCost(phoneNumber: string, provider: 'esms' | 'twilio'): string {
    const isAfrican = this.esmsService.shouldHandle(phoneNumber);
    
    if (provider === 'esms') {
      return isAfrican ? 'UGX 30' : 'Not supported';
    } else {
      return isAfrican ? 'UGX ~180' : 'USD ~0.05';
    }
  }

  private selectProvider(phoneNumber: string, preferredProvider?: 'esms' | 'twilio' | 'auto'): 'esms' | 'twilio' {
    // If specific provider requested
    if (preferredProvider === 'esms') return 'esms';
    if (preferredProvider === 'twilio') return 'twilio';

    // Auto selection logic
    const isAfrican = this.esmsService.shouldHandle(phoneNumber);
    const esmsReady = this.esmsService.isReady();
    
    // Prefer eSMS Africa for African numbers (cheaper and more reliable)
    if (isAfrican && esmsReady) {
      return 'esms';
    }
    
    // Default to Twilio for non-African numbers or if eSMS not ready
    return 'twilio';
  }

  public async sendSMS(data: MultiProviderSMSData): Promise<SMSResult> {
    const primaryProvider = this.selectProvider(data.phoneNumber, data.preferredProvider);
    
    console.log(`📱 SMS Routing Decision:`);
    console.log(`   Phone: ${data.phoneNumber}`);
    console.log(`   Primary: ${primaryProvider.toUpperCase()}`);
    console.log(`   Estimated Cost: ${this.getEstimatedCost(data.phoneNumber, primaryProvider)}`);

    // Try primary provider
    const result = await this.trySendWithProvider(data, primaryProvider);
    
    if (result.success) {
      return result;
    }

    // Try fallback provider if primary failed
    const fallbackProvider = primaryProvider === 'esms' ? 'twilio' : 'esms';
    console.log(`⚠️ ${primaryProvider.toUpperCase()} failed, trying ${fallbackProvider.toUpperCase()} as fallback...`);
    
    const fallbackResult = await this.trySendWithProvider(data, fallbackProvider);
    
    return {
      ...fallbackResult,
      fallbackUsed: true,
      error: fallbackResult.success 
        ? undefined 
        : `Both ${primaryProvider} and ${fallbackProvider} failed. Primary: ${result.error}. Fallback: ${fallbackResult.error}`
    };
  }

  private async trySendWithProvider(data: MultiProviderSMSData, provider: 'esms' | 'twilio'): Promise<SMSResult> {
    try {
      if (provider === 'esms') {
        const result = await this.esmsService.sendSMS({
          phoneNumber: data.phoneNumber,
          message: data.message
        });
        
        return {
          success: result.success,
          messageId: result.messageId,
          error: result.error,
          provider: result.provider || 'eSMS Africa',
          cost: this.getEstimatedCost(data.phoneNumber, 'esms')
        };
      } else {
        const result = await this.twilioService.sendSMS({
          phoneNumber: data.phoneNumber,
          message: data.message,
          template: data.template as any,
          templateData: data.templateData
        });
        
        return {
          success: result.success,
          messageId: result.messageId,
          error: result.error,
          provider: 'Twilio',
          cost: this.getEstimatedCost(data.phoneNumber, 'twilio')
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || `${provider.toUpperCase()} service error`,
        provider: provider === 'esms' ? 'eSMS Africa' : 'Twilio',
        cost: 'Failed'
      };
    }
  }

  // Convenience methods that route intelligently
  public async sendOTP(phoneNumber: string, otp: string, type: 'registration' | 'login' = 'registration'): Promise<SMSResult> {
    const message = `Your TransConnect ${type} code is: ${otp}\n\nThis code expires in 10 minutes.\n\nDo not share this code with anyone.`;
    
    return this.sendSMS({
      phoneNumber,
      message,
      preferredProvider: 'auto' // Let system decide best provider
    });
  }

  public async sendBookingConfirmation(phoneNumber: string, bookingData: any): Promise<SMSResult> {
    const message = `🎫 TransConnect Booking Confirmed!
Booking ID: ${bookingData.id}
Route: ${bookingData.route}
Date: ${bookingData.date}
Seat: ${bookingData.seat}
Amount: UGX ${bookingData.amount}
Show this SMS as backup ticket.`;

    return this.sendSMS({
      phoneNumber,
      message,
      preferredProvider: 'auto'
    });
  }

  public async sendTestSMS(phoneNumber: string): Promise<SMSResult> {
    return this.sendSMS({
      phoneNumber,
      message: `🧪 TransConnect Multi-Provider SMS Test
Time: ${new Date().toLocaleString()}
This message was routed automatically to the best provider for your region.
• African numbers → eSMS Africa (UGX 30)
• International → Twilio (USD ~0.05)`,
      preferredProvider: 'auto'
    });
  }

  // Status and configuration
  public getProviderStatus(): { esms: any; twilio: any; routing: string } {
    return {
      esms: this.esmsService.getStatus(),
      twilio: this.twilioService.getStatus(),
      routing: 'African numbers → eSMS Africa, Others → Twilio'
    };
  }

  public isReady(): boolean {
    return this.esmsService.isReady() || this.twilioService.isReady();
  }
}

export default MultiProviderSMSService;