#!/usr/bin/env node

/**
 * Test TransConnect Domain Redirect Status
 * Run this to check if www redirect loop is fixed
 */

const https = require('https');
const http = require('http');

console.log('🧪 TESTING TRANSCONNECT.APP DOMAIN REDIRECTS');
console.log('=' + '='.repeat(50));
console.log('');

// Test function to follow redirects and detect loops
function testURL(url, maxRedirects = 10) {
  return new Promise((resolve) => {
    const redirectChain = [];
    let redirectCount = 0;
    
    function makeRequest(testUrl) {
      const protocol = testUrl.startsWith('https') ? https : http;
      
      const options = {
        method: 'HEAD',
        timeout: 10000,
        headers: {
          'User-Agent': 'TransConnect-Domain-Test/1.0'
        }
      };
      
      const req = protocol.request(testUrl, options, (res) => {
        redirectChain.push({
          url: testUrl,
          status: res.statusCode,
          location: res.headers.location
        });
        
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          redirectCount++;
          
          if (redirectCount > maxRedirects) {
            resolve({
              success: false,
              error: 'Too many redirects (loop detected)',
              chain: redirectChain,
              redirectCount
            });
            return;
          }
          
          // Check if we've seen this URL before (loop detection)
          const seenUrls = redirectChain.map(r => r.url);
          if (seenUrls.includes(res.headers.location)) {
            resolve({
              success: false,
              error: 'Redirect loop detected',
              chain: redirectChain,
              redirectCount,
              loopUrl: res.headers.location
            });
            return;
          }
          
          // Follow redirect
          const nextUrl = res.headers.location.startsWith('http') 
            ? res.headers.location 
            : `https://${testUrl.split('//')[1].split('/')[0]}${res.headers.location}`;
          
          makeRequest(nextUrl);
        } else {
          resolve({
            success: true,
            finalStatus: res.statusCode,
            chain: redirectChain,
            redirectCount
          });
        }
      });
      
      req.on('error', (err) => {
        resolve({
          success: false,
          error: err.message,
          chain: redirectChain
        });
      });
      
      req.on('timeout', () => {
        req.destroy();
        resolve({
          success: false,
          error: 'Request timeout',
          chain: redirectChain
        });
      });
      
      req.end();
    }
    
    makeRequest(url);
  });
}

async function runTests() {
  const domains = [
    'https://transconnect.app',
    'https://www.transconnect.app',
    'https://transconnect.app/agents',
    'https://www.transconnect.app/agents'
  ];
  
  console.log('🔍 Testing domain redirects and accessibility...\n');
  
  for (const domain of domains) {
    console.log(`📡 Testing: ${domain}`);
    
    try {
      const result = await testURL(domain);
      
      if (result.success) {
        console.log(`✅ SUCCESS - Final status: ${result.finalStatus}`);
        if (result.redirectCount > 0) {
          console.log(`🔄 Redirects: ${result.redirectCount}`);
          result.chain.forEach((step, i) => {
            console.log(`   ${i + 1}. ${step.status} ${step.url} ${step.location ? `→ ${step.location}` : ''}`);
          });
        } else {
          console.log(`📍 Direct access (no redirects)`);
        }
      } else {
        console.log(`❌ FAILED: ${result.error}`);
        if (result.chain && result.chain.length > 0) {
          console.log(`🔄 Redirect chain:`);
          result.chain.forEach((step, i) => {
            console.log(`   ${i + 1}. ${step.status} ${step.url} ${step.location ? `→ ${step.location}` : ''}`);
          });
        }
        if (result.loopUrl) {
          console.log(`🔁 Loop detected at: ${result.loopUrl}`);
        }
      }
      
    } catch (error) {
      console.log(`❌ ERROR: ${error.message}`);
    }
    
    console.log('');
  }
  
  console.log('🎯 EXPECTED RESULTS:');
  console.log('✅ https://transconnect.app → 200 (direct access)');
  console.log('✅ https://www.transconnect.app → 301 → https://transconnect.app → 200');
  console.log('✅ /agents paths → 200 (should work on both domains)');
  console.log('❌ NO redirect loops or ERR_TOO_MANY_REDIRECTS');
  console.log('');
  
  console.log('💡 If you see redirect loops, clear browser cache:');
  console.log('   Chrome: Ctrl+Shift+R or Cmd+Shift+R');
  console.log('   Firefox: Ctrl+F5 or Cmd+Shift+R');
  console.log('   Safari: Cmd+Option+R');
}

// Run the tests
runTests().catch(console.error);