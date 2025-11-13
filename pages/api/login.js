// pages/api/login.js
// Mock login: sets a cookie indicating a user. If `pro` true => sets PRO cookie.
export default function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { email, pro } = req.body || {};
  if (!email || typeof email !== "string") return res.status(400).json({ error: "Email required" });

  // Create a simple session id and mark PRO if requested
  const userId = "user_" + Math.random().toString(36).slice(2, 12);
  const isPro = !!pro;

  // cookie value: userId|pro
  const cookieVal = `${userId}|${isPro ? "pro" : "free"}`;
  // Secure attribute is recommended; in local dev it might require https - if testing on localhost remove Secure
  const cookie = `user=${cookieVal}; Path=/; Max-Age=${60 * 60 * 24 * 30}; HttpOnly; SameSite=Lax; Secure`;

  res.setHeader("Set-Cookie", cookie);
  res.status(200).json({ ok: true, userId, isPro });
}
