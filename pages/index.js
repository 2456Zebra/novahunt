{results.map((r, i) => (
  <tr key={i} style={{ borderBottom: "1px solid #f3f4f6" }}>
    <td style={{ padding: 12, fontFamily: "monospace" }}>{r.email}</td>
    <td style={{ padding: 12 }}>{r.first_name} {r.last_name}</td>
    <td style={{ padding: 12 }}>{r.position}</td>
    <td style={{ padding: 12 }}><ConfidencePill score={r.score} /></td>
    <td style={{ padding: 12, color: "#6b7280" }}>{r.source || "pattern"}</td>
    <td style={{ padding: 12 }}>
      <button
        onClick={async () => {
          const v = await fetch("/api/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: r.email })
          }).then(r => r.json());
          alert(`${r.email}: ${v.valid ? "VALID" : "INVALID"} (Score: ${v.score}%)`);
        }}
        style={{
          padding: "6px 10px",
          background: "#10b981",
          color: "white",
          borderRadius: 6,
          fontSize: 12
        }}
      >
        Verify
      </button>
    </td>
  </tr>
))}
