// Test with the current API format (contactPerson instead of firstName/lastName)
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

async function testWithCurrentAPI() {
  console.log('🔄 Testing with Current API Format...\n');
  
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
    
    // Try with contactPerson format (matching current deployed API)
    const operatorData = {
      companyName: 'Test Bus Company',
      license: 'TBC001',
      contactPerson: 'John Doe',
      email: 'john.doe@testbus.com',
      phone: '+256700123456',
      password: 'operator123'
    };
    
    console.log('📝 Creating operator with current API format...');
    const result = await makeRequest('/operators', 'POST', operatorData, token);
    console.log(`Status: ${result.status}`);
    
    if (result.status === 201) {
      console.log('✅ Operator created successfully!');
      console.log('Operator:', JSON.stringify(result.data, null, 2));
      
      // Now test bus creation
      const busData = {
        plateNumber: 'UAM 001Z',
        model: 'Toyota Hiace',
        capacity: 14,
        operatorId: result.data.id
      };
      
      console.log('\n📝 Creating bus...');
      const busResult = await makeRequest('/buses', 'POST', busData, token);
      console.log(`Bus Status: ${busResult.status}`);
      
      if (busResult.status === 201) {
        console.log('✅ Bus created successfully!');
        console.log('Bus:', JSON.stringify(busResult.data, null, 2));
        
        // Now test route creation
        const routeData = {
          origin: 'Kampala',
          destination: 'Mbale',
          via: 'Jinja',
          price: 25000,
          duration: '4 hours',
          operatorId: result.data.id,
          busId: busResult.data.id,
          departureTime: '08:00',
          active: true
        };
        
        console.log('\n📝 Creating route...');
        const routeResult = await makeRequest('/routes', 'POST', routeData, token);
        console.log(`Route Status: ${routeResult.status}`);
        
        if (routeResult.status === 201) {
          console.log('✅ Route created successfully!');
          console.log('Route:', JSON.stringify(routeResult.data, null, 2));
        } else {
          console.log('❌ Route creation failed:', routeResult.data);
        }
        
      } else {
        console.log('❌ Bus creation failed:', busResult.data);
      }
      
    } else {
      console.log('❌ Operator creation failed:', result.data);
    }
    
    // Final check - get all data
    console.log('\n📊 Final Status Check:');
    const operators = await makeRequest('/operators');
    const buses = await makeRequest('/buses');
    const routes = await makeRequest('/routes');
    
    console.log(`✅ Total Operators: ${Array.isArray(operators.data) ? operators.data.length : 0}`);
    console.log(`✅ Total Buses: ${Array.isArray(buses.data) ? buses.data.length : 0}`);
    console.log(`✅ Total Routes: ${Array.isArray(routes.data) ? routes.data.length : 0}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testWithCurrentAPI();