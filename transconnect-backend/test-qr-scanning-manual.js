// Direct API test for QR validation
const API_BASE_URL = 'https://transconnect-app-44ie.onrender.com/api';

// Test QR data (this is what would be in a real QR code)
const testQRData = {
  bookingId: 'demo_test_12345',
  passengerName: 'John Doe',
  route: 'Kampala → Jinja',
  seatNumber: 'A12',
  travelDate: '2025-11-07T08:00:00.000Z',
  busPlate: 'UAH-001A',
  operator: 'Swift Safaris',
  timestamp: new Date().toISOString(),
  signature: 'demo_signature_abc123'
};

console.log('🔍 Testing QR Validation API...');
console.log('📱 QR Data to scan:');
console.log(JSON.stringify(testQRData, null, 2));
console.log('');

// Call validation API
fetch(`${API_BASE_URL}/qr/validate`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    qrData: JSON.stringify(testQRData),
    scannedBy: 'Test Operator',
    location: 'Kampala Terminal'
  })
})
.then(response => response.json())
.then(result => {
  console.log('📊 SCAN RESULT:');
  console.log('═'.repeat(50));
  
  if (result.valid) {
    console.log('✅ STATUS: VALID TICKET');
    console.log('👤 Passenger:', result.bookingDetails?.passengerName);
    console.log('🚌 Route:', result.bookingDetails?.route);
    console.log('💺 Seat:', result.bookingDetails?.seatNumber);
    console.log('✅ ACTION: Allow boarding');
  } else {
    console.log('❌ STATUS: INVALID TICKET');
    console.log('🚫 Error:', result.error);
    console.log('❌ ACTION: Deny boarding');
  }
  
  console.log('═'.repeat(50));
})
.catch(error => {
  console.error('❌ API Error:', error);
});

// Instructions for manual testing
console.log('\n📋 TO TEST MANUALLY:');
console.log('1. Copy the QR data above');
console.log('2. Go to: https://transconnect-admin.vercel.app');
console.log('3. Login and go to QR Scanner');
console.log('4. Paste in manual input field');
console.log('5. Click "Validate QR Code"');
console.log('6. You should see "INVALID - Booking not found"');
console.log('   (This is expected for demo data)');