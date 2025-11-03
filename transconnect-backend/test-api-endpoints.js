const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

// Test data
const testUser = {
  email: 'test@transconnect.com',
  password: 'password123',
  firstName: 'John',
  lastName: 'Doe',
  phone: '+256700000001'
};

const testOperator = {
  email: 'operator@buscompany.com',
  password: 'operator123',
  firstName: 'Bus',
  lastName: 'Operator',
  phone: '+256700000002'
};

let userToken = '';
let operatorToken = '';

// Utility function to make requests
async function makeRequest(method, endpoint, data = null, token = null) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {}
    };

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (data) {
      config.data = data;
      config.headers['Content-Type'] = 'application/json';
    }

    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message, 
      status: error.response?.status 
    };
  }
}

// Test functions
async function testHealthEndpoint() {
  console.log('\n🔍 Testing Health Endpoint...');
  const result = await makeRequest('GET', '/health');
  
  if (result.success) {
    console.log('✅ Health check passed:', result.data);
  } else {
    console.log('❌ Health check failed:', result.error);
  }
  
  return result.success;
}

async function testUserRegistration() {
  console.log('\n🔍 Testing User Registration...');
  
  // Register passenger
  const passengerResult = await makeRequest('POST', '/api/auth/register', testUser);
  
  if (passengerResult.success) {
    console.log('✅ Passenger registration successful');
    userToken = passengerResult.data.token;
  } else {
    console.log('❌ Passenger registration failed:', passengerResult.error);
  }

  // Register operator
  const operatorData = { ...testOperator, role: 'OPERATOR' };
  const operatorResult = await makeRequest('POST', '/api/auth/register', operatorData);
  
  if (operatorResult.success) {
    console.log('✅ Operator registration successful');
    operatorToken = operatorResult.data.token;
  } else {
    console.log('❌ Operator registration failed:', operatorResult.error);
  }

  return passengerResult.success && operatorResult.success;
}

async function testUserLogin() {
  console.log('\n🔍 Testing User Login...');
  
  const loginData = {
    email: testUser.email,
    password: testUser.password
  };
  
  const result = await makeRequest('POST', '/api/auth/login', loginData);
  
  if (result.success) {
    console.log('✅ Login successful');
    userToken = result.data.token; // Update token
    return true;
  } else {
    console.log('❌ Login failed:', result.error);
    return false;
  }
}

async function testRoutesEndpoint() {
  console.log('\n🔍 Testing Routes Endpoint...');
  
  // Test get all routes
  const allRoutesResult = await makeRequest('GET', '/api/routes');
  
  if (allRoutesResult.success) {
    console.log('✅ Get all routes successful');
    console.log(`📊 Found ${allRoutesResult.data.length} routes`);
  } else {
    console.log('❌ Get routes failed:', allRoutesResult.error);
  }

  // Test route search with filters
  const filteredResult = await makeRequest('GET', '/api/routes?origin=Kampala&destination=Jinja');
  
  if (filteredResult.success) {
    console.log('✅ Route filtering successful');
    console.log(`📊 Found ${filteredResult.data.length} filtered routes`);
  } else {
    console.log('❌ Route filtering failed:', filteredResult.error);
  }

  // Test route suggestions
  const originsResult = await makeRequest('GET', '/api/routes/suggestions/origins');
  const destinationsResult = await makeRequest('GET', '/api/routes/suggestions/destinations');

  if (originsResult.success && destinationsResult.success) {
    console.log('✅ Route suggestions successful');
    console.log(`📊 Origins: ${originsResult.data.length}, Destinations: ${destinationsResult.data.length}`);
  } else {
    console.log('❌ Route suggestions failed');
  }

  return allRoutesResult.success;
}

async function testBookingsWithAuth() {
  console.log('\n🔍 Testing Bookings (requires auth)...');
  
  if (!userToken) {
    console.log('❌ No user token available for booking tests');
    return false;
  }

  // Test get user bookings (should be empty initially)
  const bookingsResult = await makeRequest('GET', '/api/bookings/my-bookings', null, userToken);
  
  if (bookingsResult.success) {
    console.log('✅ Get user bookings successful');
    console.log(`📊 User has ${bookingsResult.data.length} bookings`);
    return true;
  } else {
    console.log('❌ Get user bookings failed:', bookingsResult.error);
    return false;
  }
}

async function testPaymentsWithAuth() {
  console.log('\n🔍 Testing Payments (requires auth)...');
  
  if (!userToken) {
    console.log('❌ No user token available for payment tests');
    return false;
  }

  // Test get payment history (should be empty initially)
  const historyResult = await makeRequest('GET', '/api/payments/history', null, userToken);
  
  if (historyResult.success) {
    console.log('✅ Get payment history successful');
    console.log(`📊 User has ${historyResult.data.payments.length} payments`);
    return true;
  } else {
    console.log('❌ Get payment history failed:', historyResult.error);
    return false;
  }
}

async function testUnauthorizedAccess() {
  console.log('\n🔍 Testing Unauthorized Access...');
  
  // Test accessing protected endpoint without token
  const result = await makeRequest('GET', '/api/bookings/my-bookings');
  
  if (!result.success && result.status === 401) {
    console.log('✅ Unauthorized access properly blocked');
    return true;
  } else {
    console.log('❌ Unauthorized access not properly handled');
    return false;
  }
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting TransConnect API Tests...');
  console.log('=' * 50);

  const tests = [
    { name: 'Health Check', func: testHealthEndpoint },
    { name: 'User Registration', func: testUserRegistration },
    { name: 'User Login', func: testUserLogin },
    { name: 'Routes API', func: testRoutesEndpoint },
    { name: 'Bookings API', func: testBookingsWithAuth },
    { name: 'Payments API', func: testPaymentsWithAuth },
    { name: 'Unauthorized Access', func: testUnauthorizedAccess }
  ];

  let passed = 0;
  let total = tests.length;

  for (const test of tests) {
    try {
      const result = await test.func();
      if (result) {
        passed++;
      }
    } catch (error) {
      console.log(`❌ ${test.name} crashed:`, error.message);
    }
  }

  console.log('\n' + '=' * 50);
  console.log(`📊 Test Results: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 All tests passed! API is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Check the output above for details.');
  }

  console.log('\n💡 Next steps:');
  console.log('1. Create sample operators, buses, and routes');
  console.log('2. Test full booking flow');
  console.log('3. Build web frontend');
  console.log('4. Set up admin dashboard');
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled Rejection:', error.message);
  process.exit(1);
});

// Check if axios is available
try {
  require('axios');
} catch (error) {
  console.log('❌ axios is not installed. Please run: npm install axios');
  process.exit(1);
}

// Run tests
runAllTests().then(() => {
  console.log('\n✨ Tests completed!');
}).catch((error) => {
  console.error('❌ Test runner failed:', error.message);
  process.exit(1);
});