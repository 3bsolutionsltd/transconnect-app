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
    this.senderId = process.env.ESMS_AFRICA_SENDER_ID || 'eSMSAfrica';
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
    // Import PhoneNormalizer properly
    try {
      const { PhoneNormalizer } = require('../utils/phone-normalizer');
      const result = PhoneNormalizer.normalize(phoneNumber, 'UG');
    
      if (result.isValid && result.normalizedNumber) {
        console.log(`📱 eSMS Africa formatted: "${phoneNumber}" → "${result.normalizedNumber}"`);
        return result.normalizedNumber;
      }
    } catch (error) {
      console.log(`⚠️ PhoneNormalizer error: ${error}`);
    }
    
    // Fallback to original logic if normalization fails
    console.log(`⚠️ Using fallback formatting for: ${phoneNumber}`);
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    // Handle Ugandan phone numbers
    if (cleaned.startsWith('0') && cleaned.length === 10) {
      cleaned = '256' + cleaned.substring(1); // Convert 07XX to 2567XX
    } else if (cleaned.startsWith('7') && cleaned.length === 9) {
      cleaned = '256' + cleaned; // Add country code
    } else if (!cleaned.startsWith('256') && cleaned.length === 9) {
      cleaned = '256' + cleaned;
    }
    
    return '+' + cleaned;
  }

  private isAfricanNumber(phoneNumber: string): boolean {
    const formatted = this.formatPhoneNumber(phoneNumber);
    
    // East Africa and eSMS Africa supported countries
    const africanCodes = [
      '+256', // Uganda
      '+254', // Kenya  
      '+255', // Tanzania
      '+250', // Rwanda
      '+211', // South Sudan 🇸🇸
      '+257', // Burundi
      '+251', // Ethiopia
      '+252', // Somalia
      '+249', // Sudan
      '+253', // Djibouti
      '+234', // Nigeria
      '+233', // Ghana
      '+27',  // South Africa
      '+260', // Zambia
      '+263', // Zimbabwe
      '+265', // Malawi
      '+267', // Botswana
      '+221', // Senegal
      '+225', // Ivory Coast
      '+226', // Burkina Faso
      '+227', // Niger
      '+228', // Togo
      '+229', // Benin
      '+230', // Mauritius
      '+231', // Liberia
      '+232', // Sierra Leone
      '+235', // Chad
      '+236', // Central African Republic
      '+237', // Cameroon
      '+238', // Cape Verde
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
      
      // Official eSMS Africa format per documentation
      const payload = {
        phoneNumber: formattedPhone,
        text: data.message,
        senderId: data.senderId || this.senderId
      };

      console.log(`🔍 eSMS Africa request payload:`, JSON.stringify(payload, null, 2));
      console.log(`🔍 eSMS Africa headers:`, {
        'X-Account-ID': this.accountId,
        'X-API-Key': `${this.apiKey.substring(0, 8)}...${this.apiKey.slice(-8)}`,
        'Content-Type': 'application/json'
      });
      console.log(`🔍 Full API Key Length: ${this.apiKey.length} characters`);

      const response = await axios.post(
        this.apiUrl,
        payload,
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
      
      // Enhanced debugging for 401 errors
      if (error.response?.status === 401) {
        console.error('🔑 Authentication failed - checking credentials:');
        console.error(`   Account ID: ${this.accountId}`);
        console.error(`   API Key: ${this.apiKey?.substring(0, 8)}...${this.apiKey?.slice(-8)}`); // Fixed substring
        console.error(`   Full API Key Length: ${this.apiKey?.length} characters`);
        console.error(`   Expected: a323393abcee40489cc09bdf5a646fd0 (32 chars)`);
        console.error(`   Sender ID: ${this.senderId}`);
        console.error(`   API URL: ${this.apiUrl}`);
        console.error('   Environment check:');
        console.error(`   • ESMS_AFRICA_ACCOUNT_ID: ${process.env.ESMS_AFRICA_ACCOUNT_ID}`);
        console.error(`   • ESMS_AFRICA_API_KEY: ${process.env.ESMS_AFRICA_API_KEY?.substring(0, 8)}...${process.env.ESMS_AFRICA_API_KEY?.slice(-8)}`);
        console.error('   Possible issues:');
        console.error('   • API key is incorrect/expired');
        console.error('   • Account is suspended/inactive');
        console.error('   • Wrong account ID');
        console.error('   • Environment variable not set correctly');
      }
      
      return {
        success: false,
        error: error.response?.data?.reason || error.message || 'Failed to send SMS via eSMS Africa',
        provider: 'eSMS Africa'
      };
    }
  }

  // Verify credentials method
  public async verifyCredentials(): Promise<{ valid: boolean; error?: string; details?: any }> {
    try {
      console.log('🔍 Verifying eSMS Africa credentials...');
      console.log(`🔍 Account ID: ${this.accountId}`);
      console.log(`🔍 API Key: ${this.apiKey.substring(0, 8)}...${this.apiKey.slice(-8)}`);
      console.log(`🔍 API Key Length: ${this.apiKey.length} characters`);
      console.log(`🔍 Expected: a323393abcee40489cc09bdf5a646fd0 (32 chars)`);
      console.log(`🔍 Sender ID: ${this.senderId}`);
      
      // Official eSMS Africa test format per documentation
      const testPayload = {
        phoneNumber: '+256700000000', // Test number
        text: 'Credential verification test - ignore',
        senderId: this.senderId
      };

      const response = await axios.post(
        this.apiUrl,
        testPayload,
        {
          headers: {
            'X-Account-ID': this.accountId,
            'X-API-Key': this.apiKey,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      console.log('✅ eSMS Africa credentials verified successfully');
      console.log('✅ Response:', response.data);
      return { valid: true, details: response.data };
    } catch (error: any) {
      console.error('❌ eSMS Africa credential verification failed:');
      console.error(`   Status: ${error.response?.status}`);
      console.error(`   Response: ${JSON.stringify(error.response?.data)}`);
      console.error(`   Message: ${error.message}`);
      
      return { 
        valid: false, 
        error: error.response?.data?.reason || error.message,
        details: {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        }
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