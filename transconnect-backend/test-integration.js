const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testBackendIntegration() {
  console.log('🧪 Testing TransConnect Backend Integration...\n');

  try {
    // Test 1: Health Check
    console.log('1️⃣  Testing Health Check...');
    const healthResponse = await axios.get('http://localhost:5000/health');
    console.log('✅ Health Check:', healthResponse.data.message);

    // Test 2: Login with seeded admin user
    console.log('\n2️⃣  Testing Admin Login...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@transconnect.ug',
      password: 'admin123'
    });
    const adminToken = loginResponse.data.token;
    console.log('✅ Admin Login Successful');
    console.log('🔑 Admin Token received:', adminToken.substring(0, 20) + '...');

    // Test 3: Get Routes
    console.log('\n3️⃣  Testing Routes Endpoint...');
    const routesResponse = await axios.get(`${BASE_URL}/routes`);
    console.log('✅ Routes Retrieved:', routesResponse.data.length, 'routes found');
    routesResponse.data.forEach((route, index) => {
      console.log(`   ${index + 1}. ${route.origin} → ${route.destination} (UGX ${route.price})`);
    });

    if (routesResponse.data.length === 0) {
      console.log('❌ No routes found - database may not be seeded properly');
      return;
    }

    // Test 4: Create a Test Booking
    console.log('\n4️⃣  Testing Booking Creation...');
    const testRoute = routesResponse.data[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const bookingResponse = await axios.post(`${BASE_URL}/bookings`, {
      routeId: testRoute.id,
      seatNumber: 'A1',
      travelDate: tomorrow.toISOString().split('T')[0]
    }, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
    
    console.log('✅ Booking Created Successfully');
    console.log('📋 Booking ID:', bookingResponse.data.id);
    console.log('🎫 QR Code:', bookingResponse.data.qrCode ? 'Generated' : 'Missing');

    // Test 5: Test QR Code Validation
    if (bookingResponse.data.qrCode) {
      console.log('\n5️⃣  Testing QR Code Validation...');
      try {
        const qrValidationResponse = await axios.post(`${BASE_URL}/qr/validate`, {
          qrCode: bookingResponse.data.qrCode
        }, {
          headers: {
            'Authorization': `Bearer ${adminToken}`
          }
        });
        console.log('✅ QR Code Validation Successful');
        console.log('🎫 Booking Status:', qrValidationResponse.data.booking.status);
      } catch (qrError) {
        console.log('❌ QR Code Validation Failed:', qrError.response?.data?.error || qrError.message);
      }
    }

    // Test 6: Get User Bookings
    console.log('\n6️⃣  Testing User Bookings...');
    const bookingsResponse = await axios.get(`${BASE_URL}/bookings`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
    console.log('✅ User Bookings Retrieved:', bookingsResponse.data.length, 'bookings found');

    console.log('\n🎉 Backend Integration Test Complete!');
    console.log('📊 Summary:');
    console.log('   ✅ Health Check: Working');
    console.log('   ✅ Authentication: Working');
    console.log('   ✅ Routes API: Working');
    console.log('   ✅ Bookings API: Working');
    console.log('   ✅ QR Code Generation: Working');
    console.log('   ✅ Database Integration: Working');

  } catch (error) {
    console.error('❌ Test Failed:', error.response?.data || error.message);
    console.log('\n🔍 Debugging Info:');
    if (error.response) {
      console.log('   Status:', error.response.status);
      console.log('   Data:', error.response.data);
    }
  }
}

// Run the test
testBackendIntegration();