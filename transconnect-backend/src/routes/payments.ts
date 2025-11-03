import { Router, Request, Response } from 'express';
import { prisma } from '../index';
import { authenticateToken } from '../middleware/auth';
import { body, validationResult } from 'express-validator';
import { PaymentMethod, PaymentStatus } from '@prisma/client';

const router = Router();

// Initiate payment for a booking
router.post('/initiate', [
  authenticateToken,
  body('bookingId').notEmpty().withMessage('Booking ID is required'),
  body('method').isIn(['MTN_MOBILE_MONEY', 'AIRTEL_MONEY', 'FLUTTERWAVE', 'CASH']).withMessage('Valid payment method is required')
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { bookingId, method } = req.body;
    const userId = (req as any).user.userId;

    // Verify booking exists and belongs to user
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        route: true
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
        status: 'PENDING'
      }
    });

    // Simulate payment gateway integration
    const paymentResponse = await simulatePaymentGateway(method, {
      amount: booking.totalAmount,
      reference: paymentReference,
      description: `Bus ticket: ${booking.route.origin} to ${booking.route.destination}`
    });

    // Update payment with gateway response
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        transactionId: paymentResponse.transactionId
      }
    });

    res.json({
      paymentId: payment.id,
      paymentReference,
      status: payment.status,
      gatewayResponse: paymentResponse
    });
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

    // In real implementation, verify status with payment gateway
    const gatewayStatus = await verifyPaymentWithGateway(payment.transactionId, payment.method);

    // Update payment status if changed
    if (gatewayStatus.status !== payment.status) {
      await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: gatewayStatus.status as PaymentStatus
        }
      });

      // If payment completed, update booking status
      if (gatewayStatus.status === 'COMPLETED') {
        await prisma.booking.update({
          where: { id: payment.bookingId },
          data: { status: 'CONFIRMED' }
        });
      }
    }

    res.json({
      paymentId: payment.id,
      status: gatewayStatus.status,
      amount: payment.amount,
      method: payment.method,
      createdAt: payment.createdAt
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

    console.log(`Received webhook from ${gateway}:`, webhookData);

    // Verify webhook signature (implementation depends on gateway)
    if (!verifyWebhookSignature(gateway, webhookData, req.headers)) {
      return res.status(401).json({ error: 'Invalid webhook signature' });
    }

    // Find payment by transaction ID
    const transactionId = extractTransactionId(gateway, webhookData);
    const payment = await prisma.payment.findFirst({
      where: { transactionId: transactionId }
    });

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    // Update payment status based on webhook
    const newStatus = mapGatewayStatus(gateway, webhookData.status);
    
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: newStatus as PaymentStatus
      }
    });

    // Update booking status if payment completed
    if (newStatus === 'COMPLETED') {
      await prisma.booking.update({
        where: { id: payment.bookingId },
        data: { status: 'CONFIRMED' }
      });
    } else if (newStatus === 'FAILED') {
      await prisma.booking.update({
        where: { id: payment.bookingId },
        data: { status: 'CANCELLED' }
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Failed to process webhook' });
  }
});

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
        status: 'COMPLETED'
      }
    });

    // Update booking status
    await prisma.booking.update({
      where: { id: payment.bookingId },
      data: { status: 'CONFIRMED' }
    });

    res.json({ message: 'Payment completed successfully' });
  } catch (error) {
    console.error('Error completing payment:', error);
    res.status(500).json({ error: 'Failed to complete payment' });
  }
});

// Helper functions for payment gateway simulation
async function simulatePaymentGateway(method: string, paymentData: any) {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  const transactionId = `TXN${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

  return {
    transactionId,
    status: 'PENDING',
    gatewayReference: `${method}_${transactionId}`,
    message: 'Payment initiated successfully',
    checkoutUrl: `https://sandbox.${method.toLowerCase()}.com/checkout/${transactionId}`
  };
}

async function verifyPaymentWithGateway(transactionId: string | null, method: PaymentMethod) {
  if (!transactionId) {
    return { status: 'FAILED' };
  }

  // Simulate gateway verification
  await new Promise(resolve => setTimeout(resolve, 500));

  // Randomly simulate payment success/failure for demo
  const isSuccess = Math.random() > 0.3; // 70% success rate
  
  return {
    status: isSuccess ? 'COMPLETED' : 'FAILED',
    verifiedAt: new Date()
  };
}

function verifyWebhookSignature(gateway: string, data: any, headers: any): boolean {
  // In real implementation, verify webhook signature
  // This is gateway-specific implementation
  return true; // Simplified for demo
}

function extractTransactionId(gateway: string, webhookData: any): string {
  // Extract transaction ID based on gateway format
  return webhookData.transaction_id || webhookData.transactionId || webhookData.id;
}

function mapGatewayStatus(gateway: string, gatewayStatus: string): string {
  // Map gateway-specific status to our standard status
  const statusMap: { [key: string]: string } = {
    'success': 'COMPLETED',
    'completed': 'COMPLETED',
    'failed': 'FAILED',
    'cancelled': 'FAILED',
    'pending': 'PENDING'
  };

  return statusMap[gatewayStatus.toLowerCase()] || 'PENDING';
}

export default router;