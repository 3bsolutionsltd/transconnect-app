require('dotenv').config();

async function testActualBookingFlow() {
  console.log('Testing actual booking notification flow...');
  
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  
  try {
    // First, let's check if the user exists and get their email
    let user = await prisma.user.findFirst({
      where: {
        email: 'jilord2@gmail.com'
      }
    });
    
    if (!user) {
      console.log('❌ User not found, creating test user...');
      user = await prisma.user.create({
        data: {
          email: 'jilord2@gmail.com',
          firstName: 'Stehen',
          lastName: 'Omwony',
          phone: '+256700' + Math.random().toString().substr(2, 6),
          password: 'hashedpassword123' // Not important for testing
        }
      });
      console.log('✅ Created test user:', user.id);
    }
    
    console.log('✅ Found user:', { id: user.id, email: user.email, name: `${user.firstName} ${user.lastName}` });
    
    const { NotificationService } = require('./src/services/notification.service.ts');
    const notificationService = NotificationService.getInstance();
    
    // Use the real user ID
    console.log('📧 About to send booking confirmation...');
    
    const result = await notificationService.sendBookingConfirmation({
      userId: user.id,
      bookingId: 'cmhvp1uhb000je8qg77wwwwyz',
      passengerName: `${user.firstName} ${user.lastName}`,
      route: 'Kampala → Entebbe',
      date: '2024-11-12',
      time: '08:30 AM',
      seatNumber: 'A1, A2',
      amount: 15000,
      qrCode: 'cmhvp1uhb000je8qg77wwwwyz'
    });
    
    console.log('✅ Booking confirmation sent:', result);
  } catch (error) {
    console.error('❌ Error in booking flow:', error);
  }
}

testActualBookingFlow().catch(console.error);