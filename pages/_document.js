import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html>
      <Head />
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (typeof window !== 'undefined' && window.localStorage) {
                  try {
                    var cur = localStorage.getItem('nh_model');
                    // Default to Copilot and migrate legacy Grok
                    if (!cur || cur === 'Grok') {
                      localStorage.setItem('nh_model', 'Copilot');
                    }
                  } catch (e) {
                    // ignore localStorage permission errors
                  }
                }
              } catch (e) {}
            `
          }}
        />
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
