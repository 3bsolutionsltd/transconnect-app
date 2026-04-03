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

/**
 * Create a transfer on behalf of a customer (Admin-initiated)
 * POST /api/manager/transfers/create
 */
export const createTransferForCustomer = async (req: Request, res: Response) => {
  try {
    const managerId = (req as any).user?.id;
    const {
      bookingId,
      targetTravelDate,
      targetRouteId,
      reason,
      reasonDetails,
      autoApprove = false, // Admin can choose to auto-approve
    } = req.body;

    // Validate required fields
    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: 'Booking ID is required',
      });
    }

    if (!targetTravelDate && !targetRouteId) {
      return res.status(400).json({
        success: false,
        message: 'At least one of targetTravelDate or targetRouteId must be provided',
      });
    }

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Reason is required',
      });
    }

    // Fetch the booking
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        user: true,
        route: {
          include: {
            operator: true,
          },
        },
      },
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // Check booking status
    if (booking.status !== BookingStatus.CONFIRMED) {
      return res.status(400).json({
        success: false,
        message: 'Only confirmed bookings can be transferred',
      });
    }

    // Check if there's already a pending transfer
    const existingTransfer = await prisma.bookingTransfer.findFirst({
      where: {
        bookingId,
        status: TransferStatus.PENDING,
      },
    });

    if (existingTransfer) {
      return res.status(400).json({
        success: false,
        message: 'This booking already has a pending transfer request',
      });
    }

    const newTravelDate = targetTravelDate ? new Date(targetTravelDate) : booking.travelDate;
    const newRouteId = targetRouteId || booking.routeId;

    // Fetch the target route if changing routes
    let targetRoute = booking.route;
    if (targetRouteId && targetRouteId !== booking.routeId) {
      const fetchedRoute = await prisma.route.findUnique({
        where: { id: targetRouteId },
        include: { operator: true },
      });

      if (!fetchedRoute) {
        return res.status(404).json({
          success: false,
          message: 'Target route not found',
        });
      }

      targetRoute = fetchedRoute;
    }

    // Check seat availability on new date/route
    const seatAvailable = await checkSeatAvailability(
      newRouteId,
      newTravelDate,
      booking.seatNumber
    );

    if (!seatAvailable) {
      return res.status(400).json({
        success: false,
        message: 'Seat not available on the target date/route',
      });
    }

    // Calculate price difference
    const originalPrice = booking.totalAmount;
    const newPrice = targetRoute.price;
    const priceDifference = newPrice - originalPrice;

    // Create transfer record
    const transfer = await prisma.bookingTransfer.create({
      data: {
        bookingId,
        userId: booking.userId,
        fromRouteId: booking.routeId,
        toRouteId: newRouteId,
        fromTravelDate: booking.travelDate,
        toTravelDate: newTravelDate,
        reason,
        reasonText: reasonDetails || `Admin-initiated transfer by manager ${managerId}`,
        fromSeatNumber: booking.seatNumber,
        toSeatNumber: booking.seatNumber,
        originalAmount: originalPrice,
        newAmount: newPrice,
        priceDifference,
        status: autoApprove ? TransferStatus.APPROVED : TransferStatus.PENDING,
        reviewedBy: autoApprove ? managerId : null,
        reviewedAt: autoApprove ? new Date() : null,
      },
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
        booking: true,
        fromRoute: true,
        toRoute: true,
      },
    });

    // If auto-approve, execute the transfer immediately
    if (autoApprove) {
      try {
        await executeTransfer(
          booking.id,
          newRouteId,
          newTravelDate,
          booking.seatNumber,
          newPrice,
          managerId,
          transfer.id
        );

        // Fetch updated transfer with relations
        const updatedTransfer = await prisma.bookingTransfer.findUnique({
          where: { id: transfer.id },
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
            booking: true,
            fromRoute: true,
            toRoute: true,
          },
        });

        return res.status(201).json({
          success: true,
          message: 'Transfer created and executed successfully',
          data: updatedTransfer,
        });
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: 'Transfer created but execution failed: ' + (error instanceof Error ? error.message : 'Unknown error'),
        });
      }
    }

    return res.status(201).json({
      success: true,
      message: 'Transfer request created successfully',
      data: transfer,
    });
  } catch (error) {
    console.error('Error creating transfer for customer:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create transfer request',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Batch transfer multiple bookings
 * POST /api/manager/transfers/batch
 */
export const batchTransferBookings = async (req: Request, res: Response) => {
  try {
    const managerId = (req as any).user?.id;
    const {
      bookingIds,
      targetTravelDate,
      targetRouteId,
      reason,
      reasonDetails,
      autoApprove = false,
    } = req.body;

    // Validate required fields
    if (!bookingIds || !Array.isArray(bookingIds) || bookingIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one booking ID is required',
      });
    }

    if (!targetTravelDate && !targetRouteId) {
      return res.status(400).json({
        success: false,
        message: 'At least one of targetTravelDate or targetRouteId must be provided',
      });
    }

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Reason is required',
      });
    }

    const results = {
      successful: [] as any[],
      failed: [] as any[],
    };

    // Process each booking
    for (const bookingId of bookingIds) {
      try {
        // Fetch the booking
        const booking = await prisma.booking.findUnique({
          where: { id: bookingId },
          include: {
            user: true,
            route: true,
          },
        });

        if (!booking) {
          results.failed.push({
            bookingId,
            error: 'Booking not found',
          });
          continue;
        }

        if (booking.status !== BookingStatus.CONFIRMED) {
          results.failed.push({
            bookingId,
            error: 'Only confirmed bookings can be transferred',
          });
          continue;
        }

        // Check for existing pending transfer
        const existingTransfer = await prisma.bookingTransfer.findFirst({
          where: {
            bookingId,
            status: TransferStatus.PENDING,
          },
        });

        if (existingTransfer) {
          results.failed.push({
            bookingId,
            error: 'Already has a pending transfer',
          });
          continue;
        }

        const newTravelDate = targetTravelDate ? new Date(targetTravelDate) : booking.travelDate;
        const newRouteId = targetRouteId || booking.routeId;

        // Calculate price difference
        let newPrice = booking.totalAmount;
        if (targetRouteId && targetRouteId !== booking.routeId) {
          const targetRoute = await prisma.route.findUnique({
            where: { id: targetRouteId },
          });
          if (targetRoute) {
            newPrice = targetRoute.price;
          }
        }

        const priceDifference = newPrice - booking.totalAmount;

        // Create transfer record
        const transfer = await prisma.bookingTransfer.create({
          data: {
            bookingId,
            userId: booking.userId,
            fromRouteId: booking.routeId,
            toRouteId: newRouteId,
            fromTravelDate: booking.travelDate,
            toTravelDate: newTravelDate,
            reason,
            reasonText: reasonDetails || `Batch transfer by manager ${managerId}`,
            fromSeatNumber: booking.seatNumber,
            toSeatNumber: booking.seatNumber,
            originalAmount: booking.totalAmount,
            newAmount: newPrice,
            priceDifference,
            status: autoApprove ? TransferStatus.APPROVED : TransferStatus.PENDING,
            reviewedBy: autoApprove ? managerId : null,
            reviewedAt: autoApprove ? new Date() : null,
          },
        });

        // If auto-approve, execute the transfer
        if (autoApprove) {
          await executeTransfer(
            booking.id,
            newRouteId,
            newTravelDate,
            booking.seatNumber,
            newPrice,
            managerId,
            transfer.id
          );
        }

        results.successful.push({
          bookingId,
          transferId: transfer.id,
        });
      } catch (error) {
        results.failed.push({
          bookingId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: `Batch transfer completed. ${results.successful.length} successful, ${results.failed.length} failed`,
      data: results,
    });
  } catch (error) {
    console.error('Error processing batch transfer:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process batch transfer',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
