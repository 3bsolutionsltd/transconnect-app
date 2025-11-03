// Mock Airtel Money Service
const mockAirtelService = {
  authenticate: jest.fn().mockResolvedValue({
    access_token: 'mock-airtel-access-token',
    token_type: 'Bearer',
    expires_in: 3600
  }),

  requestPayment: jest.fn().mockImplementation((phoneNumber: string, amount: number, externalId: string) => {
    return Promise.resolve({
      transactionId: `airtel-txn-${externalId}`,
      status: 'PENDING',
      reference: externalId
    });
  }),

  getTransactionStatus: jest.fn().mockImplementation((transactionId: string) => {
    // Mock successful transaction status
    return Promise.resolve({
      status: 'SUCCESS',
      data: {
        transaction: {
          id: transactionId,
          status: 'SUCCESS',
          airtel_money_id: `airtel-fin-${transactionId}`,
          amount: '15000',
          currency: 'UGX',
          msisdn: '256750123456'
        }
      }
    });
  }),

  validateAccountHolder: jest.fn().mockImplementation((phoneNumber: string) => {
    // Mock valid account holder for Airtel numbers
    if (phoneNumber.startsWith('25675') || phoneNumber.startsWith('25670')) {
      return Promise.resolve({
        isValid: true,
        name: 'Jane Smith'
      });
    }
    return Promise.resolve({
      isValid: false,
      name: null
    });
  }),

  isValidPhoneNumber: jest.fn().mockImplementation((phoneNumber: string) => {
    return phoneNumber.startsWith('25675') || phoneNumber.startsWith('25670');
  })
};

// Replace the actual service with our mock
jest.mock('../../services/airtel.service', () => ({
  AirtelMoneyService: jest.fn().mockImplementation(() => mockAirtelService)
}));

export { mockAirtelService };