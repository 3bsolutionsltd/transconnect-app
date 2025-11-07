const axios = require('axios');

async function monitorDeployment() {
  const baseUrl = 'https://transconnect-backend.onrender.com';
  let attempts = 0;
  const maxAttempts = 20; // 10 minutes with 30-second intervals
  
  console.log('🚀 Monitoring production deployment...\n');
  
  while (attempts < maxAttempts) {
    try {
      attempts++;
      console.log(`Attempt ${attempts}/${maxAttempts}: Checking deployment status...`);
      
      // Test health endpoint
      const response = await axios.get(`${baseUrl}/health`, { timeout: 10000 });
      console.log('✅ Backend is responding!');
      
      // Test routes endpoint
      const routesResponse = await axios.get(`${baseUrl}/api/routes`, { timeout: 10000 });
      console.log(`✅ Routes API working: ${routesResponse.data.length} routes found`);
      
      // Check for stops data
      if (routesResponse.data.length > 0) {
        const route = routesResponse.data[0];
        if (route.stops && route.stops.length > 0) {
          console.log(`🎯 Route stops system deployed successfully!`);
          console.log(`📍 ${route.origin} → ${route.destination} has ${route.stops.length} stops`);
          
          // Test stops endpoints
          const stopsResponse = await axios.get(`${baseUrl}/api/routes/${route.id}/stops`);
          const boardingResponse = await axios.get(`${baseUrl}/api/routes/${route.id}/boarding-stops`);
          
          console.log(`✅ Stops endpoint: ${stopsResponse.data.length} stops`);
          console.log(`✅ Boarding stops: ${boardingResponse.data.length} options`);
          
          if (boardingResponse.data.length >= 2) {
            const firstStop = boardingResponse.data[0].stopName;
            const alightingResponse = await axios.get(`${baseUrl}/api/routes/${route.id}/alighting-stops/${encodeURIComponent(firstStop)}`);
            console.log(`✅ Alighting stops from "${firstStop}": ${alightingResponse.data.length} destinations`);
            
            if (alightingResponse.data.length > 0) {
              const lastStop = alightingResponse.data[alightingResponse.data.length - 1].stopName;
              const priceResponse = await axios.get(`${baseUrl}/api/routes/${route.id}/stops/calculate-price?boardingStop=${encodeURIComponent(firstStop)}&alightingStop=${encodeURIComponent(lastStop)}`);
              console.log(`✅ Price calculation: UGX ${priceResponse.data.price.toLocaleString()}`);
            }
          }
          
          console.log('\n🎉 Route stops system is fully operational in production!');
          console.log('🔗 API Base: https://transconnect-backend.onrender.com/api/routes');
          return;
        } else {
          console.log('⚠️ Routes found but no stops data yet. Migration may still be running...');
        }
      }
      
    } catch (error) {
      if (error.code === 'ECONNREFUSED' || error.response?.status === 404) {
        console.log('⏳ Deployment still in progress...');
      } else {
        console.log('❌ Error:', error.response?.status || error.message);
      }
    }
    
    if (attempts < maxAttempts) {
      console.log('⏱️ Waiting 30 seconds before next check...\n');
      await new Promise(resolve => setTimeout(resolve, 30000));
    }
  }
  
  console.log('❌ Deployment monitoring timeout. Check Render dashboard for status.');
}

monitorDeployment();