/**
 * Transfer Service
 * Phase 1 Week 4: Booking Transfer System
 * 
 * Business logic for booking transfers
 */

import { prisma } from '../index';
import { Booking, Route, Payment, PaymentMethod, PaymentStatus } from '@prisma/client';

/**
 * Check if a seat is available on a specific route and date
 */
export const checkSeatAvailability = async (
  routeId: string,
  travelDate: Date,
  seatNumber: string
): Promise<boolean> => {
  try {
    // Check if seat is already booked for this route and date
    const existingBooking = await prisma.booking.findFirst({
      where: {
        routeId,
        travelDate,
        seatNumber,
        status: {
          in: ['PENDING', 'CONFIRMED'], // Exclude CANCELLED
        },
      },
    });

    return !existingBooking;
  } catch (error) {
    console.error('Error checking seat availability:', error);
    throw new Error('Failed to check seat availability');
  }
};

/**
 * Calculate price difference between original and target booking
 */
export const calculatePriceDifference = async (
  booking: Booking & { route: Route },
  toRoute: Route,
  toTravelDate: Date
): Promise<{ priceDifference: number; newAmount: number }> => {
  try {
    // Start with base route price
    let newAmount = toRoute.price;

    // If same route but different date, check for date-based price variations
    if (booking.routeId === toRoute.id) {
      // Check if target date has weekend/holiday pricing
      const dayOfWeek = toTravelDate.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      if (isWeekend && toRoute.segmentEnabled) {
        // Check for weekend price variations
        const segments = await prisma.routeSegment.findMany({
          where: { routeId: toRoute.id },
          include: {
            priceVariations: {
              where: {
                active: true,
                variationType: 'weekend',
              },
            },
          },
        });

        // Apply weekend premium if exists
        if (segments.length > 0 && segments[0].priceVariations.length > 0) {
          const variation = segments[0].priceVariations[0];
          if (variation.adjustmentType === 'percentage') {
            newAmount += (newAmount * parseFloat(variation.priceAdjustment.toString())) / 100;
          } else {
            newAmount += parseFloat(variation.priceAdjustment.toString());
          }
        }
      }
    } else {
      // Different routes - use actual stopover prices if available
      if (booking.actualPrice) {
        // Original booking used stopover pricing
        newAmount = toRoute.price; // Use full route price for new route
      }
    }

    const priceDifference = newAmount - booking.totalAmount;

    return {
      priceDifference: Math.round(priceDifference * 100) / 100, // Round to 2 decimals
      newAmount: Math.round(newAmount * 100) / 100,
    };
  } catch (error) {
    console.error('Error calculating price difference:', error);
    throw new Error('Failed to calculate price difference');
  }
};

/**
 * Execute a booking transfer (update the booking record)
 */
export const executeTransfer = async (
  bookingId: string,
  toRouteId: string,
  toTravelDate: Date,
  toSeatNumber: string,
  newAmount: number,
  changedBy: string,
  transferId: string
): Promise<void> => {
  try {
    // Get current booking
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    // Create seat history record before updating
    await prisma.bookingSeatHistory.create({
      data: {
        bookingId,
        transferId,
        oldSeatNumber: booking.seatNumber,
        newSeatNumber: toSeatNumber,
        oldRouteId: booking.routeId,
        newRouteId: toRouteId,
        oldTravelDate: booking.travelDate,
        newTravelDate: toTravelDate,
        changeReason: 'TRANSFER',
        changedBy,
        notes: `Transfer approved and executed`,
      },
    });

    // Update the booking
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        routeId: toRouteId,
        travelDate: toTravelDate,
        seatNumber: toSeatNumber,
        totalAmount: newAmount,
        actualPrice: newAmount, // Update actual price too
        updatedAt: new Date(),
      },
    });

    console.log(`Booking ${bookingId} transferred successfully`);
  } catch (error) {
    console.error('Error executing transfer:', error);
    throw new Error('Failed to execute transfer');
  }
};

/**
 * Create a payment record for price difference
 */
export const createPaymentForDifference = async (
  bookingId: string,
  userId: string,
  amount: number
): Promise<Payment> => {
  try {
    // Create a new pending payment for the difference
    const payment = await prisma.payment.create({
      data: {
        bookingId,
        userId,
        amount,
        method: PaymentMethod.CASH, // Default to CASH, customer can change
        status: PaymentStatus.PENDING,
        metadata: {
          type: 'TRANSFER_PRICE_DIFFERENCE',
          description: 'Additional payment for booking transfer',
        },
      },
    });

    return payment;
  } catch (error) {
    console.error('Error creating payment for difference:', error);
    throw new Error('Failed to create payment record');
  }
};

