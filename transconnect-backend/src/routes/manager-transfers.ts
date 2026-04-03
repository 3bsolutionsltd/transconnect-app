/**
 * Manager Transfer Routes
 * Phase 1 Week 4: Booking Transfer System
 * 
 * Manager/Admin endpoints for reviewing and managing booking transfers
 */

import { Router } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth';
import {
  getPendingTransfers,
  reviewTransfer,
  getTransferHistory,
  getTransferStatistics,
  createTransferForCustomer,
  batchTransferBookings,
} from '../controllers/managerTransferController';

const router = Router();

// Apply authentication middleware
router.use(authenticateToken);

// Require MANAGER or ADMIN role for all routes
router.use(requireRole(['MANAGER', 'ADMIN']));

/**
 * @route   POST /api/manager/transfers/create
 * @desc    Create a transfer on behalf of a customer (admin-initiated)
 * @access  Private (Manager/Admin)
 */
router.post('/create', createTransferForCustomer);

/**
 * @route   POST /api/manager/transfers/batch
 * @desc    Batch transfer multiple bookings
 * @access  Private (Manager/Admin)
 */
router.post('/batch', batchTransferBookings);

/**
 * @route   GET /api/manager/transfers/pending
 * @desc    Get all pending transfer requests
 * @access  Private (Manager/Admin)
 */
router.get('/pending', getPendingTransfers);

/**
 * @route   POST /api/manager/transfers/:transferId/review
 * @desc    Approve or reject a transfer request
 * @access  Private (Manager/Admin)
 */
router.post('/:transferId/review', reviewTransfer);

/**
 * @route   GET /api/manager/transfers/history
 * @desc    Get transfer history with filters
 * @access  Private (Manager/Admin)
 */
router.get('/history', getTransferHistory);

/**
 * @route   GET /api/manager/transfers/statistics
 * @desc    Get transfer statistics and analytics
 * @access  Private (Manager/Admin)
 */
router.get('/statistics', getTransferStatistics);

export default router;
