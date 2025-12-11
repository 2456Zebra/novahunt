import React, { useEffect, useState } from 'react';

// Render children only on the client (after mount) to avoid SSR/client mismatch.
export default function ClientOnly({ children, fallback = null }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted ? <>{children}</> : (fallback || null);
}
