// pages/api/export-csv.js
// GET endpoint to download CSV of stored results for a given domain.
// Returns 202 if job is queued/processing, 404 if not found, or CSV data if available.

const { getCollection, hasCollection } = require('../../lib/collection-store');
const { getQueue } = require('../../lib/queue');

function escapeCSV(value) {
  if (value == null) return '';
  const str = String(value);
  // Escape quotes and wrap in quotes if contains comma, quote, or newline
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function generateCSV(items) {
  if (!items || items.length === 0) {
    return 'email,name,title,confidence,source\n';
  }

  const headers = ['email', 'name', 'title', 'confidence', 'source'];
  const csvLines = [headers.join(',')];
  
  items.forEach(item => {
    const row = [
      escapeCSV(item.email),
      escapeCSV(item.name),
      escapeCSV(item.title),
      escapeCSV(item.confidence),
      escapeCSV(item.source),
    ];
    csvLines.push(row.join(','));
  });
  
  return csvLines.join('\n');
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { domain } = req.query;
    
    if (!domain || typeof domain !== 'string' || !domain.trim()) {
      return res.status(400).json({ 
        ok: false, 
        error: 'domain query parameter is required' 
      });
    }

    const cleanDomain = domain.trim().toLowerCase();
    
    // Check if collection exists
    const hasStored = await hasCollection(cleanDomain);
    
    if (!hasStored) {
      // Check if there's an active or queued job for this domain
      try {
        const queue = getQueue();
        const allJobs = await queue.getJobs(['active', 'waiting', 'delayed']);
        const activeJob = allJobs.find(j => j.data.domain === cleanDomain);
        
        if (activeJob) {
          const state = await activeJob.getState();
          return res.status(202).json({
            ok: false,
            error: 'Collection job is still processing',
            status: state,
            jobId: activeJob.id,
            message: 'Please check back later or use /api/collect-status to monitor progress',
          });
        }
      } catch (queueErr) {
        console.warn('[export-csv] Could not check queue:', queueErr.message);
      }
      
      return res.status(404).json({ 
        ok: false, 
        error: 'No stored results found for this domain',
        domain: cleanDomain,
        message: 'Use /api/collect-job to start a collection job',
      });
    }

    // Get collection data
    const collection = await getCollection(cleanDomain);
    
    if (!collection || !collection.items) {
      return res.status(404).json({ 
        ok: false, 
        error: 'Collection data is corrupted or empty',
        domain: cleanDomain,
      });
    }

    // Generate CSV
    const csv = generateCSV(collection.items);
    
    // Set headers for CSV download
    const filename = `${cleanDomain.replace(/[^a-z0-9.-]/gi, '_')}_contacts_${new Date().toISOString().split('T')[0]}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    return res.status(200).send(csv);
  } catch (err) {
    console.error('[export-csv] Error:', err.message);
    return res.status(500).json({ 
      ok: false, 
      error: 'Failed to export CSV',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
}
