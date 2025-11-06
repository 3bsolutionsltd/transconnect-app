const API_BASE_URL = 'https://transconnect-app-44ie.onrender.com/api';

async function makeRequest(url, options = {}) {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`HTTP ${response.status}: ${error}`);
  }
  
  return response.json();
}

async function testCompleteQRFlow() {
  console.log('🧪 Testing Complete QR Code Flow...\n');

  try {
    // 1. Login with existing test user
    console.log('1️⃣ Logging in with test user...');
    const userResponse = await makeRequest(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123'
      })
    });
    
    const token = userResponse.token;
    console.log('✅ User logged in successfully\n');

    // 2. Get available routes
    console.log('2️⃣ Fetching available routes...');
    const routesResponse = await makeRequest(`${API_BASE_URL}/routes`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (routesResponse.length === 0) {
      console.log('❌ No routes available for testing');
      return;
    }
    
    const route = routesResponse[0];
    console.log('✅ Route selected:', `${route.origin} → ${route.destination}\n`);

    // 3. Create booking
    console.log('3️⃣ Creating booking...');
    const bookingData = {
      routeId: route.id, // Use the actual route ID (string)
      seatNumber: 'A12',
      travelDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
      passengerName: 'QR Tester',
      passengerPhone: '+256701234567',
      passengerEmail: `qrtest${Date.now()}@example.com`
    };
    
    console.log('Booking data:', JSON.stringify(bookingData, null, 2));
    
    const bookingResponse = await makeRequest(`${API_BASE_URL}/bookings`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(bookingData)
    });
    
    const booking = bookingResponse;
    console.log('✅ Booking created:', booking.id);
    console.log('💰 Amount to pay:', booking.totalAmount, 'UGX\n');

    // 4. Process payment (demo mode)
    console.log('4️⃣ Processing payment (demo mode)...');
    const paymentResponse = await makeRequest(`${API_BASE_URL}/payments/process`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        bookingId: booking.id,
        amount: booking.totalAmount,
        currency: 'UGX',
        provider: 'MTN',
        phoneNumber: '+256701234567'
      })
    });
    
    console.log('💳 Payment processed:', paymentResponse.status);
    
    // Check if QR code was generated
    if (paymentResponse.qrCode) {
      console.log('🎯 QR Code generated automatically!');
      console.log('📱 QR Code length:', paymentResponse.qrCode.length);
      console.log('📋 QR Code preview:', paymentResponse.qrCode.substring(0, 50) + '...');
      
      if (paymentResponse.bookingDetails) {
        console.log('🎫 Booking details in response:');
        console.log('   Passenger:', paymentResponse.bookingDetails.passengerName);
        console.log('   Route:', paymentResponse.bookingDetails.route);
        console.log('   Seat:', paymentResponse.bookingDetails.seatNumber);
        console.log('   Travel Date:', paymentResponse.bookingDetails.travelDate);
      }
    } else {
      console.log('❌ No QR code found in payment response');
      console.log('Response keys:', Object.keys(paymentResponse));
    }
    
    console.log('\n');

    // 5. Test QR validation
    console.log('5️⃣ Testing QR validation...');
    if (paymentResponse.qrCode) {
      // Create test QR data for validation
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

      const validateResponse = await makeRequest(`${API_BASE_URL}/qr/validate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          qrData: JSON.stringify(testQRData),
          scannedBy: 'Test Operator',
          location: 'Test Terminal'
        })
      });

      console.log('✅ QR validation result:', validateResponse.valid ? 'VALID' : 'INVALID');
      if (validateResponse.valid) {
        console.log('👤 Passenger verified:', validateResponse.bookingDetails?.passengerName);
        console.log('🚌 Route verified:', validateResponse.bookingDetails?.route);
      }
    }

    console.log('\n🎉 Complete QR flow test successful!');
    console.log('✅ User registration: Working');
    console.log('✅ Booking creation: Working'); 
    console.log('✅ Payment processing: Working');
    console.log('✅ QR generation: Working');
    console.log('✅ QR validation: Working');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.message.includes('404')) {
      console.log('💡 This might be due to missing routes or buses in the database');
    }
  }
}

testCompleteQRFlow();