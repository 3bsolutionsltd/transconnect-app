import { Router, Request, Response } from 'express';
import { prisma } from '../index';
import { authenticateToken } from '../middleware/auth';
import { body, validationResult } from 'express-validator';
import { PaymentStatus, PaymentMethod } from '@prisma/client';
import { NotificationService } from '../services/notification.service';

const router = Router();
const notificationService = NotificationService.getInstance();

// Get all pending cash payments for operator
router.get('/pending-cash', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const userRole = (req as any).user.role;

    if (userRole !== 'OPERATOR') {
      return res.status(403).json({ error: 'Only operators can access this endpoint' });
    }

    // Find operator by user ID
    const operator = await prisma.operator.findUnique({
      where: { userId }
    });

    if (!operator) {
      return res.status(404).json({ error: 'Operator profile not found' });
    }

    // Get all pending cash payments for this operator's routes
    const pendingPayments = await prisma.payment.findMany({
      where: {
        method: 'CASH',
        status: 'PENDING',
        booking: {
          route: {
            operatorId: operator.id
          }
        }
      },
      include: {
        booking: {
          include: {
            route: {
              include: {
                bus: {
                  select: {
                    plateNumber: true,
                    model: true
                  }
                }
              }
            },
            user: {
              select: {
                firstName: true,
                lastName: true,
                phone: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      pendingPayments: pendingPayments.map(payment => ({
        id: payment.id,
        reference: payment.reference,
        amount: payment.amount,
        createdAt: payment.createdAt,
        passenger: {
          name: `${payment.booking.user.firstName} ${payment.booking.user.lastName}`,
          phone: payment.booking.user.phone,
          email: payment.booking.user.email
        },
        booking: {
          id: payment.booking.id,
          seatNumber: payment.booking.seatNumber,
          travelDate: payment.booking.travelDate
        },
        route: {
          origin: payment.booking.route.origin,
          destination: payment.booking.route.destination,
          departureTime: payment.booking.route.departureTime
        },
        bus: {
          plateNumber: payment.booking.route.bus.plateNumber,
          model: payment.booking.route.bus.model
        }
      }))
    });
  } catch (error) {
    console.error('Error fetching pending cash payments:', error);
    res.status(500).json({ error: 'Failed to fetch pending payments' });
  }
});

// Process manual payment (confirm or reject)
router.post('/:paymentId/process', [
  authenticateToken,
  body('action').isIn(['confirm', 'reject']).withMessage('Action must be confirm or reject'),
  body('notes').optional().isString().withMessage('Notes must be a string')
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { paymentId } = req.params;
    const { action, notes } = req.body;
    const userId = (req as any).user.userId;
    const userRole = (req as any).user.role;

    if (userRole !== 'OPERATOR') {
      return res.status(403).json({ error: 'Only operators can process payments' });
    }

    // Find operator by user ID
    const operator = await prisma.operator.findUnique({
      where: { userId }
    });

    if (!operator) {
      return res.status(404).json({ error: 'Operator profile not found' });
    }

    // Get payment with booking details
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        booking: {
          include: {
            route: {
              include: {
                operator: true
              }
            },
            user: true
          }
        }
      }
    });

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    // Verify operator owns this payment's route
    if (payment.booking.route.operatorId !== operator.id) {
      return res.status(403).json({ error: 'Not authorized to process this payment' });
    }

    if (payment.status !== 'PENDING') {
      return res.status(400).json({ error: 'Payment is not in pending status' });
    }

    const newStatus: PaymentStatus = action === 'confirm' ? 'COMPLETED' : 'FAILED';
    const bookingStatus = action === 'confirm' ? 'CONFIRMED' : 'CANCELLED';

    // Update payment status
    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: newStatus,
        metadata: {
          ...(payment.metadata as object || {}),
          processedManually: true,
          processedBy: operator.companyName,
          processedAt: new Date().toISOString(),
          operatorNotes: notes || '',
          operatorAction: action
        }
      }
    });

    // Update booking status
    const updatedBooking = await prisma.booking.update({
      where: { id: payment.bookingId },
      data: { status: bookingStatus }
    });

    // Generate QR code if payment confirmed
    if (action === 'confirm') {
      try {
        const qrCode = await generateBookingQRCode(payment.bookingId);
        console.log(`Manual payment confirmed - QR code ${qrCode ? 'generated' : 'generation failed'} for booking ${payment.bookingId}`);
      } catch (error) {
        console.error('Error generating QR code after manual payment confirmation:', error);
      }
    }

    // Send notification to passenger
    try {
      if (action === 'confirm') {
        await notificationService.sendPaymentConfirmation({
          userId: payment.userId,
          bookingId: payment.bookingId,
          passengerName: `${payment.booking.user.firstName} ${payment.booking.user.lastName}`,
          amount: payment.amount,
          method: 'Cash Payment',
          transactionId: payment.reference || '',
        });
      } else {
        await notificationService.sendPaymentFailed({
          userId: payment.userId,
          bookingId: payment.bookingId,
          amount: payment.amount,
          method: 'Cash Payment',
          reason: notes || 'Payment rejected by operator',
        });
      }
    } catch (notificationError) {
      console.error('Error sending payment notification:', notificationError);
      // Don't fail the operation if notification fails
    }

    res.json({
      message: `Payment ${action}ed successfully`,
      payment: {
        id: updatedPayment.id,
        status: updatedPayment.status,
        reference: updatedPayment.reference,
        processedAt: new Date().toISOString()
      },
      booking: {
        id: updatedBooking.id,
        status: updatedBooking.status
      }
    });
  } catch (error) {
    console.error('Error processing manual payment:', error);
    res.status(500).json({ error: 'Failed to process payment' });
  }
});

