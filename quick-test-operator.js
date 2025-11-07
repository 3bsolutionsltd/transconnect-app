// Quick test just operator creation
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

async function quickTest() {
  console.log('🔄 Quick Operator Test...\n');
  
  try {
    // Login as admin
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
    
    // Try creating operator
    const operatorData = {
      companyName: 'Test Bus Company',
      license: 'TBC001',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@testbus.com',
      phone: '+256700123456',
      password: 'operator123',
      approved: true
    };
    
    console.log('📝 Attempting to create operator...');
    console.log('Data:', JSON.stringify(operatorData, null, 2));
    
    const result = await makeRequest('/operators', 'POST', operatorData, token);
    console.log(`Status: ${result.status}`);
    console.log('Response:', JSON.stringify(result.data, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

quickTest();