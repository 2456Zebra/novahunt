import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  : null;
const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'dev-secret-change-me';

/**
 * GET -> returns { searches, reveals, searchesMax, revealsMax }
 * POST { action: 'search'|'reveal' } -> increments the counter and returns updated values.
 *
 * If Supabase is configured, it will persist in users table fields:
 *  - searches_count (integer)
 *  - reveals_count (integer)
 *
 * If Supabase is not configured, returns demo values (non-persistent).
 */
export default async function handler(req, res) {
  // verify JWT from cookie
  const token = (req.cookies && req.cookies.auth) || null;
  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    console.warn('usage api: invalid token', err && err.message);
    return res.status(401).json({ error: 'Invalid token' });
  }

  const email = payload.email;
  if (!email) {
    return res.status(400).json({ error: 'No email in token' });
  }

  // Plan limits (fallback). If you store plan in DB, read it and set accordingly.
  const defaultLimits = { searchesMax: 50, revealsMax: 25 };

  if (!supabase) {
    // Demo mode: non-persistent
    if (req.method === 'GET') {
      return res.status(200).json({ searches: 0, reveals: 0, ...defaultLimits });
    } else if (req.method === 'POST') {
      const { action } = req.body || {};
      let searches = 0, reveals = 0;
      if (action === 'search') searches = 1;
      if (action === 'reveal') reveals = 1;
      return res.status(200).json({ searches, reveals, ...defaultLimits });
    } else {
      res.setHeader('Allow', 'GET, POST');
      return res.status(405).end();
    }
  }

  // With Supabase: fetch and optionally increment
  try {
    // get current counts
    const { data: user, error: selectErr } = await supabase
      .from('users')
      .select('id, email, searches_count, reveals_count, plan')
      .eq('email', email)
      .maybeSingle();

    if (selectErr) {
      console.error('Supabase select error', selectErr);
      return res.status(500).json({ error: 'DB error' });
    }

    if (!user) {
      // Create a user row with zeroed counts (service role)
      const { data: created, error: createErr } = await supabase
        .from('users')
        .insert({ email, searches_count: 0, reveals_count: 0 })
        .select()
        .single();

      if (createErr) {
        console.error('Supabase create user error', createErr);
        return res.status(500).json({ error: 'DB error' });
      }

      user = created;
    }

    let searches = user.searches_count || 0;
    let reveals = user.reveals_count || 0;
    // You can store plan limits in user.plan or other table. Fallback to defaults.
    const limits = {
      searchesMax: (user.plan && user.plan.searchesMax) || defaultLimits.searchesMax,
      revealsMax: (user.plan && user.plan.revealsMax) || defaultLimits.revealsMax,
    };

    if (req.method === 'GET') {
      return res.status(200).json({ searches, reveals, ...limits });
    } else if (req.method === 'POST') {
      const { action } = req.body || {};
      const updates = {};
      if (action === 'search') {
        searches += 1;
        updates.searches_count = searches;
      } else if (action === 'reveal') {
        reveals += 1;
        updates.reveals_count = reveals;
      } else {
        return res.status(400).json({ error: 'Invalid action' });
      }

      const { data: updated, error: updateErr } = await supabase
        .from('users')
        .update(updates)
        .eq('email', email)
        .select()
        .single();

      if (updateErr) {
        console.error('Supabase update error', updateErr);
        return res.status(500).json({ error: 'DB error' });
      }

      return res.status(200).json({
        searches: updated.searches_count || 0,
        reveals: updated.reveals_count || 0,
        ...limits,
      });
    } else {
      res.setHeader('Allow', 'GET, POST');
      return res.status(405).end();
    }
  } catch (err) {
    console.error('usage handler error', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
