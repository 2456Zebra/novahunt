// Robust create-checkout-session:
// - Accepts priceId (body or query or header) OR planId (body or query or header) and maps plan -> price via data/price-map.json
// - Logs request details for quick debugging in Vercel logs
// - Does NOT use any test fallback; mapping must be filled with your real production price IDs
import stripe from '../../lib/stripe';
import priceMap from '../../data/price-map.json';

function resolvePriceFromPlan(planId) {
  if (!planId) return null;
  return priceMap[planId] || null;
}

export default async function handler(req, res) {
  console.log('--- create-checkout-session called ---');
  console.log('method:', req.method);
  console.log('url:', req.url);
  console.log('query:', req.query || {});

  // show only safe header previews
  console.log('headers preview:', {
    'content-type': req.headers['content-type'],
    'x-price-id': req.headers['x-price-id'],
    'x-plan-id': req.headers['x-plan-id']
  });

  // attempt to inspect body
  let body = req.body || {};
  try {
    if (typeof body === 'string' && body.length) {
      try { body = JSON.parse(body); } catch (e) { /* ignore */ }
    }
  } catch (e) {
    console.log('error reading body:', e.message);
  }
  console.log('body preview:', body && Object.keys(body).length ? body : null);

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  try {
    // Priority: explicit priceId (body) -> priceId (query) -> header -> planId-> query plan -> header plan
    const priceIdFromBody = body && body.priceId;
    const priceIdFromQuery = req.query && req.query.priceId;
    const priceIdFromHeader = req.headers && (req.headers['x-price-id'] || req.headers['X-Price-Id']);

    const planIdFromBody = body && body.planId;
    const planIdFromQuery = req.query && req.query.planId;
    const planIdFromHeader = req.headers && (req.headers['x-plan-id'] || req.headers['X-Plan-Id']);

    let resolvedPriceId =
      priceIdFromBody ||
      priceIdFromQuery ||
      priceIdFromHeader ||
      resolvePriceFromPlan(planIdFromBody) ||
      resolvePriceFromPlan(planIdFromQuery) ||
      resolvePriceFromPlan(planIdFromHeader) ||
      null;

    // Allow explicit line_items in body (if provided, use them instead)
    const explicitLineItems = body && body.line_items;
    const lineItems = explicitLineItems || (resolvedPriceId ? [{ price: resolvedPriceId, quantity: 1 }] : null);

    if (!lineItems) {
      console.log('-> Missing priceId/plan mapping. Resolved values:', {
        priceIdFromBody,
        priceIdFromQuery,
        priceIdFromHeader,
        planIdFromBody,
        planIdFromQuery,
        planIdFromHeader
      });
      return res.status(400).json({
        error: 'Missing priceId',
        message:
          'Request must include a Stripe priceId (price_...) or a planId that exists in data/price-map.json.',
        details: {
          priceIdFromBody,
          priceIdFromQuery,
          priceIdFromHeader,
          planIdFromBody,
          planIdFromQuery,
          planIdFromHeader
        }
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
