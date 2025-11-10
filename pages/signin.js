import { useState } from 'react';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isPro, setIsPro] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    const res = await fetch('/api/auth/signin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();

    if (res.ok) {
      setMessage(data.message);
      setIsPro(data.user.subscription === 'pro');
      // NO REDIRECT — stay on success page
    } else {
      setMessage(data.error || 'Error');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9f9f9', fontFamily: 'Arial' }}>
      <div style={{ background: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', width: '400px', maxWidth: '90%' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', textAlign: 'center', marginBottom: '24px' }}>Sign In</h1>

        {!message ? (
          <form onSubmit={handleSubmit}>
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: '100%', padding: '12px', marginBottom: '16px', border: '1px solid #ccc', borderRadius: '8px', fontSize: '16px' }}
            />
            <button
              type="submit"
              style={{ width: '100%', padding: '12px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' }}
            >
              Sign In
            </button>
          </form>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ color: isPro ? '#10b981' : '#666', fontWeight: 'bold', margin: '20px 0' }}>
              {message}
            </h2>
            {isPro && (
              <p style={{ fontSize: '18px', margin: '20px 0' }}>
                Unlimited Access Activated
              </p>
            )}
            <a
              href="/"
              style={{ display: 'inline-block', marginTop: '20px', padding: '12px 24px', background: '#2563eb', color: 'white', textDecoration: 'none', borderRadius: '8px', fontWeight: 'bold' }}
            >
              Go to Dashboard →
            </a>
          </div>
        )}

        <p style={{ marginTop: '20px', textAlign: 'center', color: '#666', fontSize: '14px' }}>
          Use <code>test@novahunt.ai</code> for PRO mode
        </p>
      </div>
    </div>
  );
}
