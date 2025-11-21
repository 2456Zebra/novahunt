// pages/api/collect-status.js
// GET endpoint to report job status and stored result availability.
// Accepts domain or jobId as query parameter.

const { getQueue } = require('../../lib/queue');
const { hasCollection, getCollection } = require('../../lib/collection-store');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { domain, jobId } = req.query;
    
    if (!domain && !jobId) {
      return res.status(400).json({ 
        ok: false, 
        error: 'Either domain or jobId parameter is required' 
      });
    }

    const queue = getQueue();
    let job = null;

    if (jobId) {
      // Look up by job ID
      job = await queue.getJob(jobId);
      
      if (!job) {
        return res.status(404).json({ 
          ok: false, 
          error: 'Job not found',
          jobId,
        });
      }
    } else if (domain) {
      // Look up by domain - find most recent job
      const cleanDomain = domain.trim().toLowerCase();
      const allJobs = await queue.getJobs(['completed', 'active', 'waiting', 'delayed', 'failed']);
      const domainJobs = allJobs.filter(j => j.data.domain === cleanDomain);
      
      if (domainJobs.length === 0) {
        // No job found, check if we have stored results
        const hasStored = await hasCollection(cleanDomain);
        
        if (hasStored) {
          const collection = await getCollection(cleanDomain);
          return res.status(200).json({
            ok: true,
            domain: cleanDomain,
            status: 'completed',
            hasStoredResults: true,
            itemCount: collection?.items?.length || 0,
            total: collection?.total || 0,
            storedAt: collection?.storedAt || null,
            message: 'Results available (no active job)',
          });
        }
        
        return res.status(404).json({ 
          ok: false, 
          error: 'No job found for this domain',
          domain: cleanDomain,
        });
      }
      
      // Get the most recent job
      domainJobs.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      job = domainJobs[0];
    }

    const state = await job.getState();
    const progress = job.progress || 0;
    const jobDomain = job.data.domain;
    
    // Check if results are stored
    const hasStored = await hasCollection(jobDomain);
    let collection = null;
    
    if (hasStored) {
      collection = await getCollection(jobDomain);
    }

    const response = {
      ok: true,
      jobId: job.id,
      domain: jobDomain,
      status: state,
      progress,
      hasStoredResults: hasStored,
    };

    if (state === 'completed' && collection) {
      response.itemCount = collection.items?.length || 0;
      response.total = collection.total || 0;
      response.storedAt = collection.storedAt || null;
      response.collectedAt = collection.collectedAt || null;
    }

    if (state === 'failed') {
      response.failedReason = job.failedReason || 'Unknown error';
      response.attemptsMade = job.attemptsMade || 0;
    }

    if (state === 'active') {
      response.message = 'Job is currently processing';
    } else if (state === 'waiting' || state === 'delayed') {
      response.message = 'Job is queued and waiting to be processed';
    } else if (state === 'completed') {
      response.message = 'Job completed successfully';
    } else if (state === 'failed') {
      response.message = 'Job failed after retries';
    }

    return res.status(200).json(response);
  } catch (err) {
    console.error('[collect-status] Error:', err.message);
    return res.status(500).json({ 
      ok: false, 
      error: 'Failed to retrieve job status',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
}
