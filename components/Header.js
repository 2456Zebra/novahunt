import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '../pages/_app';
import styles from './Header.module.css';

/**
 * Header
 * - polls /api/usage periodically (5s)
 * - listens for 'usage-updated' custom events and localStorage signals for immediate updates
 * - account dropdown: account/manage and sign out buttons are same width and left/right aligned
 */
export default function Header() {
  const { loading: authLoading, authenticated, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({ searches: 0, reveals: 0 });
  const [limits, setLimits] = useState({ searchesMax: 50, revealsMax: 25 });
  const [open, setOpen] = useState(false);
  const mounted = useRef(true);
  const pollRef = useRef(null);

  async function loadUsage() {
    try {
      const res = await fetch('/api/usage', { credentials: 'same-origin' });
      if (!res.ok) return;
      const json = await res.json();
      if (!mounted.current) return;
      setCounts({ searches: json.searches || 0, reveals: json.reveals || 0 });
      setLimits({ searchesMax: json.searchesMax || 50, revealsMax: json.revealsMax || 25 });
    } catch (err) {
      // ignore
    } finally {
      if (mounted.current) setLoading(false);
    }
  }

  useEffect(() => {
    mounted.current = true;

    if (!authLoading && authenticated) {
      loadUsage();
      // poll in background to catch server increments
      if (!pollRef.current) {
        pollRef.current = setInterval(loadUsage, 5000);
      }
    }

    function onUsageUpdated() {
      loadUsage();
    }
    function onStorage(e) {
      // react to our nh_usage_last_update marker written by SearchClient or reveal handler
      if (!e) return;
      if (e.key === 'nh_usage_last_update' || e.key === 'nh_last_domain' || e.key === 'nh_usage') {
        // small debounce
        setTimeout(() => loadUsage(), 200);
      }
    }

    window.addEventListener('usage-updated', onUsageUpdated);
    window.addEventListener('storage', onStorage);

    return () => {
      mounted.current = false;
      window.removeEventListener('usage-updated', onUsageUpdated);
      window.removeEventListener('storage', onStorage);
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, authenticated]);

  function percentClass(current, max) {
    if (!max || max <= 0) return 'p0';
    const p = Math.min(100, Math.round((current / max) * 100));
    const rounded = Math.round(p / 5) * 5;
    return `p${Math.min(100, Math.max(0, rounded))}`;
  }

  return (
    <header className={styles.header} role="banner">
      {!authLoading && !authenticated && (
        <div className={styles.signedOut}>
          <Link href="/signin"><a className={styles.signinLink}>Sign in</a></Link>
        </div>
      )}

      {!authLoading && authenticated && user && (
        <div className={styles.signedIn}>
          <div className={styles.accountInfo}>
            <div className={styles.email}>{user.email}</div>
            <div className={styles.usageSummary}>
              {counts.searches || 0} of {limits.searchesMax} searches · {counts.reveals || 0} of {limits.revealsMax} reveals
            </div>
          </div>

          <div className={styles.dropdownWrap}>
            <button
              aria-haspopup="true"
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
              className={styles.accountButton}
              type="button"
            >
              Account ▾
            </button>

            {open && (
              <div className={styles.dropdown} role="menu">
                <div className={styles.usageTitle}>Usage</div>

                <div className={styles.usageRow}>
                  <div className={styles.usageLabel}>Searches</div>
                  <div className={styles.usageValue}>{counts.searches || 0} / {limits.searchesMax}</div>
                </div>
                <div className={styles.progressBar}>
                  <div className={`${styles.progressFill} ${styles[percentClass(counts.searches||0, limits.searchesMax)]}`} />
                </div>

                <div className={styles.usageRow}>
                  <div className={styles.usageLabel}>Reveals</div>
                  <div className={styles.usageValue}>{counts.reveals || 0} / {limits.revealsMax}</div>
                </div>
                <div className={styles.progressBar}>
                  <div className={`${styles.progressFill} ${styles[percentClass(counts.reveals||0, limits.revealsMax)]}`} />
                </div>

                <div className={styles.buttonRow}>
                  <Link href="/account">
                    <a className={styles.leftButton} role="menuitem">Account</a>
                  </Link>
                  <a href="/api/logout" className={styles.rightButton} role="menuitem">Sign out</a>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
