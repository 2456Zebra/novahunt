// pages/api/collect-job.js
// POST endpoint to enqueue a collection job for a domain.
// Accepts { domain } and returns job id and status.

const { getQueue } = require('../../lib/queue');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { domain } = req.body || {};
    
    if (!domain || typeof domain !== 'string' || !domain.trim()) {
      return res.status(400).json({ 
        ok: false, 
        error: 'domain is required and must be a non-empty string' 
      });
    }

    const cleanDomain = domain.trim().toLowerCase();
    
    // Validate domain format (basic check)
    if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(cleanDomain)) {
      return res.status(400).json({ 
        ok: false, 
        error: 'Invalid domain format' 
      });
    }

    // Get queue instance
    const queue = getQueue();
    
    // Check if a job already exists for this domain (active or waiting)
    const existingJobs = await queue.getJobs(['active', 'waiting', 'delayed']);
    const existingJob = existingJobs.find(job => job.data.domain === cleanDomain);
    
    if (existingJob) {
      const state = await existingJob.getState();
      return res.status(200).json({
        ok: true,
        jobId: existingJob.id,
        domain: cleanDomain,
        status: state,
        message: 'Job already exists for this domain',
        existing: true,
      });
    }

    // Add job to queue
    const job = await queue.add('collect-domain', {
      domain: cleanDomain,
      requestedAt: new Date().toISOString(),
    }, {
      jobId: `collect-${cleanDomain}-${Date.now()}`,
      removeOnComplete: {
        age: 86400, // 24 hours
        count: 1000,
      },
      removeOnFail: {
        age: 604800, // 7 days
      },
    });

    console.log(`[collect-job] Enqueued job ${job.id} for domain: ${cleanDomain}`);

    return res.status(202).json({
      ok: true,
      jobId: job.id,
      domain: cleanDomain,
      status: 'queued',
      message: 'Collection job enqueued successfully',
    });
  } catch (err) {
    console.error('[collect-job] Error:', err.message);
    return res.status(500).json({ 
      ok: false, 
      error: 'Failed to enqueue collection job',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
}
