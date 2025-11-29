import { useEffect, useState } from 'react';

// Simple hook: true only after client mount
export default function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  return mounted;
}
