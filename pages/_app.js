import { useEffect, useState } from 'react';

export default function App({ Component, pageProps }) {
  const [isPro, setIsPro] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check subscription on load
    fetch('/api/user/subscription')
      .then(res => res.json())
      .then(data => {
        setIsPro(data.isPro);
        // If no user, redirect to sign in
        if (!data.user) window.location = '/signin';
      });
  }, []);

  return (
    <Component {...pageProps} isPro={isPro} user={user} />
  );
}
