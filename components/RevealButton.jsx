import { useState } from 'react';
import styles from './RevealButton.module.css';

/**
 * RevealButton
 * Props:
 * - domain (string)
 *
 * Defensive Reveal flow: checks limits, calls /api/find-company, shows email + Save (no auto-redirect).
 */
export default function RevealButton({ domain }) {
  const [loading, setLoading] = useState(false);
  const [revealedEmail, setRevealedEmail] = useState(null);
  const [error, setError] = useState(null);
  const [upgradeNeeded, setUpgradeNeeded] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleReveal() {
    setError(null);
    setUpgradeNeeded(false);
    setSaved(false);
    setLoading(true);

    try {
      // 1) Check usage
      const usageRes = await fetch('/api/usage', { credentials: 'same-origin' });
      const usage = await usageRes.json().catch(() => ({ searches:0, reveals:0, searchesMax:0, revealsMax:0 }));

      if (usage.revealsMax && (usage.reveals >= usage.revealsMax)) {
        setUpgradeNeeded(true);
        setLoading(false);
        return;
      }

      // 2) Call find-company endpoint
      const findUrl = `/api/find-company?domain=${encodeURIComponent(domain)}`;
      const findRes = await fetch(findUrl, { credentials: 'same-origin' });
      if (!findRes.ok) {
        if (findRes.status === 402 || findRes.status === 403) {
          setUpgradeNeeded(true);
          setLoading(false);
          return;
        }
        const txt = await findRes.text().catch(() => '');
        throw new Error(`Reveal request failed (${findRes.status}) ${txt}`);
      }
      const findJson = await findRes.json().catch(() => null);
      const email = (findJson && (findJson.email || findJson.revealedEmail || findJson.result?.email)) || null;
      if (!email) {
        setError('No email returned from reveal API');
        console.warn('reveal API returned', findJson);
        setLoading(false);
        return;
      }

      setRevealedEmail(email);

      // 3) Inform usage endpoint (best-effort)
      try {
        await fetch('/api/usage', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'reveal' }),
        });
      } catch (e) {
        console.warn('failed to update usage after reveal', e);
      }
    } catch (err) {
      console.error('Reveal error', err);
      setError(String(err.message || err));
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/save-contact', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain, email: revealedEmail }),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        console.warn('save-contact failed', res.status, txt);
        setSaved(true);
        setLoading(false);
        return;
      }
      setSaved(true);
    } catch (err) {
      console.warn('save contact error', err);
      setSaved(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.wrap}>
      {!revealedEmail && (
        <button className={styles.revealButton} onClick={handleReveal} disabled={loading}>
          {loading ? 'Revealing…' : 'Reveal'}
        </button>
      )}

      {upgradeNeeded && (
        <div className={styles.upgrade}>
          You reached your reveal limit. <a href="/plans" className={styles.link}>View plans</a>
        </div>
      )}

      {error && <div className={styles.error}>{error}</div>}

      {revealedEmail && (
        <div className={styles.result}>
          <div className={styles.email}>{revealedEmail}</div>
          {!saved ? (
            <button className={styles.saveButton} onClick={handleSave} disabled={loading}>
              {loading ? 'Saving…' : 'Save'}
            </button>
          ) : (
            <div className={styles.saved}>Saved ✓</div>
          )}
        </div>
      )}
    </div>
  );
}
