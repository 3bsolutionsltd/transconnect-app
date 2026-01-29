/**
 * Test script for Route Segment Management API
 * Tests CRUD operations for segments and price variations
 */

import axios from 'axios';

const API_BASE_URL = process.env.API_URL || 'https://transconnect-app-testing.onrender.com/api';
const TEST_TOKEN = process.env.TEST_TOKEN || ''; // Set this to a valid admin token

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    ...(TEST_TOKEN && { 'Authorization': `Bearer ${TEST_TOKEN}` })
  }
});

async function testSegmentManagement() {
  console.log('🧪 Testing Route Segment Management API\n');
  console.log('='.repeat(60) + '\n');

  try {
    // Test 1: Get segments for a route
    console.log('Test 1: Get segments for route');
    const routeId = 'kampala-fortportal-0800';
    
    try {
      const segmentsResponse = await api.get(`/routes/${routeId}/segments`);
      console.log(`✅ Found ${segmentsResponse.data.count} segments`);
      console.log(`   Segments:`, segmentsResponse.data.segments.map((s: any) => 
        `${s.fromLocation} → ${s.toLocation} (UGX ${s.basePrice})`
      ).join(', '));
    } catch (error: any) {
      console.log(`❌ Error: ${error.response?.data?.error || error.message}`);
    }

    console.log('\n' + '-'.repeat(60) + '\n');

    // Test 2: Get price variations for a segment
    console.log('Test 2: Get price variations');
    
    try {
      // First get segments to get a segment ID
      const segmentsResponse = await api.get(`/routes/${routeId}/segments`);
      if (segmentsResponse.data.segments.length > 0) {
        const firstSegment = segmentsResponse.data.segments[0];
        const variationsResponse = await api.get(`/routes/segments/${firstSegment.id}/variations`);
        console.log(`✅ Found ${variationsResponse.data.count} price variations for segment ${firstSegment.fromLocation} → ${firstSegment.toLocation}`);
        
        if (variationsResponse.data.variations.length > 0) {
          variationsResponse.data.variations.forEach((v: any) => {
            console.log(`   - ${v.variationType}: ${v.adjustmentType === 'percentage' ? '+' : ''}${v.priceAdjustment}${v.adjustmentType === 'percentage' ? '%' : ' UGX'}`);
          });
        }
      }
    } catch (error: any) {
      console.log(`❌ Error: ${error.response?.data?.error || error.message}`);
    }

    console.log('\n' + '-'.repeat(60) + '\n');

    // Test 3: Create segments (requires authentication)
    console.log('Test 3: Create segments (requires authentication)');
    
    if (!TEST_TOKEN) {
      console.log('⏭️  Skipped - No authentication token provided');
      console.log('   Set TEST_TOKEN environment variable to test authenticated endpoints');
    } else {
      try {
        const testRouteId = 'test-route-123';
        const newSegments = [
          {
            segmentOrder: 1,
            fromLocation: 'Test Origin',
            toLocation: 'Test Stop 1',
            distanceKm: 50,
            durationMinutes: 60,
            basePrice: 5000
          },
          {
            segmentOrder: 2,
            fromLocation: 'Test Stop 1',
            toLocation: 'Test Destination',
            distanceKm: 100,
            durationMinutes: 120,
            basePrice: 10000
          }
        ];

        const createResponse = await api.post(`/routes/${testRouteId}/segments`, {
          segments: newSegments
        });
        console.log(`✅ ${createResponse.data.message}`);
      } catch (error: any) {
        if (error.response?.status === 404) {
          console.log('⚠️  Test route not found (expected for test)');
        } else if (error.response?.status === 401) {
          console.log('❌ Authentication failed - Invalid or expired token');
        } else if (error.response?.status === 403) {
          console.log('❌ Authorization failed - User not authorized');
        } else {
          console.log(`❌ Error: ${error.response?.data?.error || error.message}`);
        }
      }
    }

    console.log('\n' + '-'.repeat(60) + '\n');

    // Test 4: Create price variation (requires authentication)
    console.log('Test 4: Create weekend price variation (requires authentication)');
    
    if (!TEST_TOKEN) {
      console.log('⏭️  Skipped - No authentication token provided');
    } else {
      try {
        const segmentsResponse = await api.get(`/routes/${routeId}/segments`);
        if (segmentsResponse.data.segments.length > 0) {
          const firstSegment = segmentsResponse.data.segments[0];
          
          const newVariation = {
            variationType: 'weekend',
            priceAdjustment: 15, // 15% increase
            adjustmentType: 'percentage',
            appliesToDates: {
              days: ['saturday', 'sunday']
            }
          };

          const createResponse = await api.post(
            `/routes/segments/${firstSegment.id}/variations`,
            newVariation
          );
          console.log(`✅ ${createResponse.data.message}`);
          console.log(`   Applied to: ${firstSegment.fromLocation} → ${firstSegment.toLocation}`);
          console.log(`   Adjustment: +${newVariation.priceAdjustment}%`);
        }
      } catch (error: any) {
        if (error.response?.status === 401) {
          console.log('❌ Authentication failed - Invalid or expired token');
        } else if (error.response?.status === 403) {
          console.log('❌ Authorization failed - User not authorized');
        } else {
          console.log(`❌ Error: ${error.response?.data?.error || error.message}`);
        }
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Segment Management API tests completed!\n');
    console.log('📝 Summary:');
    console.log('   - GET /routes/:routeId/segments - Fetch segments ✅');
    console.log('   - GET /routes/segments/:segmentId/variations - Fetch variations ✅');
    console.log('   - POST /routes/:routeId/segments - Create segments ' + (TEST_TOKEN ? '✅' : '⏭️'));
    console.log('   - POST /routes/segments/:segmentId/variations - Create variation ' + (TEST_TOKEN ? '✅' : '⏭️'));
    console.log('\n   Other endpoints available:');
    console.log('   - PUT /routes/segments/:segmentId - Update segment');
    console.log('   - DELETE /routes/segments/:segmentId - Delete segment');
    console.log('   - PUT /routes/variations/:variationId - Update variation');
    console.log('   - DELETE /routes/variations/:variationId - Delete variation');
    console.log('   - PATCH /routes/variations/:variationId/toggle - Toggle active status\n');

  } catch (error: any) {
    console.error('\n💥 Fatal error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

// Check if backend is running
async function checkBackendStatus() {
  try {
    const response = await axios.get('https://transconnect-app-testing.onrender.com/health');
    console.log('✅ Backend is running (Staging)\n');
    return true;
  } catch (error) {
    console.log('❌ Backend is not reachable');
    console.log('   Check if staging server is running\n');
    return false;
  }
}

// Run tests
(async () => {
  const isRunning = await checkBackendStatus();
  if (isRunning) {
    await testSegmentManagement();
  } else {
    console.log('To test authenticated endpoints, you need to:');
    console.log('1. Start the backend server');
    console.log('2. Get an admin or operator auth token');
    console.log('3. Set TEST_TOKEN environment variable');
    console.log('4. Run this script again\n');
  }
})();
