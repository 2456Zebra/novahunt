import Stripe from 'stripe';

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

/**
 * GET /api/session-info?session_id=...
 *
 * Server-side helper that:
 * - Retrieves Stripe Checkout session to read customer/email
 * - Looks up your user DB by email/customer to determine if a password exists
 * - Returns JSON { hasPassword: boolean, email?: string, setPasswordToken?: string }
 *
 * IMPORTANT: Replace the placeholder DB logic below with your real user lookup.
 */
export default async function handler(req, res) {
  const { session_id } = req.query;

  if (!session_id) {
    return res.status(400).json({ error: 'missing session_id' });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(200).json({ hasPassword: false, note: 'no stripe key configured' });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ['customer', 'customer_details'],
    });

    const email = session?.customer_details?.email || (session.customer && session.customer.email) || null;

    // TODO: Replace with your DB/identity lookup to decide if this user already has a password.
    // Example (pseudo):
    // const user = await db.users.findOne({ email });
    // const hasPassword = !!(user && user.passwordHash);
    //
    // If you need to create a one-time token to set password:
    // const setPasswordToken = createOneTimeTokenForEmail(email, expiresIn='1h')
    //
    // For now, return hasPassword=false to force the set-password flow.
    const hasPassword = false;
    const setPasswordToken = null;

    return res.status(200).json({ hasPassword, email, setPasswordToken });
  } catch (err) {
    console.error('session-info error', err);
    return res.status(500).json({ error: 'failed to fetch session' });
  }
}
