export default function UpgradeButton({ priceId, label = 'Upgrade' }) {
  const handleClick = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priceId }),
    });
    const json = await res.json();
    if (json?.url) window.location.href = json.url;
    else alert('Unable to start checkout');
  };

  return (
    <button onClick={handleClick} style={{ background: '#10b981', color: 'white', borderRadius: 8, padding: '6px 12px', border: 'none' }}>
      {label}
    </button>
  );
}
