const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function quickTest() {
  try {
    // Test login
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@transconnect.ug',
      password: 'admin123'
    });
    const token = loginResponse.data.token;
    console.log('✅ Login successful');

    // Get all routes to see what's available
    const allRoutes = await axios.get(`${BASE_URL}/routes`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('\n📍 Available Routes:');
    allRoutes.data.forEach(route => {
      console.log(`   ${route.origin} → ${route.destination} (Price: UGX ${route.price})`);
    });

    if (allRoutes.data.length > 0) {
      const route = allRoutes.data[0];
      console.log(`\n🎯 Testing with route: ${route.origin} → ${route.destination}`);

      // Test booking
      const booking = await axios.post(`${BASE_URL}/bookings`, {
        routeId: route.id,
        seatNumber: `${Math.floor(Math.random() * 20) + 1}`,
        travelDate: '2024-11-15'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ Booking created:', booking.data.id);

      // Test QR generation
      const qrResponse = await axios.post(`${BASE_URL}/qr/generate`, {
        bookingId: booking.data.id
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ QR Code generated');

      console.log('\n🎉 PILOT READY: Core functionality working!');
    }

  } catch (error) {
    console.error('❌ Error:', error.response?.data?.error || error.message);
    if (error.response?.data) {
      console.error('Response data:', error.response.data);
    }
  }
}

quickTest();