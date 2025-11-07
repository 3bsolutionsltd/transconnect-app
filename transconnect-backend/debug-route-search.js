const axios = require('axios');

const API_BASE = 'https://transconnect-api.onrender.com';

async function debugRouteSearch() {
    console.log('🔍 Debug: Route Search Investigation');
    console.log('=====================================');
    
    try {
        // Test 1: Basic routes endpoint
        console.log('\n1. Testing basic routes endpoint (no parameters)...');
        const basicResponse = await axios.get(`${API_BASE}/api/routes`);
        console.log(`✅ Status: ${basicResponse.status}`);
        console.log(`📊 Routes count: ${basicResponse.data.length}`);
        console.log(`📋 First route:`, basicResponse.data[0] || 'None');
        
        // Test 2: Routes with search parameters
        console.log('\n2. Testing routes with search parameters...');
        const searchResponse = await axios.get(`${API_BASE}/api/routes`, {
            params: {
                origin: 'Kampala',
                destination: 'Jinja'
            }
        });
        console.log(`✅ Status: ${searchResponse.status}`);
        console.log(`📊 Filtered routes count: ${searchResponse.data.length}`);
        
        // Test 3: Check if routes have required data structure
        console.log('\n3. Analyzing route data structure...');
        if (basicResponse.data.length > 0) {
            const route = basicResponse.data[0];
            console.log('📋 Route structure analysis:');
            console.log('- ID:', route.id || 'Missing');
            console.log('- Origin:', route.origin || 'Missing');
            console.log('- Destination:', route.destination || 'Missing');
            console.log('- Price:', route.price || 'Missing');
            console.log('- Operator:', route.operator?.name || 'Missing operator data');
            console.log('- Bus:', route.bus?.busNumber || 'Missing bus data');
        }
        
        // Test 4: Check CORS headers
        console.log('\n4. Checking CORS headers...');
        console.log('Access-Control-Allow-Origin:', basicResponse.headers['access-control-allow-origin'] || 'Not set');
        console.log('Access-Control-Allow-Methods:', basicResponse.headers['access-control-allow-methods'] || 'Not set');
        
        // Test 5: Test from different origins
        console.log('\n5. Testing common search scenarios...');
        const testSearches = [
            { origin: 'Kampala', destination: 'Jinja' },
            { origin: 'Entebbe', destination: 'Kampala' },
            { travelDate: new Date().toISOString().split('T')[0] },
            {} // Empty search
        ];
        
        for (const searchParams of testSearches) {
            const response = await axios.get(`${API_BASE}/api/routes`, { params: searchParams });
            console.log(`🔍 Search ${JSON.stringify(searchParams)}: ${response.data.length} routes found`);
        }
        
        console.log('\n✅ Route search debugging completed successfully!');
        
    } catch (error) {
        console.error('\n❌ Error during route search debugging:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Headers:', error.response.headers);
            console.error('Data:', error.response.data);
        } else if (error.request) {
            console.error('No response received:', error.request);
        } else {
            console.error('Error:', error.message);
        }
    }
}

// Run the debug
debugRouteSearch();