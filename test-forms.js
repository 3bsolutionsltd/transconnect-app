// Test Form Functionality - Create Test Data
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

async function testFormFunctionality() {
  console.log('🧪 Testing Form Functionality...\n');
  
  try {
    // First, let's create an admin user to get a token
    console.log('1️⃣ Creating Admin User...');
    const adminUser = {
      firstName: 'Test',
      lastName: 'Admin',
      email: 'testadmin@example.com',
      phone: '+256700000001',
      password: 'admin123456',
      role: 'ADMIN'
    };
    
    const userResult = await makeRequest('/auth/register', 'POST', adminUser);
    console.log(`   Status: ${userResult.status}`);
    
    let token = null;
    if (userResult.status === 201 && userResult.data.token) {
      token = userResult.data.token;
      console.log('   ✅ Admin user created and token obtained');
    } else {
      console.log(`   ⚠️  Admin user creation: ${JSON.stringify(userResult.data)}`);
      // Try to login instead
      const loginResult = await makeRequest('/auth/login', 'POST', {
        email: adminUser.email,
        password: adminUser.password
      });
      if (loginResult.status === 200 && loginResult.data.token) {
        token = loginResult.data.token;
        console.log('   ✅ Admin user logged in successfully');
      }
    }
    
    if (!token) {
      console.log('   ❌ Could not get admin token, cannot test protected endpoints');
      return;
    }
    
    // Test 1: Create Operator
    console.log('\n2️⃣ Testing Operator Creation...');
    const operatorData = {
      companyName: 'SafeBoda Transport',
      license: 'SBT001',
      firstName: 'John',
      lastName: 'Kiprotich',
      email: 'john@safeboda.com',
      phone: '+256700000002',
      password: 'operator123',
      approved: true
    };
    
    const operatorResult = await makeRequest('/operators', 'POST', operatorData, token);
    console.log(`   Status: ${operatorResult.status}`);
    if (operatorResult.status === 201) {
      console.log(`   ✅ Operator created: ${operatorResult.data.companyName}`);
      console.log(`   📋 Operator ID: ${operatorResult.data.id}`);
    } else {
      console.log(`   ❌ Operator creation failed: ${JSON.stringify(operatorResult.data)}`);
    }
    
    // Test 2: Create Another Operator for variety
    console.log('\n3️⃣ Creating Second Operator...');
    const operator2Data = {
      companyName: 'Horizon Bus Company',
      license: 'HBC002',
      firstName: 'Mary',
      lastName: 'Nakato',
      email: 'mary@horizon.com',
      phone: '+256700000003',
      password: 'operator456',
      approved: true
    };
    
    const operator2Result = await makeRequest('/operators', 'POST', operator2Data, token);
    console.log(`   Status: ${operator2Result.status}`);
    if (operator2Result.status === 201) {
      console.log(`   ✅ Second operator created: ${operator2Result.data.companyName}`);
    }
    
    // Test 3: Get operators to verify they were created
    console.log('\n4️⃣ Verifying Operators List...');
    const operatorsListResult = await makeRequest('/operators');
    console.log(`   Status: ${operatorsListResult.status}`);
    if (operatorsListResult.status === 200) {
      console.log(`   ✅ Operators retrieved: ${operatorsListResult.data.length} operators found`);
      operatorsListResult.data.forEach((op, index) => {
        console.log(`   📋 ${index + 1}. ${op.companyName} (ID: ${op.id})`);
      });
    }
    
    // Test 4: Create Buses (need operator ID first)
    if (operatorResult.status === 201) {
      const operatorId = operatorResult.data.id;
      
      console.log('\n5️⃣ Testing Bus Creation...');
      const busData = {
        plateNumber: 'UAM 001Z',
        model: 'Toyota Hiace',
        capacity: 14,
        operatorId: operatorId
      };
      
      const busResult = await makeRequest('/buses', 'POST', busData, token);
      console.log(`   Status: ${busResult.status}`);
      if (busResult.status === 201) {
        console.log(`   ✅ Bus created: ${busResult.data.plateNumber} (${busResult.data.model})`);
      } else {
        console.log(`   ❌ Bus creation failed: ${JSON.stringify(busResult.data)}`);
      }
      
      // Create second bus
      const bus2Data = {
        plateNumber: 'UAM 002Z',
        model: 'Toyota Coaster',
        capacity: 29,
        operatorId: operatorId
      };
      
      const bus2Result = await makeRequest('/buses', 'POST', bus2Data, token);
      if (bus2Result.status === 201) {
        console.log(`   ✅ Second bus created: ${bus2Result.data.plateNumber}`);
      }
      
      // Test 5: Create Routes
      console.log('\n6️⃣ Testing Route Creation...');
      const routeData = {
        origin: 'Kampala',
        destination: 'Mbale',
        via: 'Jinja',
        price: 25000,
        duration: '4 hours',
        operatorId: operatorId,
        busId: busResult.data?.id,
        departureTime: '08:00',
        active: true
      };
      
      const routeResult = await makeRequest('/routes', 'POST', routeData, token);
      console.log(`   Status: ${routeResult.status}`);
      if (routeResult.status === 201) {
        console.log(`   ✅ Route created: ${routeResult.data.origin} → ${routeResult.data.destination}`);
        if (routeResult.data.via) {
          console.log(`   📍 Via: ${routeResult.data.via}`);
        }
      } else {
        console.log(`   ❌ Route creation failed: ${JSON.stringify(routeResult.data)}`);
      }
      
      // Create another route
      const route2Data = {
        origin: 'Kampala',
        destination: 'Gulu',
        via: 'Lira',
        price: 35000,
        duration: '6 hours',
        operatorId: operatorId,
        busId: bus2Result.data?.id,
        departureTime: '09:00',
        active: true
      };
      
      const route2Result = await makeRequest('/routes', 'POST', route2Data, token);
      if (route2Result.status === 201) {
        console.log(`   ✅ Second route created: ${route2Result.data.origin} → ${route2Result.data.destination}`);
      }
    }
    
    // Final verification
    console.log('\n7️⃣ Final Verification...');
    const finalRoutes = await makeRequest('/routes');
    const finalOperators = await makeRequest('/operators');
    const finalBuses = await makeRequest('/buses');
    
    console.log(`   📊 Summary:`);
    console.log(`   • Routes: ${Array.isArray(finalRoutes.data) ? finalRoutes.data.length : 0}`);
    console.log(`   • Operators: ${Array.isArray(finalOperators.data) ? finalOperators.data.length : 0}`);
    console.log(`   • Buses: ${Array.isArray(finalBuses.data) ? finalBuses.data.length : 0}`);
    
    console.log('\n✅ Form Functionality Test Complete!');
    console.log('\n🎯 Next: Test the data appears in admin dashboard and client search');
    
  } catch (error) {
    console.error('❌ Test Error:', error.message);
  }
}

testFormFunctionality();