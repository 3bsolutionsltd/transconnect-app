// Test to debug the booking payload
const axios = require('axios');

async function testBookingPayload() {
  try {
    // First, get available routes to see the data structure
    console.log('Fetching routes...');
    const routesResponse = await axios.get('http://localhost:5000/api/routes');
    console.log('Routes response:', JSON.stringify(routesResponse.data, null, 2));
    
    if (routesResponse.data.routes && routesResponse.data.routes.length > 0) {
      const route = routesResponse.data.routes[0];
      console.log('\nFirst route data:');
      console.log('ID:', route.id, 'Type:', typeof route.id);
      console.log('Origin:', route.origin);
      console.log('Destination:', route.destination);
      
      // Create a test booking payload
      const bookingData = {
        routeId: route.id,
        seatNumbers: ["1"],
        travelDate: "2024-12-01",
        passengers: [
          {
            firstName: "Test",
            lastName: "User",
            phone: "+256700000000",
            idNumber: "TEST123"
          }
        ]
      };
      
      console.log('\nBooking payload to be sent:');
      console.log(JSON.stringify(bookingData, null, 2));
      console.log('\nRouteId type:', typeof bookingData.routeId);
      
      // Test the booking creation (this will fail but we can see the exact error)
      try {
        const bookingResponse = await axios.post(
          'http://localhost:5000/api/bookings',
          bookingData,
          {
            headers: {
              'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoiam9obkBleGFtcGxlLmNvbSIsInJvbGUiOiJQQVNTRU5HRVIiLCJpYXQiOjE3MzI5MDYzMDR9.8CCvl5lqFyJQq5yZzTqFKh-vbqiPQ4viFh8BKlmrGM4',
              'Content-Type': 'application/json'
            }
          }
        );
        console.log('\nBooking created successfully!');
        console.log(bookingResponse.data);
      } catch (bookingError) {
        console.log('\nBooking creation error:');
        console.log('Status:', bookingError.response?.status);
        console.log('Error:', bookingError.response?.data);
        console.log('Full error:', bookingError.message);
      }
    }
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

testBookingPayload();