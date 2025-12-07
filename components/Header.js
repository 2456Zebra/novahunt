import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '../pages/_app';
import styles from './Header.module.css';

/**
 * Header component (no inline styles)
 */
export default function Header() {
  const { loading: authLoading, authenticated, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({ searches: 0, reveals: 0 });
  const [limits, setLimits] = useState({ searchesMax: 50, revealsMax: 25 });
  const [open, setOpen] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch('/api/usage', { credentials: 'same-origin' });
        if (!mounted.current) return;
        const json = await res.json();
        if (res.ok) {
          setCounts({ searches: json.searches || 0, reveals: json.reveals || 0 });
          setLimits({ searchesMax: json.searchesMax || 50, revealsMax: json.revealsMax || 25 });
        } else {
          setCounts({ searches: 0, reveals: 0 });
        }
      } catch (err) {
        console.error('Header load usage error', err);
      } finally {
        if (mounted.current) setLoading(false);
      }
    }

    if (!authLoading && authenticated) load();
    return () => { mounted.current = false; };
  }, [authLoading, authenticated]);

  function percent(current, max) {
    if (!max || max <= 0) return 0;
    return Math.min(100, Math.round((current / max) * 100));
  }

  function percentClass(current, max) {
    const p = percent(current, max);
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
                    <a className={styles.primaryButton} role="menuitem">Account</a>
                  </Link>
                  <a href="/api/logout" className={styles.primaryButton} role="menuitem">Sign out</a>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
