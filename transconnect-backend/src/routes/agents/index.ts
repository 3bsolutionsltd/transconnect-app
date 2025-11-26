import { Router } from 'express';
import { registerAgent, verifyOtp, getDashboard, requestWithdrawal, loginAgent, verifyLoginOtp, getAllAgents, updateAgentStatus } from '../../services/agents/agent.service';
import { uploadKyc, confirmKycUpload, listPendingKyc, reviewKyc, getPresignedUrl } from './kyc/kyc.controller';
import operatorRoutes from './operators';
import { authenticateToken } from '../../middleware/auth';
import { trackAgentActivity, getOnlineAgents, getOnlineAgentsCount, markAgentOffline, cleanupOfflineAgents } from '../../middleware/agentActivity';

const router = Router();

// onboarding
router.post('/register', registerAgent);
router.post('/verify-otp', verifyOtp);

// login
router.post('/login', loginAgent);
router.post('/login/verify', verifyLoginOtp);

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

// Operator Management
router.use('/', operatorRoutes);

export default router;