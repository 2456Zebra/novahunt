export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  // Simulate user creation (in-memory)
  const user = {
    id: Date.now().toString(),
    email,
    subscription: 'free'
  };

  // Set cookie
  res.setHeader('Set-Cookie', `userId=${user.id}; Path=/; Max-Age=31536000; HttpOnly; SameSite=Lax`);

  res.status(201).json({ user, message: 'Signed up! Free plan active.' });
}
