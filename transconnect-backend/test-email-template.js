// Test email functionality
const { EmailService } = require('./src/services/email.service');

async function testEmailService() {
  const emailService = EmailService.getInstance();
  
  console.log('Testing email service...');
  
  try {
    const result = await emailService.sendBookingConfirmation('lukuduthomas@gmail.com', {
      bookingId: 'TEST-BOOKING-123',
      passengerName: 'Thomas Lukudu',
      route: 'Kampala → Entebbe',
      date: '2025-01-15',
      time: '08:30 AM',
      seatNumber: 'A1',
      amount: 15000,
      qrCode: 'TEST-QR-CODE-123'
    });
    
    console.log('Email sent successfully:', result);
  } catch (error) {
    console.error('Error sending email:', error);
  }
}

testEmailService();