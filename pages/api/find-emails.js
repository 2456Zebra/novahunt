// pages/api/find-emails.js
// (existing file content — keep everything as-is until the response-return portion)
// Add this helper near the top (after normalizeHunterItemsFromEmails):

function maskEmailAddr(email) {
  if (!email || typeof email !== 'string') return '';
  const [local, domain] = email.split('@');
  if (!local || !domain) return '***';
  if (local.length <= 2) return `* @${domain}`;
  // reveal first char and last char of local, mask middle
  const first = local[0];
  const last = local[local.length - 1];
  return `${first}${'*'.repeat(Math.max(3, local.length - 2))}${last}@${domain}`;
}

... (keep your callHunterDomainSearch and other code unchanged) ...

// In the main handler, after computing `result` (items + total)
// replace the final return blocks where you return items with the following logic:

// before returning result to client, enforce masking for unauthenticated users:
function maskResultForPublic(resultObj, session) {
  if (!resultObj || !Array.isArray(resultObj.items)) return resultObj;
  if (!session) {
    // user not signed in — mask emails and add reveal hints
    const maskedItems = resultObj.items.map(it => {
      const masked = Object.assign({}, it);
      masked.maskedEmail = maskEmailAddr(it.email || '');
      // remove actual email to avoid accidental exposure
      delete masked.email;
      // optional: remove source if you want to hide source URL for public
      // delete masked.source;
      return masked;
    });
    return {
      items: maskedItems,
      total: resultObj.total,
      public: true,
      canReveal: false,
      revealUrl: '/plans?source=search'
    };
  } else {
    // signed in — include full result
    return {
      items: resultObj.items,
      total: resultObj.total,
      public: false,
      canReveal: true
    };
  }
}

// Replace every `return res.status(200).json({ ok: true, items: result.items, total: result.total })`
// and the session-aware returns with the masked variant. Example:

// Previously:
// return res.status(200).json({ ok: true, items: result.items, total: result.total });

// New:
const publicResult = maskResultForPublic(result, session);
return res.status(200).json(Object.assign({ ok: true }, publicResult));

// And similarly for cached paths earlier — ensure cached responses are masked the same way:
// When returning cached earlier, wrap with maskResultForPublic(cached, session) instead of returning cached directly.
