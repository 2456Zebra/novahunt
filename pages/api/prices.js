// Simple API exposing configured Stripe price IDs to the client.
// Returns only the price IDs (no secret keys).
export default function handler(req, res) {
  const prices = {
    starter_monthly: process.env.PRICE_ID_STARTER_MONTHLY || '',
    pro_monthly: process.env.PRICE_ID_PRO_MONTHLY || '',
    team_monthly: process.env.PRICE_ID_TEAM_MONTHLY || '',
  };
  res.status(200).json(prices);
}
