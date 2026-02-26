/**
 * Booking Transfer Controller
 * Phase 1 Week 4: Booking Transfer System
 * 
 * Handles customer-facing booking transfer operations
 */

import { Request, Response } from 'express';
import { prisma } from '../index';
import { TransferStatus, BookingStatus, UserRole } from '@prisma/client';
import { calculatePriceDifference, checkSeatAvailability } from '../services/transferService';

/**
 * Request a booking transfer
 * POST /api/bookings/:bookingId/transfers
 */
export const requestTransfer = async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.params;
    const userId = (req as any).user?.id;
    
    const {
      toRouteId,
      toTravelDate,
      toSeatNumber,
      reason,
      reasonText,
    } = req.body;

    // Validate required fields
    if (!toRouteId || !toTravelDate) {
      return res.status(400).json({
        success: false,
        message: 'Target route and travel date are required',
      });
    }

    // Find the booking
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        route: true,
        payment: true,
      },
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // Verify booking belongs to user
    if (booking.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only transfer your own bookings',
      });
    }

    // Check booking status
    if (booking.status !== BookingStatus.CONFIRMED) {
      return res.status(400).json({
        success: false,
        message: 'Only confirmed bookings can be transferred',
      });
    }

    // Check if booking has already passed
    const now = new Date();
    if (booking.travelDate < now) {
      return res.status(400).json({
        success: false,
        message: 'Cannot transfer a booking for a past date',
      });
    }

    // Check for pending transfers
    const pendingTransfer = await prisma.bookingTransfer.findFirst({
      where: {
        bookingId,
        status: TransferStatus.PENDING,
      },
    });

    if (pendingTransfer) {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending transfer request for this booking',
      });
    }

    // Verify target route exists
    const toRoute = await prisma.route.findUnique({
      where: { id: toRouteId },
    });

    if (!toRoute) {
      return res.status(404).json({
        success: false,
        message: 'Target route not found',
      });
    }

    if (!toRoute.active) {
      return res.status(400).json({
        success: false,
        message: 'Target route is not active',
      });
    }

    // Check if target travel date is valid
    const targetDate = new Date(toTravelDate);
    if (targetDate < now) {
      return res.status(400).json({
        success: false,
        message: 'Cannot transfer to a past date',
      });
    }

    // Check seat availability on target route/date
    const seatAvailable = await checkSeatAvailability(
      toRouteId,
      targetDate,
      toSeatNumber || booking.seatNumber
    );

    if (!seatAvailable && toSeatNumber) {
      return res.status(400).json({
        success: false,
        message: `Seat ${toSeatNumber} is not available on the selected date`,
      });
    }

    // Calculate price difference
    const { priceDifference, newAmount } = await calculatePriceDifference(
      booking,
      toRoute,
      targetDate
    );

    // Create transfer request
    const transfer = await prisma.bookingTransfer.create({
      data: {
        bookingId,
        userId,
        fromRouteId: booking.routeId,
        toRouteId,
        fromTravelDate: booking.travelDate,
        toTravelDate: targetDate,
        fromSeatNumber: booking.seatNumber,
        toSeatNumber: toSeatNumber || null,
        originalAmount: booking.totalAmount,
        newAmount,
        priceDifference,
        reason: reason || 'OTHER',
        reasonText,
        status: TransferStatus.PENDING,
      },
      include: {
        fromRoute: {
          select: {
            origin: true,
            destination: true,
            departureTime: true,
          },
        },
        toRoute: {
          select: {
            origin: true,
            destination: true,
            departureTime: true,
          },
        },
      },
    });

    // TODO: Send notification to managers/admins
    // TODO: If price increased, notify customer about payment requirement

    return res.status(201).json({
      success: true,
      message: 'Transfer request submitted successfully',
      data: {
        transferId: transfer.id,
        status: transfer.status,
        priceDifference: transfer.priceDifference,
        newAmount: transfer.newAmount,
        requiresPayment: transfer.priceDifference > 0,
        transfer,
      },
    });
  } catch (error) {
    console.error('Error requesting transfer:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to submit transfer request',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Get customer's transfer requests
 * GET /api/bookings/transfers/my-requests
 */
export const getMyTransfers = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { status, page = '1', limit = '10' } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = { userId };
    if (status) {
      where.status = status as TransferStatus;
    }

    const [transfers, total] = await Promise.all([
      prisma.bookingTransfer.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { requestedAt: 'desc' },
        include: {
          booking: {
            select: {
              id: true,
              qrCode: true,
              status: true,
            },
          },
          fromRoute: {
            select: {
              origin: true,
              destination: true,
              departureTime: true,
            },
          },
          toRoute: {
            select: {
              origin: true,
              destination: true,
              departureTime: true,
            },
          },
          reviewer: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      prisma.bookingTransfer.count({ where }),
    ]);

    return res.json({
      success: true,
      data: {
        transfers,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching transfers:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch transfer requests',
    });
  }
};

/**
 * Get a specific transfer request
 * GET /api/bookings/transfers/:transferId
 */
export const getTransferById = async (req: Request, res: Response) => {
  try {
    const { transferId } = req.params;
    const userId = (req as any).user?.id;

    const transfer = await prisma.bookingTransfer.findUnique({
      where: { id: transferId },
      include: {
        booking: true,
        fromRoute: true,
        toRoute: true,
        reviewer: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        seatHistory: true,
      },
    });

    if (!transfer) {
      return res.status(404).json({
        success: false,
        message: 'Transfer request not found',
      });
    }

    // Verify ownership
    if (transfer.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only view your own transfer requests',
      });
    }

    return res.json({
      success: true,
      data: transfer,
    });
  } catch (error) {
    console.error('Error fetching transfer:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch transfer request',
    });
  }
};

/**
 * Cancel a transfer request
 * DELETE /api/bookings/transfers/:transferId
 */
export const cancelTransfer = async (req: Request, res: Response) => {
  try {
    const { transferId } = req.params;
    const userId = (req as any).user?.id;

    const transfer = await prisma.bookingTransfer.findUnique({
      where: { id: transferId },
    });

    if (!transfer) {
      return res.status(404).json({
        success: false,
        message: 'Transfer request not found',
      });
    }

    // Verify ownership
    if (transfer.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only cancel your own transfer requests',
      });
    }

    // Can only cancel pending transfers
    if (transfer.status !== TransferStatus.PENDING) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel transfer with status: ${transfer.status}`,
      });
    }

    // Update transfer status to CANCELLED
    await prisma.bookingTransfer.update({
      where: { id: transferId },
      data: {
        status: TransferStatus.CANCELLED,
        updatedAt: new Date(),
      },
    });

    return res.json({
      success: true,
      message: 'Transfer request cancelled successfully',
    });
  } catch (error) {
    console.error('Error cancelling transfer:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to cancel transfer request',
    });
  }
};
