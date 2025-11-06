import { Router, Request, Response } from 'express';
import { prisma } from '../index';
import { authenticateToken } from '../middleware/auth';
import { body, validationResult } from 'express-validator';
import { PaymentMethod, PaymentStatus, Booking } from '@prisma/client';
import { 
  PaymentGatewayFactory, 
  PaymentError, 
  PaymentValidationError, 
  PaymentNetworkError,
  StandardPaymentRequest 
} from '../services/payment-gateway.factory';
import { NotificationService } from '../services/notification.service';
import QRCode from 'qrcode';
import crypto from 'crypto';

const router = Router();
const notificationService = NotificationService.getInstance();

// Initiate payment for a booking
router.post('/initiate', [
  authenticateToken,
  body('bookingId').notEmpty().withMessage('Booking ID is required'),
  body('method').isIn(['MTN_MOBILE_MONEY', 'AIRTEL_MONEY', 'FLUTTERWAVE', 'CASH']).withMessage('Valid payment method is required'),
  body('phoneNumber').optional().isMobilePhone('any').withMessage('Valid phone number is required for mobile money payments')
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { bookingId, method, phoneNumber } = req.body;
    const userId = (req as any).user.userId;

    // Verify booking exists and belongs to user
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        route: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true
          }
        }
      }
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.userId !== userId) {
      return res.status(403).json({ error: 'Not authorized for this booking' });
    }

    if (booking.status !== 'PENDING') {
      return res.status(400).json({ error: 'Booking is not in pending status' });
    }

    // Check if payment already exists
    const existingPayment = await prisma.payment.findFirst({
      where: {
        bookingId,
        status: { in: ['PENDING', 'COMPLETED'] }
      }
    });

    if (existingPayment) {
      return res.status(400).json({ error: 'Payment already initiated for this booking' });
    }

    // Check if demo mode is enabled (temporarily force enabled until env var is properly set)
    const demoMode = true; // TODO: Change back to process.env.PAYMENT_DEMO_MODE === 'true' when env var is set

    // Validate phone number for mobile money payments (skip in demo mode)
    if (!demoMode && PaymentGatewayFactory.isOnlinePayment(method as PaymentMethod)) {
      if (!phoneNumber) {
        return res.status(400).json({ error: 'Phone number is required for mobile money payments' });
      }

      const isValidPhone = await PaymentGatewayFactory.validatePaymentMethod(
        method as PaymentMethod, 
        phoneNumber, 
        'UG'
      );

      if (!isValidPhone) {
        return res.status(400).json({ 
          error: `Phone number is not registered for ${PaymentGatewayFactory.getMethodDisplayName(method as PaymentMethod)}` 
        });
      }
    }

    // Generate payment reference
    const paymentReference = `PAY${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        bookingId,
        userId,
        amount: booking.totalAmount,
        method: method as PaymentMethod,
        reference: paymentReference,
        status: 'PENDING',
        metadata: {
          phoneNumber,
          country: 'UG',
          currency: 'UGX'
        }
      }
    });

    let paymentResponse;

    try {
      if (method === 'CASH') {
        // For cash payments, just mark as pending for operator confirmation
        paymentResponse = {
          transactionId: paymentReference,
          status: 'PENDING' as const,
          checkoutUrl: undefined
        };
      } else if (demoMode) {
        // Demo mode: immediately complete payment for testing
        paymentResponse = {
          transactionId: paymentReference,
          status: 'SUCCESSFUL' as const,
          checkoutUrl: undefined
        };
        
        // Immediately update payment status for demo mode
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: 'COMPLETED',
            transactionId: paymentReference,
            metadata: {
              ...(payment.metadata as object || {}),
              demoModeCompleted: true,
              completedAt: new Date().toISOString()
            }
          }
        });
        
        // Update booking status
        await prisma.booking.update({
          where: { id: payment.bookingId },
          data: { status: 'CONFIRMED' }
        });
        
        // Generate QR code for the confirmed booking
        const qrCode = await generateBookingQRCode(payment.bookingId);
        
        console.log(`Demo payment ${payment.id} completed immediately${qrCode ? ' with QR code' : ''}`);
        
      } else {
        // Process online payment with actual provider
        const provider = PaymentGatewayFactory.getProvider(method as PaymentMethod);
        
        const paymentRequest: StandardPaymentRequest = {
          amount: booking.totalAmount,
          currency: 'UGX',
          reference: paymentReference,
          phoneNumber: phoneNumber || booking.user.phone || '',
          description: `Bus ticket: ${booking.route.origin} to ${booking.route.destination}`,
          country: 'UG'
        };

        paymentResponse = await provider.requestPayment(paymentRequest);

        // Update payment with provider response
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            transactionId: paymentResponse.transactionId,
            metadata: {
              ...(payment.metadata as object || {}),
              providerResponse: paymentResponse
            }
          }
        });
      }

      // Get the current payment status and booking (in case it was updated in demo mode)
      const currentPayment = await prisma.payment.findUnique({
        where: { id: payment.id }
      });

      // Get updated booking with QR code if payment completed
      let updatedBooking: (Booking & {
        route: {
          operator: any;
        } & any;
      }) | null = null;
      if (currentPayment?.status === 'COMPLETED') {
        updatedBooking = await prisma.booking.findUnique({
          where: { id: payment.bookingId },
          include: {
            route: {
              include: {
                operator: true
              }
            }
          }
        });
      }

      res.json({
        paymentId: payment.id,
        paymentReference,
        status: currentPayment?.status || payment.status,
        provider: PaymentGatewayFactory.getMethodDisplayName(method as PaymentMethod),
        transactionId: paymentResponse.transactionId,
        checkoutUrl: paymentResponse.checkoutUrl,
        message: demoMode && currentPayment?.status === 'COMPLETED' 
          ? 'Demo payment completed successfully' 
          : (paymentResponse.reason || 'Payment initiated successfully'),
        qrCode: updatedBooking?.qrCode || null,
        bookingDetails: updatedBooking ? {
          id: updatedBooking.id,
          status: updatedBooking.status,
          qrCode: updatedBooking.qrCode
        } : null
      });
    } catch (error) {
      // Handle payment provider errors
      if (error instanceof PaymentError) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: 'FAILED',
            metadata: {
              ...(payment.metadata as object || {}),
              error: {
                code: error.code,
                message: error.message,
                provider: error.provider
              }
            }
          }
        });

        return res.status(400).json({
          error: error.message,
          code: error.code,
          retryable: error.retryable
        });
      }

      throw error; // Re-throw unexpected errors
    }
  } catch (error) {
    console.error('Error initiating payment:', error);
    res.status(500).json({ error: 'Failed to initiate payment' });
  }
});

// Verify payment status
router.get('/:paymentId/status', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { paymentId } = req.params;
    const userId = (req as any).user.userId;

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        booking: {
          select: {
            userId: true,
            status: true
          }
        }
      }
    });

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    if (payment.booking.userId !== userId) {
      return res.status(403).json({ error: 'Not authorized to view this payment' });
    }

    let currentStatus = payment.status;
    let statusMessage = 'Payment status checked';

    // For online payments, verify status with payment gateway
    if (PaymentGatewayFactory.isOnlinePayment(payment.method) && payment.transactionId) {
      try {
        const provider = PaymentGatewayFactory.getProvider(payment.method);
        
        const additionalData = payment.method === 'AIRTEL_MONEY' 
          ? { country: 'UG', currency: 'UGX' }
          : undefined;

        const gatewayStatus = await provider.getTransactionStatus(
          payment.transactionId, 
          additionalData
        );

        // Map provider status to our status
        let newStatus: PaymentStatus = payment.status;
        if (gatewayStatus.status === 'SUCCESSFUL') {
          newStatus = 'COMPLETED';
        } else if (gatewayStatus.status === 'FAILED') {
          newStatus = 'FAILED';
        }

        // Update payment status if changed
        if (newStatus !== payment.status) {
          await prisma.payment.update({
            where: { id: paymentId },
            data: {
              status: newStatus,
              metadata: {
                ...(payment.metadata as object || {}),
                lastStatusCheck: new Date().toISOString(),
                providerTransactionId: gatewayStatus.providerTransactionId
              }
            }
          });

          currentStatus = newStatus;

          // If payment completed, update booking status
          if (newStatus === 'COMPLETED') {
            const booking = await prisma.booking.update({
              where: { id: payment.bookingId },
              data: { status: 'CONFIRMED' },
              include: {
                user: true,
                route: true
              }
            });
            
            statusMessage = 'Payment completed successfully';
            
            // Generate QR code for the confirmed booking
            const qrCode = await generateBookingQRCode(payment.bookingId);
            console.log(`Payment ${payment.id} completed${qrCode ? ' with QR code generated' : ''}`);
            
            // Send payment success notification
            try {
              await notificationService.sendPaymentConfirmation({
                userId: payment.userId,
                bookingId: payment.bookingId,
                passengerName: `${booking.user.firstName} ${booking.user.lastName}`,
                amount: payment.amount,
                method: PaymentGatewayFactory.getMethodDisplayName(payment.method),
                transactionId: payment.transactionId || payment.reference || payment.id,
              });
            } catch (notificationError) {
              console.error('Error sending payment confirmation notification:', notificationError);
            }
          } else if (newStatus === 'FAILED') {
            const booking = await prisma.booking.update({
              where: { id: payment.bookingId },
              data: { status: 'CANCELLED' },
              include: {
                user: true
              }
            });
            
            statusMessage = 'Payment failed';
            
            // Send payment failed notification
            try {
              await notificationService.sendPaymentFailed({
                userId: payment.userId,
                bookingId: payment.bookingId,
                amount: payment.amount,
                method: PaymentGatewayFactory.getMethodDisplayName(payment.method),
                reason: gatewayStatus.message || 'Payment processing failed',
              });
            } catch (notificationError) {
              console.error('Error sending payment failed notification:', notificationError);
            }
          }
        }

        statusMessage = gatewayStatus.message || statusMessage;
      } catch (error) {
        console.error('Error checking payment status with provider:', error);
        // Continue with current status if provider check fails
        statusMessage = 'Unable to verify with payment provider';
      }
    }

    res.json({
      paymentId: payment.id,
      status: currentStatus,
      amount: payment.amount,
      method: payment.method,
      methodDisplayName: PaymentGatewayFactory.getMethodDisplayName(payment.method),
      reference: payment.reference,
      transactionId: payment.transactionId,
      createdAt: payment.createdAt,
      message: statusMessage
    });
  } catch (error) {
    console.error('Error checking payment status:', error);
    res.status(500).json({ error: 'Failed to check payment status' });
  }
});

// Webhook endpoint for payment gateway callbacks
router.post('/webhook/:gateway', async (req: Request, res: Response) => {
  try {
    const { gateway } = req.params;
    const webhookData = req.body;
    const signature = req.headers['x-signature'] || req.headers['authorization'] || '';

    console.log(`Received webhook from ${gateway}:`, {
      headers: req.headers,
      body: webhookData
    });

    // Get webhook secret for the specific gateway
    const webhookSecrets: Record<string, string> = {
      'mtn': process.env.MTN_WEBHOOK_SECRET || '',
      'airtel': process.env.AIRTEL_WEBHOOK_SECRET || '',
      'flutterwave': process.env.FLUTTERWAVE_WEBHOOK_SECRET || ''
    };

    const secret = webhookSecrets[gateway.toLowerCase()];
    if (!secret) {
      console.error(`No webhook secret configured for gateway: ${gateway}`);
      return res.status(500).json({ error: 'Webhook configuration error' });
    }

    // Verify webhook signature
    let isValidSignature = false;
    try {
      const provider = PaymentGatewayFactory.getProvider(getPaymentMethodFromGateway(gateway));
      const payload = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
      isValidSignature = provider.verifyWebhookSignature(payload, signature as string, secret);
    } catch (error) {
      console.error('Error verifying webhook signature:', error);
    }

    if (!isValidSignature) {
      console.error(`Invalid webhook signature for ${gateway}`);
      return res.status(401).json({ error: 'Invalid webhook signature' });
    }

    // Extract transaction information based on gateway
    const transactionInfo = extractTransactionInfo(gateway, webhookData);
    
    if (!transactionInfo.transactionId) {
      console.error(`No transaction ID found in ${gateway} webhook`);
      return res.status(400).json({ error: 'Invalid webhook data' });
    }

    // Find payment by transaction ID or reference
    const payment = await prisma.payment.findFirst({
      where: {
        OR: [
          { transactionId: transactionInfo.transactionId },
          { reference: transactionInfo.transactionId }
        ]
      },
      include: {
        booking: true
      }
    });

    if (!payment) {
      console.error(`Payment not found for transaction: ${transactionInfo.transactionId}`);
      return res.status(404).json({ error: 'Payment not found' });
    }

    // Map gateway status to our standard status
    const newStatus = mapGatewayStatusToPaymentStatus(gateway, transactionInfo.status);
    
    // Only update if status has changed
    if (newStatus !== payment.status) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: newStatus,
          metadata: {
            ...(payment.metadata as object || {}),
            webhookData: webhookData,
            webhookReceivedAt: new Date().toISOString(),
            providerTransactionId: transactionInfo.providerTransactionId
          }
        }
      });

      // Update booking status based on payment status
      let bookingStatus = payment.booking.status;
      if (newStatus === 'COMPLETED') {
        bookingStatus = 'CONFIRMED';
        
        // Send payment success notification via webhook
        try {
          const user = await prisma.user.findUnique({
            where: { id: payment.userId }
          });
          
          if (user) {
            await notificationService.sendPaymentConfirmation({
              userId: payment.userId,
              bookingId: payment.bookingId,
              passengerName: `${user.firstName} ${user.lastName}`,
              amount: payment.amount,
              method: PaymentGatewayFactory.getMethodDisplayName(payment.method),
              transactionId: transactionInfo.transactionId,
            });
          }
        } catch (notificationError) {
          console.error('Error sending webhook payment confirmation notification:', notificationError);
        }
      } else if (newStatus === 'FAILED') {
        bookingStatus = 'CANCELLED';
        
        // Send payment failed notification via webhook
        try {
          const user = await prisma.user.findUnique({
            where: { id: payment.userId }
          });
          
          if (user) {
            await notificationService.sendPaymentFailed({
              userId: payment.userId,
              bookingId: payment.bookingId,
              amount: payment.amount,
              method: PaymentGatewayFactory.getMethodDisplayName(payment.method),
              reason: transactionInfo.status === 'FAILED' ? 'Payment was declined' : 'Payment processing failed',
            });
          }
        } catch (notificationError) {
          console.error('Error sending webhook payment failed notification:', notificationError);
        }
      }

      if (bookingStatus !== payment.booking.status) {
        await prisma.booking.update({
          where: { id: payment.bookingId },
          data: { status: bookingStatus }
        });
      }

      console.log(`Payment ${payment.id} status updated: ${payment.status} -> ${newStatus}`);
    }

    // Log webhook for audit trail
    await prisma.webhookLog.create({
      data: {
        gateway,
        transactionId: transactionInfo.transactionId,
        paymentId: payment.id,
        status: transactionInfo.status,
        payload: webhookData,
        processedAt: new Date()
      }
    }).catch(error => {
      console.error('Error logging webhook:', error);
      // Don't fail webhook processing if logging fails
    });

    res.json({ 
      success: true, 
      message: 'Webhook processed successfully',
      paymentId: payment.id,
      status: newStatus
    });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Failed to process webhook' });
  }
});

// Helper functions for webhook processing
function getPaymentMethodFromGateway(gateway: string): PaymentMethod {
  const gatewayMap: Record<string, PaymentMethod> = {
    'mtn': 'MTN_MOBILE_MONEY',
    'airtel': 'AIRTEL_MONEY',
    'flutterwave': 'FLUTTERWAVE'
  };

  const method = gatewayMap[gateway.toLowerCase()];
  if (!method) {
    throw new Error(`Unknown gateway: ${gateway}`);
  }
  
  return method;
}

function extractTransactionInfo(gateway: string, webhookData: any): {
  transactionId: string;
  status: string;
  providerTransactionId?: string;
} {
  switch (gateway.toLowerCase()) {
    case 'mtn':
      return {
        transactionId: webhookData.referenceId || webhookData.externalId,
        status: webhookData.status || 'PENDING',
        providerTransactionId: webhookData.financialTransactionId
      };
    
    case 'airtel':
      return {
        transactionId: webhookData.transaction?.id || webhookData.data?.transaction?.id,
        status: webhookData.transaction?.status || webhookData.data?.transaction?.status || 'PENDING',
        providerTransactionId: webhookData.transaction?.airtel_money_id || webhookData.data?.transaction?.airtel_money_id
      };
    
    case 'flutterwave':
      return {
        transactionId: webhookData.data?.tx_ref || webhookData.tx_ref,
        status: webhookData.data?.status || webhookData.status || 'PENDING',
        providerTransactionId: webhookData.data?.id || webhookData.id
      };
    
    default:
      throw new Error(`Unsupported gateway: ${gateway}`);
  }
}

function mapGatewayStatusToPaymentStatus(gateway: string, gatewayStatus: string): PaymentStatus {
  const status = gatewayStatus.toUpperCase();
  
  // Common status mappings
  const commonMappings: Record<string, PaymentStatus> = {
    'SUCCESS': 'COMPLETED',
    'SUCCESSFUL': 'COMPLETED',
    'COMPLETED': 'COMPLETED',
    'FAILED': 'FAILED',
    'CANCELLED': 'FAILED',
    'EXPIRED': 'FAILED',
    'REJECTED': 'FAILED',
    'PENDING': 'PENDING',
    'INITIATED': 'PENDING',
    'IN_PROGRESS': 'PENDING'
  };

  return commonMappings[status] || 'PENDING';
}

// Get payment history for user
router.get('/history', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { page = 1, limit = 10 } = req.query;

    const payments = await prisma.payment.findMany({
      where: {
        userId
      },
      include: {
        booking: {
          include: {
            route: {
              select: {
                origin: true,
                destination: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit)
    });

    const total = await prisma.payment.count({
      where: {
        userId
      }
    });

    res.json({
      payments,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching payment history:', error);
    res.status(500).json({ error: 'Failed to fetch payment history' });
  }
});

// Complete payment (for testing/demo purposes)
router.post('/:paymentId/complete', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { paymentId } = req.params;
    const userId = (req as any).user.userId;

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        booking: true
      }
    });

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    if (payment.userId !== userId) {
      return res.status(403).json({ error: 'Not authorized for this payment' });
    }

    if (payment.status !== 'PENDING') {
      return res.status(400).json({ error: 'Payment is not in pending status' });
    }

    // Update payment status
    await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'COMPLETED',
        metadata: {
          ...(payment.metadata as object || {}),
          completedManually: true,
          completedAt: new Date().toISOString()
        }
      }
    });

    // Update booking status
    await prisma.booking.update({
      where: { id: payment.bookingId },
      data: { status: 'CONFIRMED' }
    });

    res.json({ 
      message: 'Payment completed successfully',
      paymentId: payment.id,
      status: 'COMPLETED'
    });
  } catch (error) {
    console.error('Error completing payment:', error);
    res.status(500).json({ error: 'Failed to complete payment' });
  }
});

// Validate payment method and phone number
router.post('/validate', [
  authenticateToken,
  body('method').isIn(['MTN_MOBILE_MONEY', 'AIRTEL_MONEY', 'FLUTTERWAVE']).withMessage('Valid payment method is required'),
  body('phoneNumber').isMobilePhone('any').withMessage('Valid phone number is required')
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { method, phoneNumber } = req.body;

    const isValid = await PaymentGatewayFactory.validatePaymentMethod(
      method as PaymentMethod,
      phoneNumber,
      'UG'
    );

    res.json({
      valid: isValid,
      method,
      methodDisplayName: PaymentGatewayFactory.getMethodDisplayName(method as PaymentMethod),
      phoneNumber,
      message: isValid 
        ? `Phone number is registered for ${PaymentGatewayFactory.getMethodDisplayName(method as PaymentMethod)}`
        : `Phone number is not registered for ${PaymentGatewayFactory.getMethodDisplayName(method as PaymentMethod)}`
    });
  } catch (error) {
    console.error('Error validating payment method:', error);
    res.status(500).json({ error: 'Failed to validate payment method' });
  }
});

// Get supported payment methods
router.get('/methods', async (req: Request, res: Response) => {
  try {
    const methods = PaymentGatewayFactory.getSupportedMethods().map(method => ({
      value: method,
      label: PaymentGatewayFactory.getMethodDisplayName(method),
      isOnline: PaymentGatewayFactory.isOnlinePayment(method)
    }));

    res.json({
      supportedMethods: methods,
      defaultCurrency: 'UGX',
      country: 'UG'
    });
  } catch (error) {
    console.error('Error getting payment methods:', error);
    res.status(500).json({ error: 'Failed to get payment methods' });
  }
});

// Helper function to generate QR code for booking
async function generateBookingQRCode(bookingId: string): Promise<string | null> {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        route: {
          include: {
            bus: {
              select: {
                plateNumber: true,
                model: true
              }
            },
            operator: {
              select: {
                companyName: true
              }
            }
          }
        },
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    if (!booking) {
      console.error('Booking not found for QR generation:', bookingId);
      return null;
    }

    // Generate comprehensive QR data
    const qrData = {
      bookingId: booking.id,
      passengerName: `${booking.user.firstName} ${booking.user.lastName}`,
      route: `${booking.route.origin} → ${booking.route.destination}`,
      seatNumber: booking.seatNumber,
      travelDate: booking.travelDate.toISOString().split('T')[0],
      busPlate: booking.route.bus.plateNumber,
      operator: booking.route.operator.companyName,
      amount: booking.totalAmount,
      generatedAt: new Date().toISOString(),
      signature: generateBookingSignature(booking.id, booking.userId)
    };

    // Generate QR code as data URL
    const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData), {
      width: 256,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    // Update booking with QR code
    await prisma.booking.update({
      where: { id: bookingId },
      data: { qrCode: qrCodeDataURL }
    });

    console.log('QR code generated successfully for booking:', bookingId);
    return qrCodeDataURL;
  } catch (error) {
    console.error('Error generating QR code for booking:', bookingId, error);
    return null;
  }
}

// Helper function to generate booking signature
function generateBookingSignature(bookingId: string, userId: string): string {
  const secret = process.env.JWT_SECRET || 'default-secret';
  const data = `${bookingId}:${userId}:${secret}`;
  
  // Simple hash function (in production, use crypto.createHash)
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return Math.abs(hash).toString(16);
}

export default router;