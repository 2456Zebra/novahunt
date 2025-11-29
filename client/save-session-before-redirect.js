// client snippet: after your backend returns the checkout session (id/url)
async function startCheckout() {
  const res = await fetch('/api/create-checkout-session', { method: 'POST', body: JSON.stringify({ priceId: 'price_XXXX', email: 'user@example.com' }), headers: { 'Content-Type': 'application/json' } });
  const json = await res.json();
  const sessionId = json.id;
  const sessionUrl = json.url;
  try { localStorage.setItem('stripe_session_id', sessionId); } catch (e) { /* ignore */ }
  // Redirect the user to Stripe Checkout (server returned session.url)
  window.location.href = sessionUrl;
}
