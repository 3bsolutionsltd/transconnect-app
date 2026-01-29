import { searchRoutesWithSegments } from '../src/services/routeSegmentService';

async function testSegmentSearch() {
  console.log('🧪 Testing Segment-Based Route Search\n');
  console.log('='.repeat(60) + '\n');

  // Test 1: Search for stopover as destination (Masaka)
  console.log('Test 1: Search Kampala → Masaka (stopover as destination)');
  const test1 = await searchRoutesWithSegments({
    origin: 'Kampala',
    destination: 'Masaka',
  });
  console.log(`✅ Found ${test1.length} route(s)`);
  test1.forEach((route, idx) => {
    console.log(`\n  Route ${idx + 1}:`);
    console.log(`    ${route.pickupLocation} → ${route.dropoffLocation}`);
    console.log(`    Distance: ${route.totalDistance}km, Duration: ${route.totalDuration} min`);
    console.log(`    Price: UGX ${route.finalPrice}`);
    console.log(`    Segments: ${route.segments.length}`);
  });

  console.log('\n' + '='.repeat(60) + '\n');

  // Test 2: Search between stopovers (Masaka → Mbarara)
  console.log('Test 2: Search Masaka → Mbarara (between stopovers)');
  const test2 = await searchRoutesWithSegments({
    origin: 'Masaka',
    destination: 'Mbarara',
  });
  console.log(`✅ Found ${test2.length} route(s)`);
  test2.forEach((route, idx) => {
    console.log(`\n  Route ${idx + 1}:`);
    console.log(`    ${route.pickupLocation} → ${route.dropoffLocation}`);
    console.log(`    Distance: ${route.totalDistance}km, Duration: ${route.totalDuration} min`);
    console.log(`    Price: UGX ${route.finalPrice}`);
    console.log(`    Segments: ${route.segments.length}`);
  });

  console.log('\n' + '='.repeat(60) + '\n');

  // Test 3: Search with stopover as origin (Mityana → Fort Portal)
  console.log('Test 3: Search Mityana → Fort Portal (stopover as origin)');
  const test3 = await searchRoutesWithSegments({
    origin: 'Mityana',
    destination: 'Fort Portal',
  });
  console.log(`✅ Found ${test3.length} route(s)`);
  test3.forEach((route, idx) => {
    console.log(`\n  Route ${idx + 1}:`);
    console.log(`    ${route.pickupLocation} → ${route.dropoffLocation}`);
    console.log(`    Distance: ${route.totalDistance}km, Duration: ${route.totalDuration} min`);
    console.log(`    Price: UGX ${route.finalPrice}`);
    console.log(`    Segments: ${route.segments.length}`);
  });

  console.log('\n' + '='.repeat(60) + '\n');

  // Test 4: Weekend pricing (Saturday)
  console.log('Test 4: Weekend pricing - Kampala → Masaka on Saturday');
  const saturday = new Date('2026-01-31'); // A Saturday
  const test4 = await searchRoutesWithSegments({
    origin: 'Kampala',
    destination: 'Masaka',
    date: saturday,
  });
  console.log(`✅ Found ${test4.length} route(s)`);
  test4.forEach((route, idx) => {
    console.log(`\n  Route ${idx + 1}:`);
    console.log(`    ${route.pickupLocation} → ${route.dropoffLocation}`);
    console.log(`    Base Price: UGX ${route.basePrice}`);
    console.log(`    Final Price (with weekend premium): UGX ${route.finalPrice}`);
    console.log(`    Weekend surcharge: UGX ${route.finalPrice - route.basePrice}`);
    route.segments.forEach((seg, segIdx) => {
      console.log(`\n    Segment ${segIdx + 1}:`);
      console.log(`      Base: UGX ${seg.basePrice}`);
      console.log(`      Final: UGX ${seg.finalPrice}`);
      if (seg.adjustments.length > 0) {
        seg.adjustments.forEach(adj => {
          console.log(`      - ${adj.reason}: +UGX ${adj.amount.toFixed(0)}`);
        });
      }
    });
  });

  console.log('\n' + '='.repeat(60));
  console.log('✅ All tests completed!\n');
}

testSegmentSearch().catch(console.error);
