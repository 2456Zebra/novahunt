import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

// Replace the account-created success UI with this clearer component.
export default function CreateAccountSuccess({ email }) {
  const router = useRouter();

  const continueToDashboard = (e) => {
    e.preventDefault();
    router.push('/dashboard');
  };

  return (
    <div className="create-account-success">
      <h2>Account created and signed in</h2>
      <p className="muted">{email}</p>

      <div className="actions">
        <button onClick={continueToDashboard} className="btn btn-primary">Continue to dashboard</button>
        <Link href="/" className="btn btn-outline">Back to home</Link>
      </div>
    </div>
  );
}
