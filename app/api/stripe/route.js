import { NextResponse } from 'next/server';
import Stripe from 'stripe';

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2022-11-15' });
}

export async function GET(request) {
  const stripe = getStripe();
  try {
    const prices = await stripe.prices.list({
      active: true,
      expand: ['data.product'],
      limit: 100,
    });

    const items = prices.data.map((p) => ({
      id: p.id,
      unit_amount: p.unit_amount,
      currency: p.currency,
      nickname: p.nickname || null,
      recurring: p.recurring || null,
      product: p.product
        ? {
            id: p.product.id,
            name: p.product.name,
            description: p.product.description || null,
            active: p.product.active,
          }
        : null,
    }));

    return NextResponse.json({ prices: items });
  } catch (err) {
    console.error('Error listing Stripe prices', err);
    return NextResponse.json(
      { error: err.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  const stripe = getStripe();
  try {
    const body = await request.json();
    const { priceId, successPath = '/auth/stripe-success', quantity = 1 } = body || {};

    if (!priceId) {
      return NextResponse.json(
        { ok: false, error: 'Missing priceId' },
        { status: 400 }
      );
    }

    const origin = process.env.SITE_URL || `https://${request.headers.get('host')}`;

    // IMPORTANT: include {CHECKOUT_SESSION_ID} in success_url so Stripe appends session_id
    const successUrl = `${origin}${successPath}?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${origin}/signup?canceled=true`;

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription', // or 'payment' depending on your flow
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: Number(quantity || 1) }],
      // include the placeholder so Stripe will append the actual id on redirect
      success_url: successUrl,
      cancel_url: cancelUrl,
      // optional: include metadata you'll use later
      metadata: {
        createdBy: 'novahunt-checkout'
      }
    });

    // Return session id & url so client can redirect
    return NextResponse.json({ ok: true, url: session.url, id: session.id });
  } catch (err) {
    console.error('create-checkout error', err && (err.message || err));
    return NextResponse.json(
      { ok: false, error: 'Could not create checkout session' },
      { status: 500 }
    );
  }
}
