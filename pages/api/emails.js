// pages/api/emails.js
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';

const DATA_DIR = path.join(process.cwd(), 'data');

function normalizeDomain(d) {
  return d.replace(/^https?:\/\//, '').replace(/^www\./, '').trim().toLowerCase();
}

function convertStoredToApiOutput(raw) {
  const emails = new Set(raw.emails || []);
  const people = raw.people || [];

  // Generate patterns from people
  const patterns = [
    (f, l) => `${f.toLowerCase()}.${l.toLowerCase()}@${raw.domain}`,
    (f, l) => `${f.toLowerCase()[0]}${l.toLowerCase()}@${raw.domain}`,
    (f, l) => `${f.toLowerCase()}@${raw.domain}`
  ];

  people.forEach(p => {
    patterns.forEach(gen => emails.add(gen(p.first, p.last)));
  });

  // Add generics if none found
  if (emails.size === 0) {
    ['info', 'contact', 'press', 'sales', 'support'].forEach(g => {
      emails.add(`${g}@${raw.domain}`);
    });
  }

  // Build results
  const results = [...emails].map(email => {
    const person = people.find(p => 
      email.includes(p.first.toLowerCase()) && email.includes(p.last.toLowerCase())
    ) || {};
    return {
      email,
      first_name: person.first || '',
      last_name: person.last || '',
      position: person.title || 'General',
      score: 85 // or compute based on source
    };
  });

  return { results, total: results.length + 300 };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { domain } = req.body;
  if (!domain) return res.status(400).json({ error: 'Domain required' });

  const d = normalizeDomain(domain);
  const cacheFile = path.join(DATA_DIR, `${d}.json`);

  // Check cache file first
  if (fs.existsSync(cacheFile)) {
    try {
      const raw = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
      if (raw.domain === d) {
        const output = convertStoredToApiOutput(raw);
        return res.json(output);
      }
    } catch (e) {
      console.error('Cache read error:', e);
    }
  }

  // Fallback: on-demand scrape (your current logic)
  const fallback = [
    { email: `info@${d}`, first_name: '', last_name: '', position: 'General', score: 80 },
    { email: `contact@${d}`, first_name: '', last_name: '', position: 'General', score: 80 },
    { email: `press@${d}`, first_name: '', last_name: '', position: 'General', score: 80 },
    { email: `sales@${d}`, first_name: '', last_name: '', position: 'General', score: 80 },
    { email: `support@${d}`, first_name: '', last_name: '', position: 'General', score: 80 },
  ];

  res.json({ results: fallback, total: 405 });
}
