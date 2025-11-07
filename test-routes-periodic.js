const axios = require('axios');

async function testRoutesUntilWorking() {
  const maxAttempts = 10;
  let attempt = 1;
  
  console.log('🔄 Testing production routes API periodically...');
  console.log('Waiting for migration deployment to complete...\n');
  
  while (attempt <= maxAttempts) {
    console.log(`📡 Attempt ${attempt}/${maxAttempts} - Testing routes API...`);
    
    try {
      const response = await axios.get('https://transconnect-app-44ie.onrender.com/api/routes');
      console.log('✅ SUCCESS! Routes API is working!');
      console.log(`✅ Status: ${response.status}`);
      console.log(`✅ Routes found: ${response.data?.length || 0}`);
      
      if (response.data && response.data.length > 0) {
        console.log('📋 Sample route:');
        const route = response.data[0];
        console.log(`   ${route.origin} → ${route.destination}`);
        console.log(`   Price: UGX ${route.price}, Distance: ${route.distance}km`);
      }
      
      console.log('\n🎉 Routes are now accessible to passengers!');
      return true;
      
    } catch (error) {
      console.log(`❌ Still failing: ${error.response?.status || error.message}`);
      
      if (attempt < maxAttempts) {
        console.log('⏰ Waiting 30 seconds before next test...\n');
        await new Promise(resolve => setTimeout(resolve, 30000));
      }
    }
    
    attempt++;
  }
  
  console.log('❌ API still not working after all attempts');
  return false;
}

testRoutesUntilWorking();