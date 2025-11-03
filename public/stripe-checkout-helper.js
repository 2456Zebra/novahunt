// Minimal client helper to create a checkout session and redirect users.
export async function startCheckout(email) {
  try {
    const resp = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        successUrl: window.location.origin + '/?success=1',
        cancelUrl: window.location.origin + '/?canceled=1'
      })
    });
    const json = await resp.json();
    if (json?.url) {
      // redirect the browser to Stripe Checkout
      window.location.href = json.url;
    } else {
      console.error('Checkout session creation failed', json);
      alert('Unable to start checkout. Check console for details.');
    }
  } catch (err) {
    console.error('Checkout request failed', err);
    alert('Unable to start checkout. Check console for details.');
  }
}