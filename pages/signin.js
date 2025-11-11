import { useState } from 'react';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

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
      setMessage('Welcome, PRO user! Redirecting...');
      // Set cookie for 30 days
      document.cookie = `userId=pro_123; Path=/; Max-Age=${60*60*24*30}; Secure; SameSite=Lax`;
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);
    } else {
      setMessage(data.error || 'Error');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9f9f9', fontFamily: 'Arial' }}>
      <div style={{ background: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', width: '400px', maxWidth: '90%' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', textAlign: 'center', marginBottom: '24px' }}>Sign In</h1>
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
            Sign In as PRO
          </button>
        </form>
        {message && (
          <p style={{ marginTop: '20px', textAlign: 'center', color: message.includes('Welcome') ? '#10b981' : '#dc2626', fontWeight: 'bold' }}>
            {message}
          </p>
        )}
        <p style={{ marginTop: '20px', textAlign: 'center', color: '#666', fontSize: '14px' }}>
          Use any email — instantly PRO
        </p>
      </div>
    </div>
  );
}
