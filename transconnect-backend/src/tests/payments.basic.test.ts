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
            value: 'MTN_MOBILE_MONEY',
            label: 'MTN Mobile Money',
            isOnline: true
          }),
          expect.objectContaining({
            value: 'AIRTEL_MONEY',
            label: 'Airtel Money',
            isOnline: true
          })
        ])
      );
    });
  });

  describe('Payment Gateway Factory', () => {
    it('should return supported payment methods', () => {
      const methods = PaymentGatewayFactory.getSupportedMethods();
      expect(methods).toContain('MTN_MOBILE_MONEY');
      expect(methods).toContain('AIRTEL_MONEY');
      expect(methods).toContain('FLUTTERWAVE');
      expect(methods).toContain('CASH');
    });

    it('should identify online payment methods', () => {
      expect(PaymentGatewayFactory.isOnlinePayment('MTN_MOBILE_MONEY')).toBe(true);
      expect(PaymentGatewayFactory.isOnlinePayment('AIRTEL_MONEY')).toBe(true);
      expect(PaymentGatewayFactory.isOnlinePayment('FLUTTERWAVE')).toBe(true);
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