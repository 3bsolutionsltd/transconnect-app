// Mock MTN Mobile Money Service

// Mock MTN Mobile Money Service
const mockMTNService = {
  authenticate: jest.fn().mockResolvedValue({
    access_token: 'mock-access-token',
    token_type: 'Bearer',
    expires_in: 3600
  }),

  requestPayment: jest.fn().mockImplementation((phoneNumber: string, amount: number, externalId: string) => {
    return Promise.resolve({
      transactionId: `mock-txn-${externalId}`,
      status: 'PENDING',
      reference: externalId
    });
  }),

  getTransactionStatus: jest.fn().mockImplementation((transactionId: string) => {
    // Mock successful transaction status
    return Promise.resolve({
      status: 'SUCCESSFUL',
      reason: null,
      financialTransactionId: `mtn-fin-${transactionId}`,
      externalId: transactionId.replace('mock-txn-', ''),
      amount: '15000',
      currency: 'UGX',
      payer: {
        partyIdType: 'MSISDN',
        partyId: '256777123456'
      },
      payerMessage: 'Payment for bus ticket',
      payeeNote: 'TransConnect bus booking payment'
    });
  }),

  validateAccountHolder: jest.fn().mockImplementation((phoneNumber: string) => {
    // Mock valid account holder for MTN numbers
    if (phoneNumber.startsWith('25677') || phoneNumber.startsWith('25678')) {
      return Promise.resolve({
        isValid: true,
        name: 'John Doe'
      });
    }
    return Promise.resolve({
      isValid: false,
      name: null
    });
  }),

  isValidPhoneNumber: jest.fn().mockImplementation((phoneNumber: string) => {
    return phoneNumber.startsWith('25677') || phoneNumber.startsWith('25678');
  })
};

// Replace the actual service with our mock
jest.mock('../services/mtn.service', () => ({
  MTNMobileMoneyService: jest.fn().mockImplementation(() => mockMTNService)
}));

export { mockMTNService };