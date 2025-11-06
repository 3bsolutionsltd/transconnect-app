import axios, { AxiosInstance } from 'axios';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

interface MTNConfig {
  baseUrl: string;
  subscriptionKey: string;
  environment: 'sandbox' | 'live';
  userId?: string;
  apiKey?: string;
}

interface PaymentRequest {
  amount: number;
  currency: string;
  externalId: string;
  payer: {
    partyIdType: 'MSISDN';
    partyId: string; // Phone number
  };
  payerMessage: string;
  payeeNote: string;
}

interface PaymentResponse {
  transactionId: string;
  status: 'PENDING' | 'SUCCESSFUL' | 'FAILED';
  reason?: string;
}

interface TransactionStatus {
  financialTransactionId: string;
  externalId: string;
  amount: string;
  currency: string;
  payer: {
    partyIdType: string;
    partyId: string;
  };
  status: 'PENDING' | 'SUCCESSFUL' | 'FAILED';
  reason?: string;
}

export class MTNMobileMoneyService {
  private axiosInstance: AxiosInstance;
  private config: MTNConfig;
  private accessToken?: string;
  private tokenExpiry?: Date;

  constructor(config: MTNConfig) {
    this.config = config;
    this.axiosInstance = axios.create({
      baseURL: config.baseUrl,
      timeout: 30000,
      headers: {
        'Ocp-Apim-Subscription-Key': config.subscriptionKey,
        'X-Target-Environment': config.environment,
        'Content-Type': 'application/json'
      }
    });

    // Add request/response interceptors for logging
    this.axiosInstance.interceptors.request.use(
      (config) => {
        console.log(`MTN API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('MTN API Request Error:', error);
        return Promise.reject(error);
      }
    );

    this.axiosInstance.interceptors.response.use(
      (response) => {
        console.log(`MTN API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        console.error('MTN API Response Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Create API user for sandbox environment
   */
  async createApiUser(): Promise<string> {
    if (this.config.environment === 'live') {
      throw new Error('API user creation is only available in sandbox environment');
    }

    const referenceId = uuidv4();
    
    try {
      await this.axiosInstance.post('/v1_0/apiuser', {
        providerCallbackHost: process.env.CALLBACK_HOST || 'webhook.example.com'
      }, {
        headers: {
          'X-Reference-Id': referenceId
        }
      });

      // Get API user details
      const userResponse = await this.axiosInstance.get(`/v1_0/apiuser/${referenceId}`);
      
      console.log('MTN API User created:', referenceId);
      return referenceId;
    } catch (error: any) {
      console.error('Error creating MTN API user:', error.response?.data || error.message);
      throw new Error(`Failed to create MTN API user: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Create API key for the user
   */
  async createApiKey(userId: string): Promise<string> {
    try {
      const response = await this.axiosInstance.post(`/v1_0/apiuser/${userId}/apikey`);
      
      console.log('MTN API Key created for user:', userId);
      return response.data.apiKey;
    } catch (error: any) {
      console.error('Error creating MTN API key:', error.response?.data || error.message);
      throw new Error(`Failed to create MTN API key: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Get access token for API calls
   */
  private async getAccessToken(): Promise<string> {
    if (this.accessToken && this.tokenExpiry && this.tokenExpiry > new Date()) {
      return this.accessToken;
    }

    if (!this.config.userId || !this.config.apiKey) {
      throw new Error('MTN API User ID and API Key are required');
    }

    try {
      const credentials = Buffer.from(`${this.config.userId}:${this.config.apiKey}`).toString('base64');
      
      const response = await this.axiosInstance.post('/collection/token/', {}, {
        headers: {
          'Authorization': `Basic ${credentials}`
        }
      });

      this.accessToken = response.data.access_token;
      // Set expiry to 1 hour from now (tokens typically expire in 1 hour)
      this.tokenExpiry = new Date(Date.now() + (response.data.expires_in || 3600) * 1000);

      console.log('MTN Access token obtained');
      return this.accessToken!;
    } catch (error: any) {
      console.error('Error getting MTN access token:', error.response?.data || error.message);
      throw new Error(`Failed to get MTN access token: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Initiate payment request
   */
  async requestPayment(paymentData: PaymentRequest): Promise<PaymentResponse> {
    // Check if demo mode is enabled
    const demoMode = process.env.PAYMENT_DEMO_MODE === 'true' || true; // Temporary force enable
    
    if (demoMode) {
      console.log('Demo mode: Simulating MTN payment request');
      const referenceId = uuidv4();
      
      return {
        transactionId: referenceId,
        status: 'PENDING',
      };
    }
    
    try {
      const accessToken = await this.getAccessToken();
      const referenceId = uuidv4();

      const response = await this.axiosInstance.post('/collection/v1_0/requesttopay', paymentData, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-Reference-Id': referenceId,
          'X-Callback-Url': `${process.env.BACKEND_URL}/api/payments/webhook/mtn`
        }
      });

      console.log('MTN Payment request initiated:', referenceId);

      return {
        transactionId: referenceId,
        status: 'PENDING',
      };
    } catch (error: any) {
      console.error('Error initiating MTN payment:', error.response?.data || error.message);
      
      // Handle specific MTN error codes
      const errorCode = error.response?.data?.code;
      const errorMessage = error.response?.data?.message || error.message;
      
      let reason = 'Payment initiation failed';
      
      switch (errorCode) {
        case 'PAYER_NOT_FOUND':
          reason = 'Phone number not found or not registered for Mobile Money';
          break;
        case 'INSUFFICIENT_FUNDS':
          reason = 'Insufficient funds in mobile money account';
          break;
        case 'INVALID_AMOUNT':
          reason = 'Invalid payment amount';
          break;
        case 'TRANSACTION_EXPIRED':
          reason = 'Transaction expired';
          break;
        default:
          reason = errorMessage;
      }

      return {
        transactionId: '',
        status: 'FAILED',
        reason
      };
    }
  }

  /**
   * Check transaction status
   */
  async getTransactionStatus(transactionId: string): Promise<TransactionStatus> {
    try {
      const accessToken = await this.getAccessToken();

      const response = await this.axiosInstance.get(`/collection/v1_0/requesttopay/${transactionId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      const data = response.data;
      
      return {
        financialTransactionId: data.financialTransactionId || '',
        externalId: data.externalId,
        amount: data.amount,
        currency: data.currency,
        payer: data.payer,
        status: data.status,
        reason: data.reason
      };
    } catch (error: any) {
      console.error('Error getting MTN transaction status:', error.response?.data || error.message);
      
      // If transaction not found, it might have expired
      if (error.response?.status === 404) {
        return {
          financialTransactionId: '',
          externalId: transactionId,
          amount: '0',
          currency: 'UGX',
          payer: { partyIdType: 'MSISDN', partyId: '' },
          status: 'FAILED',
          reason: 'Transaction not found or expired'
        };
      }

      throw new Error(`Failed to get MTN transaction status: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
    try {
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );
    } catch (error) {
      console.error('Error verifying MTN webhook signature:', error);
      return false;
    }
  }

  /**
   * Get account balance (for testing)
   */
  async getAccountBalance(): Promise<{ balance: string; currency: string }> {
    try {
      const accessToken = await this.getAccessToken();

      const response = await this.axiosInstance.get('/collection/v1_0/account/balance', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      return {
        balance: response.data.availableBalance,
        currency: response.data.currency
      };
    } catch (error: any) {
      console.error('Error getting MTN account balance:', error.response?.data || error.message);
      throw new Error(`Failed to get MTN account balance: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Validate account holder (check if phone number is valid)
   */
  async validateAccountHolder(phoneNumber: string): Promise<boolean> {
    // Check if demo mode is enabled
    const demoMode = process.env.PAYMENT_DEMO_MODE === 'true' || true; // Temporary force enable
    
    if (demoMode) {
      console.log('Demo mode: Skipping MTN account validation for', phoneNumber);
      return true; // Always return true in demo mode
    }
    
    try {
      const accessToken = await this.getAccessToken();

      const response = await this.axiosInstance.get(`/collection/v1_0/accountholder/msisdn/${phoneNumber}/active`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      return response.data.result || false;
    } catch (error: any) {
      console.error('Error validating MTN account holder:', error.response?.data || error.message);
      return false;
    }
  }
}

// Factory function to create MTN service instance
export const createMTNService = (): MTNMobileMoneyService => {
  const config: MTNConfig = {
    baseUrl: process.env.MTN_BASE_URL || 'https://sandbox.momodeveloper.mtn.com',
    subscriptionKey: process.env.MTN_SUBSCRIPTION_KEY || '',
    environment: (process.env.NODE_ENV === 'production' ? 'live' : 'sandbox') as 'sandbox' | 'live',
    userId: process.env.MTN_USER_ID,
    apiKey: process.env.MTN_API_KEY
  };

  if (!config.subscriptionKey) {
    throw new Error('MTN_SUBSCRIPTION_KEY environment variable is required');
  }

  return new MTNMobileMoneyService(config);
};