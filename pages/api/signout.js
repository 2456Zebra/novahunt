// pages/api/signout.js
export default async function handler(req, res) {
  const cookie = `nh_session=; Path=/; HttpOnly; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
  res.setHeader('Set-Cookie', cookie);
  return res.status(200).json({ ok: true });
}
