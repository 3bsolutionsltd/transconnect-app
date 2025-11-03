import { PrismaClient, NotificationType, NotificationChannel } from '@prisma/client';

const prisma = new PrismaClient();

async function seedNotificationTemplates() {
  console.log('🌱 Seeding notification templates...');

  const templates = [
    {
      name: 'booking_confirmation',
      type: 'BOOKING_CONFIRMATION' as NotificationType,
      channel: ['EMAIL', 'PUSH', 'IN_APP'] as NotificationChannel[],
      subject: 'Booking Confirmed - {{bookingId}}',
      title: 'Booking Confirmed!',
      body: 'Your ticket for {{route}} on {{date}} has been confirmed. Seat {{seatNumber}}.',
      variables: {
        bookingId: 'Booking reference number',
        route: 'Travel route (origin to destination)',
        date: 'Travel date',
        time: 'Departure time',
        seatNumber: 'Assigned seat number',
        amount: 'Total amount paid',
        qrCode: 'QR code for boarding',
        passengerName: 'Passenger full name'
      },
      isActive: true
    },
    {
      name: 'payment_success',
      type: 'PAYMENT_SUCCESS',
      channel: ['EMAIL', 'PUSH', 'IN_APP'],
      subject: 'Payment Confirmed - {{transactionId}}',
      title: 'Payment Successful!',
      body: 'Your payment of UGX {{amount}} via {{method}} was successful.',
      variables: {
        transactionId: 'Payment transaction ID',
        amount: 'Payment amount',
        method: 'Payment method used',
        bookingId: 'Related booking ID',
        passengerName: 'Passenger full name'
      },
      isActive: true
    },
    {
      name: 'payment_failed',
      type: 'PAYMENT_FAILED',
      channel: ['EMAIL', 'PUSH', 'IN_APP'],
      subject: 'Payment Failed - Action Required',
      title: 'Payment Failed',
      body: 'Your payment of UGX {{amount}} could not be processed. {{reason}}',
      variables: {
        amount: 'Payment amount',
        method: 'Payment method used',
        reason: 'Failure reason',
        bookingId: 'Related booking ID'
      },
      isActive: true
    },
    {
      name: 'trip_reminder',
      type: 'TRIP_REMINDER',
      channel: ['EMAIL', 'PUSH', 'SMS'],
      subject: 'Trip Reminder - {{route}} Tomorrow',
      title: 'Trip Reminder',
      body: 'Your trip {{route}} is tomorrow at {{time}}. Seat {{seatNumber}}.',
      variables: {
        route: 'Travel route',
        date: 'Travel date',
        time: 'Departure time',
        seatNumber: 'Seat number',
        boardingPoint: 'Boarding location',
        passengerName: 'Passenger full name'
      },
      isActive: true
    },
    {
      name: 'bus_delayed',
      type: 'BUS_DELAYED',
      channel: ['PUSH', 'SMS', 'IN_APP'],
      subject: 'Bus Delay Notification',
      title: 'Bus Delayed',
      body: 'Your bus {{route}} has been delayed by {{delayMinutes}} minutes. New departure time: {{newTime}}',
      variables: {
        route: 'Travel route',
        delayMinutes: 'Delay duration in minutes',
        newTime: 'Updated departure time',
        originalTime: 'Original departure time'
      },
      isActive: true
    },
    {
      name: 'bus_cancelled',
      type: 'BUS_CANCELLED',
      channel: ['EMAIL', 'PUSH', 'SMS', 'IN_APP'],
      subject: 'Trip Cancelled - Refund Initiated',
      title: 'Trip Cancelled',
      body: 'Your trip {{route}} on {{date}} has been cancelled. A full refund will be processed within 3-5 business days.',
      variables: {
        route: 'Travel route',
        date: 'Travel date',
        refundAmount: 'Refund amount',
        refundMethod: 'Refund method'
      },
      isActive: true
    },
    {
      name: 'ride_matched',
      type: 'RIDE_MATCHED',
      channel: ['PUSH', 'IN_APP'],
      subject: 'Ride Match Found',
      title: 'Ride Match Found!',
      body: 'A ride match has been found for your trip {{route}}. Check the app for details.',
      variables: {
        route: 'Travel route',
        matchedRiderId: 'Matched rider ID',
        meetingPoint: 'Meeting location'
      },
      isActive: true
    },
    {
      name: 'account_verification',
      type: 'ACCOUNT_VERIFICATION',
      channel: ['EMAIL'],
      subject: 'Verify Your TransConnect Account',
      title: 'Account Verification Required',
      body: 'Please verify your email address to activate your TransConnect account.',
      variables: {
        verificationLink: 'Email verification link',
        userName: 'User full name'
      },
      isActive: true
    },
    {
      name: 'promotional',
      type: 'PROMOTIONAL',
      channel: ['EMAIL', 'PUSH'],
      subject: '{{offerTitle}} - Limited Time Offer!',
      title: 'Special Offer!',
      body: '{{offerDescription}} Use code {{promoCode}} to save {{discountAmount}}%',
      variables: {
        offerTitle: 'Promotion title',
        offerDescription: 'Promotion description',
        promoCode: 'Discount code',
        discountAmount: 'Discount percentage',
        validUntil: 'Offer expiry date'
      },
      isActive: true
    },
    {
      name: 'system_maintenance',
      type: 'SYSTEM_MAINTENANCE',
      channel: ['EMAIL', 'PUSH', 'IN_APP'],
      subject: 'Scheduled Maintenance - {{maintenanceDate}}',
      title: 'System Maintenance',
      body: 'TransConnect will be under maintenance on {{maintenanceDate}} from {{startTime}} to {{endTime}}. Service may be temporarily unavailable.',
      variables: {
        maintenanceDate: 'Maintenance date',
        startTime: 'Maintenance start time',
        endTime: 'Maintenance end time',
        estimatedDuration: 'Expected duration'
      },
      isActive: true
    }
  ];

  for (const template of templates) {
    try {
      await prisma.notificationTemplate.upsert({
        where: { name: template.name },
        update: template,
        create: template as any,
      });
      console.log(`✅ Created/updated template: ${template.name}`);
    } catch (error) {
      console.error(`❌ Error creating template ${template.name}:`, error);
    }
  }

  console.log('✅ Notification templates seeded successfully!');
}

async function main() {
  try {
    await seedNotificationTemplates();
  } catch (error) {
    console.error('Error seeding notification templates:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main()
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { seedNotificationTemplates };