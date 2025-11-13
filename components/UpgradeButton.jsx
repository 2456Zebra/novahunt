import React from 'react';
import Router from 'next/router';

/**
 * UpgradeButton
 * Behavior:
 * - If user is not signed in => navigate to /signin
 * - If user signed in and PRO => call onReveal (reveal results)
 * - If user signed in but not PRO => call /api/create-checkout to start Stripe checkout
 *
 * It detects sign-in and pro flags using cookies; replace cookie names with your app's cookie keys if different.
 */
export default function UpgradeButton({ isPro = false, onReveal }) {
  const onClick = async () => {
    const cookies = typeof document !== 'undefined' ? document.cookie : '';
    const isSignedIn = /nh_user=/.test(cookies);
    const signedIsPro = /nh_pro=(true|1)/.test(cookies) || isPro;

    if (!isSignedIn) {
      Router.push('/signin');
      return;
    }

    if (signedIsPro) {
      if (onReveal) onReveal();
      return;
    }

    // Signed in but not PRO: start checkout
    try {
      const res = await fetch('/api/create-checkout', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to start checkout');
      const data = await res.json();
      if (data && data.url) {
        window.location.href = data.url;
      } else {
        alert('Unable to start checkout. Please contact support.');
      }
    } catch (err) {
      console.error('checkout error', err);
      alert('Unable to start checkout. Please try again later.');
    }
  };

  return <button className="upgrade-button" onClick={onClick}>Upgrade</button>;
}
