// Proxy to keep compatibility with clients calling /api/create-checkout
// Delegates to the main create-checkout-session handler.
import createCheckoutSessionHandler from './create-checkout-session';

export default async function handler(req, res) {
  // forward the request to the canonical handler
  return createCheckoutSessionHandler(req, res);
}
