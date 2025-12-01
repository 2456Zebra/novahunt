import React from 'react';
import stripe from '../lib/stripe';

/*
Success page
- Retrieves the Checkout Session server-side.
- Detects purchased price and maps to plan limits.
- Sets a server-side nh_session cookie (HttpOnly) so the next server-rendered homepage request
  can detect the signed-in user immediately. Also the Go to Dashboard button writes localStorage (fallback).
*/

function detectPlanFromPriceId(priceId) {
  const starter = process.env.NEXT_PUBLIC_PRICE_STARTER || '';
  const pro = process.env.NEXT_PUBLIC_PRICE_PRO || '';
  const enterprise = process.env.NEXT_PUBLIC_PRICE_ENTERPRISE || '';

  if (!priceId) return { key: 'unknown', limits: null };

  if (priceId === pro) return { key: 'pro', limits: { searches: 0, reveals: 0, limitSearches: 1000, limitReveals: 500 } };
  if (priceId === starter) return { key: 'starter', limits: { searches: 0, reveals: 0, limitSearches: 100, limitReveals: 50 } };
  if (priceId === enterprise) return { key: 'enterprise', limits: { searches: 0, reveals: 0, limitSearches: 3000, limitReveals: 1500 } };
  return { key: 'unknown', limits: null };
}

export default function SuccessPage({ session, lineItems, planKey, planLimits, customerEmail, error }) {
  if (error) {
    return (
      <main style={{ padding: '2rem', maxWidth: 800, margin: '0 auto' }}>
        <h1>Purchase result</h1>
        <p style={{ color: 'crimson' }}>{error}</p>
      </main>
    );
  }

  const amountTotal = session?.amount_total;
  const currency = session?.currency || (session?.payment_intent && session.payment_intent.currency) || 'usd';

  const goToDashboard = () => {
    try {
      if (customerEmail) localStorage.setItem('nh_user_email', customerEmail);
      const usage = {
        searches: (planLimits && planLimits.searches) || 0,
        reveals: (planLimits && planLimits.reveals) || 0,
        limitSearches: (planLimits && planLimits.limitSearches) || 0,
        limitReveals: (planLimits && planLimits.limitReveals) || 0,
        plan: planKey || 'unknown',
      };
      localStorage.setItem('nh_usage', JSON.stringify(usage));
    } catch (e) {
      // ignore storage errors
    }
    window.location.href = '/';
  };

  return (
    <main style={{ padding: '2rem', maxWidth: 900, margin: '0 auto' }}>
      <h1>Thank you — your purchase was successful</h1>

      <section style={{ marginTop: '1rem', padding: '1rem', border: '1px solid #eee', borderRadius: 8 }}>
        <h2 style={{ marginTop: 0 }}>Order summary</h2>
        <p><strong>Customer email:</strong> {customerEmail || '—'}</p>
        {typeof amountTotal === 'number' && (
          <p>
            <strong>Total paid:</strong>{' '}
            {new Intl.NumberFormat(undefined, { style: 'currency', currency: (currency || 'usd').toUpperCase() }).format((amountTotal || 0) / 100)}
          </p>
        )}

        <div style={{ marginTop: '1rem' }}>
          <h3 style={{ marginBottom: '.5rem' }}>Items</h3>
          {lineItems && lineItems.length > 0 ? (
            <ul>
              {lineItems.map((li) => {
                const name =
                  (li.description) ||
                  (li.price && li.price.product && (li.price.product.name || li.price.product)) ||
                  (li.price && li.price.nickname) ||
                  li.price?.id ||
                  'Item';
                const unitAmount = (li.price && li.price.unit_amount) || li.amount || null;
                const currencyItem = (li.price && li.price.currency) || currency;
                return (
                  <li key={li.id || name} style={{ marginBottom: '.5rem' }}>
                    <div><strong>{name}</strong></div>
                    <div style={{ color: '#555', fontSize: '.95rem' }}>
                      {li.quantity ? `${li.quantity} × ` : ''}
                      {unitAmount ? new Intl.NumberFormat(undefined, { style: 'currency', currency: (currencyItem || 'usd').toUpperCase() }).format(unitAmount / 100) : ''}
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p>No line items available for this session.</p>
          )}
        </div>

        <div style={{ marginTop: '1rem' }}>
          <button
            onClick={goToDashboard}
            style={{
              padding: '10px 16px',
              borderRadius: 8,
              background: '#0b74ff',
              color: '#fff',
              border: 'none',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Go to Dashboard
          </button>
        </div>
      </section>

      <p style={{ marginTop: '1rem', color: '#666' }}>
        You will be redirected to the homepage signed in as {customerEmail || 'your email'}.
      </p>
    </main>
  );
}

export async function getServerSideProps(context) {
  const { session_id: sessionId } = context.query || {};

  if (!sessionId || typeof sessionId !== 'string') {
    return {
      props: {
        error: 'Missing session_id in query string.',
      },
    };
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['payment_intent'],
    });

    const lineItemsObj = await stripe.checkout.sessions.listLineItems(sessionId, { limit: 100, expand: ['data.price.product'] });
    const lineItems = lineItemsObj && lineItemsObj.data ? lineItemsObj.data : [];

    let purchasedPriceId = null;
    if (lineItems.length > 0) {
      const firstPrice = lineItems[0].price;
      purchasedPriceId = (firstPrice && firstPrice.id) || (firstPrice && firstPrice.price && firstPrice.price.id) || null;
    }

    const detected = detectPlanFromPriceId(purchasedPriceId);

    const customerEmail = (session && (session.customer_details && session.customer_details.email)) || session.customer_email || null;

    // Create nh_session cookie for server-side detection on next request
    try {
      const cookiePayload = {
        email: customerEmail || '',
        plan: detected.key || 'unknown',
        limitSearches: (detected.limits && detected.limits.limitSearches) || 0,
        limitReveals: (detected.limits && detected.limits.limitReveals) || 0,
      };
      const cookieVal = encodeURIComponent(JSON.stringify(cookiePayload));
      const maxAge = 60 * 60 * 24 * 7;
      const cookieStr = `nh_session=${cookieVal}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Lax`;
      const prev = context.res.getHeader('Set-Cookie');
      if (prev) {
        const arr = Array.isArray(prev) ? prev.slice() : [String(prev)];
        arr.push(cookieStr);
        context.res.setHeader('Set-Cookie', arr);
      } else {
        context.res.setHeader('Set-Cookie', cookieStr);
      }
    } catch (cookieErr) {
      console.warn('Failed to set nh_session cookie:', cookieErr && cookieErr.message ? cookieErr.message : cookieErr);
    }

    return {
      props: {
        session: JSON.parse(JSON.stringify(session)),
        lineItems: JSON.parse(JSON.stringify(lineItems)),
        planKey: detected.key,
        planLimits: detected.limits,
        customerEmail,
      },
    };
  } catch (err) {
    console.error('Error retrieving Stripe session:', err && err.message ? err.message : err);
    return {
      props: {
        error: `Unable to load checkout session: ${err && err.message ? err.message : 'unknown error'}`,
      },
    };
  }
}
