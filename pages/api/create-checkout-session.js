// Robust debug-friendly create-checkout-session handler.
// Accepts priceId via JSON body, query param (?priceId=), or X-Price-Id header.
// Logs request details so you can inspect Vercel function logs.
import stripe from '../../lib/stripe';

export default async function handler(req, res) {
  console.log('--- create-checkout-session called ---');
  console.log('method:', req.method);
  console.log('query:', req.query || {});
  // headers: show only the price header to avoid spamming secrets
  console.log('x-price-id header:', req.headers && req.headers['x-price-id']);

  // Try to inspect body safely
  let rawBody = req.body;
  try {
    console.log('raw body type:', typeof rawBody);
    console.log('body (preview):', rawBody);
  } catch (e) {
    console.log('error logging body:', e);
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  try {
    // Normalize body if it's a stringified JSON
    let body = req.body || {};
    if (typeof body === 'string' && body.length) {
      try {
        body = JSON.parse(body);
      } catch (e) {
        // not JSON parseable; leave as-is
        console.log('body is string but not JSON:', e.message);
      }
    }

    const priceIdFromBody = body && body.priceId;
    const line_items = body && body.line_items;
    const priceIdFromQuery = req.query && req.query.priceId;
    const priceIdFromHeader = req.headers && (req.headers['x-price-id'] || req.headers['X-Price-Id']);

    const resolvedPriceId = priceIdFromBody || priceIdFromQuery || priceIdFromHeader || null;
    const lineItems = line_items || (resolvedPriceId ? [{ price: resolvedPriceId, quantity: 1 }] : null);

    if (!lineItems) {
      console.log('-> Missing priceId or line_items on server. Resolved values:');
      console.log({ priceIdFromBody, priceIdFromQuery, priceIdFromHeader, line_items });
      return res.status(400).json({
        error: 'Missing priceId',
        details: {
          priceIdFromBody,
          priceIdFromQuery,
          priceIdFromHeader,
          line_items_preview: line_items ? line_items : null,
        },
      });
    }

    console.log('-> Creating session with lineItems:', lineItems);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL || ''}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || ''}/cancel`,
    });

    console.log('-> Created session id:', session.id);
    return res.status(200).json({ id: session.id });
  } catch (err) {
    console.error('create-checkout-session error', err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
