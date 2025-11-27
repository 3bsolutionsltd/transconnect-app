import { Router } from 'express';
import { registerAgent, verifyOtp, getDashboard, requestWithdrawal, loginAgent, verifyLoginOtp, getAllAgents, updateAgentStatus, resendRegistrationOtp, resendLoginOtp, checkRegistrationStatus } from '../../services/agents/agent.service';
import { uploadKyc, confirmKycUpload, listPendingKyc, reviewKyc, getPresignedUrl } from './kyc/kyc.controller';
import { updateProfile, getProfile } from './profile/profile.controller';
import operatorRoutes from './operators';
import { authenticateToken } from '../../middleware/auth';
import { trackAgentActivity, getOnlineAgents, getOnlineAgentsCount, markAgentOffline, cleanupOfflineAgents } from '../../middleware/agentActivity';

const router = Router();

// onboarding
router.post('/register', registerAgent);
router.post('/verify-otp', verifyOtp);
router.post('/resend-otp', resendRegistrationOtp); // <- New resend endpoint
router.post('/check-status', checkRegistrationStatus); // <- Check registration status

// login
router.post('/login', loginAgent);
router.post('/login/verify', verifyLoginOtp);
router.post('/login/resend-otp', resendLoginOtp); // <- New login resend endpoint

