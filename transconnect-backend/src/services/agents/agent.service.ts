import { prisma } from '../../index';
import { sendOtp, verifyOtpCode } from '../../tools/agents/otp.tool';
import SMSService from '../sms.service';
import MultiProviderSMSService from '../multi-provider-sms.service';
import EmailOTPService from '../email-otp.service';
import WalletService from './agent-wallet.service';
import ReferralService from './agent-referral.service';
import { PhoneNormalizer } from '../../utils/phone-normalizer';
import jwt from 'jsonwebtoken';
import { Request, Response } from 'express';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

export async function registerAgent(req: Request, res: Response) {
  try {
    const { name, phone, email, referralCode } = req.body;

    // Normalize phone number
    const phoneValidation = PhoneNormalizer.normalize(phone, 'UG'); // Default to Uganda
    
    if (!phoneValidation.isValid) {
      console.log(`❌ Invalid phone number: ${phone}`);
      console.log(`   Issues: ${phoneValidation.issues?.join(', ')}`);
      return res.status(400).json({ 
        error: 'Invalid phone number format',
        details: phoneValidation.issues,
        expected: 'Use formats like: +256700123456, 0700123456, or 700123456'
      });
    }

    const normalizedPhone = phoneValidation.normalizedNumber!;
    console.log(`📱 Phone normalized: "${phone}" → "${normalizedPhone}"`);
    
    if (phoneValidation.issues && phoneValidation.issues.length > 0) {
      console.log(`ℹ️  Normalization notes: ${phoneValidation.issues.join(', ')}`);
    }

    // Check for existing agent with normalized number
    const existingAgent = await prisma.agent.findUnique({ where: { phone: normalizedPhone } });
    
    if (existingAgent) {
      // If agent exists and is already VERIFIED, block registration
      if (existingAgent.status === 'VERIFIED' || existingAgent.status === 'APPROVED') {
        return res.status(400).json({ 
          error: 'Phone number already registered and verified',
          normalizedPhone,
          hint: 'Please use login instead',
          action: 'redirect_to_login'
        });
      }
      
      // If agent exists but is PENDING (never verified), allow re-registration
      // This handles the case where user registered but never got/verified OTP
      if (existingAgent.status === 'PENDING') {
        console.log(`🔄 Re-registration attempt for unverified agent: ${existingAgent.name}`);
        
        // Update existing agent with new registration data (in case they want to change name/email)
        const updatedAgent = await prisma.agent.update({
          where: { id: existingAgent.id },
          data: {
            name: name || existingAgent.name, // Use new name or keep existing
            email: email || existingAgent.email, // Use new email or keep existing
            // Keep existing referral code and other data
            updatedAt: new Date()
          },
        });

        console.log(`✅ Updated existing pending agent registration`);
        
        // Continue with OTP sending process for the updated agent
        const otpResult = await sendOtp(normalizedPhone);
        
        // Send OTP via intelligent SMS routing
        const smsService = MultiProviderSMSService.getInstance();
        const smsResult = await smsService.sendOTP(normalizedPhone, otpResult.otp, 'registration');
        
        console.log(`📱 Re-registration SMS Result: ${smsResult.success ? '✅' : '❌'} via ${smsResult.provider}`);
        if (smsResult.cost) console.log(`💰 Estimated cost: ${smsResult.cost}`);
        if (smsResult.fallbackUsed) console.log('🔄 Fallback provider was used');

        // If SMS fails and agent has email, send email backup
        let emailBackupSent = false;
        if (!smsResult.success && updatedAgent.email) {
          console.log('📧 SMS failed, sending email backup...');
          const emailService = EmailOTPService.getInstance();
          const emailResult = await emailService.sendOTP({
            email: updatedAgent.email,
            otp: otpResult.otp,
            agentName: updatedAgent.name,
            type: 'registration'
          });
          
          if (emailResult.success) {
            console.log('✅ Email OTP sent as backup');
            emailBackupSent = true;
          } else {
            console.log('❌ Both SMS and Email failed:', emailResult.error);
          }
        }

        return res.status(201).json({ 
          agent: updatedAgent, 
          message: smsResult.success 
            ? 'Registration updated, OTP sent via SMS'
            : emailBackupSent
              ? 'Registration updated, OTP sent to your email'
              : 'Registration updated, OTP sent',
          isReRegistration: true,
          next_step: 'verify_phone',
          delivery: {
            sms: smsResult.success,
            email: emailBackupSent,
            instruction: !smsResult.success && emailBackupSent 
              ? 'SMS delivery failed. Please check your email for the OTP code.'
              : smsResult.success
                ? 'OTP sent via SMS'
                : 'Please wait for OTP delivery'
          }
        });
      }

      // For any other status, block registration
      return res.status(400).json({ 
        error: `Phone number already registered with status: ${existingAgent.status}`,
        normalizedPhone,
        hint: 'Contact support if you need assistance',
        status: existingAgent.status
      });
    }

    // Create new agent
    const agent = await prisma.agent.create({
      data: {
        name,
        phone: normalizedPhone, // Use normalized phone number
        email,
        referralCode: generateReferralCode(name),
        status: 'PENDING' // Explicitly set as pending until OTP verification
      },
    });

    console.log(`✅ New agent created: ${agent.name} (${normalizedPhone})`);

    // Set up agent infrastructure
    if (referralCode) {
      await ReferralService.linkReferral(agent.id, referralCode);
    }

    await WalletService.createWallet(agent.id);
    await prisma.kYCVerification.create({ data: { agentId: agent.id } });

    const otpResult = await sendOtp(normalizedPhone);
    
    // Send OTP via intelligent SMS routing (eSMS Africa for African numbers, Twilio for others)
    const smsService = MultiProviderSMSService.getInstance();
    const smsResult = await smsService.sendOTP(normalizedPhone, otpResult.otp, 'registration');
    
    console.log(`📱 SMS Result: ${smsResult.success ? '✅' : '❌'} via ${smsResult.provider}`);
    if (smsResult.cost) console.log(`💰 Estimated cost: ${smsResult.cost}`);
    if (smsResult.fallbackUsed) console.log('🔄 Fallback provider was used');

    // If SMS fails and agent has email, send email backup
    let emailBackupSent = false;
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
        emailBackupSent = true;
      } else {
        console.log('❌ Both SMS and Email failed:', emailResult.error);
      }
    }

    return res.status(201).json({ 
      agent, 
      next_step: 'verify_phone',
      message: smsResult.success 
        ? 'Registration successful, OTP sent via SMS'
        : emailBackupSent
          ? 'Registration successful, OTP sent to your email'
          : 'Registration successful, OTP sent',
      delivery: {
        sms: smsResult.success,
        email: emailBackupSent,
        instruction: !smsResult.success && emailBackupSent 
          ? 'SMS delivery failed. Please check your email for the OTP code.'
          : smsResult.success
            ? 'OTP sent via SMS'
            : 'Please wait for OTP delivery'
      }
    });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

