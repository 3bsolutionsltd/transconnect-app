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