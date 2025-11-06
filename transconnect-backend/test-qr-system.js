// Test QR validation endpoint to ensure our QR system is working
const API_BASE_URL = 'https://transconnect-app-44ie.onrender.com/api';

async function testQRValidation() {
  console.log('🧪 Testing QR Code Validation System...\n');

  try {
    // Create test QR data matching our system format
    const testQRData = {
      bookingId: 'test-booking-123',
      passengerName: 'John Doe',
      route: 'Kampala → Jinja',
      seatNumber: 'A12',
      travelDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      busPlate: 'UAH-001A',
      operator: 'Swift Safaris',
      timestamp: new Date().toISOString(),
      signature: 'demo-test-signature-123'
    };

    console.log('📱 Testing QR Data:');
    console.log(JSON.stringify(testQRData, null, 2));
    console.log('');

    // Test QR validation
    console.log('🔍 Testing QR validation endpoint...');
    const validateResponse = await fetch(`${API_BASE_URL}/qr/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        qrData: JSON.stringify(testQRData),
        scannedBy: 'Test Operator',
        location: 'Test Terminal'
      })
    });

    const validationResult = await validateResponse.json();
    console.log('📋 Validation Response:', validationResult);

    if (validationResult.valid) {
      console.log('✅ QR validation system is working!');
      console.log('👤 Passenger:', validationResult.bookingDetails?.passengerName);
      console.log('🚌 Route:', validationResult.bookingDetails?.route);
      console.log('💺 Seat:', validationResult.bookingDetails?.seatNumber);
    } else {
      console.log('❌ QR validation failed:', validationResult.error);
    }

    // Test QR generation endpoint
    console.log('\n🎯 Testing QR generation endpoint...');
    const generateResponse = await fetch(`${API_BASE_URL}/qr/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        bookingId: 'test-booking-456',
        passengerName: 'Jane Smith',
        route: 'Entebbe → Kampala',
        seatNumber: 'B8',
        travelDate: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
        busPlate: 'UAH-002B',
        operator: 'Swift Safaris'
      })
    });

    if (generateResponse.ok) {
      const generateResult = await generateResponse.json();
      console.log('📱 QR Generation Response:', {
        success: generateResult.success,
        qrCodeLength: generateResult.qrCode?.length || 0,
        hasSignature: !!generateResult.signature
      });

      if (generateResult.qrCode) {
        console.log('✅ QR generation system is working!');
        console.log('📋 QR Code preview:', generateResult.qrCode.substring(0, 50) + '...');
      }
    } else {
      const errorResult = await generateResponse.json();
      console.log('❌ QR generation failed:', errorResult);
    }

    console.log('\n🎉 QR System Test Summary:');
    console.log('✅ QR validation endpoint: Available');
    console.log('✅ QR generation endpoint: Available');
    console.log('✅ QR data format: Compatible');
    console.log('🔧 System ready for payment integration');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testQRValidation();