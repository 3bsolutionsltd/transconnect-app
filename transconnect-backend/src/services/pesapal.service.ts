/**
 * PesaPal v3 Payment Service
 *
 * Flow:
 *  1. getAuthToken()           — POST /api/Auth/RequestToken  (token valid ~5 min)
 *  2. registerIPN()            — POST /api/URLSetup/RegisterIPN  (once at startup, returns ipn_id)
 *  3. submitOrder()            — POST /api/Transactions/SubmitOrderRequest  → redirect_url
 *  4. getTransactionStatus()   — GET  /api/Transactions/GetTransactionStatus?orderTrackingId=
 *
 * PesaPal sends an IPN GET request to your registered URL when payment completes:
 *   GET /api/payments/ipn/pesapal?orderTrackingId=xxx&orderMerchantReference=xxx&orderNotificationType=MERCHANT
 */

import axios, { AxiosInstance } from 'axios';
import crypto from 'crypto';

// ── Types ────────────────────────────────────────────────────────────────────

export interface PesapalOrderRequest {
  id: string;                  // Your unique merchant reference (payment reference)
  amount: number;
  currency: string;            // e.g. 'UGX'
  description: string;
  callbackUrl: string;         // Frontend redirect after checkout
  cancellationUrl: string;
  notificationId: string;      // ipn_id from registerIPN()
  billingAddress: {
    emailAddress: string;
    phoneNumber: string;
    countryCode: string;       // 'UG'
    firstName: string;
    lastName: string;
  };
}

export interface PesapalOrderResponse {
  orderTrackingId: string;
  merchantReference: string;
  redirectUrl: string;
}

export interface PesapalTransactionStatus {
  orderTrackingId: string;
  merchantReference: string;
  paymentStatus: 'COMPLETED' | 'FAILED' | 'PENDING' | 'REVERSED' | 'INVALID';
  paymentMethod: string;
  amount: number;
  currency: string;
  confirmationCode: string;
  paymentAccount: string;
  createdDate: string;
  message: string;
}

export interface PesapalIPNPayload {
  orderTrackingId: string;
  orderMerchantReference: string;
  orderNotificationType: string;
}

// ── Service ──────────────────────────────────────────────────────────────────

export class PesapalService {
  private readonly baseUrl: string;
  private readonly consumerKey: string;
  private readonly consumerSecret: string;
  private http: AxiosInstance;

  // Cached token
  private cachedToken: string | null = null;
  private tokenExpiry: Date | null = null;

  // Cached IPN id (registered once)
  private cachedIpnId: string | null = null;

