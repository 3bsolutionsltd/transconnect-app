import { Router } from 'express';
import { authenticateToken, requireRole } from '../../middleware/auth';
import EmailOTPService from '../../services/email-otp.service';
import MultiProviderSMSService from '../../services/multi-provider-sms.service';
import { FirebaseService } from '../../services/firebase.service';
import { prisma } from '../../lib/prisma';

const router = Router();

const hasAny = (...values: Array<string | undefined>) => values.some((value) => Boolean(value && value.trim()));

router.get('/auth-notifications', authenticateToken, requireRole(['ADMIN']), async (_req, res) => {
  try {
    const nodeEnv = process.env.NODE_ENV || 'development';
    const demoMode = nodeEnv !== 'production' || process.env.DEMO_MODE === 'true';
    const otpExpirySeconds = parseInt(process.env.OTP_EXPIRY || '600', 10);

    const emailOtp = EmailOTPService.getInstance();
    const smsService = MultiProviderSMSService.getInstance();
    const firebaseService = FirebaseService.getInstance();

    const smtpConfigured = hasAny(process.env.SMTP_HOST) && hasAny(process.env.SMTP_USER) && hasAny(process.env.SMTP_PASS);
    const smsStatus = smsService.getProviderStatus();
    const pushConfigured = firebaseService.isFirebaseConfigured();

    const adminEmailTarget = process.env.ADMIN_NOTIFICATION_EMAIL || process.env.SUPPORT_EMAIL || process.env.SMTP_FROM || '';
    const adminNotificationConfigured = hasAny(adminEmailTarget);

    const risks: string[] = [];
    if (demoMode) {
      risks.push('DEMO_MODE or non-production environment detected. OTP defaults may use fixed values and do not represent production behavior.');
    }
    if (nodeEnv === 'production') {
      risks.push('OTP storage is in-memory. OTP verification may fail across restarts or multiple instances until Redis/DB-backed storage is implemented.');
    }
    if (!smtpConfigured) {
      risks.push('SMTP credentials are incomplete. Email verification and email notifications will not be delivered.');
    }
    if (!smsService.isReady()) {
      risks.push('No SMS provider is fully configured. Phone OTP delivery will fail in production.');
    }
    if (!adminNotificationConfigured) {
      risks.push('No admin notification email target configured. Workflow alerts to admins may be missed.');
    }

    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      environment: nodeEnv,
      auth: {
        emailSignup: {
          registerEndpoint: '/api/auth/register',
          verifyEndpoint: '/api/auth/verify-email-otp',
          resendEndpoint: '/api/auth/resend-email-verification',
          emailOtpConfigured: emailOtp.isReady(),
          smtpConfigured,
          emailOtpStatus: emailOtp.getStatus(),
        },
        phoneOtpSignupLogin: {
          requestEndpoint: '/api/auth/request-otp',
          verifyEndpoint: '/api/auth/verify-otp',
          otpExpirySeconds,
          demoMode,
          providerReady: smsService.isReady(),
          providerStatus: smsStatus,
          otpStore: {
            type: 'in-memory',
            productionSafe: false,
          },
        },
      },
      notifications: {
        channels: {
          email: {
            configured: smtpConfigured,
            from: process.env.SMTP_FROM || process.env.SMTP_USER || null,
          },
          sms: {
            configured: smsService.isReady(),
            providers: smsStatus,
          },
          push: {
            configured: pushConfigured,
            provider: 'firebase',
          },
          inApp: {
            configured: true,
          },
        },
        adminWorkflow: {
          adminEmailConfigured: adminNotificationConfigured,
          adminEmailTarget: adminEmailTarget || null,
          note: 'Ensure booking, payment, and incident workflows explicitly trigger admin notifications in route handlers/services.',
        },
      },
      risks,
    });
  } catch (error: any) {
    console.error('Auth/notification system health check failed:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to evaluate auth/notification health',
      details: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

router.post('/auth-notifications/test', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    const user = (req as any).user;
    const channel = (req.body?.channel || 'both') as 'email' | 'sms' | 'both';
    const requestedEmail = (req.body?.email || '').trim();
    const requestedPhone = (req.body?.phoneNumber || '').trim();

    if (!['email', 'sms', 'both'].includes(channel)) {
      return res.status(400).json({ error: 'Invalid channel. Use email, sms, or both.' });
    }

    const adminUser = await prisma.user.findUnique({
      where: { id: user?.id },
      select: { email: true, phone: true, firstName: true },
    });

    const emailTarget = requestedEmail || adminUser?.email || '';
    const phoneTarget = requestedPhone || adminUser?.phone || '';

    const emailOtp = EmailOTPService.getInstance();
    const smsService = MultiProviderSMSService.getInstance();

    const results: {
      email?: { success: boolean; messageId?: string; error?: string; target?: string };
      sms?: { success: boolean; messageId?: string; error?: string; provider?: string; target?: string };
    } = {};

    if (channel === 'email' || channel === 'both') {
      if (!emailTarget) {
        results.email = { success: false, error: 'No email target provided or found on admin user profile.' };
      } else {
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const emailResult = await emailOtp.sendOTP({
          email: emailTarget,
          otp,
          agentName: adminUser?.firstName || 'Admin',
          type: 'login',
        });
        results.email = {
          ...emailResult,
          target: emailTarget,
        };
      }
    }

    if (channel === 'sms' || channel === 'both') {
      if (!phoneTarget) {
        results.sms = { success: false, error: 'No phone target provided or found on admin user profile.' };
      } else {
        const smsResult = await smsService.sendTestSMS(phoneTarget);
        results.sms = {
          success: smsResult.success,
          messageId: smsResult.messageId,
          error: smsResult.error,
          provider: smsResult.provider,
          target: phoneTarget,
        };
      }
    }

    const overallSuccess = Object.values(results).every((item) => item?.success === true);

    return res.status(overallSuccess ? 200 : 207).json({
      success: overallSuccess,
      channel,
      results,
      message: overallSuccess
        ? 'Test notification(s) sent successfully.'
        : 'One or more test notifications failed. Review results.',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Auth/notification test send failed:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to send test notifications',
      details: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
