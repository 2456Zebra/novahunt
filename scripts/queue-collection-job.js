#!/usr/bin/env node
// scripts/queue-collection-job.js — Example script to add collection jobs to the queue
const { Queue } = require('bullmq');

const REDIS_URL = process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL || 'redis://localhost:6379';

async function addCollectionJob(domain) {
  const queue = new Queue('domain-collection', {
    connection: {
      url: REDIS_URL
    }
  });

  console.log(`Adding collection job for domain: ${domain}`);

  const job = await queue.add('collect-domain', 
    { domain },
    {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000
      },
      removeOnComplete: false, // Keep completed jobs for inspection
      removeOnFail: false       // Keep failed jobs for debugging
    }
  );

  console.log(`✓ Job added with ID: ${job.id}`);
  console.log(`  Queue: domain-collection`);
  console.log(`  Domain: ${domain}`);
  
  await queue.close();
  
  return job.id;
}

// CLI usage
if (require.main === module) {
  const domain = process.argv[2];
  
  if (!domain) {
    console.error('Usage: node scripts/queue-collection-job.js <domain>');
    console.error('Example: node scripts/queue-collection-job.js example.com');
    process.exit(1);
  }

  addCollectionJob(domain)
    .then(() => {
      console.log('\n✓ Job queued successfully!');
      console.log('Start the worker with: node scripts/start-worker.js');
      process.exit(0);
    })
    .catch(err => {
      console.error('Error adding job:', err);
      process.exit(1);
    });
}

module.exports = { addCollectionJob };
