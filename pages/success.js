import React from 'react';
import stripe from '../lib/stripe';

/*
  Server-rendered success page.

  Expects ?session_id=cs_... in the query string (Stripe Checkout session id).
  Uses getServerSideProps to retrieve the session and line items securely on the server.
*/
export default function SuccessPage({ session, lineItems, error }) {
  if (error) {
    return (
      <main style={{ padding: '2rem', maxWidth: 800, margin: '0 auto' }}>
        <h1>Purchase result</h1>
        <p style={{ color: 'crimson' }}>{error}</p>
        <p>
          If you think this is an error, contact support or try again from your account dashboard.
        </p>
      </main>
    );
  }

  const customerEmail = session?.customer_details?.email || session?.customer_email || '—';
  const amountTotal = session?.amount_total;
  const currency = session?.currency || (session?.payment_intent && session.payment_intent.currency) || 'usd';

  return (
    <main style={{ padding: '2rem', maxWidth: 900, margin: '0 auto' }}>
      <h1>Thank you — your purchase was successful</h1>

      <section style={{ marginTop: '1rem', padding: '1rem', border: '1px solid #eee', borderRadius: 8 }}>
        <h2 style={{ marginTop: 0 }}>Order summary</h2>
        <p><strong>Customer email:</strong> {customerEmail}</p>
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
                // li.price may be expanded product object if available
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
          <a href="/dashboard" style={{ color: '#0b74ff', textDecoration: 'none', fontWeight: 700 }}>
            Back to dashboard
          </a>
        </div>
      </section>

      <p style={{ marginTop: '1rem', color: '#666' }}>
        A receipt has been (or will be) sent to {customerEmail} by Stripe if an email was provided.
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
    // Retrieve the session and expand the line items' price.product so we can show product name
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items.data.price.product', 'payment_intent'],
    });

    // Retrieve line items
    const lineItemsObj = await stripe.checkout.sessions.listLineItems(sessionId, { limit: 100, expand: ['data.price.product'] });
    const lineItems = lineItemsObj && lineItemsObj.data ? lineItemsObj.data : [];

    return {
      props: {
        session: JSON.parse(JSON.stringify(session)),
        lineItems: JSON.parse(JSON.stringify(lineItems)),
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
