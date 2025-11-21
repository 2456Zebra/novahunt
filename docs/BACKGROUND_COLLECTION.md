# Background Collection System

This document describes the background job system for collecting email data from the Hunter API.

## Overview

The background collection system allows for asynchronous processing of Hunter API domain searches. Instead of performing searches synchronously during API requests, jobs can be queued and processed by background workers.

### Benefits

- **Scalability**: Multiple workers can process jobs in parallel
- **Reliability**: Jobs are persisted in Redis and can survive crashes
- **Retry Logic**: Automatic retry with exponential backoff for rate limits
- **Monitoring**: Track job progress and status in real-time
- **Resource Management**: Prevents API timeouts on large domain searches

## Architecture

```
┌─────────────┐      ┌─────────────┐      ┌──────────────┐      ┌──────────────┐
│   Client    │─────▶│    Queue    │─────▶│    Worker    │─────▶│   Storage    │
│   (API)     │      │   (Redis)   │      │  (BullMQ)    │      │(File System) │
└─────────────┘      └─────────────┘      └──────────────┘      └──────────────┘
                                                  │
                                                  ▼
                                           ┌──────────────┐
                                           │  Hunter API  │
                                           └──────────────┘
```

## Components

### 1. Queue (Redis + BullMQ)

Jobs are added to a Redis-backed queue managed by BullMQ. The queue provides:
- Job persistence
- Priority scheduling
- Delayed jobs
- Rate limiting
- Job retry policies

### 2. Worker (`workers/collectorWorker.js`)

The worker processes jobs from the queue:
- Fetches all pages from Hunter API for a domain
- Handles rate limiting with exponential backoff
- Normalizes and deduplicates results
- Stores results using the storage abstraction
- Reports progress and final status

### 3. Storage (`lib/collection-store.js`)

A pluggable storage abstraction for persisting collection results:
- Default: File system storage in `data/collections/`
- Can be extended to support other backends (database, S3, etc.)

## Usage

### Prerequisites

1. Redis server running (or Upstash Redis URL configured)
2. Hunter API key set in environment
3. BullMQ installed (`npm install bullmq`)

### Environment Variables

```bash
# Required
HUNTER_API_KEY=your_hunter_api_key_here

# Redis connection (one of these)
REDIS_URL=redis://localhost:6379
# OR
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io

# Optional
HUNTER_PAGE_SIZE=100          # Items per page (default: 100)
HUNTER_MAX_COLLECT=5000       # Max items to collect (default: 5000)
NH_COLLECTIONS_DIR=/path/to/collections  # Storage directory
```

### Starting the Worker

```bash
# Start the worker
node scripts/start-worker.js
```

The worker will:
- Connect to Redis
- Listen for jobs on the `domain-collection` queue
- Process jobs as they arrive
- Log progress and results

### Queueing a Job

```bash
# Queue a collection job for a domain
node scripts/queue-collection-job.js example.com
```

Or programmatically:

```javascript
const { addCollectionJob } = require('./scripts/queue-collection-job');

const jobId = await addCollectionJob('example.com');
console.log('Job queued:', jobId);
```

### Monitoring Jobs

```javascript
const { Queue } = require('bullmq');

const queue = new Queue('domain-collection', {
  connection: { url: process.env.REDIS_URL }
});

// Get job by ID
const job = await queue.getJob(jobId);

// Check status
const state = await job.getState();
console.log('Job state:', state); // 'waiting', 'active', 'completed', 'failed'

// Get progress
const progress = await job.getProgress();
console.log('Progress:', progress);
// Example: { status: 'fetching', page: 3, collected: 300, total: 500, progress: 60 }

// Get result (if completed)
const result = await job.returnvalue;
console.log('Result:', result);
// Example: { success: true, domain: 'example.com', itemsCollected: 500, total: 500 }
```

### Retrieving Stored Results

```javascript
const CollectionStore = require('./lib/collection-store');

const store = new CollectionStore();

// Load collection for a domain
const collection = await store.load('example.com');
console.log('Domain:', collection.domain);
console.log('Items:', collection.items.length);
console.log('Collected at:', collection.collectedAt);

// List all collections
const domains = await store.list();
console.log('Stored collections:', domains);

// Check if collection exists
const exists = await store.exists('example.com');
console.log('Collection exists:', exists);
```

## Job Lifecycle

### 1. Queued
Job is added to the Redis queue and waiting for a worker.

### 2. Active
Worker picks up the job and begins processing.

