/**
 * Check if we can access dashboard with Stephen's registration
 */

const apiUrl = 'http://localhost:5000';

async function testDashboardAccess() {
  try {
    // Get Stephen's agent ID from the registration status check
    console.log('1. Using Stephen\'s known agent info...');
    
    // From our previous registration check, we know Stephen's details
    const agent = {
      id: 'stephen-agent-id', // We'll need to get this from DB
      name: 'Stephen Omwony',
      phone: '256770123456',
      status: 'VERIFIED',
      kycStatus: 'PENDING',
      referralCode: 'STEP6946'
    };
    
    console.log('✅ Agent info:', agent);
    
    // Now test dashboard access
    console.log('\n2. Testing dashboard access...');
    
    // For testing, we'll use a mock token since we don't have the actual login flow
    const mockToken = 'Bearer mock-token-for-testing';
    
    const dashboardResponse = await fetch(`${apiUrl}/api/agents/${agent.id}/dashboard`, {
      headers: {
        'Authorization': mockToken,
        'Content-Type': 'application/json'
      }
    });
    
    if (dashboardResponse.ok) {
      const dashboardData = await dashboardResponse.json();
      console.log('✅ Dashboard data retrieved:', dashboardData);
    } else {
      console.log('❌ Dashboard access failed:', dashboardResponse.status, dashboardResponse.statusText);
      const errorText = await dashboardResponse.text();
      console.log('Error details:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testDashboardAccess();