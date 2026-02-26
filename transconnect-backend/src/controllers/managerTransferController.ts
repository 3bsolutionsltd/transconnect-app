/**
 * Manager Transfer Controller
 * Phase 1 Week 4: Booking Transfer System
 * 
 * Handles manager/admin transfer approval operations
 */

import { Request, Response } from 'express';
import { prisma } from '../index';
import { TransferStatus, BookingStatus } from '@prisma/client';
import {
  checkSeatAvailability,
  executeTransfer,
  processRefund,
  createPaymentForDifference,
} from '../services/transferService';

/**
 * Get pending transfer requests
 * GET /api/manager/transfers/pending
 */
export const getPendingTransfers = async (req: Request, res: Response) => {
  try {
    const {
      operatorId,
      fromDate,
      toDate,
      page = '1',
      limit = '20',
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {
      status: TransferStatus.PENDING,
    };

    // Filter by operator if provided
    if (operatorId) {
      where.toRoute = {
        operatorId: operatorId as string,
      };
    }

    // Filter by date range
    if (fromDate || toDate) {
      where.toTravelDate = {};
      if (fromDate) {
        where.toTravelDate.gte = new Date(fromDate as string);
      }
      if (toDate) {
        where.toTravelDate.lte = new Date(toDate as string);
      }
    }

    const [transfers, total] = await Promise.all([
      prisma.bookingTransfer.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { requestedAt: 'asc' }, // Oldest first
        include: {
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
          booking: {
            select: {
              id: true,
              qrCode: true,
              status: true,
              travelDate: true,
            },
          },
          fromRoute: {
            select: {
              origin: true,
              destination: true,
              departureTime: true,
              operator: {
                select: {
                  companyName: true,
                },
              },
            },
          },
          toRoute: {
            select: {
              origin: true,
              destination: true,
              departureTime: true,
              operator: {
                select: {
                  companyName: true,
                },
              },
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
    console.error('Error fetching pending transfers:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch pending transfers',
    });
  }
};

/**
 * Review a transfer request (approve/reject)
 * POST /api/manager/transfers/:transferId/review
 */
export const reviewTransfer = async (req: Request, res: Response) => {
  try {
    const { transferId } = req.params;
    const reviewerId = (req as any).user?.id;
    const {
      action, // 'APPROVE' or 'REJECT'
      toSeatNumber,
      reviewerNotes,
      refundAmount,
    } = req.body;

    // Validate action
    if (!action || !['APPROVE', 'REJECT'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Action must be either APPROVE or REJECT',
      });
    }

    // Find the transfer request
    const transfer = await prisma.bookingTransfer.findUnique({
      where: { id: transferId },
      include: {
        booking: {
          include: {
            route: true,
            payment: true,
          },
        },
        toRoute: true,
      },
    });

    if (!transfer) {
      return res.status(404).json({
        success: false,
        message: 'Transfer request not found',
      });
    }

    // Can only review pending transfers
    if (transfer.status !== TransferStatus.PENDING) {
      return res.status(400).json({
        success: false,
        message: `Cannot review transfer with status: ${transfer.status}`,
      });
    }

    const reviewedAt = new Date();

    if (action === 'REJECT') {
      // Reject the transfer
      const updatedTransfer = await prisma.bookingTransfer.update({
        where: { id: transferId },
        data: {
          status: TransferStatus.REJECTED,
          reviewedBy: reviewerId,
          reviewedAt,
          reviewerNotes,
        },
        include: {
          customer: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      // TODO: Send rejection notification to customer

      return res.json({
        success: true,
        message: 'Transfer request rejected',
        data: updatedTransfer,
      });
    }

    // APPROVE action
    const finalSeatNumber = toSeatNumber || transfer.toSeatNumber || transfer.fromSeatNumber;

    // Verify seat availability
    const seatAvailable = await checkSeatAvailability(
      transfer.toRouteId,
      transfer.toTravelDate,
      finalSeatNumber
    );

    if (!seatAvailable) {
      return res.status(400).json({
        success: false,
        message: `Seat ${finalSeatNumber} is not available`,
      });
    }

    // Handle payment scenarios
    if (transfer.priceDifference > 0) {
      // Customer needs to pay more
      // Create a pending payment record
      await createPaymentForDifference(
        transfer.bookingId,
        transfer.userId,
        transfer.priceDifference
      );

      // Update transfer to APPROVED (not COMPLETED yet - waiting for payment)
      const updatedTransfer = await prisma.bookingTransfer.update({
        where: { id: transferId },
        data: {
          status: TransferStatus.APPROVED,
          toSeatNumber: finalSeatNumber,
          reviewedBy: reviewerId,
          reviewedAt,
          reviewerNotes,
        },
      });

      // TODO: Send notification to customer to pay the difference

      return res.json({
        success: true,
        message: 'Transfer approved - waiting for customer payment',
        data: {
          transfer: updatedTransfer,
          requiresPayment: true,
          paymentAmount: transfer.priceDifference,
        },
      });
    } else if (transfer.priceDifference < 0) {
      // Customer gets a refund
      await processRefund(
        transfer.bookingId,
        Math.abs(transfer.priceDifference)
      );
    }

    // Execute the transfer (update booking)
    await executeTransfer(
      transfer.bookingId,
      transfer.toRouteId,
      transfer.toTravelDate,
      finalSeatNumber,
      transfer.newAmount,
      reviewerId!,
      transfer.id
    );

    // Update transfer status to COMPLETED
    const updatedTransfer = await prisma.bookingTransfer.update({
      where: { id: transferId },
      data: {
        status: TransferStatus.COMPLETED,
        toSeatNumber: finalSeatNumber,
        reviewedBy: reviewerId,
        reviewedAt,
        completedAt: new Date(),
        reviewerNotes,
      },
      include: {
        booking: true,
        customer: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // TODO: Send success notification to customer

    return res.json({
      success: true,
      message: 'Transfer completed successfully',
      data: updatedTransfer,
    });
  } catch (error) {
    console.error('Error reviewing transfer:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to review transfer request',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Get transfer history
 * GET /api/manager/transfers/history
 */
export const getTransferHistory = async (req: Request, res: Response) => {
  try {
    const {
      status,
      operatorId,
      fromDate,
      toDate,
      page = '1',
      limit = '20',
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    // Filter by status (exclude PENDING)
    if (status) {
      where.status = status as TransferStatus;
    } else {
      where.status = {
        in: [
          TransferStatus.APPROVED,
          TransferStatus.COMPLETED,
          TransferStatus.REJECTED,
          TransferStatus.CANCELLED,
        ],
      };
    }

    // Filter by operator
    if (operatorId) {
      where.toRoute = {
        operatorId: operatorId as string,
      };
    }

    // Filter by reviewed date
    if (fromDate || toDate) {
      where.reviewedAt = {};
      if (fromDate) {
        where.reviewedAt.gte = new Date(fromDate as string);
      }
      if (toDate) {
        where.reviewedAt.lte = new Date(toDate as string);
      }
    }

    const [transfers, total] = await Promise.all([
      prisma.bookingTransfer.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { reviewedAt: 'desc' },
        include: {
          customer: {
            select: {
              firstName: true,
              lastName: true,
              phone: true,
            },
          },
          reviewer: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
          fromRoute: {
            select: {
              origin: true,
              destination: true,
            },
          },
          toRoute: {
            select: {
              origin: true,
              destination: true,
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
    console.error('Error fetching transfer history:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch transfer history',
    });
  }
};

/**
 * Get transfer statistics
 * GET /api/manager/transfers/statistics
 */
export const getTransferStatistics = async (req: Request, res: Response) => {
  try {
    const { fromDate, toDate, operatorId } = req.query;

    const where: any = {};

    // Filter by date range
    if (fromDate || toDate) {
      where.requestedAt = {};
      if (fromDate) {
        where.requestedAt.gte = new Date(fromDate as string);
      }
      if (toDate) {
        where.requestedAt.lte = new Date(toDate as string);
      }
    }

    // Filter by operator
    if (operatorId) {
      where.toRoute = {
        operatorId: operatorId as string,
      };
    }

    // Get status counts
    const [
      totalRequests,
      pending,
      approved,
      completed,
      rejected,
      cancelled,
    ] = await Promise.all([
      prisma.bookingTransfer.count({ where }),
      prisma.bookingTransfer.count({
        where: { ...where, status: TransferStatus.PENDING },
      }),
      prisma.bookingTransfer.count({
        where: { ...where, status: TransferStatus.APPROVED },
      }),
      prisma.bookingTransfer.count({
        where: { ...where, status: TransferStatus.COMPLETED },
      }),
      prisma.bookingTransfer.count({
        where: { ...where, status: TransferStatus.REJECTED },
      }),
      prisma.bookingTransfer.count({
        where: { ...where, status: TransferStatus.CANCELLED },
      }),
    ]);

    // Calculate average processing time for completed transfers
    const completedTransfers = await prisma.bookingTransfer.findMany({
      where: {
        ...where,
        status: TransferStatus.COMPLETED,
        reviewedAt: { not: null },
      },
      select: {
        requestedAt: true,
        reviewedAt: true,
      },
    });

    let averageProcessingTimeHours = 0;
    if (completedTransfers.length > 0) {
      const totalProcessingTime = completedTransfers.reduce((sum, transfer) => {
        const processingTime =
          transfer.reviewedAt!.getTime() - transfer.requestedAt.getTime();
        return sum + processingTime;
      }, 0);
      averageProcessingTimeHours =
        totalProcessingTime / completedTransfers.length / (1000 * 60 * 60);
    }

    return res.json({
      success: true,
      data: {
        totalRequests,
        statusBreakdown: {
          pending,
          approved,
          completed,
          rejected,
          cancelled,
        },
        approvalRate:
          totalRequests > 0
            ? ((completed / totalRequests) * 100).toFixed(2)
            : 0,
        averageProcessingTime: `${averageProcessingTimeHours.toFixed(1)} hours`,
      },
    });
  } catch (error) {
    console.error('Error fetching transfer statistics:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch transfer statistics',
    });
  }
};