**Progress updates:**
```javascript
{ status: 'starting', domain: 'example.com' }
```

### 3. Fetching
Worker fetches pages from Hunter API.

**Progress updates:**
```javascript
{ 
  status: 'fetching', 
  page: 2, 
  collected: 150, 
  total: 500, 
  progress: 30 
}
```

### 4. Rate Limited (if needed)
If Hunter returns 429, worker backs off exponentially.

**Progress updates:**
```javascript
{ 
  status: 'rate_limited', 
  page: 3, 
  backoffMs: 2000, 
  collected: 200 
}
```

### 5. Normalizing
Worker deduplicates and normalizes the collected data.

**Progress updates:**
```javascript
{ 
  status: 'normalizing', 
  domain: 'example.com',
  collected: 500, 
  total: 500 
}
```

### 6. Completed
Results are stored and job completes successfully.

**Final result:**
```javascript
{ 
  success: true, 
  domain: 'example.com', 
  itemsCollected: 500, 
  total: 500,
  collectedAt: '2025-11-21T03:30:00.000Z'
}
```

### 7. Failed (on error)
Job fails and can be retried based on retry policy.

**Progress updates:**
```javascript
{ 
  status: 'failed', 
  domain: 'example.com',
  error: 'HUNTER_API_KEY missing' 
}
```

## Error Handling

### Rate Limiting (429)
- Automatic exponential backoff
- Retries with increasing delays (1s, 2s, 4s, 8s, ..., max 30s)
- Continues from last successful page

### API Errors
- Job fails and can be retried based on job configuration
- Default: 3 attempts with exponential backoff

### Storage Errors
- Logged and job fails
- Can be retried to attempt storage again

## Testing

### Unit Tests
```bash
node scripts/test-collector.js
```

Tests:
- CollectionStore CRUD operations
- Worker normalization functions
- File system persistence

### Integration Test (requires Redis and Hunter API key)
```bash
# 1. Start worker
node scripts/start-worker.js

# 2. In another terminal, queue a test job
node scripts/queue-collection-job.js test-domain.com

# 3. Monitor logs in worker terminal
# 4. Check stored results
```

## Production Deployment

### Scaling Workers

Run multiple worker processes for parallel job processing:

```bash
# Terminal 1
node scripts/start-worker.js

# Terminal 2
node scripts/start-worker.js

# Terminal 3
node scripts/start-worker.js
```

BullMQ handles distribution of jobs across workers automatically.

### Process Management

Use a process manager like PM2 for production:

```bash
# Install PM2
npm install -g pm2

# Start worker with PM2
pm2 start scripts/start-worker.js --name collector-worker --instances 3

# Monitor
pm2 logs collector-worker
pm2 monit

# Stop
pm2 stop collector-worker
```

### Monitoring

- Job metrics via BullMQ dashboard (optional)
- Worker logs (stdout/stderr)
- Redis monitoring tools
- Custom monitoring via BullMQ events

## API Integration Example

Add background collection to your API endpoint:

```javascript
// pages/api/start-collection.js
import { Queue } from 'bullmq';

export default async function handler(req, res) {
  const { domain } = req.body;
  
  if (!domain) {
    return res.status(400).json({ error: 'Domain required' });
  }

  const queue = new Queue('domain-collection', {
    connection: {
      url: process.env.REDIS_URL
    }
  });

  const job = await queue.add('collect-domain', { domain }, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 }
  });

  await queue.close();

  return res.json({
    ok: true,
    jobId: job.id,
    domain,
    message: 'Collection job queued'
  });
}
```

## Troubleshooting

### Worker not processing jobs
- Check Redis connection
- Verify Redis server is running
- Check environment variables
- Look for error logs

### Jobs failing immediately
- Verify HUNTER_API_KEY is set
- Check Hunter API quota/limits
- Review error logs for specific failure reason

### Rate limiting issues
- Increase backoff delays
- Reduce worker concurrency
- Check Hunter API rate limits

### Storage errors
- Verify write permissions on `data/collections/` directory
- Check disk space
- Review storage error logs

## Future Enhancements

Possible improvements to the system:

1. **Database Storage**: Add PostgreSQL/MongoDB storage adapter
2. **Job Prioritization**: Priority queue for urgent collections
3. **Scheduled Collections**: Periodic re-collection for domains
4. **Webhooks**: Notify on job completion
5. **Admin Dashboard**: Web UI for job management
6. **Metrics**: Prometheus metrics export
7. **Distributed Tracing**: OpenTelemetry integration
