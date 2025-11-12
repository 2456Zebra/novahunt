// pages/api/emails.js
const DEMO_DATA = {
  'coca-cola.com': [
    { email: 'james.quincey@coca-cola.com', first_name: 'James', last_name: 'Quincey', position: 'CEO', score: 95 },
    { email: 'john.murphy@coca-cola.com', first_name: 'John', last_name: 'Murphy', position: 'President & CFO', score: 94 },
    { email: 'brian.smith@coca-cola.com', first_name: 'Brian', last_name: 'Smith', position: 'COO', score: 93 },
    { email: 'monica.howard@ctoca-cola.com', first_name: 'Monica', last_name: 'Howard', position: 'VP Marketing', score: 92 },
    { email: 'bea.perez@coca-cola.com', first_name: 'Bea', last_name: 'Perez', position: 'Chief Communications', score: 91 },
    { email: 'henrique.braun@coca-cola.com', first_name: 'Henrique', last_name: 'Braun', position: 'VP Operations', score: 90 },
    { email: 'jennifer.mann@coca-cola.com', first_name: 'Jennifer', last_name: 'Mann', position: 'VP Strategy', score: 90 },
    { email: 'info@coca-cola.com', first_name: '', last_name: '', position: 'General', score: 80 },
    { email: 'press@coca-cola.com', first_name: '', last_name: '', position: 'Press', score: 80 },
    { email: 'contact@coca-cola.com', first_name: '', last_name: '', position: 'General', score: 80 },
    { email: 'sales@coca-cola.com', first_name: '', last_name: '', position: 'General', score: 80 },
    { email: 'support@coca-cola.com', first_name: '', last_name: '', position: 'General', score: 80 },
  ]
};

export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { domain } = req.body;
  if (!domain) return res.status(400).json({ error: 'Domain required' });

  const key = domain.toLowerCase();
  const results = DEMO_DATA[key] || [
    { email: `info@${domain}`, first_name: '', last_name: '', position: 'General', score: 80 },
    { email: `contact@${domain}`, first_name: '', last_name: '', position: 'General', score: 80 },
    { email: `press@${domain}`, first_name: '', last_name: '', position: 'General', score: 80 },
    { email: `sales@${domain}`, first_name: '', last_name: '', position: 'General', score: 80 },
    { email: `support@${domain}`, first_name: '', last_name: '', position: 'General', score: 80 },
  ];

  const total = 407;

  res.json({ results, total });
}
