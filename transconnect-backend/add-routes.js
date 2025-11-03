const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function addRoutes() {
  console.log('🛣️ Adding Routes to Database...\n');

  try {
    // Login as admin to get authorization
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@transconnect.ug',
      password: 'admin123'
    });
    const token = loginResponse.data.token;
    console.log('✅ Admin login successful');

    // Get available operators and buses
    const operators = await axios.get(`${BASE_URL}/operators`, {
      headers: { Authorization: `Bearer ${token}` }
    }).catch(() => ({ data: [] }));

    const buses = await axios.get(`${BASE_URL}/buses`, {
      headers: { Authorization: `Bearer ${token}` }
    }).catch(() => ({ data: [] }));

    console.log('Available operators:', operators.data.length);
    console.log('Available buses:', buses.data.length);

    // If no operators/buses exist, let's create some first
    let operatorId, busId;

    if (operators.data.length === 0) {
      console.log('\n📋 Creating test operator...');
      const operator = await axios.post(`${BASE_URL}/operators`, {
        companyName: 'TransConnect Express',
        license: 'LIC001',
        contactPerson: 'John Manager',
        email: 'manager@transconnect.ug',
        phone: '+256700000001',
        password: 'manager123'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      }).catch(err => {
        console.log('Operator creation failed:', err.response?.data?.error || err.message);
        return null;
      });

      if (operator) {
        operatorId = operator.data.id;
        console.log('✅ Operator created:', operatorId);
      }
    } else {
      operatorId = operators.data[0].id;
      console.log('✅ Using existing operator:', operatorId);
    }

    if (buses.data.length === 0 && operatorId) {
      console.log('\n🚌 Creating test bus...');
      const bus = await axios.post(`${BASE_URL}/buses`, {
        operatorId,
        plateNumber: 'UAH 001A',
        model: 'Isuzu NPR',
        capacity: 50,
        amenities: ['Air Conditioning', 'WiFi', 'USB Charging']
      }, {
        headers: { Authorization: `Bearer ${token}` }
      }).catch(err => {
        console.log('Bus creation failed:', err.response?.data?.error || err.message);
        return null;
      });

      if (bus) {
        busId = bus.data.id;
        console.log('✅ Bus created:', busId);
      }
    } else if (buses.data.length > 0) {
      busId = buses.data[0].id;
      console.log('✅ Using existing bus:', busId);
    }

    // Now create routes if we have operator and bus
    if (operatorId && busId) {
      const routesToCreate = [
        {
          origin: 'Kampala',
          destination: 'Mbarara',
          distance: 266,
          duration: 300, // 5 hours
          price: 30000,
          departureTime: '08:00',
          operatorId,
          busId
        },
        {
          origin: 'Kampala',
          destination: 'Gulu',
          distance: 340,
          duration: 360, // 6 hours
          price: 40000,
          departureTime: '09:00',
          operatorId,
          busId
        },
        {
          origin: 'Kampala',
          destination: 'Fort Portal',
          distance: 300,
          duration: 330, // 5.5 hours
          price: 35000,
          departureTime: '10:00',
          operatorId,
          busId
        },
        {
          origin: 'Entebbe',
          destination: 'Masaka',
          distance: 150,
          duration: 180, // 3 hours
          price: 20000,
          departureTime: '07:30',
          operatorId,
          busId
        }
      ];

      console.log('\n🛣️ Creating routes...');
      for (const routeData of routesToCreate) {
        try {
          const route = await axios.post(`${BASE_URL}/routes`, routeData, {
            headers: { Authorization: `Bearer ${token}` }
          });
          console.log(`✅ Route created: ${route.data.origin} → ${route.data.destination} (UGX ${route.data.price})`);
        } catch (error) {
          console.log(`❌ Failed to create route ${routeData.origin} → ${routeData.destination}:`, 
                     error.response?.data?.error || error.message);
        }
      }
    }

    // Verify routes were created
    console.log('\n📋 Checking all routes in database...');
    const allRoutes = await axios.get(`${BASE_URL}/routes`);
    console.log(`\n✅ Total routes in database: ${allRoutes.data.length}`);
    
    if (allRoutes.data.length > 0) {
      console.log('\n📍 Available Routes:');
      allRoutes.data.forEach((route, index) => {
        console.log(`${index + 1}. ${route.origin} → ${route.destination} (UGX ${route.price}) - ${route.departureTime}`);
      });
    } else {
      console.log('❌ No routes found in database');
    }

  } catch (error) {
    console.error('❌ Error:', error.response?.data?.error || error.message);
    if (error.response?.data) {
      console.error('Full error response:', JSON.stringify(error.response.data, null, 2));
    }
    if (error.code === 'ECONNREFUSED') {
      console.error('💡 Make sure the backend server is running on port 5000');
    }
  }
}

addRoutes();