import { prisma } from '../../index';
import { sendOtp, verifyOtpCode } from '../../tools/agents/otp.tool';
import SMSService from '../sms.service';
import MultiProviderSMSService from '../multi-provider-sms.service';
import EmailOTPService from '../email-otp.service';
import WalletService from './agent-wallet.service';
import ReferralService from './agent-referral.service';
import jwt from 'jsonwebtoken';
import { Request, Response } from 'express';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

export async function registerAgent(req: Request, res: Response) {
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

    const otpResult = await sendOtp(phone);
    
    // Send OTP via intelligent SMS routing (eSMS Africa for African numbers, Twilio for others)
    const smsService = MultiProviderSMSService.getInstance();
    const smsResult = await smsService.sendOTP(phone, otpResult.otp, 'registration');
    
    console.log(`📱 SMS Result: ${smsResult.success ? '✅' : '❌'} via ${smsResult.provider}`);
    if (smsResult.cost) console.log(`💰 Estimated cost: ${smsResult.cost}`);
    if (smsResult.fallbackUsed) console.log('🔄 Fallback provider was used');

    // If SMS fails and agent has email, send email backup
    if (!smsResult.success && email) {
      console.log('📧 SMS failed, sending email backup...');
      const emailService = EmailOTPService.getInstance();
      const emailResult = await emailService.sendOTP({
        email,
        otp: otpResult.otp,
        agentName: name,
        type: 'registration'
      });
      
      if (emailResult.success) {
        console.log('✅ Email OTP sent as backup');
      } else {
        console.log('❌ Both SMS and Email failed:', emailResult.error);
      }
    }

    return res.status(201).json({ agent, next_step: 'verify_phone' });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

export async function verifyOtp(req: Request, res: Response) {
  try {
    const { phone, otp } = req.body;

    const ok = await verifyOtpCode(phone, otp);
    if (!ok) return res.status(400).json({ error: 'Invalid OTP' });

    const agent = await prisma.agent.findUnique({ where: { phone } });
    if (!agent) return res.status(404).json({ error: 'Agent not found' });

    await prisma.agent.update({
      where: { id: agent.id },
      data: { status: 'VERIFIED' },
    });

    const token = jwt.sign({ sub: agent.id, type: 'agent' }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function getDashboard(req: Request, res: Response) {
  try {
    const { agentId } = req.params;

    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
      include: { wallet: true },
    });

    if (!agent) return res.status(404).json({ error: 'Not found' });

    const pendingCommissions = await prisma.commission.findMany({
      where: { agentId, status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    const downline = await ReferralService.getDownline(agentId, 3);

    // Calculate monthly earnings (commissions paid this month)
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthlyCommissions = await prisma.commission.findMany({
      where: { 
        agentId, 
        status: 'PAID',
        paidAt: { gte: startOfMonth }
      }
    });

    const monthlyEarnings = monthlyCommissions.reduce((sum, commission) => sum + commission.amount, 0);

    // Calculate weekly earnings (commissions paid this week)
    const startOfWeek = new Date();
    const dayOfWeek = startOfWeek.getDay();
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Monday as start of week
    startOfWeek.setDate(startOfWeek.getDate() - daysToSubtract);
    startOfWeek.setHours(0, 0, 0, 0);

    const weeklyCommissions = await prisma.commission.findMany({
      where: { 
        agentId, 
        status: 'PAID',
        paidAt: { gte: startOfWeek }
      }
    });

    const weeklyEarnings = weeklyCommissions.reduce((sum, commission) => sum + commission.amount, 0);

    // Get operator stats for this agent
    const managedOperators = await prisma.operator.findMany({
      where: { agentId },
      include: { routes: true }
    });

    const operatorStats = {
      operators: managedOperators.length,
      routes: managedOperators.reduce((sum, operator) => sum + operator.routes.length, 0)
    };

    res.json({
      agent,
      wallet: agent.wallet,
      pendingCommissions,
      downline,
      monthlyEarnings,
      weeklyEarnings,
      operatorStats,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function loginAgent(req: Request, res: Response) {
  try {
    const { phone } = req.body;

    // Check if agent exists
    const agent = await prisma.agent.findUnique({ where: { phone } });
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found. Please register first.' });
    }

    // Send OTP
    const otpResult = await sendOtp(phone);
    
    // Send OTP via intelligent SMS routing (eSMS Africa for African numbers, Twilio for others)
    const smsService = MultiProviderSMSService.getInstance();
    const smsResult = await smsService.sendOTP(phone, otpResult.otp, 'login');
    
    console.log(`📱 SMS Result: ${smsResult.success ? '✅' : '❌'} via ${smsResult.provider}`);
    if (smsResult.cost) console.log(`💰 Estimated cost: ${smsResult.cost}`);
    if (smsResult.fallbackUsed) console.log('🔄 Fallback provider was used');

    // If SMS fails and agent has email, send email backup
    if (!smsResult.success && agent.email) {
      console.log('📧 SMS failed, sending email backup...');
      const emailService = EmailOTPService.getInstance();
      const emailResult = await emailService.sendOTP({
        email: agent.email,
        otp: otpResult.otp,
        agentName: agent.name,
        type: 'login'
      });
      
      if (emailResult.success) {
        console.log('✅ Email OTP sent as backup');
      } else {
        console.log('❌ Both SMS and Email failed:', emailResult.error);
      }
    }

    return res.status(200).json({ 
      message: 'OTP sent successfully',
      next_step: 'verify_login_otp'
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ error: err.message });
  }
}

export async function verifyLoginOtp(req: Request, res: Response) {
  try {
    const { phone, otp } = req.body;

    // Verify OTP
    const ok = await verifyOtpCode(phone, otp);
    if (!ok) return res.status(400).json({ error: 'Invalid or expired OTP' });

    // Find agent
    const agent = await prisma.agent.findUnique({ where: { phone } });
    if (!agent) return res.status(404).json({ error: 'Agent not found' });

    // Update agent status to VERIFIED if not already and mark as online
    let updatedAgent = agent;
    const updateData: any = {
      isOnline: true,
      lastActiveAt: new Date(),
      lastLoginAt: new Date(),
    };
    
    if (agent.status === 'PENDING') {
      updateData.status = 'VERIFIED';
    }
    
    updatedAgent = await prisma.agent.update({
      where: { id: agent.id },
      data: updateData
    });

    // Generate new JWT token
    const token = jwt.sign({ sub: agent.id, type: 'agent' }, JWT_SECRET, { expiresIn: '7d' });
    
    res.json({ 
      token, 
      agentId: updatedAgent.id,
      agent: {
        id: updatedAgent.id,
        name: updatedAgent.name,
        phone: updatedAgent.phone,
        email: updatedAgent.email,
        status: updatedAgent.status
      }
    });
  } catch (err: any) {
    console.error('Login verification error:', err);
    res.status(500).json({ error: err.message });
  }
}

export async function requestWithdrawal(req: Request, res: Response) {
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
        type: 'WITHDRAWAL_PENDING',
        amount: -amount,
      },
    });

    await prisma.agentWallet.update({
      where: { agentId },
      data: { balance: { decrement: amount } },
    });

    res.json(withdrawal);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function getAllAgents(req: Request, res: Response) {
  try {
    // Get agents with basic data
    const agents = await prisma.agent.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Get wallet data separately
    const wallets = await prisma.agentWallet.findMany({
      where: {
        agentId: {
          in: agents.map(a => a.id)
        }
      }
    });

    // Get operator counts separately
    const operatorCounts = await Promise.all(
      agents.map(async (agent) => {
        const managedOpsCount = await prisma.operator.count({
          where: { agentId: agent.id }
        });
        const agentOpsCount = await prisma.agentOperator.count({
          where: { agentId: agent.id }
        });
        const commissionsCount = await prisma.commission.count({
          where: { agentId: agent.id }
        });
        return {
          agentId: agent.id,
          operatorsCount: managedOpsCount + agentOpsCount,
          commissionsCount
        };
      })
    );

    // Transform data for admin view
    const agentsWithStats = agents.map(agent => {
      const wallet = wallets.find(w => w.agentId === agent.id);
      const counts = operatorCounts.find(c => c.agentId === agent.id);
      
      return {
        id: agent.id,
        name: agent.name,
        phone: agent.phone,
        email: agent.email,
        status: agent.status,
        referralCode: agent.referralCode,
        createdAt: agent.createdAt,
        updatedAt: agent.updatedAt,
        walletBalance: wallet?.balance || 0,
        operatorsCount: counts?.operatorsCount || 0,
        commissionsCount: counts?.commissionsCount || 0,
        totalEarnings: agent.totalEarnings || 0,
        // Add online status fields for admin dashboard
        isOnline: agent.isOnline || false,
        lastActiveAt: agent.lastActiveAt,
        lastLoginAt: agent.lastLoginAt
      };
    });

    // Calculate online count
    const onlineCount = agents.filter(a => a.isOnline).length;

    res.json({
      agents: agentsWithStats,
      total: agents.length,
      online: onlineCount, // Add online count for admin dashboard
      byStatus: {
        PENDING: agents.filter(a => a.status === 'PENDING').length,
        VERIFIED: agents.filter(a => a.status === 'VERIFIED').length,
        APPROVED: agents.filter(a => a.status === 'APPROVED').length,
        SUSPENDED: agents.filter(a => a.status === 'SUSPENDED').length,
        INACTIVE: agents.filter(a => a.status === 'INACTIVE').length
      }
    });
  } catch (err: any) {
    console.error('Get all agents error:', err);
    res.status(500).json({ error: err.message });
  }
}

export async function updateAgentStatus(req: Request, res: Response) {
  try {
    const { agentId } = req.params;
    const { status, reason } = req.body;

    const agent = await prisma.agent.findUnique({ where: { id: agentId } });
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    const updatedAgent = await prisma.agent.update({
      where: { id: agentId },
      data: { 
        status,
        updatedAt: new Date()
      }
    });

    // Log the status change
    console.log(`Agent ${agent.name} status changed from ${agent.status} to ${status}. Reason: ${reason || 'N/A'}`);

    res.json({
      message: 'Agent status updated successfully',
      agent: {
        id: updatedAgent.id,
        name: updatedAgent.name,
        phone: updatedAgent.phone,
        email: updatedAgent.email,
        status: updatedAgent.status,
        updatedAt: updatedAgent.updatedAt
      }
    });
  } catch (err: any) {
    console.error('Update agent status error:', err);
    res.status(500).json({ error: err.message });
  }
}

function generateReferralCode(name: string) {
  return (
    name.replace(/\s+/g, '').substring(0, 4).toUpperCase() +
    Math.floor(1000 + Math.random() * 9000)
  );
}