const axios = require('axios');

const API_BASE = 'https://transconnect-api.onrender.com';

async function testEndpoints() {
    console.log('🔍 Testing API Endpoints');
    console.log('========================');
    
    const endpoints = [
        '/health',
        '/api/health', 
        '/api/routes',
        '/api/auth/health'
    ];
    
    for (const endpoint of endpoints) {
        try {
            console.log(`\n📡 Testing: ${API_BASE}${endpoint}`);
            const response = await axios.get(`${API_BASE}${endpoint}`);
            console.log(`✅ Status: ${response.status}`);
            console.log(`📋 Response: `, JSON.stringify(response.data, null, 2));
        } catch (error) {
            console.log(`❌ Failed: ${endpoint}`);
            if (error.response) {
                console.log(`   Status: ${error.response.status}`);
                console.log(`   Error: ${error.response.data}`);
            } else {
                console.log(`   Error: ${error.message}`);
            }
        }
    }
}

testEndpoints();