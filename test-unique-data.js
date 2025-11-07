// Clear test data to fix phone number conflicts
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

async function clearTestDataAndTest() {
  console.log('🔄 Testing with unique data to avoid conflicts...\n');
  
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
    
    // Try with unique data
    const timestamp = Date.now();
    const operatorData = {
      companyName: `Unique Bus Co ${timestamp}`,
      license: `UBC${timestamp}`,
      contactPerson: 'Jane Smith',
      email: `jane${timestamp}@test.com`,
      phone: `+25670${timestamp.toString().slice(-7)}`, // Use timestamp for unique phone
      password: 'operator123'
    };
    
    console.log('📝 Creating operator with unique data...');
    console.log('Data:', JSON.stringify(operatorData, null, 2));
    
    const result = await makeRequest('/operators', 'POST', operatorData, token);
    console.log(`Status: ${result.status}`);
    console.log('Response:', JSON.stringify(result.data, null, 2));
    
    if (result.status === 201) {
      console.log('\\n✅ SUCCESS! Operator created successfully!');
      console.log('✅ The operator form is now working properly!');
      
      // Test bus creation
      console.log('\\n📝 Testing bus creation...');
      const busData = {
        plateNumber: `UAM${timestamp}Z`,
        model: 'Toyota Hiace',
        capacity: 14,
        operatorId: result.data.id
      };
      
      const busResult = await makeRequest('/buses', 'POST', busData, token);
      console.log(`Bus Status: ${busResult.status}`);
      if (busResult.status === 201) {
        console.log('✅ Bus created successfully too!');
      } else {
        console.log('❌ Bus creation failed:', busResult.data);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

clearTestDataAndTest();