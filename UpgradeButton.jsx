export default function UpgradeButton({ priceId, label }) {
  const handleClick = async () => {
    const res = await fetch('/api/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priceId }),
    });
    const { url } = await res.json();
    window.location = url;
  };

  return (
    <button
      onClick={handleClick}
      style={{
        background: "#10b981",
        color: "white",
        padding: "0.5rem 1rem",
        borderRadius: "8px",
        marginTop: "0.5rem",
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}