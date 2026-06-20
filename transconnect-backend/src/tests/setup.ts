import { jest } from '@jest/globals';

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Set test environment variables — preserve existing env vars so CI-injected values take precedence
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/transconnect_test';

// Mock environment variables for payment services
process.env.MTN_API_BASE_URL = process.env.MTN_API_BASE_URL || 'https://sandbox.momodeveloper.mtn.com';
process.env.MTN_SUBSCRIPTION_KEY = process.env.MTN_SUBSCRIPTION_KEY || 'test-mtn-key';
process.env.MTN_CLIENT_ID = process.env.MTN_CLIENT_ID || 'test-mtn-client';
process.env.MTN_CLIENT_SECRET = process.env.MTN_CLIENT_SECRET || 'test-mtn-secret';
process.env.MTN_TARGET_ENVIRONMENT = process.env.MTN_TARGET_ENVIRONMENT || 'sandbox';

process.env.AIRTEL_API_BASE_URL = process.env.AIRTEL_API_BASE_URL || 'https://openapi.airtel.africa';
process.env.AIRTEL_CLIENT_ID = process.env.AIRTEL_CLIENT_ID || 'test-airtel-client';
process.env.AIRTEL_CLIENT_SECRET = process.env.AIRTEL_CLIENT_SECRET || 'test-airtel-secret';

// Webhook secrets — required so the webhook handler doesn't return 500 for missing secret
process.env.MTN_WEBHOOK_SECRET = process.env.MTN_WEBHOOK_SECRET || 'test-mtn-webhook-secret';
process.env.AIRTEL_WEBHOOK_SECRET = process.env.AIRTEL_WEBHOOK_SECRET || 'test-airtel-webhook-secret';

// Set timeout for all tests
jest.setTimeout(30000);