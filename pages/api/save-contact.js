// pages/api/save-contact.js
// Demo endpoint: saves contact for the current user. Implementation is a placeholder - adapt to your real auth + DB.
// Expects POST { contact: { first_name, last_name, email, position, department, ... } }
// Returns { ok: true, saved: true } on success.

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const payload = req.body || {};
    const contact = payload.contact;
    if (!contact || !contact.email) return res.status(400).json({ error: 'Missing contact.email' });

    // TODO: Replace with real auth check and DB save (e.g. POSTgres, Fauna, Firebase, Supabase)
    // For demo: we log the contact and return success.
    console.log('Save contact request (demo):', contact);

    // Return a simulated saved ID
    return res.status(200).json({ ok: true, saved: true, id: `${Date.now()}` });
  } catch (err) {
    console.error('save-contact error', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