// SMS service testing
router.post('/test-sms', async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    
    if (!phoneNumber) {
      return res.status(400).json({ success: false, error: 'phoneNumber is required' });
    }

    // Import the SMS service
    const { ESMSAfricaService } = require('../../services/esms-africa.service');
    const smsService = ESMSAfricaService.getInstance();
    
    // Verify credentials first
    const credentialCheck = await smsService.verifyCredentials();
    console.log('🔍 Credential verification result:', credentialCheck);
    
    // Send test SMS
    const result = await smsService.sendTestSMS(phoneNumber);
    
    res.json({
      success: result.success,
      credentialCheck,
      smsResult: result,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('❌ SMS test error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Simple SMS delivery test
router.post('/test-delivery', async (req, res) => {
  try {
    const { phoneNumber, message, senderId } = req.body;
    
    if (!phoneNumber) {
      return res.status(400).json({ success: false, error: 'phoneNumber is required' });
    }

    const { ESMSAfricaService } = require('../../services/esms-africa.service');
    const smsService = ESMSAfricaService.getInstance();
    
    // Test with custom parameters
    const result = await smsService.sendSMS({
      phoneNumber,
      message: message || `Simple test: ${new Date().toLocaleTimeString()}`,
      senderId: senderId || undefined // Use default if not specified
    });
    
    res.json({
      success: result.success,
      result,
      parameters: {
        phoneNumber,
        message: message || 'Default test message',
        senderId: senderId || 'default'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('❌ SMS delivery test error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Comprehensive delivery diagnosis
router.post('/diagnose-sms', async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    
    if (!phoneNumber) {
      return res.status(400).json({ success: false, error: 'phoneNumber is required' });
    }

    const { ESMSAfricaService } = require('../../services/esms-africa.service');
    const smsService = ESMSAfricaService.getInstance();
    
    const tests: Array<{ name: string; message: string; result: any }> = [];
    
    // Test 1: Ultra simple message
    console.log('🧪 Test 1: Ultra simple message');
    const test1 = await smsService.sendSMS({
      phoneNumber,
      message: 'Hi'
    });
    tests.push({ name: 'Ultra Simple', message: 'Hi', result: test1 });
    
    // Test 2: Number only
    console.log('🧪 Test 2: Numbers only');
    const test2 = await smsService.sendSMS({
      phoneNumber,
      message: '123456'
    });
    tests.push({ name: 'Numbers Only', message: '123456', result: test2 });
    
    // Test 3: No special characters
    console.log('🧪 Test 3: Plain text');
    const test3 = await smsService.sendSMS({
      phoneNumber,
      message: 'Test message from TransConnect'
    });
    tests.push({ name: 'Plain Text', message: 'Test message from TransConnect', result: test3 });
    
    res.json({
      phoneNumber,
      tests,
      summary: {
        totalTests: tests.length,
        successfulSends: tests.filter(t => t.result.success).length,
        recommendation: tests.every(t => t.result.success) 
          ? 'All API calls successful - issue is API format vs platform delivery difference'
          : 'API issues detected - check credentials and configuration'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('❌ SMS diagnosis error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Test different API formats for delivery
router.post('/test-api-formats', async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    
    if (!phoneNumber) {
      return res.status(400).json({ success: false, error: 'phoneNumber is required' });
    }

    const axios = require('axios');
    const results: Array<{ format: string; success: boolean; response?: any; error?: any }> = [];
    
    // Format 1: Current format
    console.log('🧪 Testing Format 1: Current API format');
    try {
      const result1 = await axios.post('https://api.esmsafrica.io/api/sms/send', {
        phoneNumber: phoneNumber,
        text: 'API Format Test 1'
      }, {
        headers: {
          'X-Account-ID': process.env.ESMS_AFRICA_ACCOUNT_ID,
          'X-API-Key': process.env.ESMS_AFRICA_API_KEY,
          'Content-Type': 'application/json'
        }
      });
      results.push({ format: 'Current Format', success: true, response: result1.data });
    } catch (err: any) {
      results.push({ format: 'Current Format', success: false, error: err.message });
    }

    // Format 2: No plus sign
    console.log('🧪 Testing Format 2: No plus sign');
    try {
      const result2 = await axios.post('https://api.esmsafrica.io/api/sms/send', {
        phoneNumber: phoneNumber.replace('+', ''),
        text: 'API Format Test 2'
      }, {
        headers: {
          'X-Account-ID': process.env.ESMS_AFRICA_ACCOUNT_ID,
          'X-API-Key': process.env.ESMS_AFRICA_API_KEY,
          'Content-Type': 'application/json'
        }
      });
      results.push({ format: 'No Plus Sign', success: true, response: result2.data });
    } catch (err: any) {
      results.push({ format: 'No Plus Sign', success: false, error: err.message });
    }

    // Format 3: Different field names
    console.log('🧪 Testing Format 3: Alternative field names');
    try {
      const result3 = await axios.post('https://api.esmsafrica.io/api/sms/send', {
        phone: phoneNumber.replace('+', ''),
        message: 'API Format Test 3',
        sender: 'SMS'
      }, {
        headers: {
          'X-Account-ID': process.env.ESMS_AFRICA_ACCOUNT_ID,
          'X-API-Key': process.env.ESMS_AFRICA_API_KEY,
          'Content-Type': 'application/json'
        }
      });
      results.push({ format: 'Alternative Fields', success: true, response: result3.data });
    } catch (err: any) {
      results.push({ format: 'Alternative Fields', success: false, error: err.message });
    }
    
    res.json({
      phoneNumber,
      formatTests: results,
      recommendation: 'Check which format gets SUCCESS and if any actually deliver to phone',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('❌ API format test error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// dashboard
router.get('/:agentId/dashboard', trackAgentActivity, getDashboard);

// withdrawals
router.post('/:agentId/withdraw', trackAgentActivity, requestWithdrawal);

// KYC
router.post('/kyc/upload', uploadKyc);
router.post('/kyc/confirm', confirmKycUpload);
router.get('/kyc/pending', listPendingKyc);
router.post('/kyc/:kycId/review', reviewKyc);
router.get('/kyc/presign', getPresignedUrl);

// Profile management
router.put('/profile', updateProfile);
router.get('/profile/:agentId', getProfile);

// Admin routes for agent management
router.get('/admin/all', authenticateToken, getAllAgents);
router.put('/admin/:agentId/status', authenticateToken, updateAgentStatus);

// Online status tracking
router.get('/online', authenticateToken, async (req, res) => {
  try {
    const agents = await getOnlineAgents();
    res.json({
      success: true,
      onlineAgents: agents,
      count: agents.length,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.get('/online/count', authenticateToken, async (req, res) => {
  try {
    const count = await getOnlineAgentsCount();
    res.json({
      success: true,
      count,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.post('/:agentId/ping', trackAgentActivity, async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Activity updated',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.post('/:agentId/offline', async (req, res) => {
  try {
    await markAgentOffline(req.params.agentId);
    res.json({
      success: true,
      message: 'Agent marked offline',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.post('/cleanup-offline', authenticateToken, async (req, res) => {
  try {
    const cleanedUp = await cleanupOfflineAgents();
    res.json({
      success: true,
      message: `Cleaned up ${cleanedUp} offline agents`,
      count: cleanedUp,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Temporary test endpoints (no auth required)
router.get('/test/online', async (req, res) => {
  try {
    const agents = await getOnlineAgents();
    res.json({
      success: true,
      message: 'Test endpoint - online agents',
      onlineAgents: agents,
      count: agents.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.post('/test/:agentId/ping', trackAgentActivity, async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Test ping successful',
      agentId: req.params.agentId,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Operator Management - mount under /:agentId/operators path
router.use('/:agentId/operators', operatorRoutes);

export default router;