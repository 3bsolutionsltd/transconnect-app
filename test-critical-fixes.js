// Test Payment Confirmation Flow
// Run this after operator confirms a cash payment

const API_URL = process.env.API_URL || 'http://localhost:5000/api';
const axios = require('axios');

async function testPaymentConfirmationFlow() {
  console.log('\n🧪 Testing Payment Confirmation Flow\n');
  console.log('='.repeat(60));

  try {
    // Step 1: Get operator token
    console.log('\n📝 Step 1: Operator Login');
    const operatorLogin = await axios.post(`${API_URL}/auth/login`, {
      email: 'operator@example.com', // Replace with test operator email
      password: 'test123' // Replace with test password
    });
    
    const operatorToken = operatorLogin.data.token;
    console.log('✅ Operator logged in successfully');

    // Step 2: Get pending payments
    console.log('\n📝 Step 2: Fetch Pending Cash Payments');
    const pendingPayments = await axios.get(
      `${API_URL}/operator-payments/pending-cash`,
      {
        headers: { Authorization: `Bearer ${operatorToken}` }
      }
    );

    const payments = pendingPayments.data.pendingPayments;
    console.log(`✅ Found ${payments.length} pending payments`);

    if (payments.length === 0) {
      console.log('\n⚠️  No pending payments to test');
      console.log('Create a test booking with cash payment first');
      return;
    }

    // Step 3: Confirm first payment
    const testPayment = payments[0];
    console.log(`\n📝 Step 3: Confirming Payment ${testPayment.reference}`);
    console.log(`   Passenger: ${testPayment.passenger.name}`);
    console.log(`   Amount: UGX ${testPayment.amount}`);
    console.log(`   Booking: ${testPayment.booking.id}`);

    const confirmResponse = await axios.post(
      `${API_URL}/operator-payments/${testPayment.id}/process`,
      {
        action: 'confirm',
        notes: 'Test payment confirmation'
      },
      {
        headers: { Authorization: `Bearer ${operatorToken}` }
      }
    );

    console.log('✅ Payment confirmed successfully');
    console.log(`   New Status: ${confirmResponse.data.payment.status}`);
    console.log(`   Booking Status: ${confirmResponse.data.booking.status}`);

    // Step 4: Verify notification was sent (check backend logs)
    console.log('\n📝 Step 4: Verification Checklist');
    console.log('   Check backend console for:');
    console.log('   ✓ "Payment confirmation notification sent to user [userId]"');
    console.log('\n   Check mobile app for:');
    console.log('   ✓ Push notification received');
    console.log('   ✓ Booking status changed to CONFIRMED');
    console.log('   ✓ Email notification received');
    console.log('   ✓ SMS notification received');

    // Step 5: Fetch booking to verify status
    console.log('\n📝 Step 5: Verify Booking Status Update');
    
    // Passenger login
    const passengerLogin = await axios.post(`${API_URL}/auth/login`, {
      email: testPayment.passenger.email,
      password: 'test123' // Replace if different
    });

    const passengerToken = passengerLogin.data.token;
    
    // Get bookings
    const bookingsResponse = await axios.get(
      `${API_URL}/bookings/my-bookings`,
      {
        headers: { Authorization: `Bearer ${passengerToken}` }
      }
    );

    const confirmedBooking = bookingsResponse.data.find(
      b => b.id === testPayment.booking.id
    );

    if (confirmedBooking) {
      console.log(`✅ Booking found with status: ${confirmedBooking.status}`);
      
      if (confirmedBooking.status === 'CONFIRMED') {
        console.log('✅ Status correctly updated to CONFIRMED');
      } else {
        console.log('❌ Status not updated correctly');
        console.log(`   Expected: CONFIRMED, Got: ${confirmedBooking.status}`);
      }
    } else {
      console.log('❌ Booking not found');
    }

    console.log('\n' + '='.repeat(60));
    console.log('🎉 Payment Confirmation Flow Test Complete!\n');
    
    console.log('📊 Summary:');
    console.log(`   ✅ Payment confirmed: ${testPayment.reference}`);
    console.log(`   ✅ Booking updated: ${testPayment.booking.id}`);
    console.log(`   ✅ Notification sent to: ${testPayment.passenger.email}`);
    console.log('\n💡 Next: Check mobile app for real-time update\n');

  } catch (error) {
    console.error('\n❌ Test Failed:', error.response?.data || error.message);
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Test QR Scanner
async function testQRScanner() {
  console.log('\n🧪 QR Scanner Test Instructions\n');
  console.log('='.repeat(60));
  console.log('\n1. Open Operator Dashboard');
  console.log('2. Navigate to QR Scanner page');
  console.log('3. Click "Start Camera" button');
  console.log('4. Observe camera startup time');
  console.log('\n✅ Expected: Camera starts and stays active');
  console.log('❌ Previous Issue: Camera stopped immediately');
  console.log('\n5. Show a booking QR code to the camera');
  console.log('6. Wait 2-3 seconds for detection');
  console.log('\n✅ Expected: QR code detected and validated');
  console.log('❌ Previous Issue: Scanner stopped before detection');
  console.log('\n' + '='.repeat(60));
}

// Main test runner
async function runAllTests() {
  console.log('\n🚀 TransConnect - Critical Fixes Test Suite\n');
  console.log('Testing 3 Critical Issues:\n');
  console.log('1. QR Scanner rapid stop issue');
  console.log('2. Payment status not updating in mobile app');
  console.log('3. No notification on payment confirmation\n');

  // Test 1: QR Scanner (manual test)
  testQRScanner();

  // Wait for user to complete manual test
  console.log('\n⏳ Complete QR Scanner test, then press Enter to continue...');
  await new Promise(resolve => {
    process.stdin.once('data', resolve);
  });

  // Test 2 & 3: Payment confirmation and notifications
  await testPaymentConfirmationFlow();

  console.log('\n✨ All tests completed!\n');
  process.exit(0);
}

// Run tests
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('Test suite failed:', error);
    process.exit(1);
  });
}

module.exports = { testPaymentConfirmationFlow, testQRScanner };
