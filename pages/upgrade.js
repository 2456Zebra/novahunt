// pages/upgrade.js
export default function Upgrade() {
  const handleCheckout = async (plan) => {
    const res = await fetch('/api/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan }),
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fff', padding: '40px 20px', textAlign: 'center' }}>
      <h1 style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '16px' }}>NovaHunt PRO</h1>
      <p style={{ fontSize: '20px', color: '#666', marginBottom: '40px' }}>Unlimited email searches</p>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap' }}>
        <button
          onClick={() => handleCheckout('monthly')}
          style={{ padding: '16px 32px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}
        >
          $10 / month
        </button>
        <button
          onClick={() => handleCheckout('annual')}
          style={{ padding: '16px 32px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}
        >
          $100 / year
        </button>
      </div>
    </div>
  );
}
