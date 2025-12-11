import { useState } from 'react';

export default function SetPassword() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const params = new URLSearchParams(window.location.search);
  const email = params.get('email') || '';
  const sessionId = params.get('session_id') || ''; // For verification if needed

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 8) return setMessage('Password too short');

    setLoading(true);
    const res = await fetch('/api/auth/set-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ email, password, sessionId }),
    });

    if (res.ok) {
      setMessage('Success! Redirecting to dashboard...');
      window.location.href = '/dashboard'; // Auto-sign-in complete
    } else {
      setMessage('Error – try again');
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 400, margin: '100px auto' }}>
      <h1>Set Password</h1>
      <p>Welcome, {email}</p>
      <form onSubmit={handleSubmit}>
        <input 
          type="password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          placeholder="Choose password (8+ chars)" 
          required 
          minLength={8} 
          style={{ width: '100%', padding: 12, margin: '10px 0' }} 
        />
        <button type="submit" disabled={loading} style={{ width: '100%', padding: 12 }}>
          {loading ? 'Saving...' : 'Continue'}
        </button>
      </form>
      {message && <p style={{ color: message.includes('Success') ? 'green' : 'red' }}>{message}</p>}
    </div>
  );
}