  constructor() {
    const env = process.env.PESAPAL_ENVIRONMENT || 'sandbox';
    this.baseUrl = env === 'production'
      ? 'https://pay.pesapal.com/v3'
      : 'https://cybqa.pesapal.com/pesapalv3';

    this.consumerKey    = process.env.PESAPAL_CONSUMER_KEY    || '';
    this.consumerSecret = process.env.PESAPAL_CONSUMER_SECRET || '';

    if (!this.consumerKey || !this.consumerSecret) {
      console.warn('[PesaPal] PESAPAL_CONSUMER_KEY or PESAPAL_CONSUMER_SECRET not set');
    }

    this.http = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    });
  }

  // ── Auth ────────────────────────────────────────────────────────────────

  async getAuthToken(): Promise<string> {
    // Return cached token if still valid (with 60-second buffer)
    if (this.cachedToken && this.tokenExpiry && new Date() < new Date(this.tokenExpiry.getTime() - 60_000)) {
      return this.cachedToken;
    }

    const response = await this.http.post('/api/Auth/RequestToken', {
      consumer_key: this.consumerKey,
      consumer_secret: this.consumerSecret,
    });

    const data = response.data;
    if (!data.token) {
      throw new Error(`[PesaPal] Auth failed: ${JSON.stringify(data)}`);
    }

    this.cachedToken = data.token as string;
    this.tokenExpiry = new Date(data.expiryDate);
    return this.cachedToken;
  }

  // ── IPN Registration ────────────────────────────────────────────────────

  async registerIPN(): Promise<string> {
    if (this.cachedIpnId) return this.cachedIpnId;

    const ipnUrl = process.env.PESAPAL_IPN_URL ||
      `${process.env.FRONTEND_URL?.replace('https://transconnect.app', 'https://api.transconnect.app') || 'https://api.transconnect.app'}/api/payments/ipn/pesapal`;

    const token = await this.getAuthToken();

    const response = await this.http.post(
      '/api/URLSetup/RegisterIPN',
      { url: ipnUrl, ipn_notification_type: 'GET' },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const data = response.data;
    if (!data.ipn_id) {
      throw new Error(`[PesaPal] IPN registration failed: ${JSON.stringify(data)}`);
    }

    this.cachedIpnId = data.ipn_id as string;
    console.log(`[PesaPal] IPN registered: ${this.cachedIpnId} → ${ipnUrl}`);
    return this.cachedIpnId;
  }

  // ── Submit Order ────────────────────────────────────────────────────────

  async submitOrder(order: PesapalOrderRequest): Promise<PesapalOrderResponse> {
    const [token, ipnId] = await Promise.all([this.getAuthToken(), this.registerIPN()]);

    const payload = {
      id: order.id,
      currency: order.currency,
      amount: order.amount,
      description: order.description,
      callback_url: order.callbackUrl,
      cancellation_url: order.cancellationUrl,
      notification_id: ipnId,
      branch: 'TransConnect',
      billing_address: {
        email_address:  order.billingAddress.emailAddress,
        phone_number:   order.billingAddress.phoneNumber,
        country_code:   order.billingAddress.countryCode,
        first_name:     order.billingAddress.firstName,
        last_name:      order.billingAddress.lastName,
        line_1: '',
        line_2: '',
        city: '',
        state: '',
        postal_code: '',
        zip_code: '',
      },
    };

    const response = await this.http.post('/api/Transactions/SubmitOrderRequest', payload, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = response.data;
    if (!data.redirect_url) {
      throw new Error(`[PesaPal] Order submission failed: ${JSON.stringify(data)}`);
    }

    return {
      orderTrackingId:  data.order_tracking_id,
      merchantReference: data.merchant_reference,
      redirectUrl:      data.redirect_url,
    };
  }

  // ── Transaction Status ──────────────────────────────────────────────────

  async getTransactionStatus(orderTrackingId: string): Promise<PesapalTransactionStatus> {
    const token = await this.getAuthToken();

    const response = await this.http.get('/api/Transactions/GetTransactionStatus', {
      params: { orderTrackingId },
      headers: { Authorization: `Bearer ${token}` },
    });

    const d = response.data;

    // PesaPal status_code: 1=COMPLETED, 2=FAILED, 3=REVERSED, 0=PENDING/INVALID
    const statusMap: Record<number, PesapalTransactionStatus['paymentStatus']> = {
      1: 'COMPLETED',
      2: 'FAILED',
      3: 'REVERSED',
      0: 'PENDING',
    };

    return {
      orderTrackingId:  d.order_tracking_id,
      merchantReference: d.merchant_reference,
      paymentStatus:    statusMap[d.status_code] ?? 'PENDING',
      paymentMethod:    d.payment_method || '',
      amount:           d.amount,
      currency:         d.currency,
      confirmationCode: d.confirmation_code || '',
      paymentAccount:   d.payment_account  || '',
      createdDate:      d.created_date     || '',
      message:          d.message          || '',
    };
  }

  // ── Webhook / IPN helpers ───────────────────────────────────────────────

  /**
   * Verify that the IPN notification came from PesaPal.
   * PesaPal does not sign IPN GET requests, so we re-fetch the status
   * directly from the API rather than trusting the incoming payload blindly.
   */
  async verifyAndGetStatus(orderTrackingId: string): Promise<PesapalTransactionStatus> {
    return this.getTransactionStatus(orderTrackingId);
  }

  /**
   * HMAC-SHA256 signature helper — used if PesaPal ever adds request signing.
   */
  verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
    const expected = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    try {
      return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
    } catch {
      return false;
    }
  }
}

// Singleton factory
let _instance: PesapalService | null = null;
export function getPesapalService(): PesapalService {
  if (!_instance) _instance = new PesapalService();
  return _instance;
}
