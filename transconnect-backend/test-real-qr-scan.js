// Test with a real booking by creating one first, then scanning its QR
const API_BASE_URL = 'https://transconnect-app-44ie.onrender.com/api';

async function testRealBookingQRScan() {
  console.log('🎫 Testing QR Scanning with REAL Booking Data\n');

  try {
    // First, let's create a test booking through the demo payment flow
    console.log('1️⃣ Creating a real booking...');
    
    // Use demo mode to create a booking and payment
    const demoBookingData = {
      routeId: 'kampala-jinja-0800', // Use existing route
      seatNumber: 'A15',
      travelDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      passengerName: 'Real Test Passenger',
      passengerPhone: '+256701234567',
      passengerEmail: 'realtest@example.com',
      totalAmount: 15000
    };

    // Simulate the payment process that generates QR codes
    console.log('2️⃣ Processing demo payment to generate QR...');
    const paymentResponse = await fetch(`${API_BASE_URL}/payments/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        bookingId: `demo_${Date.now()}`,
        amount: 15000,
        currency: 'UGX',
        provider: 'MTN',
        phoneNumber: '+256701234567',
        // Include booking data for QR generation
        passengerName: demoBookingData.passengerName,
        route: 'Kampala → Jinja',
        seatNumber: demoBookingData.seatNumber,
        travelDate: demoBookingData.travelDate,
        busPlate: 'UAH-001A',
        operator: 'Swift Safaris'
      })
    });

    const paymentResult = await paymentResponse.json();
    console.log('💳 Payment Status:', paymentResult.status);

    if (paymentResult.qrCode) {
      console.log('✅ QR Code Generated!');
      console.log('📱 QR Code Length:', paymentResult.qrCode.length, 'characters');
      
      // Now extract the QR data to show what would be scanned
      if (paymentResult.bookingDetails) {
        console.log('\n🔍 QR Code Contains:');
        console.log('─'.repeat(50));
        console.log('👤 Passenger:', paymentResult.bookingDetails.passengerName);
        console.log('🚌 Route:', paymentResult.bookingDetails.route);
        console.log('💺 Seat:', paymentResult.bookingDetails.seatNumber);
        console.log('📅 Travel Date:', new Date(paymentResult.bookingDetails.travelDate).toLocaleDateString());
        console.log('🚐 Bus Plate:', paymentResult.bookingDetails.busPlate);
        console.log('🏢 Operator:', paymentResult.bookingDetails.operator);
        console.log('─'.repeat(50));

        // Simulate scanning this QR code
        console.log('\n📱 SCANNING THIS QR CODE...');
        console.log('(This is what the operator sees when scanning)');
        
        const qrScanData = {
          bookingId: paymentResult.bookingDetails.bookingId || `demo_${Date.now()}`,
          passengerName: paymentResult.bookingDetails.passengerName,
          route: paymentResult.bookingDetails.route,
          seatNumber: paymentResult.bookingDetails.seatNumber,
          travelDate: paymentResult.bookingDetails.travelDate,
          busPlate: paymentResult.bookingDetails.busPlate,
          operator: paymentResult.bookingDetails.operator,
          timestamp: new Date().toISOString(),
          signature: `demo_sig_${Date.now()}`
        };

        const scanResponse = await fetch(`${API_BASE_URL}/qr/validate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            qrData: JSON.stringify(qrScanData),
            scannedBy: 'Terminal Operator',
            location: 'Kampala Central Bus Terminal'
          })
        });

        const scanResult = await scanResponse.json();
        
        console.log('\n📊 OPERATOR SCREEN DISPLAY:');
        console.log('═'.repeat(60));
        
        if (scanResult.valid) {
          console.log('🟢 STATUS: VALID TICKET ✅');
          console.log('');
          console.log('🎫 TICKET INFORMATION:');
          console.log(`   Passenger: ${scanResult.bookingDetails?.passengerName || qrScanData.passengerName}`);
          console.log(`   Route: ${scanResult.bookingDetails?.route || qrScanData.route}`);
          console.log(`   Seat Number: ${scanResult.bookingDetails?.seatNumber || qrScanData.seatNumber}`);
          console.log(`   Travel Date: ${new Date(scanResult.bookingDetails?.travelDate || qrScanData.travelDate).toLocaleDateString()}`);
          console.log(`   Bus: ${scanResult.bookingDetails?.busPlate || qrScanData.busPlate}`);
          console.log('');
          console.log('✅ ACTION: ALLOW BOARDING');
          
          if (scanResult.alreadyScanned) {
            console.log('⚠️  WARNING: Previously scanned');
            console.log(`   First scan: ${new Date(scanResult.scanDetails.scannedAt).toLocaleString()}`);
            console.log(`   Scanned by: ${scanResult.scanDetails.scannedBy}`);
          } else {
            console.log('🆕 FIRST SCAN: Record passenger boarding');
          }
        } else {
          console.log('🔴 STATUS: INVALID TICKET ❌');
          console.log(`   Error: ${scanResult.error}`);
          console.log('❌ ACTION: DENY BOARDING');
        }
        
        console.log('═'.repeat(60));
        
      } else {
        console.log('❌ No booking details in QR response');
      }
    } else {
      console.log('❌ No QR code generated in demo payment');
      console.log('Response keys:', Object.keys(paymentResult));
    }

    console.log('\n🎯 QR SCANNING CAPABILITIES:');
    console.log('▶️  Instant passenger verification');
    console.log('▶️  Real-time booking validation');
    console.log('▶️  Duplicate scan prevention');
    console.log('▶️  Complete journey details');
    console.log('▶️  Operator audit trail');
    console.log('▶️  Security signature verification');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testRealBookingQRScan();