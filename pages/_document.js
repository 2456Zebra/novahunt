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
      </body>
    </Html>
  );
}
