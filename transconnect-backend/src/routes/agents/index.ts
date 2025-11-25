import { Router } from 'express';
import { registerAgent, verifyOtp, getDashboard, requestWithdrawal, loginAgent, verifyLoginOtp, getAllAgents, updateAgentStatus } from '../../services/agents/agent.service';
import { uploadKyc, listPendingKyc, reviewKyc } from './kyc/kyc.controller';
import { getPresignedUrl } from './kyc/kyc.controller';
import operatorRoutes from './operators';
import { authenticateToken } from '../../middleware/auth';

const router = Router();

// onboarding
router.post('/register', registerAgent);
router.post('/verify-otp', verifyOtp);

// login
router.post('/login', loginAgent);
router.post('/login/verify', verifyLoginOtp);

// dashboard
router.get('/:agentId/dashboard', getDashboard);

// withdrawals
router.post('/:agentId/withdraw', requestWithdrawal);

// KYC
router.post('/kyc/upload', uploadKyc);
router.get('/kyc/pending', listPendingKyc);
router.post('/kyc/:kycId/review', reviewKyc);
router.get('/kyc/presign', getPresignedUrl);

// Admin routes for agent management
router.get('/admin/all', authenticateToken, getAllAgents);
router.put('/admin/:agentId/status', authenticateToken, updateAgentStatus);

// Operator Management
router.use('/', operatorRoutes);

export default router;