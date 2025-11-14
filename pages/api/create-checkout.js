// Proxy so older clients calling /api/create-checkout continue to work.
// Delegates to the canonical create-checkout-session handler.
import createCheckoutSessionHandler from './create-checkout-session';

export default async function handler(req, res) {
  return createCheckoutSessionHandler(req, res);
}
