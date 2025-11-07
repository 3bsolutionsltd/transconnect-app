const axios = require('axios');

async function testLocalAPI() {
  const baseUrl = 'http://localhost:5000';
  
  try {
    console.log('🧪 Testing Local Routes API...\n');
    
    // Test basic routes endpoint
    console.log('1. Testing /api/routes...');
    const response = await axios.get(`${baseUrl}/api/routes`);
    console.log(`Status: ${response.status}`);
    console.log(`Routes found: ${response.data.length}`);
    
    if (response.data.length > 0) {
      const route = response.data[0];
      console.log(`\nSample Route: ${route.origin} → ${route.destination}`);
      console.log(`Operator: ${route.operator?.companyName}`);
      console.log(`Bus: ${route.bus?.plateNumber} (${route.bus?.capacity} seats)`);
      console.log(`Price: UGX ${route.price.toLocaleString()}`);
      console.log(`Stops: ${route.stops?.length || 0}`);
      
      if (route.stops && route.stops.length > 0) {
        console.log('\n📍 Route Stops:');
        route.stops.forEach(stop => {
          console.log(`  ${stop.order}. ${stop.stopName} - ${stop.distanceFromOrigin}km - UGX ${stop.priceFromOrigin.toLocaleString()} - ${stop.estimatedTime}`);
        });
        
        // Test specific route stops endpoints
        console.log(`\n2. Testing route-specific endpoints for route ${route.id}...`);
        
        // Test /stops endpoint
        const stopsResponse = await axios.get(`${baseUrl}/api/routes/${route.id}/stops`);
        console.log(`✅ Route stops: ${stopsResponse.data.length}`);
        
        // Test boarding stops
        const boardingResponse = await axios.get(`${baseUrl}/api/routes/${route.id}/boarding-stops`);
        console.log(`✅ Boarding stops: ${boardingResponse.data.length}`);
        
        if (boardingResponse.data.length >= 2) {
          const firstStop = boardingResponse.data[0];
          const lastStopIndex = boardingResponse.data.length - 1;
          
          // Test alighting stops
          const alightingResponse = await axios.get(`${baseUrl}/api/routes/${route.id}/alighting-stops/${encodeURIComponent(firstStop.stopName)}`);
          console.log(`✅ Alighting stops from "${firstStop.stopName}": ${alightingResponse.data.length}`);
          
          // Test price calculation
          if (alightingResponse.data.length > 0) {
            const targetStop = alightingResponse.data[alightingResponse.data.length - 1];
            const priceResponse = await axios.get(`${baseUrl}/api/routes/${route.id}/stops/calculate-price?boardingStop=${encodeURIComponent(firstStop.stopName)}&alightingStop=${encodeURIComponent(targetStop.stopName)}`);
            
            console.log(`\n💰 Price Calculation:`);
            console.log(`From: ${firstStop.stopName} (${firstStop.distanceFromOrigin}km)`);
            console.log(`To: ${targetStop.stopName} (${targetStop.distanceFromOrigin}km)`);
            console.log(`Distance: ${priceResponse.data.distance}km`);
            console.log(`Price: UGX ${priceResponse.data.price.toLocaleString()}`);
          }
        }
      }
    }
    
    console.log('\n✅ All local tests completed successfully!');
    console.log('\n🚀 Route stops system is working locally! Deployment should be ready soon.');
    
  } catch (error) {
    console.error('\n❌ Test Error:');
    console.error('Status:', error.response?.status);
    console.error('Message:', error.response?.data || error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Local server not running. The deployed version should be ready soon.');
    }
  }
}

testLocalAPI();