const axios = require('axios');

const API_BASE = 'https://transconnect-app-44ie.onrender.com/api';

async function checkDemoMode() {
  try {
    console.log('🔍 Checking demo mode status...\n');

    // Create a simple endpoint test to check environment
    console.log('Making a basic request to check demo mode...');
    
    // Try to hit a payment endpoint without auth to see the error
    const response = await axios.post(`${API_BASE}/payments/initiate`, {
      bookingId: 'test-id',
      method: 'MTN_MOBILE_MONEY',
      phoneNumber: '256701234567'
    });
    
  } catch (error) {
    console.log('Status:', error.response?.status);
    console.log('Error message:', error.response?.data?.error);
    
    // Check if we get phone validation error or auth error
    if (error.response?.data?.error?.includes('registered for MTN')) {
      console.log('🚨 DEMO MODE IS NOT WORKING - Phone validation is still active!');
    } else if (error.response?.data?.error?.includes('token')) {
      console.log('✅ No phone validation error - demo mode might be working');
    } else {
      console.log('🤔 Different error:', error.response?.data);
    }
  }
}

checkDemoMode();