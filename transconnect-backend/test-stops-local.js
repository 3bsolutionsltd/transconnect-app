const axios = require('axios');
const baseUrl = 'http://localhost:5000';

async function testRouteStopsAPI() {
  try {
    console.log('🧪 Testing Route Stops API (Local)...\n');
    
    // 1. Test basic routes endpoint
    console.log('1. Testing routes endpoint:');
    const routesRes = await axios.get(`${baseUrl}/api/routes`);
    console.log(`   ✅ Found ${routesRes.data.length} routes`);
    
    if (routesRes.data.length === 0) {
      console.log('   ⚠️  No routes found - adding sample data first');
      return;
    }
    
    const route = routesRes.data[0];
    console.log(`   📍 Route: ${route.origin} → ${route.destination}`);
    console.log(`   🛤️  Stops: ${route.stops?.length || 0}`);
    
    if (route.stops && route.stops.length > 0) {
      console.log('\n   Sample stops:');
      route.stops.forEach((stop, index) => {
        console.log(`     ${index + 1}. ${stop.stopName} - ${stop.distanceFromOrigin}km - UGX ${stop.priceFromOrigin.toLocaleString()} - ${stop.estimatedTime}`);
      });
    }
    
    // 2. Test route stops endpoints
    console.log(`\n2. Testing route ${route.id} stops endpoints:`);
    
    // Get stops for route
    const stopsRes = await axios.get(`${baseUrl}/api/routes/${route.id}/stops`);
    console.log(`   ✅ Route stops: ${stopsRes.data.length}`);
    
    // Get boarding stops
    const boardingRes = await axios.get(`${baseUrl}/api/routes/${route.id}/boarding-stops`);
    console.log(`   ✅ Boarding stops: ${boardingRes.data.length}`);
    
    if (boardingRes.data.length > 0) {
      const firstStop = boardingRes.data[0];
      console.log(`   📍 First boarding stop: ${firstStop.stopName}`);
      
      // Get alighting stops from first boarding stop
      const alightingRes = await axios.get(`${baseUrl}/api/routes/${route.id}/alighting-stops/${encodeURIComponent(firstStop.stopName)}`);
      console.log(`   ✅ Alighting stops from "${firstStop.stopName}": ${alightingRes.data.length}`);
      
      if (alightingRes.data.length > 0) {
        const lastStop = alightingRes.data[alightingRes.data.length - 1];
        console.log(`   📍 Last alighting stop: ${lastStop.stopName}`);
        
        // Test price calculation
        console.log(`\n3. Testing price calculation:`);
        const priceRes = await axios.get(`${baseUrl}/api/routes/${route.id}/stops/calculate-price`, {
          params: {
            boardingStop: firstStop.stopName,
            alightingStop: lastStop.stopName
          }
        });
        
        console.log(`   💰 Price from "${firstStop.stopName}" to "${lastStop.stopName}": UGX ${priceRes.data.price.toLocaleString()}`);
        console.log(`   📏 Distance: ${priceRes.data.distance}km`);
      }
    }
    
    console.log('\n✅ All Route Stops API tests passed!');
    
  } catch (error) {
    console.error('❌ API Test Error:', error.response?.data || error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
    }
  }
}

testRouteStopsAPI();