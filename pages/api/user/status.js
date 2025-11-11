// pages/api/user/status.js
export default function handler(req, res) {
  const cookie = req.headers.cookie || '';
  const match = cookie.match(/userId=([^;]+)/);
  const customerId = match ? match[1] : null;

  const isPro = global.proUsers?.has(customerId) || false;
  const user = isPro ? global.proUsers.get(customerId) : null;

  res.status(200).json({ isPro, user });
}
