// lib/queue.js
// BullMQ queue configuration and initialization for background collection jobs

const { Queue } = require('bullmq');

// Redis connection configuration
function getRedisConfig() {
  // Check for Upstash Redis configuration (REST API converted to Redis protocol)
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.UPSTASH_REST_URL;
  
  if (upstashUrl) {
    // Parse Upstash REST URL to extract host and port
    // Upstash REST URLs are in format: https://host:port
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

  // Standard Redis configuration
  return {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || '0', 10),
  };
}

// Queue name
const QUEUE_NAME = 'hunter-collections';

// Create and export the queue instance
let queueInstance = null;

function getQueue() {
  if (queueInstance) {
    return queueInstance;
  }

  const redisConfig = getRedisConfig();
  
  try {
    queueInstance = new Queue(QUEUE_NAME, {
      connection: redisConfig,
      defaultJobOptions: {
        attempts: 5,
        backoff: {
          type: 'exponential',
          delay: 5000, // Start with 5 seconds
        },
        removeOnComplete: {
          age: 86400, // Keep completed jobs for 24 hours
          count: 1000, // Keep last 1000 completed jobs
        },
        removeOnFail: {
          age: 604800, // Keep failed jobs for 7 days
        },
      },
    });

    console.log('Queue initialized successfully with Redis config:', {
      host: redisConfig.host,
      port: redisConfig.port,
      hasPassword: !!redisConfig.password,
    });

    return queueInstance;
  } catch (err) {
    console.error('Failed to initialize queue:', err.message);
    throw err;
  }
}

async function closeQueue() {
  if (queueInstance) {
    await queueInstance.close();
    queueInstance = null;
  }
}

module.exports = {
  getQueue,
  closeQueue,
  QUEUE_NAME,
};
