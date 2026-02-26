/**
 * Booking Transfer Routes
 * Phase 1 Week 4: Booking Transfer System
 * 
 * Customer endpoints for requesting booking transfers
 */

import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  requestTransfer,
  getMyTransfers,
  cancelTransfer,
  getTransferById,
} from '../controllers/bookingTransferController';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

/**
 * @route   POST /api/bookings/:bookingId/transfers
 * @desc    Request a booking transfer (customer)
 * @access  Private (Customer - must own the booking)
 */
router.post('/:bookingId/transfers', requestTransfer);

/**
 * @route   GET /api/bookings/transfers/my-requests
 * @desc    Get all transfer requests by the authenticated customer
 * @access  Private (Customer)
 */
router.get('/transfers/my-requests', getMyTransfers);

/**
 * @route   GET /api/bookings/transfers/:transferId
 * @desc    Get a specific transfer request details
 * @access  Private (Customer - must own the transfer)
 */
router.get('/transfers/:transferId', getTransferById);

/**
 * @route   DELETE /api/bookings/transfers/:transferId
 * @desc    Cancel a transfer request (only if PENDING)
 * @access  Private (Customer - must own the transfer)
 */
router.delete('/transfers/:transferId', cancelTransfer);

export default router;
