# Workers

This directory contains background job workers for NovaHunt.

## Collector Worker

The `collectorWorker.js` implements a BullMQ-based background job processor for Hunter API domain searches.

### Features

- **BullMQ Integration**: Uses BullMQ for robust job queue management with Redis
- **Hunter API Paging**: Fetches all available emails across multiple pages
- **Retry Logic**: Implements exponential backoff for 429 rate limit responses
- **Progress Tracking**: Reports job progress and status updates
- **Pluggable Storage**: Uses the CollectionStore abstraction for persistence
- **Deduplication**: Normalizes and deduplicates email results

### Usage

#### Starting the Worker

```javascript
const { createCollectorWorker } = require('./workers/collectorWorker');

// Create and start the worker
const worker = createCollectorWorker('domain-collection', {
  // Optional worker configuration
});

// The worker will now process jobs from the 'domain-collection' queue
```

#### Adding Jobs to the Queue

```javascript
const { Queue } = require('bullmq');

const queue = new Queue('domain-collection', {
  connection: {
    url: process.env.REDIS_URL
  }
});

// Add a job to collect emails for a domain
await queue.add('collect-domain', {
  domain: 'example.com'
}, {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 2000
  }
});
```

#### Monitoring Job Progress

```javascript
const job = await queue.getJob(jobId);
const progress = await job.getProgress();
console.log(progress);
// { status: 'fetching', page: 2, collected: 100, total: 250, progress: 40 }
```

### Environment Variables

- `REDIS_URL` or `UPSTASH_REDIS_REST_URL`: Redis connection URL
- `HUNTER_API_KEY`: Hunter.io API key (required)
- `HUNTER_PAGE_SIZE`: Page size for Hunter API requests (default: 100)
- `HUNTER_MAX_COLLECT`: Maximum emails to collect per domain (default: 5000)

### Storage

Results are stored using the `CollectionStore` abstraction (see `lib/collection-store.js`), which persists to the filesystem under `data/collections/` by default.

### Testing

Run the test script to verify functionality:

```bash
node scripts/test-collector.js
```

### Job Lifecycle

1. **Starting**: Job begins, initializes storage
2. **Fetching**: Fetches pages from Hunter API, reports progress
3. **Rate Limited**: If 429 received, backs off exponentially
4. **Normalizing**: Deduplicates and normalizes results
5. **Completed**: Saves to storage, returns success result
6. **Failed**: Logs error, throws for retry logic

### Example Job Result

```json
{
  "success": true,
  "domain": "example.com",
  "itemsCollected": 245,
  "total": 245,
  "collectedAt": "2025-11-21T03:30:00.000Z"
}
```
