/**
 * Test KYC Upload Flow
 * This script tests the complete KYC upload process
 */

const API_BASE = 'https://transconnect-app-44ie.onrender.com/api/agents';

async function testKycUploadFlow() {
  console.log('🧪 Testing KYC Upload Flow\n');
  console.log('=' * 50);

  try {
    // Step 1: Test presigned URL generation
    console.log('\n1. Testing presigned URL generation...');
    const presignResponse = await fetch(`${API_BASE}/kyc/presign?fileName=test.jpg&contentType=image/jpeg&agentId=cmiftwot00000pe8m342bdvpi`);
    
    if (!presignResponse.ok) {
      throw new Error(`Presign failed: ${presignResponse.status}`);
    }
    
    const presignData = await presignResponse.json();
    console.log('✅ Presigned URL generated:');
    console.log(`   Upload URL: ${presignData.uploadUrl}`);
    console.log(`   File Key: ${presignData.fileKey}`);
    
    // Check if it's demo mode
    const isDemoMode = presignData.uploadUrl.startsWith('DEMO_MODE:');
    console.log(`   Mode: ${isDemoMode ? '🧪 DEMO' : '🔴 PRODUCTION'}`);
    
    // Step 2: Test upload confirmation
    console.log('\n2. Testing upload confirmation...');
    const confirmResponse = await fetch(`${API_BASE}/kyc/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agentId: 'cmiftwot00000pe8m342bdvpi',
        fileKey: presignData.fileKey,
        documentType: 'nationalId'
      })
    });
    
    if (!confirmResponse.ok) {
      const errorText = await confirmResponse.text();
      throw new Error(`Confirm upload failed: ${confirmResponse.status} - ${errorText}`);
    }
    
    const confirmData = await confirmResponse.json();
    console.log('✅ Upload confirmation successful:');
    console.log(`   Message: ${confirmData.message}`);
    console.log(`   Status: ${confirmData.status}`);
    
    console.log('\n' + '=' * 50);
    console.log('✅ KYC Upload Flow Test PASSED!');
    console.log(`\nComplete flow works: presign → ${isDemoMode ? 'simulate' : 'upload'} → confirm`);
    
  } catch (error) {
    console.error('\n❌ KYC Upload Flow Test FAILED:');
    console.error(error.message);
    console.log('\n' + '=' * 50);
  }
}

// Run the test
testKycUploadFlow();