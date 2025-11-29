const { PrismaClient } = require('@prisma/client');

async function testBookingDebug() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Testing booking creation debug...');
    
    // Test 1: Check if route exists
    const route = await prisma.route.findUnique({
      where: { id: 1 },
      include: {
        bus: true,
        operator: true,
        stops: {
          orderBy: { order: 'asc' }
        }
      }
    });
    
    if (!route) {
      console.error('Route not found');
      return;
    }
    
    console.log('Route found:', {
      id: route.id,
      origin: route.origin,
      destination: route.destination,
      price: route.price,
      active: route.active,
      busCapacity: route.bus?.capacity,
      stopsCount: route.stops?.length
    });
    
    // Test 2: Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: 1 }
    });
    
    if (!user) {
      console.error('User not found');
      return;
    }
    
    console.log('User found:', {
      id: user.id,
      email: user.email,
      firstName: user.firstName
    });
    
    // Test 3: Try creating a simple booking
    const bookingData = {
      userId: 1,
      routeId: 1,
      seatNumber: "1",
      travelDate: new Date('2024-12-01'),
      qrCode: "test-qr-code",
      totalAmount: 25000,
      status: 'PENDING'
    };
    
    console.log('Attempting to create booking with data:', bookingData);
    
    const booking = await prisma.booking.create({
      data: bookingData
    });
    
    console.log('Booking created successfully:', booking);
    
    // Clean up test booking
    await prisma.booking.delete({
      where: { id: booking.id }
    });
    
    console.log('Test booking cleaned up');
    
  } catch (error) {
    console.error('Error in booking test:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta
    });
  } finally {
    await prisma.$disconnect();
  }
}

testBookingDebug();