export async function verifyOtp(req: Request, res: Response) {
  try {
    const { phone, otp } = req.body;

    // Normalize phone number for verification
    const phoneValidation = PhoneNormalizer.normalize(phone, 'UG');
    const normalizedPhone = phoneValidation.isValid ? phoneValidation.normalizedNumber! : phone;
    
    console.log(`📱 OTP verification for: "${phone}" → "${normalizedPhone}"`);

    const ok = await verifyOtpCode(normalizedPhone, otp);
    if (!ok) return res.status(400).json({ error: 'Invalid or expired OTP' });

    const agent = await prisma.agent.findUnique({ where: { phone: normalizedPhone } });
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

    // Normalize phone number
    const phoneValidation = PhoneNormalizer.normalize(phone, 'UG');
    
    if (!phoneValidation.isValid) {
      return res.status(400).json({ 
        error: 'Invalid phone number format',
        details: phoneValidation.issues,
        expected: 'Use formats like: +256700123456, 0700123456, or 700123456'
      });
    }

    const normalizedPhone = phoneValidation.normalizedNumber!;
    console.log(`📱 Login phone normalized: "${phone}" → "${normalizedPhone}"`);

    // Check if agent exists with normalized number
    const agent = await prisma.agent.findUnique({ where: { phone: normalizedPhone } });
    if (!agent) {
      return res.status(404).json({ 
        error: 'Agent not found. Please register first.',
        hint: 'Make sure you use the same phone number format you registered with'
      });
    }

    // Send OTP
    const otpResult = await sendOtp(normalizedPhone);
    
    // Send OTP via intelligent SMS routing (eSMS Africa for African numbers, Twilio for others)
    const smsService = MultiProviderSMSService.getInstance();
    const smsResult = await smsService.sendOTP(normalizedPhone, otpResult.otp, 'login');
    
    console.log(`📱 SMS Result: ${smsResult.success ? '✅' : '❌'} via ${smsResult.provider}`);
    if (smsResult.cost) console.log(`💰 Estimated cost: ${smsResult.cost}`);
    if (smsResult.fallbackUsed) console.log('🔄 Fallback provider was used');

    // If SMS fails and agent has email, send email backup
    let emailBackupSent = false;
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
        emailBackupSent = true;
      } else {
        console.log('❌ Both SMS and Email failed:', emailResult.error);
      }
    }

    return res.status(200).json({ 
      message: smsResult.success 
        ? 'OTP sent via SMS'
        : emailBackupSent
          ? 'OTP sent to your email'
          : 'OTP sent successfully',
      next_step: 'verify_login_otp',
      delivery: {
        sms: smsResult.success,
        email: emailBackupSent,
        instruction: !smsResult.success && emailBackupSent 
          ? 'SMS delivery failed. Please check your email for the OTP code.'
          : smsResult.success
            ? 'OTP sent via SMS'
            : 'Please wait for OTP delivery'
      }
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ error: err.message });
  }
}

