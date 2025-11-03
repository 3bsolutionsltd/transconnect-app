import { PaymentMethod } from '@prisma/client';
import { createMTNService, MTNMobileMoneyService } from './mtn.service';
import { createAirtelService, AirtelMoneyService } from './airtel.service';

export interface PaymentProvider {
  requestPayment(paymentData: any): Promise<{
    transactionId: string;
    status: 'PENDING' | 'SUCCESSFUL' | 'FAILED';
    reason?: string;
    checkoutUrl?: string;
  }>;
  
  getTransactionStatus(transactionId: string, additionalData?: any): Promise<{
    transactionId: string;
    status: 'PENDING' | 'SUCCESSFUL' | 'FAILED';
    message?: string;
    providerTransactionId?: string;
  }>;
  
  verifyWebhookSignature(payload: string, signature: string, secret: string): boolean;
  
  validatePhoneNumber?(phoneNumber: string, country?: string): Promise<boolean>;
}

export interface StandardPaymentRequest {
  amount: number;
  currency: string;
  reference: string;
  phoneNumber: string;
  description: string;
  country: string;
}

export class MTNPaymentProvider implements PaymentProvider {
  private service: MTNMobileMoneyService;

  constructor() {
    this.service = createMTNService();
  }

  async requestPayment(paymentData: StandardPaymentRequest) {
    const mtnRequest = {
      amount: paymentData.amount,
      currency: paymentData.currency,
      externalId: paymentData.reference,
      payer: {
        partyIdType: 'MSISDN' as const,
        partyId: this.formatPhoneNumber(paymentData.phoneNumber)
      },
      payerMessage: paymentData.description,
      payeeNote: `TransConnect payment: ${paymentData.reference}`
    };

    const result = await this.service.requestPayment(mtnRequest);
    
    return {
      transactionId: result.transactionId,
      status: result.status,
      reason: result.reason,
      checkoutUrl: result.status === 'PENDING' 
        ? `https://sandbox.momodeveloper.mtn.com/collection/v1_0/requesttopay/${result.transactionId}`
        : undefined
    };
  }

  async getTransactionStatus(transactionId: string) {
    const status = await this.service.getTransactionStatus(transactionId);
    
    return {
      transactionId: status.externalId,
      status: status.status,
      message: status.reason,
      providerTransactionId: status.financialTransactionId
    };
  }

  verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
    return this.service.verifyWebhookSignature(payload, signature, secret);
  }

  async validatePhoneNumber(phoneNumber: string): Promise<boolean> {
    try {
      return await this.service.validateAccountHolder(this.formatPhoneNumber(phoneNumber));
    } catch (error) {
      console.error('Error validating MTN phone number:', error);
      return false;
    }
  }

  private formatPhoneNumber(phoneNumber: string): string {
    // Remove any non-digit characters
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    // Handle Uganda phone numbers
    if (cleaned.startsWith('256')) {
      return cleaned;
    } else if (cleaned.startsWith('0')) {
      return '256' + cleaned.substring(1);
    } else if (cleaned.length === 9) {
      return '256' + cleaned;
    }
    
    return cleaned;
  }
}

export class AirtelPaymentProvider implements PaymentProvider {
  private service: AirtelMoneyService;

  constructor() {
    this.service = createAirtelService();
  }

  async requestPayment(paymentData: StandardPaymentRequest) {
    const airtelRequest = {
      reference: paymentData.reference,
      subscriber: {
        country: paymentData.country.toUpperCase(),
        currency: paymentData.currency,
        msisdn: this.formatPhoneNumber(paymentData.phoneNumber)
      },
      transaction: {
        amount: paymentData.amount,
        country: paymentData.country.toUpperCase(),
        currency: paymentData.currency,
        id: paymentData.reference
      }
    };

    const result = await this.service.requestPayment(airtelRequest);
    
    return {
      transactionId: result.transactionId,
      status: result.status,
      reason: result.reason
    };
  }

  async getTransactionStatus(transactionId: string, additionalData?: { country: string; currency: string }) {
    if (!additionalData) {
      throw new Error('Country and currency are required for Airtel transaction status check');
    }

    const status = await this.service.getTransactionStatus(
      transactionId, 
      additionalData.country, 
      additionalData.currency
    );
    
    return {
      transactionId: status.transactionId,
      status: status.status,
      message: status.message,
      providerTransactionId: status.airtelTransactionId
    };
  }

  verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
    return this.service.verifyWebhookSignature(payload, signature, secret);
  }

  async validatePhoneNumber(phoneNumber: string, country: string = 'UG'): Promise<boolean> {
    try {
      return await this.service.isPhoneNumberRegistered(
        this.formatPhoneNumber(phoneNumber), 
        country.toUpperCase()
      );
    } catch (error) {
      console.error('Error validating Airtel phone number:', error);
      return false;
    }
  }

  private formatPhoneNumber(phoneNumber: string): string {
    // Remove any non-digit characters
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    // Handle Uganda phone numbers
    if (cleaned.startsWith('256')) {
      return cleaned;
    } else if (cleaned.startsWith('0')) {
      return '256' + cleaned.substring(1);
    } else if (cleaned.length === 9) {
      return '256' + cleaned;
    }
    
    return cleaned;
  }
}

export class FlutterwavePaymentProvider implements PaymentProvider {
  async requestPayment(paymentData: StandardPaymentRequest) {
    // Placeholder for Flutterwave implementation
    // This would integrate with Flutterwave's API
    return {
      transactionId: `FLW_${Date.now()}`,
      status: 'PENDING' as const,
      checkoutUrl: `https://checkout.flutterwave.com/pay/${paymentData.reference}`
    };
  }

  async getTransactionStatus(transactionId: string) {
    // Placeholder for Flutterwave status check
    return {
      transactionId,
      status: 'PENDING' as const,
      message: 'Flutterwave status check not implemented'
    };
  }

  verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
    // Placeholder for Flutterwave webhook verification
    return true;
  }
}

export class PaymentGatewayFactory {
  private static providers: Map<PaymentMethod, PaymentProvider> = new Map();

  static getProvider(method: PaymentMethod): PaymentProvider {
    if (!this.providers.has(method)) {
      switch (method) {
        case 'MTN_MOBILE_MONEY':
          this.providers.set(method, new MTNPaymentProvider());
          break;
        case 'AIRTEL_MONEY':
          this.providers.set(method, new AirtelPaymentProvider());
          break;
        case 'FLUTTERWAVE':
          this.providers.set(method, new FlutterwavePaymentProvider());
          break;
        case 'CASH':
          throw new Error('Cash payments do not require a payment provider');
        default:
          throw new Error(`Unsupported payment method: ${method}`);
      }
    }

    return this.providers.get(method)!;
  }

  static async validatePaymentMethod(method: PaymentMethod, phoneNumber?: string, country?: string): Promise<boolean> {
    try {
      const provider = this.getProvider(method);
      
      if (provider.validatePhoneNumber && phoneNumber) {
        return await provider.validatePhoneNumber(phoneNumber, country);
      }
      
      return true; // If validation is not available, assume valid
    } catch (error) {
      console.error(`Error validating payment method ${method}:`, error);
      return false;
    }
  }

  static getSupportedMethods(): PaymentMethod[] {
    return ['MTN_MOBILE_MONEY', 'AIRTEL_MONEY', 'FLUTTERWAVE', 'CASH'];
  }

  static isOnlinePayment(method: PaymentMethod): boolean {
    return ['MTN_MOBILE_MONEY', 'AIRTEL_MONEY', 'FLUTTERWAVE'].includes(method);
  }

  static getMethodDisplayName(method: PaymentMethod): string {
    const displayNames: Record<PaymentMethod, string> = {
      'MTN_MOBILE_MONEY': 'MTN Mobile Money',
      'AIRTEL_MONEY': 'Airtel Money',
      'FLUTTERWAVE': 'Card Payment',
      'CASH': 'Cash Payment'
    };

    return displayNames[method] || method;
  }
}

// Error classes for payment processing
export class PaymentError extends Error {
  constructor(
    message: string,
    public code: string,
    public provider: string,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'PaymentError';
  }
}

export class PaymentValidationError extends PaymentError {
  constructor(message: string, provider: string) {
    super(message, 'VALIDATION_ERROR', provider, false);
    this.name = 'PaymentValidationError';
  }
}

export class PaymentNetworkError extends PaymentError {
  constructor(message: string, provider: string) {
    super(message, 'NETWORK_ERROR', provider, true);
    this.name = 'PaymentNetworkError';
  }
}

export class PaymentProviderError extends PaymentError {
  constructor(message: string, provider: string, code: string) {
    super(message, code, provider, false);
    this.name = 'PaymentProviderError';
  }
}