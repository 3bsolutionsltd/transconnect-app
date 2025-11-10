/**
 * Notification Service for TransConnect App
 * Handles various notification types throughout the application lifecycle
 */

import { useNotifications, NotificationTemplates } from '@/contexts/NotificationContext';

export interface NotificationService {
  // Booking related notifications
  onBookingCreated: (bookingId: string, routeDetails: string) => void;
  onBookingCancelled: (bookingId: string, routeDetails: string) => void;
  onSeatChanged: (oldSeat: string, newSeat: string) => void;
  
  // Payment related notifications
  onPaymentSuccess: (amount: number, method: string) => void;
  onPaymentFailed: (reason: string) => void;
  onRefundProcessed: (amount: number, bookingId: string) => void;
  
  // Trip related notifications
  onTripReminder: (routeDetails: string, departureTime: string) => void;
  onTripCancelled: (routeDetails: string, reason: string) => void;
  onQrTicketReady: (bookingId: string) => void;
  
  // Account related notifications
  onAccountVerified: () => void;
  onLowBalance: (balance: number) => void;
  
  // System notifications
  onSystemMaintenance: (startTime: string, duration: string) => void;
  onPromotion: (title: string, description: string, actionUrl?: string) => void;
  
  // General purpose notifications
  showSuccess: (title: string, message: string, action?: { label: string; onClick: () => void }) => void;
  showError: (title: string, message: string, action?: { label: string; onClick: () => void }) => void;
  showWarning: (title: string, message: string, action?: { label: string; onClick: () => void }) => void;
  showInfo: (title: string, message: string, action?: { label: string; onClick: () => void }) => void;
}

export const useNotificationService = (): NotificationService => {
  const { addNotification } = useNotifications();

  return {
    // Booking notifications
    onBookingCreated: (bookingId: string, routeDetails: string) => {
      addNotification(NotificationTemplates.bookingCreated(bookingId, routeDetails));
    },

    onBookingCancelled: (bookingId: string, routeDetails: string) => {
      addNotification({
        type: 'warning',
        title: 'Booking Cancelled ⚠️',
        message: `Your booking ${bookingId} for ${routeDetails} has been cancelled successfully.`,
        persistent: true,
      });
    },

    onSeatChanged: (oldSeat: string, newSeat: string) => {
      addNotification(NotificationTemplates.seatChanged(oldSeat, newSeat));
    },

    // Payment notifications
    onPaymentSuccess: (amount: number, method: string) => {
      addNotification(NotificationTemplates.paymentConfirmed(amount, method));
    },

    onPaymentFailed: (reason: string) => {
      addNotification(NotificationTemplates.paymentFailed(reason));
    },

    onRefundProcessed: (amount: number, bookingId: string) => {
      addNotification(NotificationTemplates.refundProcessed(amount, bookingId));
    },

    // Trip notifications
    onTripReminder: (routeDetails: string, departureTime: string) => {
      addNotification(NotificationTemplates.tripReminder(routeDetails, departureTime));
    },

    onTripCancelled: (routeDetails: string, reason: string) => {
      addNotification(NotificationTemplates.tripCancelled(routeDetails, reason));
    },

    onQrTicketReady: (bookingId: string) => {
      addNotification(NotificationTemplates.qrTicketReady(bookingId));
    },

    // Account notifications
    onAccountVerified: () => {
      addNotification(NotificationTemplates.accountVerified());
    },

    onLowBalance: (balance: number) => {
      addNotification(NotificationTemplates.lowBalance(balance));
    },

    // System notifications
    onSystemMaintenance: (startTime: string, duration: string) => {
      addNotification({
        type: 'warning',
        title: 'Scheduled Maintenance 🔧',
        message: `System maintenance scheduled at ${startTime} for ${duration}. Some features may be temporarily unavailable.`,
        persistent: true,
      });
    },

    onPromotion: (title: string, description: string, actionUrl?: string) => {
      addNotification({
        type: 'info',
        title: `🎉 ${title}`,
        message: description,
        persistent: true,
        ...(actionUrl && {
          action: {
            label: 'Learn More',
            onClick: () => window.open(actionUrl, '_blank'),
          },
        }),
      });
    },

    // General purpose notifications
    showSuccess: (title: string, message: string, action?: { label: string; onClick: () => void }) => {
      addNotification({
        type: 'success',
        title,
        message,
        action,
      });
    },

    showError: (title: string, message: string, action?: { label: string; onClick: () => void }) => {
      addNotification({
        type: 'error',
        title,
        message,
        persistent: true,
        action,
      });
    },

    showWarning: (title: string, message: string, action?: { label: string; onClick: () => void }) => {
      addNotification({
        type: 'warning',
        title,
        message,
        action,
      });
    },

    showInfo: (title: string, message: string, action?: { label: string; onClick: () => void }) => {
      addNotification({
        type: 'info',
        title,
        message,
        action,
      });
    },
  };
};

// Utility functions for common notification patterns
export const NotificationUtils = {
  /**
   * Creates a trip reminder notification for 24 hours before departure
   */
  scheduleTripReminder: (bookingId: string, routeDetails: string, departureTime: Date) => {
    const reminderTime = new Date(departureTime.getTime() - 24 * 60 * 60 * 1000); // 24 hours before
    const now = new Date();
    
    if (reminderTime > now) {
      const timeoutMs = reminderTime.getTime() - now.getTime();
      setTimeout(() => {
        // This would typically be handled by a backend service or push notification
        console.log(`Trip reminder for ${bookingId}: ${routeDetails} departing at ${departureTime.toLocaleString()}`);
      }, timeoutMs);
    }
  },

  /**
   * Formats route details for notification display
   */
  formatRouteDetails: (origin: string, destination: string, departureTime?: string) => {
    return `${origin} → ${destination}${departureTime ? ` at ${departureTime}` : ''}`;
  },

  /**
   * Formats currency amounts for notifications
   */
  formatAmount: (amount: number, currency = 'UGX') => {
    return `${currency} ${amount.toLocaleString()}`;
  },
};