import { useState } from 'react';
import { ensureUsageForPlan } from '../components/UsageEnforcer';

/*
Simple signup page that:
- fixes the sign-up form layout (password field won't overflow)
- on successful signup (mock or real) sets nh_user_email and nh_usage in localStorage
  so user is immediately signed in on redirect to homepage.
Important:
- If you have a real server signup endpoint, replace the mock POST below with the real request
  and only set localStorage after server returns success. This file ensures layout and local sign-in.
*/

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [plan, setPlan] = useState('free');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg('');
    if (!email || !password) {
      setMsg('Please enter email and password.');
      return;
    }

    setLoading(true);
    try {
      // TODO: replace with real signup POST to your backend if present.
      // Example:
      // const res = await fetch('/api/signup', { method: 'POST', body: JSON.stringify({ email, password, plan }) });
      // if (!res.ok) throw new Error('Signup failed');

      // For now assume signup success. Set localStorage so homepage will show signed-in state.
      try {
        localStorage.setItem('nh_user_email', email);
        // ensure default usage structure for chosen plan
        const usage = ensureUsageForPlan(plan);
        // if plan chosen isn't free, overwrite limits from plan defaults
        usage.plan = plan;
        localStorage.setItem('nh_usage', JSON.stringify(usage));
      } catch (err) {
        // ignore storage errors
      }

      // Redirect to homepage (signed-in)
      window.location.href = '/';
    } catch (err) {
      setMsg(err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ padding: 24, maxWidth: 680, margin: '0 auto' }}>
      <h1 style={{ marginTop: 0 }}>Create an account</h1>
      <form onSubmit={handleSubmit} style={{ background: '#fff', border: '1px solid #eee', padding: 20, borderRadius: 8 }}>
        <label style={{ display: 'block', marginBottom: 12 }}>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ display: 'block', width: '100%', padding: '10px 12px', marginTop: 6, borderRadius: 6, border: '1px solid #e6e6e6', boxSizing: 'border-box' }}
            required
          />
        </label>

        <label style={{ display: 'block', marginBottom: 12 }}>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ display: 'block', width: '100%', padding: '10px 12px', marginTop: 6, borderRadius: 6, border: '1px solid #e6e6e6', boxSizing: 'border-box' }}
            required
          />
        </label>

        <label style={{ display: 'block', marginBottom: 12 }}>
          Plan
          <select value={plan} onChange={(e) => setPlan(e.target.value)} style={{ display: 'block', width: '100%', padding: '10px 12px', marginTop: 6, borderRadius: 6, border: '1px solid #e6e6e6' }}>
            <option value="free">Free</option>
            <option value="starter">Starter</option>
            <option value="pro">Pro</option>
            <option value="enterprise">Enterprise</option>
          </select>
        </label>

        {msg && <div style={{ color: 'crimson', marginBottom: 12 }}>{msg}</div>}

        <div style={{ display: 'flex', gap: 12 }}>
          <button type="submit" disabled={loading} style={{ padding: '10px 14px', borderRadius: 8, background: '#0b74ff', color: '#fff', border: 'none', fontWeight: 700 }}>
            {loading ? 'Creating…' : 'Create account'}
          </button>

          <a href="/" style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #e6e6e6', background: '#fff', color: '#333', display: 'inline-flex', alignItems: 'center' }}>
            Cancel
          </a>
        </div>
      </form>
    </main>
  );
}
