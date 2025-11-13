require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

async function testEmailDirectly() {
  console.log('Testing email service directly...');
  
  // Import EmailService
  const { EmailService } = require('./src/services/email.service.ts');
  
  const emailService = EmailService.getInstance();
  
  // Test booking confirmation email
  try {
    const result = await emailService.sendBookingConfirmation('jilord2@gmail.com', {
      bookingId: 'cmhvp1uhb000je8qg77wwwwyz',
      passengerName: 'Kiri Edward',
      route: 'Kampala → Entebbe',
      date: '2024-01-15',
      time: '08:30 AM',
      seatNumber: 'A1, A2',
      amount: 15000,
      qrCode: 'cmhvp1uhb000je8qg77wwwwyz'
    });
    
    console.log('✅ Direct email result:', result);
  } catch (error) {
    console.error('❌ Error sending direct email:', error);
  }
}

testEmailDirectly().catch(console.error);