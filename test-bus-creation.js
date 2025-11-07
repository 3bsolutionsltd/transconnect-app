// Test bus creation with fixed amenities field
const https = require('https');

const API_BASE = 'https://transconnect-app-44ie.onrender.com/api';

function makeRequest(path, method = 'GET', data = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = `${API_BASE}${path}`;
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
    };

    const req = https.request(url, options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testBusCreation() {
  console.log('🚌 Testing Bus Creation with Fixed Amenities...\n');
  
  try {
    // Login
    const loginResult = await makeRequest('/auth/login', 'POST', {
      email: 'testadmin@example.com',
      password: 'admin123456'
    });
    
    if (loginResult.status !== 200) {
      console.log('❌ Login failed:', loginResult.data);
      return;
    }
    
    const token = loginResult.data.token;
    console.log('✅ Admin logged in successfully');
    
    // Get existing operators
    const operatorsResult = await makeRequest('/operators');
    if (!Array.isArray(operatorsResult.data) || operatorsResult.data.length === 0) {
      console.log('❌ No operators found. Create an operator first.');
      return;
    }
    
    const operator = operatorsResult.data[0];
    console.log(`✅ Using operator: ${operator.companyName} (ID: ${operator.id})`);
    
    // Test bus creation with no amenities
    const timestamp = Date.now();
    const busData = {
      plateNumber: `TEST${timestamp}`,
      model: 'Toyota Hiace',
      capacity: 14,
      operatorId: operator.id
      // No amenities field - should default to null
    };
    
    console.log('📝 Creating bus...');
    console.log('Data:', JSON.stringify(busData, null, 2));
    
    const busResult = await makeRequest('/buses', 'POST', busData, token);
    console.log(`Status: ${busResult.status}`);
    console.log('Response:', JSON.stringify(busResult.data, null, 2));
    
    if (busResult.status === 201) {
      console.log('\\n🎉 SUCCESS! Bus created successfully!');
      console.log('✅ Bus creation form is now working!');
      
      // Now test route creation
      console.log('\\n🛣️ Testing route creation...');
      const routeData = {
        origin: 'Kampala',
        destination: 'Mbale',
        via: 'Jinja',
        price: 25000,
        duration: '4 hours',
        operatorId: operator.id,
        busId: busResult.data.id,
        departureTime: '08:00',
        active: true
      };
      
      const routeResult = await makeRequest('/routes', 'POST', routeData, token);
      console.log(`Route Status: ${routeResult.status}`);
      
      if (routeResult.status === 201) {
        console.log('✅ Route created successfully!');
        console.log('Route:', JSON.stringify(routeResult.data, null, 2));
        
        // Final check - get all data
        console.log('\\n📊 Final Status:');
        const finalRoutes = await makeRequest('/routes');
        const finalBuses = await makeRequest('/buses');
        const finalOperators = await makeRequest('/operators');
        
        console.log(`✅ Total Operators: ${Array.isArray(finalOperators.data) ? finalOperators.data.length : 0}`);
        console.log(`✅ Total Buses: ${Array.isArray(finalBuses.data) ? finalBuses.data.length : 0}`);
        console.log(`✅ Total Routes: ${Array.isArray(finalRoutes.data) ? finalRoutes.data.length : 0}`);
        
        console.log('\\n🎯 ALL FORMS ARE NOW WORKING! 🎉');
        console.log('✅ Operators ✅ Buses ✅ Routes');
        
      } else {
        console.log('❌ Route creation failed:', routeResult.data);
      }
      
    } else {
      console.log('❌ Bus creation still failing:', busResult.data);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testBusCreation();