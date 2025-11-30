// Robust create-checkout-session that determines whether the chosen price(s) are recurring
// and creates a Checkout Session with mode 'subscription' for recurring prices or 'payment' for one-time prices.
// Supports resolving plan -> price via data/price-map.json.
import stripe from '../../lib/stripe';
import priceMap from '../../data/price-map.json';

async function isPriceRecurring(priceId) {
  try {
    const price = await stripe.prices.retrieve(priceId);
    return !!price.recurring; // truthy if recurring (object) otherwise false
  } catch (err) {
    console.error('Error retrieving price from Stripe:', priceId, err && err.message);
    // If we cannot retrieve price, assume not recurring to avoid blocking non-subscription flow.
    return false;
  }
}

function resolvePriceFromPlan(planId) {
  if (!planId) return null;
  return priceMap[planId] || null;
}

export default async function handler(req, res) {
  console.log('--- create-checkout-session called ---');
  console.log('method:', req.method);
  console.log('query:', req.query || {});

  // Light header preview
  console.log('headers preview:', {
    'content-type': req.headers['content-type'],
    'x-price-id': req.headers['x-price-id'],
    'x-plan-id': req.headers['x-plan-id']
  });

  // Normalize body
  let body = req.body || {};
  if (typeof body === 'string' && body.length) {
    try { body = JSON.parse(body); } catch (e) { /* ignore */ }
  }
  console.log('body preview:', body && Object.keys(body).length ? body : null);

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  try {
    // Resolve explicit priceId or planId from multiple sources
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

    // If caller supplied explicit line_items (array), use them; otherwise build from resolvedPriceId
    const explicitLineItems = body && body.line_items;
    let lineItems = null;
    if (explicitLineItems && Array.isArray(explicitLineItems) && explicitLineItems.length > 0) {
      lineItems = explicitLineItems;
    } else if (resolvedPriceId) {
      lineItems = [{ price: resolvedPriceId, quantity: 1 }];
    }

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
        message: 'Request must include a Stripe priceId (price_...) or a planId that exists in data/price-map.json.'
      });
    }

    // Determine whether any price in lineItems is recurring
    // Collect all priceIds from lineItems where item.price is a string id
    const priceIdsToCheck = lineItems
      .map((it) => (it && typeof it.price === 'string' ? it.price : null))
      .filter(Boolean);

    let anyRecurring = false;
    for (const pid of priceIdsToCheck) {
      /* eslint-disable no-await-in-loop */
      const recurring = await isPriceRecurring(pid);
      if (recurring) {
        anyRecurring = true;
        break;
      }
      /* eslint-enable no-await-in-loop */
    }

    const mode = anyRecurring ? 'subscription' : 'payment';
    console.log('-> Creating session; mode:', mode, 'lineItems:', lineItems);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode,
      // For subscription mode, Stripe will create a subscription from the provided recurring price
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
