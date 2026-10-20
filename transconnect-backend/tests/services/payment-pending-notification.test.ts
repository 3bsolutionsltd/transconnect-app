import { EmailService } from '../../src/services/email.service';
import { NotificationService } from '../../src/services/notification.service';

describe('pending-payment booking notifications', () => {
  it('marks booking-received notifications as pending instead of confirmed', async () => {
    const service = Object.create(NotificationService.prototype) as NotificationService;
    const sendNotification = jest.spyOn(service, 'sendNotification').mockResolvedValue({
      success: true,
      results: [],
    });

    await service.sendBookingReceived({
      userId: 'user-1',
      bookingId: 'booking-1',
      passengerName: 'Test Passenger',
      route: 'Kampala to Gulu',
      date: '10/08/2026',
      time: '09:00',
      seatNumber: '12',
      amount: 15000,
    });

    expect(sendNotification).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Booking Received - Payment Pending',
      body: expect.stringContaining('Payment is pending'),
      data: expect.objectContaining({
        bookingStatus: 'PENDING',
        paymentStatus: 'PENDING',
      }),
    }));
  });

  it('keeps payment confirmation as the only notification that declares payment successful', async () => {
    const service = Object.create(NotificationService.prototype) as NotificationService;
    const sendNotification = jest.spyOn(service, 'sendNotification').mockResolvedValue({
      success: true,
      results: [],
    });

    await service.sendPaymentConfirmation({
      userId: 'user-1',
      bookingId: 'booking-1',
      passengerName: 'Test Passenger',
      amount: 15000,
      method: 'Cash Payment',
      transactionId: 'cash-ref-1',
    });

    expect(sendNotification).toHaveBeenCalledWith(expect.objectContaining({
      type: 'PAYMENT_SUCCESS',
      title: 'Payment Confirmed!',
      data: expect.objectContaining({ bookingStatus: 'CONFIRMED' }),
    }));
  });

  it('sends a pending email without claiming the fare was paid or providing an active ticket', async () => {
    const service = Object.create(EmailService.prototype) as EmailService;
    const sendEmail = jest.spyOn(service, 'sendEmail').mockResolvedValue({ success: true });

    await service.sendBookingReceived('passenger@example.com', {
      bookingId: 'booking-1',
      passengerName: 'Test Passenger',
      route: 'Kampala to Gulu',
      date: '10/08/2026',
      time: '09:00',
      seatNumber: '12',
      amount: 15000,
    });

    const [email, subject, html, text] = sendEmail.mock.calls[0];
    expect(email).toBe('passenger@example.com');
    expect(subject).toContain('Payment Pending');
    expect(`${html} ${text}`).toContain('Amount due');
    expect(`${html} ${text}`).not.toContain('Amount Paid');
    expect(`${html} ${text}`).not.toContain('Your QR Ticket');
  });
});
