import { useState } from 'react';
import Router from 'next/router';

export default function AccountMenu({ user }) {
  const [open, setOpen] = useState(false);

  async function handleSignOut() {
    try {
      if (window.supabase?.auth?.signOut) {
        await window.supabase.auth.signOut();
      }
    } catch (err) {
      console.warn('Sign out error', err);
    } finally {
      Router.push('/signin');
    }
  }

  return (
    <div className={`account-wrapper ${open ? 'open' : 'closed'}`}>
      <button className="account-toggle" onClick={() => setOpen(v => !v)} aria-expanded={open}>
        Account
      </button>

      <div className={`account-menu ${open ? 'visible' : 'hidden'}`} role="menu">
        <a role="menuitem" href="/account">Account</a>
        <a role="menuitem" href="/billing">Billing</a>
        <button role="menuitem" onClick={handleSignOut}>Sign out</button>
      </div>
    </div>
  );
}
