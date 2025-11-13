import React from 'react';

/**
 * UpgradeModal
 * Simple confirm modal for upgrade flow.
 *
 * onConfirm should trigger checkout (server /api/create-checkout) or redirect.
 */
export default function UpgradeModal({
  onConfirm,
  onCancel,
  price = '$9.99/month',
  productIdPlaceholder = 'STRIPE_PRODUCT_ID_PLACEHOLDER',
}) {
  return (
    <div className="upgrade-modal" role="dialog" aria-modal="true" aria-labelledby="upgrade-title">
      <h3 id="upgrade-title">Confirm upgrade to reveal full results.</h3>
      <p>Confirm Upgrade — {price}</p>
      <p>
        This will open the secure Stripe checkout for product id: <code>{productIdPlaceholder}</code>.
        (You will provide the real product id in Vercel environment variables).
      </p>
      <div className="actions">
        <button onClick={onCancel}>Cancel</button>
        <button onClick={onConfirm} className="primary">Confirm Upgrade</button>
      </div>
    </div>
  );
}
