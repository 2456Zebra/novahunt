// pages/api/create-checkout-session.js
import Stripe from "stripe";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const secret = process.env.STRIPE_SECRET_KEY;
  const priceId = process.env.STRIPE_PRO_PRICE_ID;
  if (!secret || !priceId) return res.status(500).json({ error: "Stripe not configured (set STRIPE_SECRET_KEY & STRIPE_PRO_PRICE_ID)" });

  const stripe = new Stripe(secret, { apiVersion: "2022-11-15" });
  try {
    const session = await stripe.checkout.sessions.create({
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      billing_address_collection: "auto",
      success_url: `${req.headers.origin}/?checkout=success`,
      cancel_url: `${req.headers.origin}/?checkout=cancel`
    });
    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("stripe err", err);
    res.status(500).json({ error: "Stripe error" });
  }
}
