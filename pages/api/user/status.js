// pages/api/user/status.js
// Reads cookie "user" and returns { isPro, user }
export default function handler(req, res) {
  const cookie = req.headers.cookie || "";
  const match = cookie.match(/user=([^;]+)/);
  if (!match) {
    return res.status(200).json({ isPro: false, user: null });
  }
  try {
    const val = decodeURIComponent(match[1]);
    const [userId, flag] = val.split("|");
    const isPro = flag === "pro";
    return res.status(200).json({ isPro, user: isPro ? { id: userId, email: "pro@novahunt.ai", subscription: "pro" } : { id: userId } });
  } catch (e) {
    return res.status(200).json({ isPro: false, user: null });
  }
}