export async function verifyLoginOtp(req: Request, res: Response) {
  try {
    const { phone, otp } = req.body;

    // Normalize phone number for verification
    const phoneValidation = PhoneNormalizer.normalize(phone, 'UG');
    const normalizedPhone = phoneValidation.isValid ? phoneValidation.normalizedNumber! : phone;
    
    console.log(`📱 Login OTP verification for: "${phone}" → "${normalizedPhone}"`);

    // Verify OTP
    const ok = await verifyOtpCode(normalizedPhone, otp);
    if (!ok) return res.status(400).json({ error: 'Invalid or expired OTP' });

    // Find agent
    const agent = await prisma.agent.findUnique({ where: { phone: normalizedPhone } });
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

export async function resendRegistrationOtp(req: Request, res: Response) {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    // Normalize phone number
    const phoneValidation = PhoneNormalizer.normalize(phone, 'UG');
    
    if (!phoneValidation.isValid) {
      return res.status(400).json({ 
        error: 'Invalid phone number format',
        details: phoneValidation.issues,
        expected: 'Use formats like: +256700123456, 0700123456, or 700123456'
      });
    }

    const normalizedPhone = phoneValidation.normalizedNumber!;
    console.log(`📱 Resend registration OTP for: "${phone}" → "${normalizedPhone}"`);

    // Check if agent exists and is not yet verified
    const agent = await prisma.agent.findUnique({ where: { phone: normalizedPhone } });
    if (!agent) {
      return res.status(404).json({ 
        error: 'Agent not found. Please register first.',
        hint: 'Make sure you use the same phone number you registered with'
      });
    }

    if (agent.status === 'VERIFIED') {
      return res.status(400).json({ 
        error: 'Agent already verified. Please login instead.',
        redirect: 'login'
      });
    }

    // Generate new OTP
    const otpResult = await sendOtp(normalizedPhone);
    
    // Send OTP via intelligent SMS routing
    const smsService = MultiProviderSMSService.getInstance();
    const smsResult = await smsService.sendOTP(normalizedPhone, otpResult.otp, 'registration');
    
    console.log(`📱 Resend SMS Result: ${smsResult.success ? '✅' : '❌'} via ${smsResult.provider}`);
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
        type: 'registration'
      });
      
      if (emailResult.success) {
        console.log('✅ Email OTP sent as backup');
        return res.status(200).json({ 
          message: 'OTP sent to your email',
          method: 'email',
          email: agent.email.replace(/(.{2}).*(@.*)/, '$1***$2'), // Mask email
          next_step: 'check_email_and_verify',
          delivery: {
            sms: false,
            email: true,
            instruction: 'SMS delivery failed. Please check your email for the OTP code.'
          }
        });
      } else {
        console.log('❌ Both SMS and Email failed:', emailResult.error);
        return res.status(500).json({
          error: 'Failed to send OTP via SMS and email',
          details: {
            sms: smsResult.error,
            email: emailResult.error
          },
          message: 'Unable to deliver OTP via SMS or email. Please try again or contact support.'
        });
      }
    }

    if (smsResult.success) {
      return res.status(200).json({ 
        message: 'OTP resent via SMS',
        method: 'sms',
        provider: smsResult.provider,
        cost: smsResult.cost,
        next_step: 'verify_phone',
        delivery: {
          sms: true,
          email: false,
          instruction: 'OTP sent via SMS'
        }
      });
    } else {
      return res.status(500).json({
        error: 'Failed to resend OTP',
        details: smsResult.error,
        message: 'Unable to send OTP via SMS. Please try again or contact support.'
      });
    }

  } catch (err: any) {
    console.error('Resend registration OTP error:', err);
    res.status(500).json({ error: err.message });
  }
}

