// Smoke test for homepage
// Verifies that the homepage is accessible and contains expected content

const http = require('http');
const https = require('https');

/**
 * Simple HTTP GET request function
 * @param {string} url - URL to fetch
 * @returns {Promise<{status: number, body: string}>}
 */
function get(url) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const protocol = urlObj.protocol === 'https:' ? https : http;
    
    const req = protocol.get(url, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        resolve({ status: res.statusCode, body });
      });
    });
    
    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

/**
 * Test homepage accessibility
 */
async function testHomepage() {
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  const url = `${baseUrl}/`;
  
  console.log(`Testing homepage at: ${url}`);
  
  try {
    const response = await get(url);
    
    // Check status code
    if (response.status !== 200) {
      throw new Error(`Expected status 200, got ${response.status}`);
    }
    console.log('✓ Homepage returns 200 OK');
    
    // Check for "NovaHunt" in response
    if (!response.body.includes('NovaHunt') && !response.body.includes('novahunt')) {
      throw new Error('Homepage does not contain "NovaHunt"');
    }
    console.log('✓ Homepage contains "NovaHunt"');
    
    console.log('\nAll smoke tests passed!');
    process.exit(0);
  } catch (error) {
    console.error('\n✗ Smoke test failed:', error.message);
    process.exit(1);
  }
}

// Run test if executed directly
if (require.main === module) {
  testHomepage();
}

module.exports = { testHomepage };
