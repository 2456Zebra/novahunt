import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  : null;
const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'dev-secret-change-me';
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

/**
 * GET -> returns { searches, reveals, searchesMax, revealsMax }
 * POST { action: 'search'|'reveal' } -> increments the counter and returns updated values.
 *
 * Plan mapping now includes 'enterprise' for higher limits.
 */
export default async function handler(req, res) {
  const token = (req.cookies && req.cookies.auth) || null;
  if (!token) return res.status(401).json({ error: 'Not authenticated' });

  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    console.warn('usage api: invalid token', err && err.message);
    return res.status(401).json({ error: 'Invalid token' });
  }

  const email = payload.email;
  if (!email) return res.status(400).json({ error: 'No email in token' });

  const PLAN_MAP = {
    starter: { searchesMax: 50, revealsMax: 25 },
    pro: { searchesMax: 1000, revealsMax: 500 },
    enterprise: { searchesMax: 100000, revealsMax: 50000 },
  };

  async function detectStripePlanForEmail(email) {
    if (!stripe) return null;
    try {
      const customers = await stripe.customers.list({ email, limit: 1 });
      const customer = customers?.data?.[0];
      if (!customer) return null;

      const subs = await stripe.subscriptions.list({ customer: customer.id, limit: 10 });
      const activeSub = subs.data.find((s) => ['active', 'trialing', 'past_due'].includes(s.status)) || subs.data[0];
      if (!activeSub) return null;

      const item = activeSub.items?.data?.[0];
      if (!item) return null;

      const price = await stripe.prices.retrieve(item.price.id);
      const nickname = (price?.nickname || '').toLowerCase();
      let productName = '';
      if (price && price.product) {
        try {
          const prod = await stripe.products.retrieve(price.product);
          productName = (prod?.name || '').toLowerCase();
        } catch (e) { /* ignore */ }
      }

      const combined = `${nickname} ${productName}`;
      if (combined.includes('enterprise')) return 'enterprise';
      if (combined.includes('pro')) return 'pro';
      if (combined.includes('starter')) return 'starter';
      if (combined.includes('basic')) return 'starter';
      if (price?.unit_amount && price.unit_amount >= 10000) return 'pro';

      return null;
    } catch (err) {
      console.warn('detectStripePlanForEmail: error', err && err.message);
      return null;
    }
  }

  if (!supabase) {
    let planName = null;
    if (stripe) planName = await detectStripePlanForEmail(email);
    const limits = planName ? (PLAN_MAP[planName] || PLAN_MAP.starter) : PLAN_MAP.starter;

    if (req.method === 'GET') {
      return res.status(200).json({ searches: 0, reveals: 0, searchesMax: limits.searchesMax, revealsMax: limits.revealsMax });
    } else if (req.method === 'POST') {
      const { action } = req.body || {};
      let searches = 0, reveals = 0;
      if (action === 'search') searches = 1;
      if (action === 'reveal') reveals = 1;
      return res.status(200).json({ searches, reveals, searchesMax: limits.searchesMax, revealsMax: limits.revealsMax });
    } else {
      res.setHeader('Allow', 'GET, POST');
      return res.status(405).end();
    }
  }

  try {
    const selectResult = await supabase
      .from('users')
      .select('id, email, searches_count, reveals_count, plan')
      .eq('email', email)
      .maybeSingle();

    const user = selectResult?.data || null;
    const selectErr = selectResult?.error || null;
    if (selectErr) {
      console.error('Supabase select error', selectErr);
      return res.status(500).json({ error: 'DB error' });
    }

    let currentUser = user;
    if (!currentUser) {
      const createResult = await supabase
        .from('users')
        .insert({ email, searches_count: 0, reveals_count: 0 })
        .select()
        .single();
      const created = createResult?.data || null;
      const createErr = createResult?.error || null;
      if (createErr) {
        console.error('Supabase create user error', createErr);
        return res.status(500).json({ error: 'DB error' });
      }
      currentUser = created;
    }

    let planName = currentUser.plan || null;
    if (!planName && stripe) {
      const detected = await detectStripePlanForEmail(email);
      if (detected) {
        planName = detected;
        try {
          await supabase.from('users').update({ plan: planName }).eq('email', email);
        } catch (e) {
          console.warn('Failed to persist plan on user', e && e.message);
        }
      }
    }

    const limits = (planName && PLAN_MAP[planName]) ? PLAN_MAP[planName] : PLAN_MAP.starter;
    let searches = currentUser.searches_count || 0;
    let reveals = currentUser.reveals_count || 0;

    if (req.method === 'GET') {
      return res.status(200).json({ searches, reveals, searchesMax: limits.searchesMax, revealsMax: limits.revealsMax });
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

      const updateResult = await supabase
        .from('users')
        .update(updates)
        .eq('email', email)
        .select()
        .single();
      const updated = updateResult?.data || null;
      const updateErr = updateResult?.error || null;
      if (updateErr) {
        console.error('Supabase update error', updateErr);
        return res.status(500).json({ error: 'DB error' });
      }

      return res.status(200).json({
        searches: updated.searches_count || 0,
        reveals: updated.reveals_count || 0,
        searchesMax: limits.searchesMax,
        revealsMax: limits.revealsMax,
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
