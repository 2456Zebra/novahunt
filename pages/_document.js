import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html>
      <Head />
      <body>
        {/* Pre-hydration script: ensure a model preference exists and migrate any 'Grok' value to 'Copilot' */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (typeof window !== 'undefined' && window.localStorage) {
                  try {
                    const cur = localStorage.getItem('nh_model');
                    // If not set, default to Copilot
                    if (!cur) {
                      localStorage.setItem('nh_model', 'Copilot');
                    } else if (cur === 'Grok') {
                      // Migrate legacy Grok preference to Copilot
                      localStorage.setItem('nh_model', 'Copilot');
                    }
                  } catch (e) {
                    // ignore localStorage permission errors
                  }
                }
              } catch (e) {
                /* ignore any unexpected errors */
              }
            `,
          }}
        />
        <Main />
        <NextScript />

        {/* Post-hydration helper: make any "Sign in to see all" text act as a link to /signin */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const targetTexts = [
                    'Sign in to see all',
                    'Sign in to see all results',
                    'Sign in to see all results.'
                  ];

                  function normalize(s){ return String(s||'').trim(); }

                  function matchesTargetText(nodeText) {
                    if (!nodeText) return false;
                    const text = normalize(nodeText);
                    for (let t of targetTexts) {
                      if (text === t || text.indexOf(t) === 0) return true;
                    }
                    return false;
                  }

                  function makeClickable(el) {
                    if (!el) return;
                    el.style.cursor = 'pointer';
                    el.setAttribute('role', 'link');
                    if (!el.getAttribute('tabindex')) el.setAttribute('tabindex', '0');
                    // prevent multiple handlers
                    if (!el.__nh_signin_hooked) {
                      el.addEventListener('click', function(e) {
                        e.preventDefault();
                        window.location.href = '/signin';
                      });
                      el.addEventListener('keydown', function(e) {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          window.location.href = '/signin';
                        }
                      });
                      el.__nh_signin_hooked = true;
                    }
                  }

                  function scanAndAttach() {
                    try {
                      // Look for elements whose own textContent matches the target text.
                      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
                      let node;
                      while (node = walker.nextNode()) {
                        // avoid attaching to large container nodes; check direct text presence
                        const ownText = Array.from(node.childNodes)
                          .filter(n => n.nodeType === Node.TEXT_NODE)
                          .map(n => n.textContent).join('').trim();
                        if (matchesTargetText(ownText)) {
                          makeClickable(node);
                        }
                      }
                    } catch (e) {
                      // ignore scanning errors
                    }
                  }

                  if (document.readyState === 'loading') {
                    document.addEventListener('DOMContentLoaded', scanAndAttach);
                  } else {
                    scanAndAttach();
                  }

                  // Also observe DOM changes so dynamically-inserted CTAs become clickable
                  try {
                    const obs = new MutationObserver(function() {
                      scanAndAttach();
                    });
                    obs.observe(document.body, { childList: true, subtree: true });
                  } catch (e) {
                    // ignore observer errors
                  }
                } catch (e) {
                  // silent fail-safe
                }
              })();
            `,
          }}
        />
      </body>
    </Html>
  );
}
