/**
 * Clears the auth cookie and redirects to the homepage (or signin).
 * Paste as pages/api/logout.js
 */
export default function handler(req, res) {
  // Clear cookie
  const secure = process.env.NODE_ENV === 'production';
  const cookieParts = [
    'auth=deleted',
    'HttpOnly',
    'Path=/',
    'Expires=Thu, 01 Jan 1970 00:00:00 GMT',
    'SameSite=Lax',
  ];
  if (secure) cookieParts.push('Secure');

  res.setHeader('Set-Cookie', cookieParts.join('; '));
  // Redirect back to homepage (client will receive 302)
  res.writeHead(302, { Location: '/' });
  res.end();
}
