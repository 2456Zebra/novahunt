// tests/smoke/homepage.test.js
// Smoke test for homepage to catch regressions
// This test ensures the homepage route returns a 200 response and contains expected content

const http = require('http');

/**
 * Simple smoke test that can be run with: node tests/smoke/homepage.test.js
 * Or integrated into a test framework like Jest or Mocha
 */
async function testHomepage() {
  // If running in a test environment with a server, use that
  // Otherwise, this test assumes the server is running on localhost:3000
  const hostname = process.env.TEST_HOST || 'localhost';
  const port = process.env.TEST_PORT || 3000;
  
  return new Promise((resolve, reject) => {
    const timeout = parseInt(process.env.TEST_TIMEOUT) || 5000;
    const options = {
      hostname,
      port,
      path: '/',
      method: 'GET',
      timeout
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        // Test 1: Check status code is 200
        if (res.statusCode !== 200) {
          reject(new Error(`Expected status 200, got ${res.statusCode}`));
          return;
        }
        
        // Test 2: Check that response contains key UI string 'NovaHunt'
        if (!data.includes('NovaHunt')) {
          reject(new Error('Homepage does not contain expected content: "NovaHunt"'));
          return;
        }
        
        // Test 3: Check that response looks like HTML
        if (!data.includes('<!DOCTYPE html>') && !data.includes('<html')) {
          reject(new Error('Homepage does not appear to be valid HTML'));
          return;
        }
        
        console.log('✓ Homepage smoke test passed');
        console.log(`  - Status code: ${res.statusCode}`);
        console.log(`  - Contains "NovaHunt": true`);
        console.log(`  - HTML structure: valid`);
        resolve();
      });
    });

    req.on('error', (err) => {
      reject(new Error(`Failed to connect to ${hostname}:${port} - ${err.message}`));
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Request to ${hostname}:${port} timed out`));
    });

    req.end();
  });
}

// Run the test if this file is executed directly
if (require.main === module) {
  console.log('Running homepage smoke test...');
  testHomepage()
    .then(() => {
      console.log('✅ All smoke tests passed!');
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Smoke test failed:', err.message);
      process.exit(1);
    });
}

// Export for use in test frameworks
module.exports = { testHomepage };
