🟩 START OF MASTER COMMAND PACK — COPY EVERYTHING BELOW THIS LINE

You are assisting with a codebase update for the project located at:

mobility-app/transconnect-backend


Follow these instructions EXACTLY.
Do not modify unrelated files.
Do not refactor existing modules.
Only create, append, or patch files as instructed.

========================
1. CREATE REQUIRED FOLDERS
========================

Create the following directories inside:

mobility-app/transconnect-backend/src/


Directories to create:

src/routes/agents
src/routes/agents/kyc
src/routes/agents/wallet
src/services/agents
src/tools/agents


Only create them if they do not already exist.

========================
2. CREATE ROUTES
========================
2.1 Create file:
src/routes/agents/index.ts


File contents:

index.ts
import { Router } from 'express';
import { registerAgent, verifyOtp, getDashboard, requestWithdrawal } from '../../services/agents/agent.service';
import { uploadKyc, listPendingKyc, reviewKyc } from './kyc/kyc.controller';
import { getPresignedUrl } from './kyc/kyc.controller';

const router = Router();

// onboarding
router.post('/register', registerAgent);
router.post('/verify-otp', verifyOtp);

// dashboard
router.get('/:agentId/dashboard', getDashboard);

// withdrawals
router.post('/:agentId/withdraw', requestWithdrawal);

// KYC
router.post('/kyc/upload', uploadKyc);
router.get('/kyc/pending', listPendingKyc);
router.post('/kyc/:kycId/review', reviewKyc);
router.get('/kyc/presign', getPresignedUrl);

export default router;

========================
3. AGENT SERVICE LAYER
========================

Create file:

src/services/agents/agent.service.ts


Add full implementation:

import prisma from '../../../prisma/client';
import { sendOtp, verifyOtpCode } from '../../tools/agents/otp.tool';
import { sendSms } from '../../tools/agents/notification.tool';
import WalletService from './agent-wallet.service';
import ReferralService from './agent-referral.service';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

