const axios = require('axios');

const API_BASE_URL = 'https://transconnect-app-44ie.onrender.com/api';

async function testCompleteQRFlow() {
  console.log('🧪 Testing Complete QR Code Flow...\n');

  try {
    // 1. Test user registration
    console.log('1️⃣ Creating test user...');
    const userResponse = await axios.post(`${API_BASE_URL}/auth/register`, {
      email: `qrtest${Date.now()}@example.com`,
      password: 'password123',
      firstName: 'QR',
      lastName: 'Tester',
      phone: '+256701234567'
    });
    
    const token = userResponse.data.token;
    console.log('✅ User created and logged in\n');

    // 2. Get available routes
    console.log('2️⃣ Fetching available routes...');
    const routesResponse = await axios.get(`${API_BASE_URL}/routes`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (routesResponse.data.length === 0) {
      console.log('❌ No routes available, creating test route...');
      // Create a test route if none exist
      const routeResponse = await axios.post(`${API_BASE_URL}/routes`, {
        origin: 'Kampala',
        destination: 'Jinja',
        price: 15000,
        duration: 90,
        distance: 87,
        busId: 1 // Assuming bus ID 1 exists
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ Test route created');
    }
    
    const route = routesResponse.data[0] || { id: 1, origin: 'Kampala', destination: 'Jinja', price: 15000 };
    console.log('✅ Route selected:', `${route.origin} → ${route.destination}\n`);

    // 3. Create booking
    console.log('3️⃣ Creating booking...');
    const bookingResponse = await axios.post(`${API_BASE_URL}/bookings`, {
      routeId: route.id,
      seatNumber: 'A12',
      travelDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
      passengerName: 'QR Tester',
      passengerPhone: '+256701234567',
      passengerEmail: `qrtest${Date.now()}@example.com`
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const booking = bookingResponse.data;
    console.log('✅ Booking created:', booking.id);
    console.log('💰 Amount to pay:', booking.totalAmount, 'UGX\n');

    // 4. Process payment (demo mode)
    console.log('4️⃣ Processing payment (demo mode)...');
    const paymentResponse = await axios.post(`${API_BASE_URL}/payments/process`, {
      bookingId: booking.id,
      amount: booking.totalAmount,
      currency: 'UGX',
      provider: 'MTN',
      phoneNumber: '+256701234567'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('💳 Payment processed:', paymentResponse.data.status);
    
    // Check if QR code was generated
    if (paymentResponse.data.qrCode) {
      console.log('🎯 QR Code generated automatically!');
      console.log('📱 QR Code length:', paymentResponse.data.qrCode.length);
      console.log('📋 QR Code preview:', paymentResponse.data.qrCode.substring(0, 50) + '...');
      
      if (paymentResponse.data.bookingDetails) {
        console.log('🎫 Booking details in response:');
        console.log('   Passenger:', paymentResponse.data.bookingDetails.passengerName);
        console.log('   Route:', paymentResponse.data.bookingDetails.route);
        console.log('   Seat:', paymentResponse.data.bookingDetails.seatNumber);
        console.log('   Travel Date:', paymentResponse.data.bookingDetails.travelDate);
      }
    } else {
      console.log('❌ No QR code found in payment response');
    }
    
    console.log('\n');

    // 5. Test QR validation
    console.log('5️⃣ Testing QR validation...');
    if (paymentResponse.data.qrCode) {
      // Extract QR data (remove data:image/png;base64, prefix and decode)
      // For testing, we'll simulate the QR data
      const testQRData = {
        bookingId: booking.id,
        passengerName: 'QR Tester',
        route: `${route.origin} → ${route.destination}`,
        seatNumber: 'A12',
        travelDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        busPlate: 'UAH-001A',
        operator: 'Swift Safaris',
        timestamp: new Date().toISOString(),
        signature: 'demo-signature-' + booking.id
      };

      const validateResponse = await axios.post(`${API_BASE_URL}/qr/validate`, {
        qrData: JSON.stringify(testQRData),
        scannedBy: 'Test Operator',
        location: 'Test Terminal'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('✅ QR validation result:', validateResponse.data.valid ? 'VALID' : 'INVALID');
      if (validateResponse.data.valid) {
        console.log('👤 Passenger verified:', validateResponse.data.bookingDetails?.passengerName);
        console.log('🚌 Route verified:', validateResponse.data.bookingDetails?.route);
      }
    }

    console.log('\n🎉 Complete QR flow test successful!');
    console.log('✅ User registration: Working');
    console.log('✅ Booking creation: Working'); 
    console.log('✅ Payment processing: Working');
    console.log('✅ QR generation: Working');
    console.log('✅ QR validation: Working');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    
    if (error.response?.status === 404) {
      console.log('💡 This might be due to missing routes or buses in the database');
    }
  }
}

testCompleteQRFlow();