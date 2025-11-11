import express from 'express';
import { body, query, param, validationResult } from 'express-validator';
import { authenticateToken } from '../middleware/auth';
import { NotificationService } from '../services/notification.service';

const router = express.Router();
const notificationService = NotificationService.getInstance();

/**
 * @route POST /api/notifications/register-token
 * @desc Register FCM device token
 * @access Private
 */
router.post('/register-token', [
  authenticateToken,
  body('token').notEmpty().withMessage('Device token is required'),
  body('platform').isIn(['ANDROID', 'IOS', 'WEB']).withMessage('Valid platform required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { token, platform } = req.body;
    const userId = req.user.userId;

    const success = await notificationService.registerDeviceToken(userId, token, platform);

    if (success) {
      res.json({
        success: true,
        message: 'Device token registered successfully'
      });
    } else {
      res.status(400).json({
        error: 'Failed to register device token'
      });
    }
  } catch (error: any) {
    console.error('Error registering device token:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @route GET /api/notifications
 * @desc Get user notifications
 * @access Private
 */
router.get('/', [
  authenticateToken,
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user.userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await notificationService.getUserNotifications(userId, page, limit);

    res.json(result);
  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @route PUT /api/notifications/:id/read
 * @desc Mark notification as read
 * @access Private
 */
router.put('/:id/read', [
  authenticateToken,
  param('id').notEmpty().withMessage('Notification ID is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const notificationId = req.params.id;
    const userId = req.user.userId;

    const success = await notificationService.markAsRead(notificationId, userId);

    if (success) {
      res.json({
        success: true,
        message: 'Notification marked as read'
      });
    } else {
      res.status(404).json({
        error: 'Notification not found or already read'
      });
    }
  } catch (error: any) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @route PUT /api/notifications/preferences
 * @desc Update notification preferences
 * @access Private
 */
router.put('/preferences', [
  authenticateToken,
  body('email').optional().isBoolean().withMessage('Email preference must be boolean'),
  body('sms').optional().isBoolean().withMessage('SMS preference must be boolean'),
  body('push').optional().isBoolean().withMessage('Push preference must be boolean'),
  body('marketing').optional().isBoolean().withMessage('Marketing preference must be boolean'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user.userId;
    const { email, sms, push, marketing } = req.body;

    const preferences = {
      ...(email !== undefined && { email }),
      ...(sms !== undefined && { sms }),
      ...(push !== undefined && { push }),
      ...(marketing !== undefined && { marketing }),
    };

    const success = await notificationService.updateNotificationPreferences(userId, preferences);

    if (success) {
      res.json({
        success: true,
        message: 'Notification preferences updated successfully'
      });
    } else {
      res.status(500).json({
        error: 'Failed to update notification preferences'
      });
    }
  } catch (error: any) {
    console.error('Error updating notification preferences:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @route POST /api/notifications/test
 * @desc Send test notification (for development)
 * @access Private
 */
router.post('/test', [
  authenticateToken,
  body('title').notEmpty().withMessage('Title is required'),
  body('body').notEmpty().withMessage('Body is required'),
  body('channels').isArray().withMessage('Channels must be an array'),
], async (req, res) => {
  try {
    // Only allow in development/test environment
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ error: 'Test notifications not allowed in production' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user.userId;
    const { title, body, channels, data } = req.body;

    const result = await notificationService.sendNotification({
      userId,
      type: 'GENERAL',
      channels,
      title,
      body,
      data,
    });

    res.json({
      success: result.success,
      results: result.results,
      message: 'Test notification sent'
    });
  } catch (error: any) {
    console.error('Error sending test notification:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @route POST /api/notifications/email
 * @desc Send email notification
 * @access Private
 */
router.post('/email', [
  authenticateToken,
  body('template').notEmpty().withMessage('Email template is required'),
  body('data').isObject().withMessage('Email data is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { template, data } = req.body;
    const userId = req.user.userId;

    // Send notification using the NotificationService which handles email
    const result = await notificationService.sendNotification({
      userId,
      type: 'GENERAL',
      channels: ['EMAIL'],
      title: data.subject,
      body: `Email notification: ${template}`,
      data: {
        template,
        ...data,
      },
    });

    if (result.success) {
      res.json({
        success: true,
        message: 'Email notification sent successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to send email notification'
      });
    }
  } catch (error: any) {
    console.error('Error sending email notification:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

/**
 * @route GET /api/notifications/unread-count
 * @desc Get count of unread notifications
 * @access Private
 */
router.get('/unread-count', [authenticateToken], async (req, res) => {
  try {
    const userId = req.user.userId;

    const { prisma } = await import('../index');
    const unreadCount = await prisma.notification.count({
      where: {
        userId,
        readAt: null,
        status: 'SENT'
      }
    });

    res.json({
      unreadCount
    });
  } catch (error: any) {
    console.error('Error getting unread count:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @route GET /api/notifications/preferences
 * @desc Get user notification preferences
 * @access Private
 */
router.get('/preferences', [authenticateToken], async (req, res) => {
  try {
    const userId = req.user.userId;

    const { prisma } = await import('../index');
    const preferences = await prisma.userNotificationPreference.findUnique({
      where: { userId },
      select: {
        email: true,
        sms: true,
        push: true,
        marketing: true,
      }
    });

    // Return default preferences if none set
    const defaultPreferences = {
      email: true,
      sms: true,
      push: true,
      marketing: false,
    };

    res.json({
      preferences: preferences || defaultPreferences
    });
  } catch (error: any) {
    console.error('Error getting notification preferences:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @route POST /api/notifications/broadcast
 * @desc Send broadcast notification to all users (Admin only)
 * @access Private (Admin)
 */
router.post('/broadcast', [
  authenticateToken,
  body('title').notEmpty().withMessage('Title is required'),
  body('body').notEmpty().withMessage('Body is required'),
  body('type').isIn(['PROMOTIONAL', 'SYSTEM_MAINTENANCE', 'GENERAL']).withMessage('Valid type required'),
  body('channels').isArray().withMessage('Channels must be an array'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check if user is admin
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { title, body, type, channels, data } = req.body;

    // Get all users (limit to active users)
    const { prisma } = await import('../index');
    const users = await prisma.user.findMany({
      where: {
        verified: true,
        // Only send promotional notifications to users who opted in
        ...(type === 'PROMOTIONAL' && {
          notificationPreferences: {
            marketing: true
          }
        })
      },
      select: { id: true }
    });

    // Send notifications in batches to avoid overwhelming the system
    const batchSize = 100;
    const results: any[] = [];

    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);
      const batchPromises = batch.map(user =>
        notificationService.sendNotification({
          userId: user.id,
          type,
          channels,
          title,
          body,
          data,
        })
      );

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;

    res.json({
      success: true,
      message: 'Broadcast notification sent',
      totalUsers: users.length,
      successCount,
      failureCount,
    });
  } catch (error: any) {
    console.error('Error sending broadcast notification:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
