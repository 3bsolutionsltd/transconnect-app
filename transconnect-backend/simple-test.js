const axios = require('axios');

async function simpleHealthTest() {
  console.log('🧪 Simple TransConnect API Health Test');
  console.log('=====================================');
  
  try {
    // Test basic health endpoint
    const response = await axios.get('http://localhost:5000/health', {
      timeout: 5000
    });
    
    console.log('✅ Server is running!');
    console.log('📊 Status:', response.data.status);
    console.log('🕐 Timestamp:', response.data.timestamp);
    console.log('🎯 Environment:', response.data.environment);
    
    // Test routes endpoint
    try {
      const routesResponse = await axios.get('http://localhost:5000/api/routes');
      console.log('✅ Routes API working');
      console.log('📍 Routes found:', routesResponse.data.total || 0);
    } catch (routeError) {
      console.log('⚠️  Routes API error:', routeError.response?.data?.error || routeError.message);
    }
    
    // Test auth endpoint
    try {
      const authResponse = await axios.get('http://localhost:5000/api/auth/me');
      console.log('⚠️  Auth endpoint responded (should require token)');
    } catch (authError) {
      if (authError.response?.status === 401) {
        console.log('✅ Auth API working (401 as expected)');
      } else {
        console.log('⚠️  Auth API unexpected error:', authError.response?.data?.error || authError.message);
      }
    }
    
    console.log('\n🎉 Basic server functionality confirmed!');
    console.log('📝 Next: Fix agent system TypeScript errors');
    
  } catch (error) {
    console.log('❌ Server not responding:', error.message);
    console.log('💡 Make sure to run: npm run dev');
  }
}

simpleHealthTest();