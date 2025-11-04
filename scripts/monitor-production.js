#!/usr/bin/env node

/**
 * TransConnect Production Deployment Monitor
 * 
 * Monitors all production services and provides deployment status
 */

const https = require('https');
const { execSync } = require('child_process');

console.log('🔍 TransConnect Production Status Monitor\n');

const services = {
  backend: 'https://transconnect-app-44ie.onrender.com/health',
  web: 'https://transconnect-app-yh7k.vercel.app',
  admin: 'https://transconnect-admin.vercel.app'
};

async function checkService(name, url) {
  if (!url) {
    console.log(`⏳ ${name.toUpperCase()}: Not yet deployed`);
    return false;
  }

  return new Promise((resolve) => {
    const startTime = Date.now();
    
    const req = https.get(url, (res) => {
      const responseTime = Date.now() - startTime;
      
      if (res.statusCode === 200) {
        console.log(`✅ ${name.toUpperCase()}: Online (${responseTime}ms) - ${url}`);
        resolve(true);
      } else {
        console.log(`❌ ${name.toUpperCase()}: Error ${res.statusCode} - ${url}`);
        resolve(false);
      }
    });

    req.on('error', (error) => {
      console.log(`❌ ${name.toUpperCase()}: Connection failed - ${error.message}`);
      resolve(false);
    });

    req.setTimeout(10000, () => {
      console.log(`⏰ ${name.toUpperCase()}: Timeout (10s) - ${url}`);
      req.destroy();
      resolve(false);
    });
  });
}

async function monitorServices() {
  console.log('📊 Checking all TransConnect services...\n');
  
  const results = await Promise.all([
    checkService('backend', services.backend),
    checkService('web', services.web),
    checkService('admin', services.admin)
  ]);

  const onlineCount = results.filter(Boolean).length;
  const totalServices = Object.keys(services).length;
  
  console.log(`\n📈 Status Summary: ${onlineCount}/${totalServices} services online`);
  
  if (onlineCount === totalServices) {
    console.log('🎉 All services operational!');
  } else {
    console.log('⚠️  Some services need attention');
  }

  console.log('\n🔗 Production URLs:');
  console.log(`Backend API: ${services.backend}`);
  console.log(`Web Portal: ${services.web || 'Pending deployment...'}`);
  console.log(`Admin Dashboard: ${services.admin || 'Pending deployment...'}`);
}

// Run monitoring
monitorServices().catch(console.error);