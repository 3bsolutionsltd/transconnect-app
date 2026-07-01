import request from 'supertest';
import app from './test-app';
import { PaymentGatewayFactory } from '../services/payment-gateway.factory';

describe('Payment API Basic Tests', () => {
  describe('GET /api/payments/methods', () => {
    it('should return supported payment methods', async () => {
      const response = await request(app)
        .get('/api/payments/methods')
        .expect(200);

      expect(response.body).toHaveProperty('supportedMethods');
      expect(response.body.supportedMethods).toBeInstanceOf(Array);
      expect(response.body.supportedMethods.length).toBeGreaterThan(0);
      
      const methods = response.body.supportedMethods;
      expect(methods).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            value: 'PESAPAL',
            isOnline: true
          }),
          expect.objectContaining({
            value: 'CASH',
            isOnline: false
          })
        ])
      );
      const methodValues = methods.map((m: any) => m.value);
      expect(methodValues).not.toContain('MTN_MOBILE_MONEY');
      expect(methodValues).not.toContain('AIRTEL_MONEY');
    });
  });

  describe('Payment Gateway Factory', () => {
    it('should return supported payment methods', () => {
      const methods = PaymentGatewayFactory.getSupportedMethods();
      expect(methods).toContain('PESAPAL');
      expect(methods).toContain('CASH');
      expect(methods).not.toContain('MTN_MOBILE_MONEY');
      expect(methods).not.toContain('AIRTEL_MONEY');
    });

    it('should identify online payment methods', () => {
      expect(PaymentGatewayFactory.isOnlinePayment('MTN_MOBILE_MONEY')).toBe(false);
      expect(PaymentGatewayFactory.isOnlinePayment('AIRTEL_MONEY')).toBe(false);
      expect(PaymentGatewayFactory.isOnlinePayment('PESAPAL')).toBe(true);
      expect(PaymentGatewayFactory.isOnlinePayment('CASH')).toBe(false);
    });

    it('should return display names for payment methods', () => {
      expect(PaymentGatewayFactory.getMethodDisplayName('MTN_MOBILE_MONEY')).toBe('MTN Mobile Money');
      expect(PaymentGatewayFactory.getMethodDisplayName('AIRTEL_MONEY')).toBe('Airtel Money');
      expect(PaymentGatewayFactory.getMethodDisplayName('FLUTTERWAVE')).toBe('Card Payment');
      expect(PaymentGatewayFactory.getMethodDisplayName('CASH')).toBe('Cash Payment');
    });
  });
});