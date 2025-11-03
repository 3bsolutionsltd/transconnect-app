import { PaymentGatewayFactory } from '../services/payment-gateway.factory';

describe('Payment Gateway Factory Tests', () => {
  describe('getSupportedMethods', () => {
    it('should return all supported payment methods', () => {
      const methods = PaymentGatewayFactory.getSupportedMethods();
      
      expect(methods).toBeInstanceOf(Array);
      expect(methods.length).toBeGreaterThan(0);
      expect(methods).toContain('MTN_MOBILE_MONEY');
      expect(methods).toContain('AIRTEL_MONEY');
      expect(methods).toContain('FLUTTERWAVE');
      expect(methods).toContain('CASH');
    });
  });

  describe('isOnlinePayment', () => {
    it('should correctly identify online payment methods', () => {
      expect(PaymentGatewayFactory.isOnlinePayment('MTN_MOBILE_MONEY')).toBe(true);
      expect(PaymentGatewayFactory.isOnlinePayment('AIRTEL_MONEY')).toBe(true);
      expect(PaymentGatewayFactory.isOnlinePayment('FLUTTERWAVE')).toBe(true);
      expect(PaymentGatewayFactory.isOnlinePayment('CASH')).toBe(false);
    });

    it('should return false for unknown payment methods', () => {
      expect(PaymentGatewayFactory.isOnlinePayment('UNKNOWN_METHOD' as any)).toBe(false);
    });
  });

  describe('getMethodDisplayName', () => {
    it('should return correct display names', () => {
      expect(PaymentGatewayFactory.getMethodDisplayName('MTN_MOBILE_MONEY')).toBe('MTN Mobile Money');
      expect(PaymentGatewayFactory.getMethodDisplayName('AIRTEL_MONEY')).toBe('Airtel Money');
      expect(PaymentGatewayFactory.getMethodDisplayName('FLUTTERWAVE')).toBe('Card Payment');
      expect(PaymentGatewayFactory.getMethodDisplayName('CASH')).toBe('Cash Payment');
    });

    it('should return unknown for invalid methods', () => {
      expect(PaymentGatewayFactory.getMethodDisplayName('INVALID_METHOD' as any)).toBe('Unknown Payment Method');
    });
  });

  describe('validatePaymentMethod', () => {
    it('should validate MTN phone numbers', async () => {
      const isValid = await PaymentGatewayFactory.validatePaymentMethod('MTN_MOBILE_MONEY', '256777123456');
      expect(typeof isValid).toBe('boolean');
    });

    it('should validate Airtel phone numbers', async () => {
      const isValid = await PaymentGatewayFactory.validatePaymentMethod('AIRTEL_MONEY', '256750123456');
      expect(typeof isValid).toBe('boolean');
    });

    it('should return true for methods that do not require phone validation', async () => {
      const isValidCash = await PaymentGatewayFactory.validatePaymentMethod('CASH', '');
      const isValidFlutterwave = await PaymentGatewayFactory.validatePaymentMethod('FLUTTERWAVE', '');
      expect(isValidCash).toBe(true);
      expect(isValidFlutterwave).toBe(true);
    });
  });

  describe('getProvider', () => {
    it('should return providers for supported methods', () => {
      const mtnProvider = PaymentGatewayFactory.getProvider('MTN_MOBILE_MONEY');
      const airtelProvider = PaymentGatewayFactory.getProvider('AIRTEL_MONEY');
      
      expect(mtnProvider).toBeDefined();
      expect(airtelProvider).toBeDefined();
    });
  });
});