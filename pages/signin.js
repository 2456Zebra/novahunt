import React from 'react';
import SignInModal from '../components/SignInModal';
import Router from 'next/router';

/*
pages/signin.js
- Simple standalone SignIn page that uses the SignInModal component.
- "Create account" action should take user to /plans (per product decision).
*/

export default function SignInPage() {
  return (
    <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 720 }}>
        <SignInModal open={true} onClose={() => Router.push('/')} />
      </div>
    </div>
  );
}
