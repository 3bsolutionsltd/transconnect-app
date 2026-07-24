import axios from 'axios';

export interface ESMSAfricaSMSData {
  phoneNumber: string;
  message: string;
  senderId?: string;
}

export class ESMSAfricaService {
  private static instance: ESMSAfricaService;
  private accountId: string;
  private username: string;
  private apiKey: string;
  private senderId: string;
  private apiUrl: string;
  private isConfigured: boolean = false;

  private constructor() {
    this.accountId = process.env.ESMS_AFRICA_ACCOUNT_ID || process.env.ESMS_ACCOUNT_ID || '';
    this.username = process.env.ESMS_USERNAME || '';
    if (!this.accountId && this.username) {
      // Backward compatibility for environments that store account identifier under ESMS_USERNAME.
      this.accountId = this.username;
    }
    this.apiKey = process.env.ESMS_AFRICA_API_KEY || process.env.ESMS_API_KEY || '';
    this.senderId = process.env.ESMS_AFRICA_SENDER_ID || process.env.ESMS_SENDER_ID || '';
    this.apiUrl = process.env.ESMS_API_BASE_URL || 'https://sms.esmsafrica.io/api/messages/send';
    
    // Official API key auth only requires a Bearer key.
    this.isConfigured = !!this.apiKey;
    
    if (this.isConfigured) {
      console.log('✅ eSMS Africa service initialized successfully');
      console.log(`📱 Account ID: ${this.accountId || 'not required in Bearer mode'}`);
      if (this.username) {
        console.log(`👤 Username: ${this.username}`);
      }
      console.log(`🏷️  Sender ID: ${this.senderId || 'default/empty'}`);
      console.log(`🔗 API URL: ${this.apiUrl}`);
    } else {
      console.warn('⚠️ eSMS Africa configuration incomplete. Check ESMS_AFRICA_API_KEY or ESMS_API_KEY');
    }
  }

  private buildAuthHeaders(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };
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
    const nodeEnv = process.env.NODE_ENV || 'development';
    const isDemoMode = process.env.DEMO_MODE === 'true' || nodeEnv === 'development' || nodeEnv === 'test';
    
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
        error: 'eSMS Africa not configured. Check ESMS_AFRICA_API_KEY or ESMS_API_KEY.',
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

      // Official eSMS Africa format per documentation.
      const payload: any = {
        to: formattedPhone,
        text: data.message,
      };

      const senderId = data.senderId || this.senderId;
      if (senderId && senderId.trim() !== '') {
        payload.sender_id = senderId;
        console.log(`📤 Using Sender ID: ${senderId}`);
      } else {
        console.log('📤 Using default sender ID');
      }

      console.log(`🔍 eSMS Africa request payload:`, JSON.stringify(payload, null, 2));
      console.log(`🔍 eSMS Africa headers:`, {
        Authorization: `Bearer ${this.apiKey.substring(0, 12)}...`,
        'Content-Type': 'application/json'
      });
      console.log(`🔍 Full API Key Length: ${this.apiKey.length} characters`);
      console.log(`🔍 Endpoint: ${this.apiUrl}`);

      let response;
      try {
        response = await axios.post(
          this.apiUrl,
          payload,
          {
            headers: this.buildAuthHeaders(),
            timeout: 10000 // 10 second timeout
          }
        );
      } catch (firstError: any) {
        const status = firstError?.response?.status;
        const detail = firstError?.response?.data?.detail;
        const reason = firstError?.response?.data?.reason;
        const message = String(detail?.message || detail || reason || firstError?.message || '').toLowerCase();
        const senderRejected = status === 403 && message.includes('sender id');

        if (senderRejected && payload.sender_id) {
          console.warn('⚠️ Sender ID rejected by eSMS API. Retrying once without sender_id...');
          const retryPayload = { ...payload };
          delete retryPayload.sender_id;

          response = await axios.post(
            this.apiUrl,
            retryPayload,
            {
              headers: this.buildAuthHeaders(),
              timeout: 10000,
            }
          );
        } else {
          throw firstError;
        }
      }

