// pages/blocked.js
export default function Blocked() {
  const currentProd = process.env.NEXT_PUBLIC_CURRENT_PROD_URL;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      fontFamily: 'Inter, sans-serif',
      textAlign: 'center',
      padding: '2rem'
    }}>
      <h1>Access Blocked</h1>
      <p>You are not allowed to view this site.</p>
      <button
        style={{
          marginTop: '1rem',
          padding: '0.5rem 1rem',
          fontSize: '1rem',
          cursor: 'pointer'
        }}
        onClick={() => {
          window.location.href = currentProd; // full redirect
        }}
      >
        Go Home
      </button>
    </div>
  );
}