export async function checkRegistrationStatus(req: Request, res: Response) {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    // Normalize phone number
    const phoneValidation = PhoneNormalizer.normalize(phone, 'UG');
    
    if (!phoneValidation.isValid) {
      return res.status(400).json({ 
        error: 'Invalid phone number format',
        details: phoneValidation.issues,
        expected: 'Use formats like: +256700123456, 0700123456, or 700123456'
      });
    }

    const normalizedPhone = phoneValidation.normalizedNumber!;
    console.log(`🔍 Checking registration status for: "${phone}" → "${normalizedPhone}"`);

    // Check if agent exists
    const agent = await prisma.agent.findUnique({ where: { phone: normalizedPhone } });

    if (!agent) {
      return res.status(200).json({
        exists: false,
        message: 'Phone number not registered',
        action: 'register',
        normalizedPhone
      });
    }

    // Return status information
    const statusInfo = {
      exists: true,
      status: agent.status,
      name: agent.name,
      email: agent.email ? agent.email.replace(/(.{2}).*(@.*)/, '$1***$2') : null, // Mask email
      createdAt: agent.createdAt,
      updatedAt: agent.updatedAt,
      normalizedPhone
    };

    // Provide action guidance based on status
    let action = '';
    let message = '';

    switch (agent.status) {
      case 'PENDING':
        action = 'verify_or_resend_otp';
        message = 'Registration started but not verified. You can resend OTP or try registering again.';
        break;
      case 'VERIFIED':
        action = 'login';
        message = 'Agent verified. Please login to continue.';
        break;
      case 'APPROVED':
        action = 'login';
        message = 'Agent approved and active. Please login.';
        break;
      case 'SUSPENDED':
        action = 'contact_support';
        message = 'Agent account suspended. Please contact support.';
        break;
      case 'INACTIVE':
        action = 'contact_support';
        message = 'Agent account inactive. Please contact support.';
        break;
      default:
        action = 'contact_support';
        message = 'Unknown agent status. Please contact support.';
    }

    res.status(200).json({
      ...statusInfo,
      action,
      message
    });

  } catch (err: any) {
    console.error('Check registration status error:', err);
    res.status(500).json({ error: err.message });
  }
}

export async function resendLoginOtp(req: Request, res: Response) {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    // Normalize phone number
    const phoneValidation = PhoneNormalizer.normalize(phone, 'UG');
    
    if (!phoneValidation.isValid) {
      return res.status(400).json({ 
        error: 'Invalid phone number format',
        details: phoneValidation.issues,
        expected: 'Use formats like: +256700123456, 0700123456, or 700123456'
      });
    }

    const normalizedPhone = phoneValidation.normalizedNumber!;
    console.log(`📱 Resend login OTP for: "${phone}" → "${normalizedPhone}"`);

    // Check if agent exists
    const agent = await prisma.agent.findUnique({ where: { phone: normalizedPhone } });
    if (!agent) {
      return res.status(404).json({ 
        error: 'Agent not found. Please register first.',
        hint: 'Make sure you use the same phone number you registered with',
        redirect: 'register'
      });
    }

    // Generate new OTP
    const otpResult = await sendOtp(normalizedPhone);
    
    // Send OTP via intelligent SMS routing
    const smsService = MultiProviderSMSService.getInstance();
    const smsResult = await smsService.sendOTP(normalizedPhone, otpResult.otp, 'login');
    
    console.log(`📱 Resend Login SMS Result: ${smsResult.success ? '✅' : '❌'} via ${smsResult.provider}`);
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
        return res.status(200).json({ 
          message: 'OTP sent to your email',
          method: 'email',
          email: agent.email.replace(/(.{2}).*(@.*)/, '$1***$2'), // Mask email
          next_step: 'check_email_and_verify',
          delivery: {
            sms: false,
            email: true,
            instruction: 'SMS delivery failed. Please check your email for the OTP code.'
          }
        });
      } else {
        console.log('❌ Both SMS and Email failed:', emailResult.error);
        return res.status(500).json({
          error: 'Failed to send OTP via SMS and email',
          details: {
            sms: smsResult.error,
            email: emailResult.error
          },
          message: 'Unable to deliver OTP via SMS or email. Please try again or contact support.'
        });
      }
    }

    if (smsResult.success) {
      return res.status(200).json({ 
        message: 'Login OTP resent via SMS',
        method: 'sms',
        provider: smsResult.provider,
        cost: smsResult.cost,
        next_step: 'verify_login_otp',
        delivery: {
          sms: true,
          email: false,
          instruction: 'OTP sent via SMS'
        }
      });
    } else {
      return res.status(500).json({
        error: 'Failed to resend login OTP',
        details: smsResult.error,
        message: 'Unable to send OTP via SMS. Please try again or contact support.'
      });
    }

  } catch (err: any) {
    console.error('Resend login OTP error:', err);
    res.status(500).json({ error: err.message });
  }
}

function generateReferralCode(name: string) {
  return (
    name.replace(/\s+/g, '').substring(0, 4).toUpperCase() +
    Math.floor(1000 + Math.random() * 9000)
  );
}