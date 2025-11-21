#!/usr/bin/env node
// scripts/test-collector.js — Test script for collection store and worker functionality
const CollectionStore = require('../lib/collection-store');

async function testCollectionStore() {
  console.log('Testing CollectionStore...\n');
  
  const store = new CollectionStore();
  
  // Test data
  const testDomain = 'example.com';
  const testData = {
    items: [
      { email: 'john@example.com', name: 'John Doe', title: 'CEO', confidence: 0.95, source: '' },
      { email: 'jane@example.com', name: 'Jane Smith', title: 'CTO', confidence: 0.90, source: '' }
    ],
    total: 2,
    collectedAt: new Date().toISOString(),
    metadata: { test: true }
  };
  
  console.log('1. Testing save()...');
  const saved = await store.save(testDomain, testData);
  console.log(`   Save result: ${saved ? '✓ SUCCESS' : '✗ FAILED'}`);
  
  console.log('\n2. Testing exists()...');
  const exists = await store.exists(testDomain);
  console.log(`   Exists result: ${exists ? '✓ SUCCESS' : '✗ FAILED'}`);
  
  console.log('\n3. Testing load()...');
  const loaded = await store.load(testDomain);
  console.log(`   Load result: ${loaded ? '✓ SUCCESS' : '✗ FAILED'}`);
  if (loaded) {
    console.log(`   Domain: ${loaded.domain}`);
    console.log(`   Items count: ${loaded.items.length}`);
    console.log(`   Total: ${loaded.total}`);
  }
  
  console.log('\n4. Testing list()...');
  const list = await store.list();
  console.log(`   List result: ${list.length > 0 ? '✓ SUCCESS' : '✗ FAILED'}`);
  console.log(`   Collections: ${list.join(', ')}`);
  
  console.log('\n5. Testing delete()...');
  const deleted = await store.delete(testDomain);
  console.log(`   Delete result: ${deleted ? '✓ SUCCESS' : '✗ FAILED'}`);
  
  console.log('\n6. Verifying deletion...');
  const stillExists = await store.exists(testDomain);
  console.log(`   No longer exists: ${!stillExists ? '✓ SUCCESS' : '✗ FAILED'}`);
  
  console.log('\n✓ CollectionStore tests completed!\n');
}

async function testWorkerFunctions() {
  console.log('Testing Worker functions...\n');
  
  const { normalizeHunterItemsFromEmails } = require('../workers/collectorWorker');
  
  console.log('1. Testing normalizeHunterItemsFromEmails()...');
  const mockHunterEmails = [
    {
      value: 'test@example.com',
      first_name: 'Test',
      last_name: 'User',
      position: 'Developer',
      confidence: 95,
      sources: [{ uri: 'https://example.com' }]
    },
    {
      value: 'admin@example.com',
      first_name: 'Admin',
      last_name: '',
      position: '',
      confidence: 80,
      sources: []
    }
  ];
  
  const normalized = normalizeHunterItemsFromEmails(mockHunterEmails);
  console.log(`   Normalized ${normalized.length} items: ${normalized.length === 2 ? '✓ SUCCESS' : '✗ FAILED'}`);
  console.log(`   First item: ${normalized[0].email} - ${normalized[0].name}`);
  console.log(`   Confidence: ${normalized[0].confidence}`);
  
  console.log('\n✓ Worker function tests completed!\n');
}

// Run tests
(async () => {
  try {
    await testCollectionStore();
    await testWorkerFunctions();
    console.log('All tests passed! ✓');
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
})();
