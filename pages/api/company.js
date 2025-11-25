// pages/api/company.js
/**
 * Lightweight API route that fetches company info from a domain.
 * - Accepts ?domain=example.com and optional &regenerate=1
 * - Attempts to fetch the domain's homepage and extract meta description
 * - Builds a company object: { name, website, logo, description, summary, industry? }
 * - Generates a conversational summary with multiple templates
 * - Returns JSON { company }
 */

// Configuration
const FETCH_TIMEOUT_MS = 5000;
const MAX_HTML_LENGTH = 100000; // Limit HTML to prevent memory issues

const summaryTemplates = [
  (name, desc) => `${name} is an organization known for ${desc || 'providing professional services'}.`,
  (name, desc) => `Here's what we know about ${name}: ${desc || 'A company focused on delivering value to its customers'}.`,
  (name, desc) => `${name} appears to be ${desc || 'a business operating in its industry'}.`,
  (name, desc) => `Looking at ${name}, they seem to focus on ${desc || 'serving their market effectively'}.`,
  (name, desc) => `${name} is positioned as ${desc || 'a provider in their field'}.`,
];

function generateSummary(name, description, regenerate) {
  // Pick template based on regenerate flag to vary phrasing
  const index = regenerate ? Math.floor(Math.random() * summaryTemplates.length) : 0;
  const shortDesc = description ? description.substring(0, 100).toLowerCase() : null;
  return summaryTemplates[index](name, shortDesc);
}

function extractDomainName(domain) {
  // Extract a human-readable name from domain
  // e.g., "coca-cola.com" -> "Coca Cola"
  const baseDomain = domain.replace(/^www\./, '').split('.')[0];
  return baseDomain
    .split(/[-_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Extract meta description from HTML using safer parsing.
 * Uses indexOf-based extraction to avoid ReDoS vulnerabilities.
 */
function extractMetaContent(html, attrName, attrValue) {
  // Find meta tags with the specified attribute
  const searchPattern = `${attrName}="${attrValue}"`;
  const searchPatternAlt = `${attrName}='${attrValue}'`;
  
  let index = html.toLowerCase().indexOf(searchPattern.toLowerCase());
  if (index === -1) {
    index = html.toLowerCase().indexOf(searchPatternAlt.toLowerCase());
  }
  if (index === -1) return null;

  // Find the containing meta tag
  const tagStart = html.lastIndexOf('<meta', index);
  if (tagStart === -1) return null;
  
  const tagEnd = html.indexOf('>', index);
  if (tagEnd === -1) return null;
  
  const metaTag = html.slice(tagStart, tagEnd + 1);
  
  // Extract content attribute value
  const contentMatch = metaTag.match(/content=["']([^"']{0,500})["']/i);
  return contentMatch ? contentMatch[1] : null;
}

async function fetchMetaDescription(domain) {
  try {
    const url = `https://${domain}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NovaHunt/1.0)',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return null;
    }

    let html = await response.text();
    
    // Limit HTML size to prevent memory issues
    if (html.length > MAX_HTML_LENGTH) {
      html = html.slice(0, MAX_HTML_LENGTH);
    }

    // Try meta description
    let description = extractMetaContent(html, 'name', 'description');
    if (description) return description;

    // Try og:description
    description = extractMetaContent(html, 'property', 'og:description');
    if (description) return description;

    // Try to get title as fallback (simple extraction)
    const titleStart = html.toLowerCase().indexOf('<title');
    if (titleStart !== -1) {
      const titleContentStart = html.indexOf('>', titleStart) + 1;
      const titleEnd = html.toLowerCase().indexOf('</title>', titleContentStart);
      if (titleEnd !== -1) {
        const title = html.slice(titleContentStart, titleEnd).trim();
        if (title.length > 0 && title.length < 200) {
          return title;
        }
      }
    }

    return null;
  } catch (error) {
    console.error('Error fetching meta description:', error.message);
    return null;
  }
}

function guessIndustry(description, domain) {
  if (!description) return null;
  
  const desc = description.toLowerCase();
  
  // Simple keyword matching for industry
  if (desc.includes('beverage') || desc.includes('drink') || desc.includes('food')) return 'Food & Beverage';
  if (desc.includes('software') || desc.includes('tech') || desc.includes('digital')) return 'Technology';
  if (desc.includes('finance') || desc.includes('bank') || desc.includes('invest')) return 'Finance';
  if (desc.includes('health') || desc.includes('medical') || desc.includes('pharma')) return 'Healthcare';
  if (desc.includes('retail') || desc.includes('shop') || desc.includes('store')) return 'Retail';
  if (desc.includes('media') || desc.includes('news') || desc.includes('entertainment')) return 'Media & Entertainment';
  if (desc.includes('education') || desc.includes('learn') || desc.includes('school')) return 'Education';
  if (desc.includes('manufacture') || desc.includes('industrial')) return 'Manufacturing';
  
  return null;
}

export default async function handler(req, res) {
  const { domain, regenerate } = req.query;

  if (!domain) {
    return res.status(400).json({ error: 'Domain is required' });
  }

  // Sanitize domain
  const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '').toLowerCase();

  if (!cleanDomain || cleanDomain.length < 3) {
    return res.status(400).json({ error: 'Invalid domain' });
  }

  try {
    // Attempt to fetch meta description from the domain's homepage
    const description = await fetchMetaDescription(cleanDomain);
    
    const name = extractDomainName(cleanDomain);
    const website = `https://${cleanDomain}`;
    const logo = `https://logo.clearbit.com/${cleanDomain}`;
    const industry = guessIndustry(description, cleanDomain);
    const summary = generateSummary(name, description, regenerate === '1');

    const company = {
      name,
      website,
      logo,
      description: description || 'No description available for this company.',
      summary,
      industry,
    };

    return res.status(200).json({ company });
  } catch (error) {
    console.error('Company API error:', error);
    
    // Return a basic fallback response
    const name = extractDomainName(cleanDomain);
    return res.status(200).json({
      company: {
        name,
        website: `https://${cleanDomain}`,
        logo: `https://logo.clearbit.com/${cleanDomain}`,
        description: 'Unable to fetch company information at this time.',
        summary: `${name} is a company we're still learning about.`,
        industry: null,
      },
    });
  }
}