export async function registerAgent(req, res) {
  try {
    const { name, phone, email, referralCode } = req.body;

    const exists = await prisma.agent.findUnique({ where: { phone } });
    if (exists) return res.status(400).json({ error: 'Phone already registered' });

    const agent = await prisma.agent.create({
      data: {
        name,
        phone,
        email,
        referralCode: generateReferralCode(name),
      },
    });

    if (referralCode) {
      await ReferralService.linkReferral(agent.id, referralCode);
    }

    await WalletService.createWallet(agent.id);
    await prisma.kYCVerification.create({ data: { agentId: agent.id } });

    await sendOtp(phone);
    await sendSms(phone, `Your TransConnect OTP code has been sent.`);

    return res.status(201).json({ agent, next_step: 'verify_phone' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

export async function verifyOtp(req, res) {
  try {
    const { phone, otp } = req.body;

    const ok = await verifyOtpCode(phone, otp);
    if (!ok) return res.status(400).json({ error: 'Invalid OTP' });

    const agent = await prisma.agent.findUnique({ where: { phone } });
    if (!agent) return res.status(404).json({ error: 'Agent not found' });

    await prisma.agent.update({
      where: { id: agent.id },
      data: { status: 'verified' },
    });

    const token = jwt.sign({ sub: agent.id, type: 'agent' }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function getDashboard(req, res) {
  try {
    const { agentId } = req.params;

    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
      include: { wallet: true },
    });

    if (!agent) return res.status(404).json({ error: 'Not found' });

    const pendingCommissions = await prisma.commission.findMany({
      where: { agentId, status: 'paid' },
    });

    const downline = await ReferralService.getDownline(agentId, 3);

    res.json({
      agent,
      wallet: agent.wallet,
      pendingCommissions,
      downline,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function requestWithdrawal(req, res) {
  try {
    const { agentId } = req.params;
    const { amount } = req.body;

    const wallet = await prisma.agentWallet.findUnique({ where: { agentId } });
    if (!wallet) return res.status(400).json({ error: 'Wallet not found' });
    if (wallet.balance < amount) return res.status(400).json({ error: 'Insufficient balance' });

    const withdrawal = await prisma.withdrawal.create({
      data: { agentId, amount },
    });

    await prisma.agentTransaction.create({
      data: {
        walletId: wallet.id,
        type: 'withdrawal_pending',
        amount: -amount,
      },
    });

    await prisma.agentWallet.update({
      where: { agentId },
      data: { balance: { decrement: amount } },
    });

    res.json(withdrawal);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

function generateReferralCode(name: string) {
  return (
    name.replace(/\s+/g, '').substring(0, 4).toUpperCase() +
    Math.floor(1000 + Math.random() * 9000)
  );
}

========================
4. WALLET SERVICES
========================

Create file:

src/services/agents/agent-wallet.service.ts


Add:

import prisma from '../../../prisma/client';

class WalletService {
  static async createWallet(agentId: string) {
    return prisma.agentWallet.create({ data: { agentId } });
  }

  static async credit(agentId: string, amount: number) {
    const wallet = await prisma.agentWallet.findUnique({ where: { agentId } });
    if (!wallet) throw new Error('Wallet not found');

    await prisma.agentTransaction.create({
      data: {
        walletId: wallet.id,
        type: 'credit',
        amount,
      },
    });

    await prisma.agentWallet.update({
      where: { agentId },
      data: { balance: { increment: amount } },
    });
  }

  static async debit(agentId: string, amount: number) {
    const wallet = await prisma.agentWallet.findUnique({ where: { agentId } });
    if (!wallet) throw new Error('Wallet not found');

    if (wallet.balance < amount) throw new Error('Insufficient funds');

    await prisma.agentTransaction.create({
      data: {
        walletId: wallet.id,
        type: 'debit',
        amount: -amount,
      },
    });

    await prisma.agentWallet.update({
      where: { agentId },
      data: { balance: { decrement: amount } },
    });
  }
}

export default WalletService;

========================
5. COMMISSION ENGINE
========================

Create file:

src/services/agents/agent-commission.service.ts


Add the full 3-level commission processor:

import prisma from '../../../prisma/client';
import WalletService from './agent-wallet.service';

const SPLITS = [10, 5, 2];

class CommissionService {
  static async process(agentId: string, amount: number, context?: any) {
    const agent = await prisma.agent.findUnique({ where: { id: agentId } });
    if (!agent || !agent.path) return;

    const uplines = agent.path.split('/').filter(Boolean).reverse();

    for (let i = 0; i < Math.min(3, uplines.length); i++) {
      const uplineId = uplines[i];
      const pct = SPLITS[i];
      const commissionAmount = Math.floor((amount * pct) / 100);

      if (commissionAmount <= 0) continue;

      await prisma.commission.create({
        data: {
          agentId: uplineId,
          fromAgentId: agentId,
          amount: commissionAmount,
          level: i + 1,
          status: 'paid',
        },
      });

      await WalletService.credit(uplineId, commissionAmount);
    }
  }
}

export default CommissionService;

========================
6. REFERRAL SERVICE
========================

Create:

src/services/agents/agent-referral.service.ts


Add:

import prisma from '../../../prisma/client';

class ReferralService {
  static async linkReferral(agentId: string, referralCode: string) {
    const referrer = await prisma.agent.findUnique({ where: { referralCode } });
    if (!referrer) return;

    await prisma.agent.update({
      where: { id: agentId },
      data: { referredById: referrer.id },
    });

    await prisma.referral.create({
      data: {
        agentId: referrer.id,
        referredId: agentId,
        level: 1,
      },
    });
  }

  static async getDownline(agentId: string, depth = 3) {
    const result = [];

    async function walk(id: string, level: number) {
      if (level > depth) return;

      const refs = await prisma.referral.findMany({ where: { agentId: id } });
      for (const r of refs) {
        result.push({ level, agent: r.referredId });
        await walk(r.referredId, level + 1);
      }
    }

    await walk(agentId, 1);
    return result;
  }
}

export default ReferralService;

========================
7. KYC MODULE
========================

Create:

src/routes/agents/kyc/kyc.controller.ts


And implement the upload, list, review, and presigned URL endpoints.

(Claude will generate this from the Toolkit spec.)

========================
8. UTILITIES
========================

Create these:

src/tools/agents/otp.tool.ts
src/tools/agents/notification.tool.ts
src/tools/agents/s3.tool.ts


Use the exact logic from the Agent Toolkit document.

========================
9. UPDATE index.ts
========================

Modify:

src/index.ts


Add:

import agentRoutes from './routes/agents';
app.use('/agents', agentRoutes);


Place it with the other route registrations.

========================
10. UPDATE PRISMA SCHEMA
========================

Append all Prisma models exactly as defined in the Agent Toolkit canvas:

Agent

AgentProfile

AgentWallet

AgentTransaction

KYCVerification

Referral

Commission

Withdrawal

========================
11. FORMAT & MIGRATE
========================

Run:

npx prisma format
npx prisma migrate dev --name agent_onboarding

========================
12. UPDATE ENVIRONMENT
========================

Add to:

transconnect-backend/.env


Variables:

UPLOAD_BUCKET=transconnect-agents
AWS_REGION=us-east-1
OTP_EXPIRY=300
REFERRAL_PERCENTAGES=10,5,2
SMS_API_KEY=
EMAIL_API_KEY=

🟩 END OF MASTER COMMAND PACK — STOP COPYING HERE