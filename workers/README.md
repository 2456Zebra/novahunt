# Background Collection System

This directory contains the background job system for Hunter domain searches.

## Overview

The background collection system allows asynchronous processing of Hunter API domain searches with the following benefits:

- **Asynchronous Processing**: Jobs are queued and processed in the background, preventing timeout issues
- **Retry Logic**: Automatic retries with exponential backoff for rate limiting (429) and server errors
- **Persistent Storage**: Results are stored on the filesystem (or in-memory as fallback)
- **Job Status Tracking**: Monitor job progress and retrieve status via API

## Architecture

### Components

1. **Queue System** (`lib/queue.js`)
   - BullMQ-based Redis job queue
   - Configurable retry and backoff policies
   - Supports both Upstash Redis and standard Redis

2. **Collection Store** (`lib/collection-store.js`)
   - Pluggable storage abstraction
   - Filesystem storage (preferred) with in-memory fallback
   - Stores results in `data/collections/`

3. **Worker Process** (`workers/collectorWorker.js`)
   - Background worker that processes collection jobs
   - Reuses existing Hunter API logic with retry/backoff
   - Normalizes and deduplicates results
   - Stores results in persistent storage

### API Endpoints

#### POST /api/collect-job

Enqueue a collection job for a domain.

**Request:**
```json
{
  "domain": "example.com"
}
```

**Response:**
```json
{
  "ok": true,
  "jobId": "collect-example.com-1234567890",
  "domain": "example.com",
  "status": "queued",
  "message": "Collection job enqueued successfully"
}
```

#### GET /api/collect-status?domain=example.com

Check the status of a collection job by domain or job ID.

**Query Parameters:**
- `domain`: Domain name to check
- `jobId`: Specific job ID to check

**Response:**
```json
{
  "ok": true,
  "jobId": "collect-example.com-1234567890",
  "domain": "example.com",
  "status": "completed",
  "progress": 100,
  "hasStoredResults": true,
  "itemCount": 150,
  "total": 150,
  "storedAt": "2024-11-21T12:00:00.000Z"
}
```

#### GET /api/export-csv?domain=example.com

Download CSV of stored results for a domain.

**Query Parameters:**
- `domain`: Domain name to export

**Response:**
- 200: CSV file download
- 202: Job still processing
- 404: No results found

## Configuration

### Environment Variables

#### Redis Configuration

**Option 1: Upstash Redis (Recommended for Vercel)**
```
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token
```

**Option 2: Standard Redis**
```
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-password
REDIS_DB=0
```

#### Worker Configuration

```
WORKER_CONCURRENCY=2                    # Number of concurrent jobs
WORKER_MAX_JOBS_PER_INTERVAL=10        # Rate limit: max jobs per interval
WORKER_RATE_LIMIT_DURATION_MS=60000    # Rate limit interval (1 minute)
```

#### Hunter API Configuration

```
HUNTER_API_KEY=your-hunter-api-key
HUNTER_PAGE_SIZE=100                    # Items per page (default: 100)
HUNTER_MAX_COLLECT=5000                 # Safety cap (default: 5000)
```

## Running the Worker

### Development
```bash
npm run worker
```

### Production

For production deployments, run the worker as a separate process or container:

```bash
node workers/collectorWorker.js
```

**Docker Example:**
```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
CMD ["node", "workers/collectorWorker.js"]
```

**Systemd Example:**
```ini
[Unit]
Description=NovaHunt Collection Worker
After=network.target

[Service]
Type=simple
User=novahunt
WorkingDirectory=/opt/novahunt
ExecStart=/usr/bin/node workers/collectorWorker.js
Restart=always
Environment="NODE_ENV=production"
EnvironmentFile=/opt/novahunt/.env

[Install]
WantedBy=multi-user.target
```

## Storage

Results are stored in `data/collections/` as JSON files:

```json
{
  "domain": "example.com",
  "items": [
    {
      "email": "john@example.com",
      "name": "John Doe",
      "title": "CEO",
      "confidence": 0.95,
      "source": "https://example.com/about"
    }
  ],
  "total": 150,
  "storedAt": "2024-11-21T12:00:00.000Z",
  "collectedAt": "2024-11-21T11:59:45.000Z",
  "jobId": "collect-example.com-1234567890"
}
```

## Deployment Notes

### Vercel Deployment

For Vercel deployments:

1. The API routes will deploy automatically
2. The worker process needs to run separately (e.g., on a VPS, container, or another serverless platform)
3. Use Upstash Redis for the queue backend
4. Storage will fall back to in-memory if filesystem is not available (ephemeral on Vercel)

### Self-Hosted Deployment

1. Set up Redis instance
2. Configure environment variables
3. Run the Next.js app: `npm start`
4. Run the worker: `npm run worker` (in a separate process)
5. Ensure `data/collections/` directory is writable

## Monitoring

The worker logs important events:

- Job start: `[CollectionWorker] Processing job {id} for domain: {domain}`
- Job success: `[CollectionWorker] Successfully completed job {id} for {domain}`
- Job failure: `[CollectionWorker] Job {id} failed for {domain}: {error}`
- Rate limiting: `hunter rate limited, backing off {ms}ms for domain={domain} page={page}`

Monitor these logs to track worker health and performance.
