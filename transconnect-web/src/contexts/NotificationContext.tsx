import React, { createContext, useContext, useReducer, ReactNode } from 'react';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
  persistent?: boolean; // For important notifications that shouldn't auto-dismiss
}

interface NotificationState {
  notifications: Notification[];
}

type NotificationAction =
  | { type: 'ADD_NOTIFICATION'; notification: Notification }
  | { type: 'REMOVE_NOTIFICATION'; id: string }
  | { type: 'MARK_AS_READ'; id: string }
  | { type: 'CLEAR_ALL' };

const NotificationContext = createContext<{
  state: NotificationState;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  removeNotification: (id: string) => void;
  markAsRead: (id: string) => void;
  clearAll: () => void;
} | null>(null);

function notificationReducer(state: NotificationState, action: NotificationAction): NotificationState {
  switch (action.type) {
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [action.notification, ...state.notifications],
      };
    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.id),
      };
    case 'MARK_AS_READ':
      return {
        ...state,
        notifications: state.notifications.map(n =>
          n.id === action.id ? { ...n, read: true } : n
        ),
      };
    case 'CLEAR_ALL':
      return {
        ...state,
        notifications: [],
      };
    default:
      return state;
  }
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(notificationReducer, { notifications: [] });

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: crypto.randomUUID(),
      timestamp: new Date(),
      read: false,
    };
    
    dispatch({ type: 'ADD_NOTIFICATION', notification: newNotification });

    // Auto-remove non-persistent notifications after 5 seconds
    if (!notification.persistent) {
      setTimeout(() => {
        dispatch({ type: 'REMOVE_NOTIFICATION', id: newNotification.id });
      }, 5000);
    }
  };

  const removeNotification = (id: string) => {
    dispatch({ type: 'REMOVE_NOTIFICATION', id });
  };

  const markAsRead = (id: string) => {
    dispatch({ type: 'MARK_AS_READ', id });
  };

  const clearAll = () => {
    dispatch({ type: 'CLEAR_ALL' });
  };

  return (
    <NotificationContext.Provider
      value={{
        state,
        addNotification,
        removeNotification,
        markAsRead,
        clearAll,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

// Predefined notification templates for common actions
export const NotificationTemplates = {
  bookingCreated: (bookingId: string, routeDetails: string) => ({
    type: 'success' as const,
    title: 'Booking Confirmed! 🎉',
    message: `Your booking for ${routeDetails} has been created successfully. Booking ID: ${bookingId}`,
    persistent: true,
    action: {
      label: 'View Booking',
      onClick: () => window.location.href = `/bookings/${bookingId}`,
    },
  }),

  paymentConfirmed: (amount: number, method: string) => ({
    type: 'success' as const,
    title: 'Payment Successful ✅',
    message: `Payment of UGX ${amount.toLocaleString()} via ${method} has been confirmed.`,
    persistent: true,
  }),

  paymentFailed: (reason: string) => ({
    type: 'error' as const,
    title: 'Payment Failed ❌',
    message: `Payment could not be processed: ${reason}. Please try again.`,
    persistent: true,
    action: {
      label: 'Retry Payment',
      onClick: () => window.location.reload(),
    },
  }),

  tripReminder: (routeDetails: string, departureTime: string) => ({
    type: 'info' as const,
    title: 'Trip Reminder 🚌',
    message: `Your ${routeDetails} trip departs at ${departureTime}. Don't forget to arrive 15 minutes early!`,
    persistent: true,
  }),

  qrTicketReady: (bookingId: string) => ({
    type: 'info' as const,
    title: 'QR Ticket Ready 🎫',
    message: `Your QR ticket is ready for scanning. Show this to the conductor when boarding.`,
    action: {
      label: 'View Ticket',
      onClick: () => window.location.href = `/tickets/${bookingId}`,
    },
  }),

  seatChanged: (oldSeat: string, newSeat: string) => ({
    type: 'warning' as const,
    title: 'Seat Change Notice ⚠️',
    message: `Your seat has been changed from ${oldSeat} to ${newSeat} due to bus configuration update.`,
    persistent: true,
  }),

  tripCancelled: (routeDetails: string, reason: string) => ({
    type: 'error' as const,
    title: 'Trip Cancelled 🚫',
    message: `Your ${routeDetails} trip has been cancelled: ${reason}. Full refund will be processed.`,
    persistent: true,
    action: {
      label: 'Contact Support',
      onClick: () => window.location.href = '/support',
    },
  }),

  refundProcessed: (amount: number, bookingId: string) => ({
    type: 'success' as const,
    title: 'Refund Processed 💰',
    message: `Refund of UGX ${amount.toLocaleString()} for booking ${bookingId} has been processed successfully.`,
    persistent: true,
  }),

  accountVerified: () => ({
    type: 'success' as const,
    title: 'Account Verified ✅',
    message: 'Your account has been successfully verified. You now have access to all features.',
  }),

  lowBalance: (balance: number) => ({
    type: 'warning' as const,
    title: 'Low Balance Warning ⚠️',
    message: `Your wallet balance is low (UGX ${balance.toLocaleString()}). Top up to avoid payment failures.`,
    action: {
      label: 'Top Up',
      onClick: () => window.location.href = '/wallet/topup',
    },
  }),
};