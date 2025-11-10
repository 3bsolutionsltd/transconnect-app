'use client';
import React from 'react';
import { Button } from '@/components/ui/button';
import { useNotificationService } from '@/lib/notificationService';

export default function NotificationDemo() {
  const notificationService = useNotificationService();

  const testNotifications = [
    {
      label: 'Test Booking Success',
      action: () => notificationService.onBookingCreated('BK123456', 'Kampala → Jinja'),
    },
    {
      label: 'Test Payment Success',
      action: () => notificationService.onPaymentSuccess(15000, 'MTN Mobile Money'),
    },
    {
      label: 'Test Payment Failed',
      action: () => notificationService.onPaymentFailed('Insufficient funds'),
    },
    {
      label: 'Test Trip Reminder',
      action: () => notificationService.onTripReminder('Kampala → Jinja', '8:00 AM tomorrow'),
    },
    {
      label: 'Test QR Ticket Ready',
      action: () => notificationService.onQrTicketReady('BK123456'),
    },
    {
      label: 'Test Account Verified',
      action: () => notificationService.onAccountVerified(),
    },
    {
      label: 'Test Low Balance',
      action: () => notificationService.onLowBalance(2000),
    },
    {
      label: 'Test System Maintenance',
      action: () => notificationService.onSystemMaintenance('11:00 PM tonight', '2 hours'),
    },
    {
      label: 'Test Promotion',
      action: () => notificationService.onPromotion('50% Off Weekend Trips', 'Book your weekend getaway now and save 50%!', 'https://transconnect.vercel.app/search'),
    },
  ];

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <h3 className="text-lg font-semibold mb-4">Notification System Demo</h3>
      <p className="text-gray-600 mb-6">Click the buttons below to test different notification types:</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {testNotifications.map((test, index) => (
          <Button
            key={index}
            variant="outline"
            size="sm"
            onClick={test.action}
            className="text-left justify-start"
          >
            {test.label}
          </Button>
        ))}
      </div>
      
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">🔔 How to test:</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Click any button above to trigger a notification</li>
          <li>• Watch for the bell icon to animate and show unread count</li>
          <li>• Notifications appear as toasts on the right side</li>
          <li>• Click the bell icon to open the notification center</li>
          <li>• Persistent notifications (payments, bookings) stay until dismissed</li>
          <li>• Regular notifications auto-dismiss after 5 seconds</li>
        </ul>
      </div>
    </div>
  );
}