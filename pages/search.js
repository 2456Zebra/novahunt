const generateCompanyInfo = (domain) => {
  // Decorative, colorful mock profile
  const name = domain.split('.')[0].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  return {
    name: name,
    description: `${name} is a leading company in its industry, known for excellence and innovation.`,
    logo: `https://via.placeholder.com/320x120.png?text=${encodeURIComponent(name)}`,
    founded: '2000',
    industry: 'Technology',
    website: `https://${domain}`,
  };
};
