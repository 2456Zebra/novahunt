// workers/collectorWorker.js
// Background worker that processes Hunter domain search collection jobs.
// Pulls jobs from Redis queue, pages Hunter API, normalizes/dedupes, and stores results.

const { Worker } = require('bullmq');
const { QUEUE_NAME } = require('../lib/queue');
const { storeCollection } = require('../lib/collection-store');

const HUNTER_KEY = process.env.HUNTER_API_KEY || '';
const HUNTER_PAGE_SIZE = Number(process.env.HUNTER_PAGE_SIZE || 100);
const HUNTER_MAX_COLLECT = Number(process.env.HUNTER_MAX_COLLECT || 5000);

// Redis connection configuration (same as queue.js)
function getRedisConfig() {
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.UPSTASH_REST_URL;
  
  if (upstashUrl) {
    try {
      const url = new URL(upstashUrl);
      return {
        host: url.hostname,
        port: parseInt(url.port) || 6379,
        password: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.UPSTASH_REST_TOKEN,
        tls: url.protocol === 'https:' ? {} : undefined,
      };
    } catch (err) {
      console.warn('Failed to parse Upstash URL, falling back to standard Redis config:', err.message);
    }
  }

  return {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || '0', 10),
  };
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchHunterPage(domain, page, perPage) {
  const url = `https://api.hunter.io/v2/domain-search?domain=${encodeURIComponent(domain)}&api_key=${encodeURIComponent(HUNTER_KEY)}&limit=${perPage}&page=${page}`;
  const res = await fetch(url, { method: 'GET' });
  const text = await res.text().catch(() => '');
  let json = null;
  try {
    json = text ? JSON.parse(text) : {};
  } catch (e) {
    json = { raw: text };
  }
  return { status: res.status, json, bodyText: text };
}

function normalizeHunterItemsFromEmails(emails) {
  try {
    return (emails || []).map(e => ({
      email: e.value,
      name: [e.first_name, e.last_name].filter(Boolean).join(' ') || '',
      title: e.position || '',
      confidence: (typeof e.confidence === 'number') ? (e.confidence / 100) : (e.score ? e.score : 0),
      source: (e.sources && e.sources[0] && e.sources[0].uri) ? e.sources[0].uri : '',
    }));
  } catch (e) {
    return [];
  }
}

async function callHunterDomainSearch(domain) {
  if (!HUNTER_KEY) {
    const err = new Error('HUNTER_API_KEY missing in env');
    err.hunter = { status: 500, url: null, body: 'HUNTER_API_KEY missing' };
    throw err;
  }

  let page = 1;
  const perPage = Math.min(500, Math.max(10, HUNTER_PAGE_SIZE));
  const maxCollect = Math.max(100, Math.min(20000, HUNTER_MAX_COLLECT));
  let allEmailsRaw = [];
  let hunterTotal = null;
  let consecutive429s = 0;

  while (true) {
    const { status, json, bodyText } = await (async () => {
      try {
        const res = await fetchHunterPage(domain, page, perPage);
        return { status: res.status, json: res.json, bodyText: res.bodyText };
      } catch (err) {
        return { status: 500, json: null, bodyText: String(err?.message || err) };
      }
    })();

    if (status === 429) {
      // Rate limited: exponential backoff (BullMQ will also retry at job level)
      consecutive429s += 1;
      const backoffMs = Math.min(1000 * Math.pow(2, consecutive429s), 30000); // cap 30s
      console.warn(`hunter rate limited, backing off ${backoffMs}ms for domain=${domain} page=${page}`);
      await sleep(backoffMs);
      continue;
    }

    if (status >= 500) {
      // Server error - throw to trigger job retry
      const err = new Error(`Hunter API server error: ${status}`);
      err.hunter = { status, body: json };
      throw err;
    }

    if (!json) {
      console.error('hunter unexpected non-json response', {
        domain,
        page,
        status,
        preview: (bodyText || '').slice(0, 400),
      });
      break;
    }

    if (hunterTotal === null) {
      hunterTotal = (json && json.data && (json.data.total || (json.data.meta && json.data.meta.total))) || null;
    }

    const emails = (json && json.data && json.data.emails) ? json.data.emails : [];
    if (!emails || emails.length === 0) {
      break;
    }

    allEmailsRaw = allEmailsRaw.concat(emails);

    // stop if collected enough items
    if (hunterTotal && allEmailsRaw.length >= hunterTotal) break;
    if (allEmailsRaw.length >= maxCollect) {
      console.warn('Reached HUNTER_MAX_COLLECT safety cap', {
        domain,
        collected: allEmailsRaw.length,
        cap: maxCollect,
      });
      break;
    }

    page += 1;
    consecutive429s = 0; // reset backoff counter after a successful page
    await sleep(150); // small delay between pages
  }

  // Normalize and dedupe by email (case-insensitive)
  const normalized = normalizeHunterItemsFromEmails(allEmailsRaw);
  const map = new Map();
  normalized.forEach(it => {
    if (it.email) map.set(it.email.toLowerCase(), it);
  });
  const uniqueItems = Array.from(map.values());

  const result = {
    items: uniqueItems,
    total: Number.isFinite(hunterTotal) ? hunterTotal : uniqueItems.length,
  };

  return result;
}