// Get payment history for operator
router.get('/history', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const userRole = (req as any).user.role;
    const { page = 1, limit = 10, status, method } = req.query;

    if (userRole !== 'OPERATOR') {
      return res.status(403).json({ error: 'Only operators can access this endpoint' });
    }

    // Find operator by user ID
    const operator = await prisma.operator.findUnique({
      where: { userId }
    });

    if (!operator) {
      return res.status(404).json({ error: 'Operator profile not found' });
    }

    // Build where clause
    const whereClause: any = {
      booking: {
        route: {
          operatorId: operator.id
        }
      }
    };

    if (status) {
      whereClause.status = status;
    }

    if (method) {
      whereClause.method = method;
    }

    const payments = await prisma.payment.findMany({
      where: whereClause,
      include: {
        booking: {
          include: {
            route: {
              include: {
                bus: {
                  select: {
                    plateNumber: true,
                    model: true
                  }
                }
              }
            },
            user: {
              select: {
                firstName: true,
                lastName: true,
                phone: true,
                email: true
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
      where: whereClause
    });

    res.json({
      payments: payments.map(payment => ({
        id: payment.id,
        reference: payment.reference,
        amount: payment.amount,
        method: payment.method,
        status: payment.status,
        createdAt: payment.createdAt,
        passenger: {
          name: `${payment.booking.user.firstName} ${payment.booking.user.lastName}`,
          phone: payment.booking.user.phone,
          email: payment.booking.user.email
        },
        booking: {
          id: payment.booking.id,
          seatNumber: payment.booking.seatNumber,
          travelDate: payment.booking.travelDate,
          status: payment.booking.status
        },
        route: {
          origin: payment.booking.route.origin,
          destination: payment.booking.route.destination,
          departureTime: payment.booking.route.departureTime
        },
        bus: {
          plateNumber: payment.booking.route.bus.plateNumber,
          model: payment.booking.route.bus.model
        },
        metadata: payment.metadata
      })),
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching operator payment history:', error);
    res.status(500).json({ error: 'Failed to fetch payment history' });
  }
});

// Get payment analytics for operator
router.get('/analytics', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const userRole = (req as any).user.role;
    const { period = '30' } = req.query; // days

    if (userRole !== 'OPERATOR') {
      return res.status(403).json({ error: 'Only operators can access this endpoint' });
    }

    // Find operator by user ID
    const operator = await prisma.operator.findUnique({
      where: { userId }
    });

    if (!operator) {
      return res.status(404).json({ error: 'Operator profile not found' });
    }

    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - Number(period));

    // Get payment statistics
    const payments = await prisma.payment.findMany({
      where: {
        booking: {
          route: {
            operatorId: operator.id
          }
        },
        createdAt: {
          gte: daysAgo
        }
      },
      include: {
        booking: {
          include: {
            route: true
          }
        }
      }
    });

    // Calculate analytics
    const totalRevenue = payments
      .filter(p => p.status === 'COMPLETED')
      .reduce((sum, p) => sum + p.amount, 0);

    const totalBookings = payments.length;
    const completedPayments = payments.filter(p => p.status === 'COMPLETED').length;
    const pendingPayments = payments.filter(p => p.status === 'PENDING').length;
    const failedPayments = payments.filter(p => p.status === 'FAILED').length;

    // Payment method breakdown
    const paymentMethods = {
      cash: payments.filter(p => p.method === 'CASH').length,
      mtnMoney: payments.filter(p => p.method === 'MTN_MOBILE_MONEY').length,
      airtelMoney: payments.filter(p => p.method === 'AIRTEL_MONEY').length,
      flutterwave: payments.filter(p => p.method === 'FLUTTERWAVE').length
    };

    // Daily revenue breakdown
    const dailyRevenue = payments
      .filter(p => p.status === 'COMPLETED')
      .reduce((acc, payment) => {
        const date = payment.createdAt.toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + payment.amount;
        return acc;
      }, {} as Record<string, number>);

    res.json({
      period: `${period} days`,
      summary: {
        totalRevenue,
        totalBookings,
        completedPayments,
        pendingPayments,
        failedPayments,
        successRate: totalBookings > 0 ? Math.round((completedPayments / totalBookings) * 100) : 0
      },
      paymentMethods,
      dailyRevenue,
      operator: {
        id: operator.id,
        name: operator.companyName
      }
    });
  } catch (error) {
    console.error('Error fetching operator payment analytics:', error);
    res.status(500).json({ error: 'Failed to fetch payment analytics' });
  }
});

// Helper function to generate QR code (imported from payments.ts logic)
async function generateBookingQRCode(bookingId: string): Promise<string | null> {
  try {
    const QRCode = require('qrcode');
    const crypto = require('crypto');

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
  
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  return Math.abs(hash).toString(16);
}

export default router;