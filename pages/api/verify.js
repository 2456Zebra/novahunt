// pages/api/verify.js
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { email } = req.body || {};
  if (!email || !email.includes("@")) return res.status(400).json({ error: "Valid email required" });

  try {
    // 1. Syntax check
    const local = email.split("@")[0];
    const domain = email.split("@")[1];
    if (!domain || local.length < 1 || local.length > 64) throw new Error("Invalid format");

    // 2. MX check
    const mxRes = await fetch(`https://dns.google/resolve?name=${domain}&type=MX`);
    const mxData = await mxRes.json();
    if (!mxData.Answer) throw new Error("No mail server");

    // 3. SMTP simulation (catch-all detection)
    const smtpRes = await fetch("https://api.eva.guru/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });
    const smtp = await smtpRes.json();

    const valid = smtp.deliverable && !smtp.catch_all;
    const score = valid ? 98 : smtp.catch_all ? 60 : 35;

    return res.json({
      email,
      valid,
      score,
      details: {
        mx: !!mxData.Answer,
        catch_all: smtp.catch_all,
        disposable: smtp.disposable,
        role: ["info", "sales", "support"].includes(local)
      }
    });
  } catch (err) {
    return res.status(500).json({ error: "Verification failed" });
  }
}
