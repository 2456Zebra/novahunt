'use client';

import { useEffect, useState } from 'react';
import RevealButton from './RevealButton';

// ... (the rest of this file remains the same as your current SearchClient)
// We'll only show the updated small function that updates local usage on search:

// Inside your handleSearch() success path (after results are set), add:
function updateLocalUsageAfterSearch() {
  try {
    const raw = localStorage.getItem('nh_usage');
    const current = raw ? JSON.parse(raw) : { searchesUsed: 0, searchesTotal: 5, revealsUsed: 0, revealsTotal: 2 };
    const next = { ...current, searchesUsed: Math.min(current.searchesTotal, (current.searchesUsed || 0) + 1) };
    localStorage.setItem('nh_usage', JSON.stringify(next));
    window.dispatchEvent(new CustomEvent('account-usage-updated'));
  } catch (e) {}
}

// Then in handleSearch() after you set results (both demo and API success), call updateLocalUsageAfterSearch()

// If you prefer, I can paste the full SearchClient.jsx file again with the update included inline—just say "Paste full SearchClient with usage update".