      if (response.data.status === 'SUCCESS' || response.data.status === 'submitted' || response.data.status === 'scheduled') {
        const messageId = response.data.messageId || response.data.id;
        console.log(`✅ eSMS Africa SMS sent successfully! Message ID: ${messageId}`);
        return {
          success: true,
          messageId,
          provider: 'eSMS Africa'
        };
      } else {
        const errorMessage = response.data.reason || response.data?.detail?.message || response.data?.detail || 'Unknown error';
        console.error('❌ eSMS Africa SMS failed:', errorMessage);
        return {
          success: false,
          error: String(errorMessage),
          provider: 'eSMS Africa'
        };
      }

    } catch (error: any) {
      console.error('❌ eSMS Africa API error:', error.response?.data || error.message);
      
      // Enhanced debugging for 401 errors
      if (error.response?.status === 401) {
        console.error('🔑 Authentication failed - checking credentials:');
        console.error(`   Account ID: ${this.accountId || 'not required in Bearer mode'}`);
        console.error(`   API Key: ${this.apiKey?.substring(0, 8)}...${this.apiKey?.slice(-8)}`); // Fixed substring
        console.error(`   Full API Key Length: ${this.apiKey?.length} characters`);
        console.error(`   Expected key prefix: esms_live_ or esms_test_`);
        console.error(`   Sender ID: ${this.senderId}`);
        console.error(`   API URL: ${this.apiUrl}`);
        console.error('   Environment check:');
        console.error(`   • ESMS_AFRICA_ACCOUNT_ID: ${process.env.ESMS_AFRICA_ACCOUNT_ID}`);
        console.error(`   • ESMS_AFRICA_API_KEY: ${process.env.ESMS_AFRICA_API_KEY?.substring(0, 8)}...${process.env.ESMS_AFRICA_API_KEY?.slice(-8)}`);
        console.error(`   • ESMS_USERNAME: ${process.env.ESMS_USERNAME}`);
        console.error(`   • ESMS_API_KEY: ${process.env.ESMS_API_KEY?.substring(0, 8)}...${process.env.ESMS_API_KEY?.slice(-8)}`);
        console.error('   Possible issues:');
        console.error('   • API key is incorrect/expired');
        console.error('   • Using test key in live context or live key in test context');
        console.error('   • Account is suspended/inactive');
        console.error('   • Environment variable not set correctly');
      }
      
      return {
        success: false,
        error: error.response?.data?.reason || error.response?.data?.detail?.message || error.response?.data?.detail || error.message || 'Failed to send SMS via eSMS Africa',
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
        to: '+256700000000', // Test number
        text: 'Credential verification test - ignore',
        ...(this.senderId ? { sender_id: this.senderId } : {})
      };

      const response = await axios.post(
        this.apiUrl,
        testPayload,
        {
          headers: this.buildAuthHeaders(),
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

  // Test method with multiple sender ID attempts
  public async sendTestSMS(phoneNumber: string): Promise<{ success: boolean; messageId?: string; error?: string; provider?: string; tests?: any[] }> {
    const tests: any[] = [];
    
    // Test 1: Default sender (no custom sender)
    console.log('🧪 Test 1: Default sender (no senderId)');
    const test1 = await this.sendSMS({
      phoneNumber,
      message: `Test SMS 1: Default sender. Time: ${new Date().toLocaleTimeString()}`
    });
    tests.push({ test: 'Default sender', result: test1 });
    
    if (test1.success) return { ...test1, tests };
    
    // Test 2: Empty sender
    console.log('🧪 Test 2: Empty sender');
    const test2 = await this.sendSMS({
      phoneNumber,
      message: `Test SMS 2: Empty sender. Time: ${new Date().toLocaleTimeString()}`,
      senderId: ''
    });
    tests.push({ test: 'Empty sender', result: test2 });
    
    if (test2.success) return { ...test2, tests };
    
    // Test 3: Simple sender
    console.log('🧪 Test 3: Simple sender');
    const test3 = await this.sendSMS({
      phoneNumber,
      message: `Test SMS 3: Simple sender. Time: ${new Date().toLocaleTimeString()}`,
      senderId: 'SMS'
    });
    tests.push({ test: 'Simple sender', result: test3 });
    
    return test3.success ? { ...test3, tests } : { 
      success: false, 
      error: 'All sender ID tests failed', 
      provider: 'eSMS Africa',
      tests 
    };
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
      error: !this.isConfigured ? 'Check ESMS_AFRICA_API_KEY or ESMS_API_KEY environment variables' : undefined
    };
  }

  // Check if a number should use eSMS Africa
  public shouldHandle(phoneNumber: string): boolean {
    return this.isAfricanNumber(phoneNumber);
  }
}

export default ESMSAfricaService;