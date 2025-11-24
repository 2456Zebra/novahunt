// pages/blocked.js
import { useRouter } from 'next/router';

export default function BlockedPage() {
  const router = useRouter();
  const currentProd = process.env.NEXT_PUBLIC_CURRENT_PROD_URL;

  const goHome = () => {
    // Force redirect to the current production site
    if (currentProd) {
      window.location.href = currentProd; // full page reload to avoid flashes
    } else {
      console.error('NEXT_PUBLIC_CURRENT_PROD_URL is not set');
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Access Blocked</h1>
      <p style={styles.message}>You are not allowed to view this site.</p>
      <button style={styles.button} onClick={goHome}>Go Home</button>
    </div>
  );
}

const styles = {
  container: {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    background: '#f9fafb',
    color: '#111827',
    fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial',
    textAlign: 'center',
  },
  title: {
    fontSize: '3rem',
    fontWeight: 'bold',
    marginBottom: '1rem',
  },
  message: {
    fontSize: '1.25rem',
    marginBottom: '2rem',
  },
  button: {
    fontSize: '1rem',
    padding: '0.75rem 1.5rem',
    borderRadius: '0.5rem',
    border: 'none',
    background: '#2563eb',
    color: 'white',
    cursor: 'pointer',
  },
};
