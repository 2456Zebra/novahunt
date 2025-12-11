import { useState } from 'react';

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const { url } = await res.json();
      window.location.href = url; // Flawless redirect to Stripe
    } catch (err) {
      alert('Signup error');
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 400, margin: '100px auto' }}>
      <h1>Sign Up</h1>
      <form onSubmit={handleSignup}>
        <input 
          type="email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          placeholder="Enter email" 
          required 
          style={{ width: '100%', padding: 12, margin: '10px 0' }} 
        />
        <button type="submit" disabled={loading} style={{ width: '100%', padding: 12 }}>
          {loading ? 'Starting...' : 'Sign Up & Pay'}
        </button>
      </form>
    </div>
  );
}
