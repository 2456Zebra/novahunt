// Friendly error page that surfaces status code — useful to see server-side errors quickly.
export default function ErrorPage({ statusCode }) {
  return (
    <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ marginTop: 0 }}>NovaHunt — Error</h1>
      <p>Status code: {statusCode ?? 'unknown'}</p>
      <p>Open browser console and Vercel function logs for details.</p>
    </div>
  );
}

ErrorPage.getInitialProps = ({ res, err }) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};
