// workers/collectorWorker.js — BullMQ worker for Hunter API domain search collection
const { Worker } = require('bullmq');
const CollectionStore = require('../lib/collection-store');
const { callHunterDomainSearch } = require('../lib/hunter-api');

const REDIS_URL = process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL || 'redis://localhost:6379';

/**
 * Process a single collection job
 */
async function processCollectionJob(job) {
  const { domain } = job.data;
  
  if (!domain) {
    throw new Error('Job missing required field: domain');
  }

  console.log(`Starting collection job for domain: ${domain}`);
  
  // Initialize storage
  const store = new CollectionStore();
  
  // Progress callback
  const updateProgress = (data) => {
    job.updateProgress(data);
    console.log(`Job ${job.id} progress:`, data);
  };

  try {
    // Fetch from Hunter API
    updateProgress({ status: 'starting', domain });
    
    const result = await callHunterDomainSearch(domain, {
      progressCallback: updateProgress
    });
    
    updateProgress({ 
      status: 'normalizing', 
      domain,
      collected: result.items.length,
      total: result.total
    });

    // Save to storage
    const collectionData = {
      items: result.items,
      total: result.total,
      collectedAt: new Date().toISOString(),
      metadata: {
        jobId: job.id,
        processedAt: new Date().toISOString()
      }
    };

    const saved = await store.save(domain, collectionData);
    
    if (!saved) {
      throw new Error('Failed to save collection to storage');
    }

    console.log(`Successfully completed collection job for ${domain}: ${result.items.length} items`);
    
    updateProgress({ 
      status: 'completed', 
      domain,
      itemsSaved: result.items.length,
      total: result.total
    });

    return {
      success: true,
      domain,
      itemsCollected: result.items.length,
      total: result.total,
      collectedAt: collectionData.collectedAt
    };
    
  } catch (error) {
    console.error(`Collection job failed for ${domain}:`, error);
    
    updateProgress({ 
      status: 'failed', 
      domain,
      error: error.message
    });
    
    throw error;
  }
}

/**
 * Create and start the BullMQ worker
 */
function createCollectorWorker(queueName = 'domain-collection', options = {}) {
  const connection = {
    url: REDIS_URL
  };

  const worker = new Worker(
    queueName,
    async (job) => {
      return await processCollectionJob(job);
    },
    {
      connection,
      limiter: {
        max: 10, // max 10 jobs
        duration: 1000, // per second
      },
      ...options
    }
  );

  // Event listeners for logging
  worker.on('completed', (job, result) => {
    console.log(`Job ${job.id} completed successfully:`, result);
  });

  worker.on('failed', (job, err) => {
    console.error(`Job ${job?.id} failed:`, err?.message || err);
  });

  worker.on('error', (err) => {
    console.error('Worker error:', err);
  });

  worker.on('active', (job) => {
    console.log(`Job ${job.id} started processing`);
  });

  return worker;
}

module.exports = {
  createCollectorWorker,
  processCollectionJob
};
