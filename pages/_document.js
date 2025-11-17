import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html>
      <Head />
      <body>
        {/* Pre-hydration script: ensure a model preference exists and default to "Copilot" */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (typeof window !== 'undefined' && window.localStorage && !localStorage.getItem('nh_model')) {
                  localStorage.setItem('nh_model', 'Copilot');
                }
              } catch (e) {
                /* ignore localStorage errors in restricted environments */
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
