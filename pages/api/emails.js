// pages/api/emails.js
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { domain } = req.body;
  if (!domain || typeof domain !== 'string') {
    return res.status(400).json({ error: 'Valid domain required' });
  }

  // Simulate search delay
  await new Promise(resolve => setTimeout(resolve, 2500));

  // Fake results
  const fakeResults = [
    {
      email: 'c***@fordmodels.com',
      first_name: 'Caden',
      last_name: 'P',
      position: 'Talent Agent',
      score: 98
    },
    {
      email: 'c***@fordmodels.com',
      first_name: 'Cathy',
      last_name: 'Q',
      position: 'Booking Manager',
      score: 95
    },
    {
      email: 's***@fordmodels.com',
      first_name: 'Subramanian',
      last_name: 'R',
      position: 'Creative Director',
      score: 88
    },
    {
      email: 'j***@fordmodels.com',
      first_name: 'Jane',
      last_name: 'D',
      position: 'Photographer',
      score: 85
    },
    {
      email: 'm***@fordmodels.com',
      first_name: 'Mike',
      last_name: 'S',
      position: 'Scout',
      score: 82
    }
  ];

  res.json({
    results: fakeResults,
    total: 5
  });
}
