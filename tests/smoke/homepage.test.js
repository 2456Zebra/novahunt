/**
 * Smoke test for homepage
 * Verifies that the homepage is accessible and returns expected content
 */

const http = require('http');

async function testHomepage() {
  const port = process.env.PORT || 3000;
  const hostname = process.env.HOST || 'localhost';
  
  console.log(`Testing homepage at http://${hostname}:${port}/`);
  
  return new Promise((resolve, reject) => {
    const req = http.get(`http://${hostname}:${port}/`, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        // Check for 200 status code
        if (res.statusCode === 200) {
          console.log('✓ Homepage returned 200 status');
        } else {
          console.error(`✗ Expected 200 status, got ${res.statusCode}`);
          reject(new Error(`Status code ${res.statusCode}`));
          return;
        }
        
        // Check for 'NovaHunt' in response
        if (data.includes('NovaHunt')) {
          console.log('✓ Homepage contains "NovaHunt"');
          resolve();
        } else {
          console.error('✗ Homepage does not contain "NovaHunt"');
          reject(new Error('NovaHunt not found in response'));
        }
      });
    });
    
    req.on('error', (err) => {
      console.error('✗ Request failed:', err.message);
      console.log('\nNote: Server must be running for smoke test to pass.');
      console.log('Start server with: npm run dev or npm start');
      reject(err);
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

// Run the test
testHomepage()
  .then(() => {
    console.log('\n✓ All smoke tests passed!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n✗ Smoke test failed:', err.message);
    process.exit(1);
  });