// Job processor
async function processCollectionJob(job) {
  const { domain } = job.data;
  
  console.log(`[CollectionWorker] Processing job ${job.id} for domain: ${domain}`);
  
  try {
    // Update job progress
    await job.updateProgress(10);
    
    // Fetch from Hunter API with retry/backoff handling
    console.log(`[CollectionWorker] Fetching data from Hunter API for ${domain}`);
    const result = await callHunterDomainSearch(domain);
    
    await job.updateProgress(80);
    
    // Store in persistent storage
    console.log(`[CollectionWorker] Storing ${result.items.length} items for ${domain}`);
    const stored = await storeCollection(domain, {
      items: result.items,
      total: result.total,
      collectedAt: new Date().toISOString(),
      jobId: job.id,
    });
    
    if (!stored) {
      throw new Error('Failed to store collection results');
    }
    
    await job.updateProgress(100);
    
    console.log(`[CollectionWorker] Successfully completed job ${job.id} for ${domain}`);
    
    return {
      domain,
      itemsCollected: result.items.length,
      total: result.total,
      storedAt: new Date().toISOString(),
    };
  } catch (err) {
    console.error(`[CollectionWorker] Job ${job.id} failed for ${domain}:`, err.message);
    throw err;
  }
}

// Initialize worker
function startWorker() {
  const redisConfig = getRedisConfig();
  
  const worker = new Worker(QUEUE_NAME, processCollectionJob, {
    connection: redisConfig,
    concurrency: parseInt(process.env.WORKER_CONCURRENCY || '2', 10),
    limiter: {
      max: parseInt(process.env.WORKER_MAX_JOBS_PER_INTERVAL || '10', 10),
      duration: parseInt(process.env.WORKER_RATE_LIMIT_DURATION_MS || '60000', 10), // 1 minute default
    },
  });

  worker.on('completed', (job) => {
    console.log(`[CollectionWorker] Job ${job.id} completed successfully`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[CollectionWorker] Job ${job?.id} failed:`, err.message);
  });

  worker.on('error', (err) => {
    console.error('[CollectionWorker] Worker error:', err);
  });

  console.log('[CollectionWorker] Worker started successfully');
  console.log('[CollectionWorker] Redis config:', {
    host: redisConfig.host,
    port: redisConfig.port,
    hasPassword: !!redisConfig.password,
  });

  // Graceful shutdown
  const gracefulShutdown = async () => {
    console.log('[CollectionWorker] Shutting down gracefully...');
    await worker.close();
    process.exit(0);
  };

  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);

  return worker;
}

// Start worker if this is the main module
if (require.main === module) {
  startWorker();
}

module.exports = { startWorker, processCollectionJob };
