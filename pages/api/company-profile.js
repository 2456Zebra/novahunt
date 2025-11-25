export default function handler(req, res) {
  const { domain } = req.query;

  if (!domain) return res.status(400).json({ error: 'Domain required' });

  // Mock data; replace with real API fetch if desired
  const mockProfiles = {
    'coca-cola.com': {
      name: 'Coca-Cola Company',
      description: 'Multinational beverage corporation.',
      website: 'https://www.coca-cola.com',
      industry: 'Beverages',
      location: 'Atlanta, GA, USA'
    },
    'example.com': {
      name: 'Example Inc.',
      description: 'Fictional company for demo purposes.',
      website: 'https://www.example.com',
      industry: 'Tech',
      location: 'San Francisco, CA, USA'
    }
  };

  res.status(200).json(mockProfiles[domain] || null);
}
