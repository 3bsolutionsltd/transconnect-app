import axios from 'axios';

export interface ESMSAfricaSMSData {
  phoneNumber: string;
  message: string;
  senderId?: string;
}

export class ESMSAfricaService {
  private static instance: ESMSAfricaService;
  private accountId: string;
  private apiKey: string;
  private senderId: string;
  private apiUrl: string;
  private isConfigured: boolean = false;

  private constructor() {
    this.accountId = process.env.ESMS_AFRICA_ACCOUNT_ID || '';
    this.apiKey = process.env.ESMS_AFRICA_API_KEY || '';
    this.senderId = process.env.ESMS_AFRICA_SENDER_ID || 'TransConnect';
    this.apiUrl = 'https://api.esmsafrica.io/api/sms/send';
    
    this.isConfigured = !!(this.accountId && this.apiKey);
    
    if (this.isConfigured) {
      console.log('✅ eSMS Africa service initialized successfully');
      console.log(`📱 Account ID: ${this.accountId}`);
      console.log(`🏷️  Sender ID: ${this.senderId}`);
    } else {
      console.warn('⚠️ eSMS Africa configuration incomplete. Check ESMS_AFRICA_ACCOUNT_ID and ESMS_AFRICA_API_KEY');
    }
  }

  public static getInstance(): ESMSAfricaService {
    if (!ESMSAfricaService.instance) {
      ESMSAfricaService.instance = new ESMSAfricaService();
    }
    return ESMSAfricaService.instance;
  }

  private formatPhoneNumber(phoneNumber: string): string {
    // Remove any non-digit characters
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    // Handle Ugandan phone numbers
    if (cleaned.startsWith('0') && cleaned.length === 10) {
      cleaned = '256' + cleaned.substring(1); // Convert 07XX to 2567XX
    } else if (cleaned.startsWith('7') && cleaned.length === 9) {
      cleaned = '256' + cleaned; // Add country code
    } else if (!cleaned.startsWith('256') && cleaned.length === 9) {
      cleaned = '256' + cleaned;
    }
    
    // Handle other East African numbers
    if (cleaned.startsWith('0')) {
      // Remove leading 0 and detect country
      const withoutZero = cleaned.substring(1);
      if (withoutZero.length === 9) {
        // Could be Kenya (254), Tanzania (255), Rwanda (250)
        // For now, assume Uganda if not specified
        if (!cleaned.startsWith('25')) {
          cleaned = '256' + withoutZero;
        }
      }
    }

    return '+' + cleaned;
  }

  private isAfricanNumber(phoneNumber: string): boolean {
    const formatted = this.formatPhoneNumber(phoneNumber);
    
    // African country codes supported by eSMS Africa
    const africanCodes = [
      '+256', '+254', '+255', '+250', // East Africa
      '+233', '+234', '+260', '+263', // West/South Africa  
      '+265', '+27', '+221', '+225'   // More African countries
    ];
    
    return africanCodes.some(code => formatted.startsWith(code));
  }

  public async sendSMS(data: ESMSAfricaSMSData): Promise<{ success: boolean; messageId?: string; error?: string; provider?: string }> {
    // Demo mode - log instead of sending
    const isDemoMode = process.env.NODE_ENV !== 'production' || process.env.DEMO_MODE === 'true';
    
    if (isDemoMode) {
      console.log(`📱 [DEMO MODE] eSMS Africa SMS to ${data.phoneNumber}:`);
      console.log(`Message: ${data.message}`);
      console.log(`Sender: ${data.senderId || this.senderId}`);
      console.log(`(In production, this would be sent via eSMS Africa HTTP API)`);
      return { 
        success: true, 
        messageId: 'esms-demo-' + Date.now(),
        provider: 'eSMS Africa (Demo)'
      };
    }

    if (!this.isConfigured) {
      console.log(`📱 eSMS Africa would send SMS to ${data.phoneNumber}: ${data.message}`);
      return { 
        success: false, 
        error: 'eSMS Africa not configured. Check ESMS_AFRICA_ACCOUNT_ID and ESMS_AFRICA_API_KEY.',
        provider: 'eSMS Africa'
      };
    }

    // Only send to African numbers
    if (!this.isAfricanNumber(data.phoneNumber)) {
      return {
        success: false,
        error: 'eSMS Africa only supports African phone numbers',
        provider: 'eSMS Africa'
      };
    }

    try {
      const formattedPhone = this.formatPhoneNumber(data.phoneNumber);
      
      console.log(`📱 Sending SMS via eSMS Africa to ${formattedPhone}...`);
      
      const response = await axios.post(
        this.apiUrl,
        {
          phoneNumber: formattedPhone,
          text: data.message,
          senderId: data.senderId || this.senderId
        },
        {
          headers: {
            'X-Account-ID': this.accountId,
            'X-API-Key': this.apiKey,
            'Content-Type': 'application/json'
          },
          timeout: 10000 // 10 second timeout
        }
      );

      if (response.data.status === 'SUCCESS') {
        console.log(`✅ eSMS Africa SMS sent successfully! Message ID: ${response.data.messageId}`);
        return {
          success: true,
          messageId: response.data.messageId,
          provider: 'eSMS Africa'
        };
      } else {
        console.error('❌ eSMS Africa SMS failed:', response.data.reason || 'Unknown error');
        return {
          success: false,
          error: response.data.reason || 'SMS sending failed',
          provider: 'eSMS Africa'
        };
      }

    } catch (error: any) {
      console.error('❌ eSMS Africa API error:', error.response?.data || error.message);
      
      return {
        success: false,
        error: error.response?.data?.reason || error.message || 'Failed to send SMS via eSMS Africa',
        provider: 'eSMS Africa'
      };
    }
  }

  // Test method
  public async sendTestSMS(phoneNumber: string): Promise<{ success: boolean; messageId?: string; error?: string; provider?: string }> {
    return this.sendSMS({
      phoneNumber,
      message: `🧪 TransConnect SMS Test via eSMS Africa
This is a test message from TransConnect MVP1.
eSMS Africa SMS integration is working!
Time: ${new Date().toLocaleString()}
Cost: ~UGX 30 (vs Twilio ~UGX 180)`
    });
  }

  // Configuration check
  public isReady(): boolean {
    return this.isConfigured;
  }

  public getStatus(): { configured: boolean; accountId: string; senderId: string; error?: string } {
    return {
      configured: this.isConfigured,
      accountId: this.accountId ? `${this.accountId.substring(0, 4)}***` : 'Not set',
      senderId: this.senderId,
      error: !this.isConfigured ? 'Check ESMS_AFRICA_ACCOUNT_ID and ESMS_AFRICA_API_KEY environment variables' : undefined
    };
  }

  // Check if a number should use eSMS Africa
  public shouldHandle(phoneNumber: string): boolean {
    return this.isAfricanNumber(phoneNumber);
  }
}

export default ESMSAfricaService;