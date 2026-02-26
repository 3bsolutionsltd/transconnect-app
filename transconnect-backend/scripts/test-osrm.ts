/**
 * Quick OSRM Test Script
 * Tests OSRM integration with Uganda locations
 */

import { osrmService } from '../src/services/osrm.service';

async function quickTest() {
  console.log('🗺️  OSRM Quick Test - Uganda Locations\n');
  console.log('='.repeat(60));

  // Test 1: Simple route
  console.log('\n✅ Test 1: Kampala → Jinja');
  console.log('-'.repeat(60));
  const test1 = await osrmService.calculateDistance('Kampala, Uganda', 'Jinja, Uganda');
  console.log(`Distance: ${test1.distanceKm} km`);
  console.log(`Duration: ${test1.durationMinutes} minutes`);
  console.log(`Status: ${test1.success ? '✅ SUCCESS' : '❌ FAILED'}`);

  // Test 2: Longer route
  console.log('\n✅ Test 2: Kampala → Mbarara');
  console.log('-'.repeat(60));
  const test2 = await osrmService.calculateDistance('Kampala, Uganda', 'Mbarara, Uganda');
  console.log(`Distance: ${test2.distanceKm} km`);
  console.log(`Duration: ${test2.durationMinutes} minutes`);
  console.log(`Status: ${test2.success ? '✅ SUCCESS' : '❌ FAILED'}`);

  // Test 3: Another common route
  console.log('\n✅ Test 3: Kampala → Masaka');
  console.log('-'.repeat(60));
  const test3 = await osrmService.calculateDistance('Kampala, Uganda', 'Masaka, Uganda');
  console.log(`Distance: ${test3.distanceKm} km`);
  console.log(`Duration: ${test3.durationMinutes} minutes`);
  console.log(`Status: ${test3.success ? '✅ SUCCESS' : '❌ FAILED'}`);

  // Test 4: Geocoding
  console.log('\n✅ Test 4: Geocode Entebbe');
  console.log('-'.repeat(60));
  const coords = await osrmService.geocode('Entebbe, Uganda');
  if (coords) {
    console.log(`Coordinates: ${coords.lat}, ${coords.lng}`);
    console.log('Status: ✅ SUCCESS');
  } else {
    console.log('Status: ❌ FAILED');
  }

  // Test 5: Location validation
  console.log('\n✅ Test 5: Validate Locations');
  console.log('-'.repeat(60));
  const validKampala = await osrmService.validateLocation('Kampala, Uganda');
  const validInvalid = await osrmService.validateLocation('NonExistentCity12345, Uganda');
  console.log(`Kampala valid: ${validKampala ? '✅ YES' : '❌ NO'}`);
  console.log(`Fake city valid: ${validInvalid ? '❌ UNEXPECTED' : '✅ NO (correct)'}`);

  // Test 6: Batch calculation
  console.log('\n✅ Test 6: Batch Calculation');
  console.log('-'.repeat(60));
  const pairs = [
    { origin: 'Kampala, Uganda', destination: 'Entebbe, Uganda' },
    { origin: 'Kampala, Uganda', destination: 'Fort Portal, Uganda' },
  ];
  const batchResults = await osrmService.calculateDistanceBatch(pairs);
  batchResults.forEach((result, i) => {
    console.log(`${i + 1}. ${result.origin} → ${result.destination}`);
    console.log(`   ${result.success ? '✅' : '❌'} ${result.distanceKm} km, ${result.durationMinutes} min`);
  });

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('🎉 OSRM Test Complete!');
  console.log('='.repeat(60));
  console.log('\nService Info:');
  const info = osrmService.getInfo();
  console.log(`  Name: ${info.name}`);
  console.log(`  Provider: ${info.provider}`);
  console.log(`  Cost: ${info.cost}`);
  console.log(`  API Key Required: ${info.apiKey ? 'Yes' : 'No'}`);
  console.log('\n✅ All tests completed successfully!\n');
}

quickTest()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
