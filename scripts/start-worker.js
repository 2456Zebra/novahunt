#!/usr/bin/env node
// scripts/start-worker.js — Start the collection worker
const { createCollectorWorker } = require('../workers/collectorWorker');

console.log('Starting collection worker...');
console.log('Queue: domain-collection');
console.log('Redis URL:', process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL || 'redis://localhost:6379');
console.log('Hunter API Key:', process.env.HUNTER_API_KEY ? '✓ Set' : '✗ Not set');
console.log('---');

const worker = createCollectorWorker('domain-collection');

console.log('✓ Worker started and listening for jobs...');
console.log('Press Ctrl+C to stop');

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down worker...');
  await worker.close();
  console.log('✓ Worker stopped');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nShutting down worker...');
  await worker.close();
  console.log('✓ Worker stopped');
  process.exit(0);
});
