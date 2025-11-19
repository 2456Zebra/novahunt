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
                    // If not set or legacy Grok, default to Copilot
                    if (!cur || cur === 'Grok') {
                      localStorage.setItem('nh_model', 'Copilot');
                    }
                  } catch (e) {
                    // ignore localStorage errors in restricted environments
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
