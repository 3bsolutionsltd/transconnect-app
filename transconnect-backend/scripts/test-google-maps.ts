/**
 * Test Google Maps Distance Matrix Integration
 * 
 * This script tests the Google Maps service for calculating distances
 * and durations between Uganda locations.
 */

import { googleMapsService } from '../src/services/googleMaps.service';
import dotenv from 'dotenv';

dotenv.config();

async function testGoogleMapsIntegration() {
  console.log('🗺️  Testing Google Maps Distance Matrix Integration\n');
  console.log('='.repeat(60));

  // Check if service is enabled
  if (!googleMapsService.isEnabled()) {
    console.error('❌ Google Maps service is not enabled');
    console.error('Please set GOOGLE_MAPS_API_KEY in your .env file');
    process.exit(1);
  }

  console.log('✅ Google Maps service is enabled\n');

  // Test locations in Uganda
  const testCases = [
    { origin: 'Kampala, Uganda', destination: 'Jinja, Uganda' },
    { origin: 'Kampala, Uganda', destination: 'Mbarara, Uganda' },
    { origin: 'Kampala, Uganda', destination: 'Fort Portal, Uganda' },
    { origin: 'Entebbe, Uganda', destination: 'Kampala, Uganda' },
    { origin: 'Masaka, Uganda', destination: 'Mbarara, Uganda' },
  ];

  console.log('Test Case 1: Single Distance Calculation');
  console.log('-'.repeat(60));
  
  for (const testCase of testCases.slice(0, 2)) {
    console.log(`\nCalculating: ${testCase.origin} → ${testCase.destination}`);
    
    const result = await googleMapsService.calculateDistance(
      testCase.origin,
      testCase.destination
    );

    if (result.success) {
      console.log('✅ Success!');
      console.log(`   Distance: ${result.distanceKm} km (${result.distanceText})`);
      console.log(`   Duration: ${result.durationMinutes} minutes (${result.durationText})`);
    } else {
      console.log('❌ Failed!');
      console.log(`   Error: ${result.error}`);
    }
  }

  // Test batch calculation
  console.log('\n\n' + '='.repeat(60));
  console.log('Test Case 2: Batch Distance Calculation');
  console.log('-'.repeat(60));

  const batchPairs = testCases.map(tc => ({ 
    origin: tc.origin, 
    destination: tc.destination 
  }));

  console.log(`\nCalculating ${batchPairs.length} routes in batch...`);
  const startTime = Date.now();
  
  const batchResults = await googleMapsService.calculateDistanceBatch(batchPairs);
  
  const endTime = Date.now();
  const duration = (endTime - startTime) / 1000;

  console.log(`\n✅ Batch calculation completed in ${duration.toFixed(2)}s`);
  console.log(`Success rate: ${batchResults.filter(r => r.success).length}/${batchResults.length}\n`);

  batchResults.forEach((result, index) => {
    console.log(`${index + 1}. ${result.origin} → ${result.destination}`);
    if (result.success) {
      console.log(`   ✓ ${result.distanceKm} km, ${result.durationMinutes} min`);
    } else {
      console.log(`   ✗ Failed: ${result.error}`);
    }
  });

  // Test geocoding
  console.log('\n\n' + '='.repeat(60));
  console.log('Test Case 3: Geocoding');
  console.log('-'.repeat(60));

  const locationsToGeocode = [
    'Kampala, Uganda',
    'Entebbe International Airport, Uganda',
    'Makerere University, Kampala',
  ];

  for (const location of locationsToGeocode) {
    console.log(`\nGeocoding: ${location}`);
    const coordinates = await googleMapsService.geocode(location);
    
    if (coordinates) {
      console.log(`✅ Found: ${coordinates.lat}, ${coordinates.lng}`);
    } else {
      console.log('❌ Not found');
    }
  }

  // Test location validation
  console.log('\n\n' + '='.repeat(60));
  console.log('Test Case 4: Location Validation');
  console.log('-'.repeat(60));

  const locationsToValidate = [
    'Kampala, Uganda',
    'Invalid Location XYZ123',
    'Jinja, Uganda',
  ];

  for (const location of locationsToValidate) {
    const isValid = await googleMapsService.validateLocation(location);
    console.log(`${isValid ? '✅' : '❌'} ${location}: ${isValid ? 'Valid' : 'Invalid'}`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ All tests completed!\n');
}

// Run tests
testGoogleMapsIntegration()
  .then(() => {
    console.log('Test suite finished successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  });
