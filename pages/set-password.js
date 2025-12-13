import { useState } from 'react';
import { useRouter } from 'next/router';

export default function SetPassword() {
  const router = useRouter();
  const { email: qemail, session_id: qsession } = router.query || {};
  const email = Array.isArray(qemail) ? qemail[0] : qemail || '';
  const sessionId = Array.isArray(qsession) ? qsession[0] : qsession || '';

  const [pw, setPw] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (pw.length < 8) return setMsg('Password too short');
    setMsg('');
    setLoading(true);

    try {
      // Create user server-side (Supabase admin) and optionally verify Stripe session
      const res = await fetch('/api/auth/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pw, session_id: sessionId }),
      });

      if (!res.ok) {
        const txt = await res.text();
        setMsg('Verification failed: ' + txt);
        setLoading(false);
        return;
      }

      // Client-side sign-in to populate client session used by your account header.
      // Requires NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in preview envs.
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        // If public keys not provided, redirect to /account anyway
        router.push('/account');
        return;
      }

      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

      const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
      if (error) {
        setMsg('Sign-in failed: ' + error.message);
        setLoading(false);
        return;
      }

      // Signed in — navigate to /account
      router.push('/account');
    } catch (err) {
      setMsg('Network error');
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: '100px auto', textAlign: 'center' }}>
      <h1>Set Password</h1>
      <p>Continue with <strong>{email}</strong></p>
      <form onSubmit={submit}>
        <input
          type="password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          required
          minLength={8}
          placeholder="Choose password"
          style={{ width: '100%', padding: 14, margin: '10px 0' }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{ width: '100%', padding: 14, background: '#0066ff', color: 'white', border: 'none' }}
        >
          {loading ? 'Working…' : 'Continue → Account'}
        </button>
      </form>
      {msg && <p style={{ color: 'red', marginTop: 20 }}>{msg}</p>}
    </div>
  );
}
