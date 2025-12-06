import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  : null;

/**
 * GET /api/session-info?session_id=...
 * - Retrieves the Stripe Checkout session to get customer email
 * - Looks up Supabase users table for that email to determine hasPassword
 *
 * Response: { hasPassword: boolean, email?: string, setPasswordToken?: string }
 */
export default async function handler(req, res) {
  const { session_id } = req.query;

  if (!session_id) {
    return res.status(400).json({ error: 'missing session_id' });
  }

  if (!stripe) {
    return res.status(200).json({ hasPassword: false, note: 'stripe secret not configured' });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ['customer', 'customer_details'],
    });

    const email = session?.customer_details?.email || (session.customer && session.customer.email) || null;

    if (!email) {
      return res.status(200).json({ hasPassword: false, email: null });
    }

    if (!supabase) {
      // No DB configured; return fallback
      return res.status(200).json({ hasPassword: false, email });
    }

    // Query Supabase users table for this email
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, password_hash')
      .eq('email', email)
      .maybeSingle();

    if (error) {
      console.error('Supabase query error', error);
      return res.status(500).json({ error: 'Database error' });
    }

    const hasPassword = !!(user && user.password_hash);

    // Optionally generate a one-time token here
    const setPasswordToken = null;

    return res.status(200).json({ hasPassword, email, setPasswordToken });
  } catch (err) {
    console.error('session-info error', err);
    return res.status(500).json({ error: 'failed to fetch session' });
  }
}