/**
 * Process a refund for price decreases
 */
export const processRefund = async (
  bookingId: string,
  refundAmount: number
): Promise<void> => {
  try {
    // Find the original payment
    const payment = await prisma.payment.findFirst({
      where: { bookingId },
      orderBy: { createdAt: 'desc' },
    });

    if (!payment) {
      console.warn(`No payment found for booking ${bookingId}`);
      return;
    }

    // Update payment status to indicate refund needed
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.REFUNDED,
        metadata: {
          ...((payment.metadata as object) || {}),
          refundAmount,
          refundReason: 'TRANSFER_PRICE_DECREASE',
          refundProcessedAt: new Date().toISOString(),
        },
      },
    });

    // TODO: Integrate with actual payment gateway to process refund
    // For now, we just mark it for manual processing

    console.log(`Refund of ${refundAmount} marked for booking ${bookingId}`);
  } catch (error) {
    console.error('Error processing refund:', error);
    throw new Error('Failed to process refund');
  }
};

/**
 * Get available seats for a route on a specific date
 */
export const getAvailableSeats = async (
  routeId: string,
  travelDate: Date
): Promise<string[]> => {
  try {
    // Get route with bus capacity
    const route = await prisma.route.findUnique({
      where: { id: routeId },
      include: {
        bus: true,
      },
    });

    if (!route) {
      throw new Error('Route not found');
    }

    const capacity = route.bus.capacity;

    // Generate all possible seat numbers (A1, A2, B1, B2, etc.)
    const rows = ['A', 'B', 'C', 'D', 'E', 'F']; // Up to 6 rows
    const seatsPerRow = Math.ceil(capacity / rows.length);
    const allSeats: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      for (let j = 1; j <= seatsPerRow; j++) {
        const seatNumber = `${rows[i]}${j}`;
        allSeats.push(seatNumber);
        if (allSeats.length >= capacity) break;
      }
      if (allSeats.length >= capacity) break;
    }

    // Get booked seats
    const bookedSeats = await prisma.booking.findMany({
      where: {
        routeId,
        travelDate,
        status: {
          in: ['PENDING', 'CONFIRMED'],
        },
      },
      select: {
        seatNumber: true,
      },
    });

    const bookedSeatNumbers = bookedSeats.map((b) => b.seatNumber);

    // Return available seats
    return allSeats.filter((seat) => !bookedSeatNumbers.includes(seat));
  } catch (error) {
    console.error('Error getting available seats:', error);
    throw new Error('Failed to get available seats');
  }
};

/**
 * Validate a transfer request before submission
 */
export const validateTransferRequest = async (
  bookingId: string,
  userId: string,
  toRouteId: string,
  toTravelDate: Date
): Promise<{ valid: boolean; message?: string }> => {
  try {
    // Check booking exists and belongs to user
    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        userId,
      },
    });

    if (!booking) {
      return {
        valid: false,
        message: 'Booking not found or does not belong to you',
      };
    }

    // Check booking status
    if (booking.status !== 'CONFIRMED') {
      return {
        valid: false,
        message: 'Only confirmed bookings can be transferred',
      };
    }

    // Check if booking date hasn't passed
    if (booking.travelDate < new Date()) {
      return {
        valid: false,
        message: 'Cannot transfer a booking for a past date',
      };
    }

    // Check for existing pending transfer
    const pendingTransfer = await prisma.bookingTransfer.findFirst({
      where: {
        bookingId,
        status: 'PENDING',
      },
    });

    if (pendingTransfer) {
      return {
        valid: false,
        message: 'You already have a pending transfer for this booking',
      };
    }

    // Check target route exists and is active
    const toRoute = await prisma.route.findUnique({
      where: { id: toRouteId },
    });

    if (!toRoute || !toRoute.active) {
      return {
        valid: false,
        message: 'Target route is not available',
      };
    }

    // Check target date is in the future
    if (toTravelDate < new Date()) {
      return {
        valid: false,
        message: 'Cannot transfer to a past date',
      };
    }

    return { valid: true };
  } catch (error) {
    console.error('Error validating transfer request:', error);
    return {
      valid: false,
      message: 'Failed to validate transfer request',
    };
  }
};
