const axios = require('axios');

const API_BASE = 'https://transconnect-app-44ie.onrender.com/api';

async function testPaymentFlow() {
  try {
    console.log('🔍 Testing payment flow...\n');

    // Step 1: Register a test user
    console.log('1. Registering test user...');
    const registerResponse = await axios.post(`${API_BASE}/auth/register`, {
      firstName: 'Test',
      lastName: 'User',
      email: `test-${Date.now()}@example.com`,
      phone: '256701234567',
      password: 'password123',
      accountType: 'PASSENGER'
    });
    
    const { token, user } = registerResponse.data.data;
    console.log('✅ User registered:', user.email);

    // Step 2: Get available routes
    console.log('\n2. Getting available routes...');
    const routesResponse = await axios.get(`${API_BASE}/routes`);
    const routes = routesResponse.data.data;
    
    if (routes.length === 0) {
      console.log('❌ No routes available');
      return;
    }
    
    const route = routes[0];
    console.log('✅ Found route:', route.origin, '→', route.destination);

    // Step 3: Create a booking
    console.log('\n3. Creating booking...');
    const bookingResponse = await axios.post(`${API_BASE}/bookings`, {
      routeId: route.id,
      travelDate: new Date(Date.now() + 24*60*60*1000).toISOString(), // Tomorrow
      seatNumber: 'A1',
      passengerName: `${user.firstName} ${user.lastName}`,
      passengerPhone: user.phone
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const booking = bookingResponse.data.data;
    console.log('✅ Booking created:', booking.id);

    // Step 4: Test payment initiation
    console.log('\n4. Testing payment initiation...');
    const paymentResponse = await axios.post(`${API_BASE}/payments/initiate`, {
      bookingId: booking.id,
      method: 'MTN_MOBILE_MONEY',
      phoneNumber: '256701234567'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Payment initiated:', paymentResponse.data);

  } catch (error) {
    console.error('❌ Error:', error.response?.status, error.response?.data || error.message);
    
    if (error.response?.status === 400) {
      console.log('\n🔍 400 Error details:');
      console.log('Status:', error.response.status);
      console.log('Data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testPaymentFlow();