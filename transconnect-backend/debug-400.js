const axios = require('axios');

const API_BASE = 'https://transconnect-app-44ie.onrender.com/api';

async function debugPaymentIssue() {
  try {
    console.log('🔍 Debugging payment 400 error...\n');

    // Check what happens when we make the exact same call as the frontend
    console.log('1. Testing without authentication (like frontend might be doing)...');
    
    try {
      const response = await axios.post(`${API_BASE}/payments/initiate`, {
        bookingId: 'test-booking-id',
        method: 'MTN_MOBILE_MONEY',
        phoneNumber: '256701234567'
      });
      console.log('✅ Response:', response.data);
    } catch (error) {
      console.log('❌ Expected error without auth:');
      console.log('Status:', error.response?.status);
      console.log('Data:', JSON.stringify(error.response?.data, null, 2));
    }

    console.log('\n2. Testing with invalid token...');
    try {
      const response = await axios.post(`${API_BASE}/payments/initiate`, {
        bookingId: 'test-booking-id', 
        method: 'MTN_MOBILE_MONEY',
        phoneNumber: '256701234567'
      }, {
        headers: { Authorization: 'Bearer invalid-token' }
      });
      console.log('✅ Response:', response.data);
    } catch (error) {
      console.log('❌ Error with invalid token:');
      console.log('Status:', error.response?.status);
      console.log('Data:', JSON.stringify(error.response?.data, null, 2));
    }

    console.log('\n3. Testing validation errors...');
    try {
      const response = await axios.post(`${API_BASE}/payments/initiate`, {
        // Missing required fields
      }, {
        headers: { Authorization: 'Bearer invalid-token' }
      });
    } catch (error) {
      console.log('❌ Validation error:');
      console.log('Status:', error.response?.status);
      console.log('Data:', JSON.stringify(error.response?.data, null, 2));
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

debugPaymentIssue();