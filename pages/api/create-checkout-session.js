// pages/api/create-checkout-session.js
// Robust version: validates input, checks env, logs detailed errors, and returns helpful HTTP codes.

import Stripe from 'stripe';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
    const { priceId, email } = body;

    // Basic validation
    if (!priceId || typeof priceId !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid priceId in request body' });
    }

    // Check required env
    const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
    const SUCCESS_URL = process.env.SUCCESS_URL;
    if (!STRIPE_SECRET_KEY) {
      console.error('STRIPE_SECRET_KEY not configured in environment');
      return res.status(500).json({ error: 'Server misconfiguration: STRIPE_SECRET_KEY missing' });
    }
    if (!SUCCESS_URL || !SUCCESS_URL.includes('{CHECKOUT_SESSION_ID}')) {
      console.warn('SUCCESS_URL missing or does not include {CHECKOUT_SESSION_ID}', SUCCESS_URL);
      // Not fatal for tests, but warn and continue — Stripe requires the placeholder to be useful.
    }

    const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2022-11-15' });

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription', // or 'payment' depending on your use
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: email || undefined,
      success_url: SUCCESS_URL,
      cancel_url: process.env.CANCEL_URL || `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.novahunt.ai'}/plans`,
    });

    return res.status(200).json({ id: session.id, url: session.url });
  } catch (err) {
    // Detailed server logs for Vercel (this helps us diagnose the 500)
    console.error('create-checkout-session error:', err && err.stack ? err.stack : err);
    // If it's a Stripe API error with a status code, propagate a friendly message
    if (err && err.statusCode) {
      return res.status(err.statusCode).json({ error: err.message, type: err.type || 'stripe_error' });
    }
    // Generic 500
    return res.status(500).json({ error: 'Internal server error', message: err && err.message ? err.message : '' });
  }
}
