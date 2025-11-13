// pages/api/verify.js
// Lightweight email verification: checks MX records for the domain part.
// Returns { valid: boolean, score: number }
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { email } = req.body || {};
  if (!email || typeof email !== "string") return res.status(400).json({ error: "Email required" });

  const parts = email.split("@");
  if (parts.length !== 2) return res.status(400).json({ error: "Invalid email" });
  const domain = parts[1].toLowerCase();

  try {
    const r = await fetch(`https://dns.google/resolve?name=${domain}&type=MX`);
    if (!r.ok) return res.status(200).json({ valid: false, score: 35 });
    const j = await r.json();
    const ok = !!j.Answer;
    return res.status(200).json({ valid: ok, score: ok ? 90 : 40 });
  } catch (err) {
    return res.status(200).json({ valid: false, score: 40 });
  }
}
