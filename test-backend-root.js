// Simple backend health check
const https = require('https');

function testRoot() {
  const req = https.request('https://transconnect-backend.onrender.com/', (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
      console.log(`Status: ${res.statusCode}`);
      console.log(`Response: ${body}`);
    });
  });
  
  req.on('error', (error) => {
    console.error('Error:', error.message);
  });
  
  req.end();
}

testRoot();