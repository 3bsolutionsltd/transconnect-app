import axios, { AxiosInstance } from 'axios';
import crypto from 'crypto';

interface AirtelConfig {
  baseUrl: string;
  clientId: string;
  clientSecret: string;
  environment: 'staging' | 'production';
}

interface AirtelAuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface AirtelPaymentRequest {
  reference: string;
  subscriber: {
    country: string;
    currency: string;
    msisdn: string; // Phone number
  };
  transaction: {
    amount: number;
    country: string;
    currency: string;
    id: string;
  };
}

interface AirtelPaymentResponse {
  data?: {
    transaction: {
      id: string;
      status: string;
      message?: string;
    };
  };
  status: {
    code: string;
    message: string;
    result_code: string;
    response_code: string;
    success: boolean;
  };
}

interface AirtelTransactionStatus {
  data?: {
    transaction: {
      airtel_money_id: string;
      id: string;
      message: string;
      status: string;
    };
  };
  status: {
    code: string;
    message: string;
    response_code: string;
    result_code: string;
    success: boolean;
  };
}

export class AirtelMoneyService {
  private axiosInstance: AxiosInstance;
  private config: AirtelConfig;
  private accessToken?: string;
  private tokenExpiry?: Date;

  constructor(config: AirtelConfig) {
    this.config = config;
    this.axiosInstance = axios.create({
      baseURL: config.baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    // Add request/response interceptors for logging
    this.axiosInstance.interceptors.request.use(
      (config) => {
        console.log(`Airtel API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('Airtel API Request Error:', error);
        return Promise.reject(error);
      }
    );

    this.axiosInstance.interceptors.response.use(
      (response) => {
        console.log(`Airtel API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        console.error('Airtel API Response Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Get access token for API calls
   */
  private async getAccessToken(): Promise<string> {
    if (this.accessToken && this.tokenExpiry && this.tokenExpiry > new Date()) {
      return this.accessToken;
    }

    try {
      const response = await this.axiosInstance.post('/auth/oauth2/token', {
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        grant_type: 'client_credentials'
      });

      const authData: AirtelAuthResponse = response.data;
      
      this.accessToken = authData.access_token;
      // Set expiry to 5 minutes before actual expiry for safety
      this.tokenExpiry = new Date(Date.now() + (authData.expires_in - 300) * 1000);

      console.log('Airtel Access token obtained');
      return this.accessToken;
    } catch (error: any) {
      console.error('Error getting Airtel access token:', error.response?.data || error.message);
      throw new Error(`Failed to get Airtel access token: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Initiate payment request
   */
  async requestPayment(paymentData: AirtelPaymentRequest): Promise<{
    transactionId: string;
    status: 'PENDING' | 'SUCCESSFUL' | 'FAILED';
    reason?: string;
  }> {
    try {
      const accessToken = await this.getAccessToken();

      const response = await this.axiosInstance.post('/merchant/v1/payments/', paymentData, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-Country': paymentData.subscriber.country,
          'X-Currency': paymentData.subscriber.currency
        }
      });

      const responseData: AirtelPaymentResponse = response.data;

      if (responseData.status.success) {
        return {
          transactionId: responseData.data?.transaction.id || paymentData.transaction.id,
          status: this.mapAirtelStatus(responseData.data?.transaction.status || 'PENDING'),
        };
      } else {
        return {
          transactionId: '',
          status: 'FAILED',
          reason: responseData.status.message || 'Payment initiation failed'
        };
      }
    } catch (error: any) {
      console.error('Error initiating Airtel payment:', error.response?.data || error.message);
      
      // Handle specific Airtel error codes
      const errorData = error.response?.data;
      let reason = 'Payment initiation failed';
      
      if (errorData?.status) {
        switch (errorData.status.result_code) {
          case 'ER_WALLET_NOT_FOUND':
            reason = 'Airtel Money wallet not found for this number';
            break;
          case 'ER_INSUFFICIENT_BALANCE':
            reason = 'Insufficient balance in Airtel Money wallet';
            break;
          case 'ER_INVALID_AMOUNT':
            reason = 'Invalid payment amount';
            break;
          case 'ER_TRANSACTION_FAILED':
            reason = 'Transaction failed, please try again';
            break;
          case 'ER_DUPLICATE_TRANSACTION':
            reason = 'Duplicate transaction detected';
            break;
          default:
            reason = errorData.status.message || reason;
        }
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
  async getTransactionStatus(transactionId: string, country: string, currency: string): Promise<{
    transactionId: string;
    status: 'PENDING' | 'SUCCESSFUL' | 'FAILED';
    airtelTransactionId?: string;
    message?: string;
  }> {
    try {
      const accessToken = await this.getAccessToken();

      const response = await this.axiosInstance.get(`/standard/v1/payments/${transactionId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-Country': country,
          'X-Currency': currency
        }
      });

      const statusData: AirtelTransactionStatus = response.data;

      if (statusData.status.success && statusData.data) {
        return {
          transactionId: statusData.data.transaction.id,
          status: this.mapAirtelStatus(statusData.data.transaction.status),
          airtelTransactionId: statusData.data.transaction.airtel_money_id,
          message: statusData.data.transaction.message
        };
      } else {
        return {
          transactionId,
          status: 'FAILED',
          message: statusData.status.message || 'Transaction status check failed'
        };
      }
    } catch (error: any) {
      console.error('Error getting Airtel transaction status:', error.response?.data || error.message);
      
      // If transaction not found, it might be expired or invalid
      if (error.response?.status === 404) {
        return {
          transactionId,
          status: 'FAILED',
          message: 'Transaction not found'
        };
      }

      throw new Error(`Failed to get Airtel transaction status: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Map Airtel status to our standard status
   */
  private mapAirtelStatus(airtelStatus: string): 'PENDING' | 'SUCCESSFUL' | 'FAILED' {
    const status = airtelStatus.toUpperCase();
    
    switch (status) {
      case 'SUCCESS':
      case 'SUCCESSFUL':
      case 'COMPLETED':
        return 'SUCCESSFUL';
      case 'PENDING':
      case 'INITIATED':
      case 'IN_PROGRESS':
        return 'PENDING';
      case 'FAILED':
      case 'CANCELLED':
      case 'EXPIRED':
      case 'REJECTED':
      default:
        return 'FAILED';
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
        .digest('base64');

      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );
    } catch (error) {
      console.error('Error verifying Airtel webhook signature:', error);
      return false;
    }
  }

  /**
   * Get user KYC information (for compliance)
   */
  async getUserKYC(phoneNumber: string, country: string): Promise<{
    isKycVerified: boolean;
    firstName?: string;
    lastName?: string;
    dateOfBirth?: string;
  }> {
    try {
      const accessToken = await this.getAccessToken();

      const response = await this.axiosInstance.get(`/standard/v1/users/${phoneNumber}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-Country': country
        }
      });

      const userData = response.data;

      return {
        isKycVerified: userData.data?.is_kyc_verified || false,
        firstName: userData.data?.first_name,
        lastName: userData.data?.last_name,
        dateOfBirth: userData.data?.date_of_birth
      };
    } catch (error: any) {
      console.error('Error getting Airtel user KYC:', error.response?.data || error.message);
      return {
        isKycVerified: false
      };
    }
  }

  /**
   * Check if phone number is registered for Airtel Money
   */
  async isPhoneNumberRegistered(phoneNumber: string, country: string): Promise<boolean> {
    try {
      const kycInfo = await this.getUserKYC(phoneNumber, country);
      return kycInfo.isKycVerified;
    } catch (error) {
      console.error('Error checking Airtel phone registration:', error);
      return false;
    }
  }

  /**
   * Refund transaction
   */
  async refundTransaction(
    originalTransactionId: string,
    refundAmount: number,
    country: string,
    currency: string
  ): Promise<{
    refundId: string;
    status: 'PENDING' | 'SUCCESSFUL' | 'FAILED';
    message?: string;
  }> {
    try {
      const accessToken = await this.getAccessToken();

      const refundData = {
        transaction: {
          airtel_money_id: originalTransactionId,
          amount: refundAmount,
          country: country,
          currency: currency,
          id: `REFUND_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
        }
      };

      const response = await this.axiosInstance.post('/standard/v1/payments/refund', refundData, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-Country': country,
          'X-Currency': currency
        }
      });

      const refundResponse = response.data;

      if (refundResponse.status.success) {
        return {
          refundId: refundResponse.data?.transaction?.id || refundData.transaction.id,
          status: this.mapAirtelStatus(refundResponse.data?.transaction?.status || 'PENDING'),
          message: refundResponse.data?.transaction?.message
        };
      } else {
        return {
          refundId: '',
          status: 'FAILED',
          message: refundResponse.status.message || 'Refund failed'
        };
      }
    } catch (error: any) {
      console.error('Error processing Airtel refund:', error.response?.data || error.message);
      
      return {
        refundId: '',
        status: 'FAILED',
        message: error.response?.data?.status?.message || 'Refund processing failed'
      };
    }
  }
}

// Factory function to create Airtel service instance
export const createAirtelService = (): AirtelMoneyService => {
  const config: AirtelConfig = {
    baseUrl: process.env.AIRTEL_BASE_URL || 'https://openapiuat.airtel.africa',
    clientId: process.env.AIRTEL_CLIENT_ID || '',
    clientSecret: process.env.AIRTEL_CLIENT_SECRET || '',
    environment: (process.env.NODE_ENV === 'production' ? 'production' : 'staging') as 'staging' | 'production'
  };

  if (!config.clientId || !config.clientSecret) {
    throw new Error('AIRTEL_CLIENT_ID and AIRTEL_CLIENT_SECRET environment variables are required');
  }

  return new AirtelMoneyService(config);
};