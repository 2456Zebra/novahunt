import jwt from 'jsonwebtoken';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'dev-secret-change-me';
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  : null;

/**
 * Debug endpoint (server-side only).
 * GET -> returns:
 * {
 *   authenticated: true|false,
 *   email,
 *   supabaseUser: <user row or null>,
 *   detectedPlan: 'starter'|'pro'|'enterprise'|null,
 *   stripeCustomer: { ... } | null,
 *   stripeSubscriptions: [ ... ] | null
 * }
 *
 * Use only for debugging — remove after use.
 */
export default async function handler(req, res) {
  const token = (req.cookies && req.cookies.auth) || null;
  if (!token) return res.status(401).json({ error: 'Not authenticated' });

  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token', message: err?.message });
  }

  const email = payload.email || null;
  if (!email) return res.status(400).json({ error: 'No email in token' });

  // read user from supabase if available
  let supabaseUser = null;
  if (supabase) {
    try {
      const r = await supabase.from('users').select('id,email,searches_count,reveals_count,plan').eq('email', email).maybeSingle();
      supabaseUser = r?.data || null;
    } catch (e) {
      // ignore
      supabaseUser = { error: String(e?.message || e) };
    }
  }

  // helper to detect plan from Stripe
  async function detectStripePlan(emailArg) {
    if (!stripe) return null;
    try {
      const customers = await stripe.customers.list({ email: emailArg, limit: 1 });
      const customer = customers?.data?.[0] || null;
      if (!customer) return { detectedPlan: null, customer: null, subscriptions: null };

      const subs = await stripe.subscriptions.list({ customer: customer.id, limit: 10 });
      const subscriptions = subs?.data || [];

      // Pick the most relevant subscription
      const activeSub = subscriptions.find((s) => ['active','trialing','past_due'].includes(s.status)) || subscriptions[0] || null;
      // try to infer plan name from price/product
      let detected = null;
      if (activeSub) {
        const item = activeSub.items?.data?.[0];
        if (item && item.price) {
          try {
            const price = await stripe.prices.retrieve(item.price.id);
            const nickname = (price?.nickname || '').toLowerCase();
            let productName = '';
            if (price && price.product) {
              try {
                const prod = await stripe.products.retrieve(price.product);
                productName = (prod?.name || '').toLowerCase();
              } catch (e) {
                // ignore
              }
            }
            const combined = `${nickname} ${productName}`;
            if (combined.includes('enterprise')) detected = 'enterprise';
            else if (combined.includes('pro')) detected = 'pro';
            else if (combined.includes('starter') || combined.includes('basic')) detected = 'starter';
            else if (price?.unit_amount && price.unit_amount >= 10000) detected = 'pro';
          } catch (e) {
            // ignore price retrieval error
          }
        }
      }

      return {
        detectedPlan: detected,
        customer,
        subscriptions,
        activeSubscription: activeSub,
      };
    } catch (err) {
      return { error: String(err?.message || err) };
    }
  }

  const stripeInfo = await detectStripePlan(email);

  return res.status(200).json({
    authenticated: true,
    email,
    supabaseUser,
    stripeInfo,
  });
}
