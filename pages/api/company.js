/**
 * /api/company — Returns company profile data with photos extracted from og:image and site images.
 * Safe: short timeouts, conservative regex, no external API keys.
 */

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).end('Method Not Allowed');
  }

  try {
    const { domain, regenerate } = req.method === 'POST' ? req.body || {} : req.query || {};
    if (!domain) {
      return res.status(400).json({ error: 'domain is required' });
    }

    // Normalize domain
    const normalizedDomain = normalizeDomain(domain);
    if (!normalizedDomain) {
      return res.status(400).json({ error: 'Invalid domain' });
    }

    // Fetch homepage HTML with short timeout
    const homepageUrl = `https://${normalizedDomain}`;
    let html = '';
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const response = await fetch(homepageUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; NovaHunt/1.0)',
          'Accept': 'text/html',
        },
      });
      clearTimeout(timeoutId);
      if (response.ok) {
        html = await response.text();
      }
    } catch (fetchError) {
      // Silently fail - we'll just have less data
      console.warn('Failed to fetch homepage:', fetchError.message);
    }

    // Extract metadata from HTML
    const metaDescription = extractMetaDescription(html);
    const ogImage = extractOgImage(html);
    const siteTitle = extractTitle(html);
    const siteImages = extractSiteImages(html, normalizedDomain);

    // Build photos array: og:image first, then site images, then clearbit fallback
    const clearbitLogo = `https://logo.clearbit.com/${normalizedDomain}`;
    const photos = buildPhotosArray(ogImage, siteImages, clearbitLogo);

    // Generate playful/informal summaries
    const summaries = generateSummaries(normalizedDomain, metaDescription, siteTitle, !!regenerate);

    // Build company object
    const company = {
      domain: normalizedDomain,
      name: formatCompanyName(normalizedDomain, siteTitle),
      logo: clearbitLogo,
      description: metaDescription || null,
      title: siteTitle || null,
      photos: photos,
      summary: summaries.summary,
      history: summaries.history,
      summaryVariant: summaries.variant,
    };

    return res.status(200).json({ company });
  } catch (error) {
    console.error('company API error:', error.message || error);
    return res.status(500).json({ error: 'Failed to fetch company data' });
  }
}

/**
 * Normalize domain to a clean hostname
 */
function normalizeDomain(domain) {
  if (!domain) return null;
  try {
    let cleanDomain = domain.trim().toLowerCase();
    if (!cleanDomain.includes('://')) {
      cleanDomain = 'https://' + cleanDomain;
    }
    const url = new URL(cleanDomain);
    return url.hostname.replace(/^www\./, '');
  } catch {
    // Try simple cleanup
    const simple = domain.trim().toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
    return simple && simple.includes('.') ? simple : null;
  }
}

/**
 * Extract meta description from HTML
 */
function extractMetaDescription(html) {
  if (!html) return null;
  // Try meta description
  const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']{1,500})["']/i)
    || html.match(/<meta[^>]+content=["']([^"']{1,500})["'][^>]+name=["']description["']/i);
  if (descMatch && descMatch[1]) {
    return cleanHtmlText(descMatch[1]);
  }
  // Try og:description
  const ogDescMatch = html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']{1,500})["']/i)
    || html.match(/<meta[^>]+content=["']([^"']{1,500})["'][^>]+property=["']og:description["']/i);
  if (ogDescMatch && ogDescMatch[1]) {
    return cleanHtmlText(ogDescMatch[1]);
  }
  return null;
}

/**
 * Extract og:image from HTML
 */
function extractOgImage(html) {
  if (!html) return null;
  // Try property="og:image"
  const ogMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
  if (ogMatch && ogMatch[1]) {
    return ogMatch[1].trim();
  }
  // Try name="og:image"
  const nameMatch = html.match(/<meta[^>]+name=["']og:image["'][^>]+content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']og:image["']/i);
  if (nameMatch && nameMatch[1]) {
    return nameMatch[1].trim();
  }
  return null;
}

/**
 * Extract title from HTML
 */
function extractTitle(html) {
  if (!html) return null;
  const titleMatch = html.match(/<title[^>]*>([^<]{1,200})<\/title>/i);
  if (titleMatch && titleMatch[1]) {
    return cleanHtmlText(titleMatch[1]);
  }
  // Try og:title
  const ogTitleMatch = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']{1,200})["']/i)
    || html.match(/<meta[^>]+content=["']([^"']{1,200})["'][^>]+property=["']og:title["']/i);
  if (ogTitleMatch && ogTitleMatch[1]) {
    return cleanHtmlText(ogTitleMatch[1]);
  }
  return null;
}

/**
 * Extract site images from HTML
 */
function extractSiteImages(html, domain) {
  if (!html) return [];
  const images = [];
  // Match img tags with src starting with https:// or //
  const imgRegex = /<img[^>]+src=["']((?:https?:)?\/\/[^"']+)["']/gi;
  let match;
  while ((match = imgRegex.exec(html)) !== null && images.length < 10) {
    const src = match[1];
    if (isValidImageUrl(src, domain)) {
      images.push(normalizeImageUrl(src));
    }
  }
  return images;
}

/**
 * Check if image URL is valid and relevant
 */
function isValidImageUrl(src, domain) {
  if (!src) return false;
  const normalized = src.toLowerCase();
  // Skip tracking pixels, icons, and tiny images
  if (normalized.includes('pixel') || normalized.includes('tracking') ||
      normalized.includes('.gif') || normalized.includes('favicon') ||
      normalized.includes('icon') || normalized.includes('1x1') ||
      normalized.includes('spacer')) {
    return false;
  }
  // Check if it's from the same domain or a CDN
  try {
    const urlToParse = src.startsWith('//') ? 'https:' + src : src;
    const imgUrl = new URL(urlToParse);
    const imgHost = imgUrl.hostname.toLowerCase();
    // Allow same domain or common CDNs
    if (imgHost.includes(domain) || domain.includes(imgHost.split('.')[0]) ||
        imgHost.includes('cdn') || imgHost.includes('cloudfront') ||
        imgHost.includes('imgix') || imgHost.includes('cloudinary') ||
        imgHost.includes('akamai') || imgHost.includes('fastly')) {
      return true;
    }
  } catch {
    return false;
  }
  return false;
}

/**
 * Normalize image URL to absolute
 */
function normalizeImageUrl(src) {
  if (src.startsWith('//')) {
    return 'https:' + src;
  }
  return src;
}

/**
 * Build photos array with deduplication
 */
function buildPhotosArray(ogImage, siteImages, clearbitLogo) {
  const seen = new Set();
  const photos = [];
  
  // Add og:image first
  if (ogImage && !seen.has(ogImage)) {
    seen.add(ogImage);
    photos.push(ogImage);
  }
  
  // Add site images
  for (const img of siteImages) {
    if (!seen.has(img) && photos.length < 5) {
      seen.add(img);
      photos.push(img);
    }
  }
  
  // If no photos found, use clearbit logo as fallback
  if (photos.length === 0 && clearbitLogo) {
    photos.push(clearbitLogo);
  }
  
  return photos;
}

/**
 * Clean HTML text (decode entities, trim)
 */
function cleanHtmlText(text) {
  if (!text) return null;
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim();
}

/**
 * Format company name from domain or title
 */
function formatCompanyName(domain, title) {
  if (title) {
    // Clean up title - remove common suffixes
    const cleaned = title
      .replace(/\s*[-|–—]\s*.+$/, '')  // Remove everything after dash/pipe
      .replace(/\s*\|.+$/, '')
      .trim();
    if (cleaned.length > 2 && cleaned.length < 60) {
      return cleaned;
    }
  }
  // Format domain as name
  const parts = domain.split('.');
  if (parts.length >= 2) {
    const name = parts[0];
    return name.charAt(0).toUpperCase() + name.slice(1);
  }
  return domain;
}

/**
 * Generate playful/informal summaries with multiple templates
 */
function generateSummaries(domain, description, title, regenerate) {
  const companyName = formatCompanyName(domain, title);
  
  // Playful summary templates - rotate based on regenerate flag
  const summaryTemplates = [
    () => description 
      ? `So here's the scoop on ${companyName}! 🎯 ${description} Pretty cool, right?`
      : `Welcome to the world of ${companyName}! ✨ We're still digging up the details, but this looks like an interesting company worth exploring.`,
    () => description
      ? `Let me tell you about ${companyName}! 🚀 ${description} They seem to know what they're doing!`
      : `Hey there! ${companyName} is on our radar. 📡 We're gathering intel, but they definitely caught our attention!`,
    () => description
      ? `Alright, check this out! ${companyName} is all about: ${description} 💡 Sounds exciting!`
      : `Ooh, ${companyName}! 🔍 Still uncovering what makes them tick, but stay tuned for more!`,
    () => description
      ? `Here's what we found about ${companyName}! 🌟 ${description} Not bad at all!`
      : `${companyName} has piqued our curiosity! 🧐 More details coming soon as we learn more about them.`,
    () => description
      ? `Ready for the lowdown on ${companyName}? 📋 ${description} They're making moves!`
      : `${companyName} is definitely one to watch! 👀 We'll keep you posted on what we discover.`,
  ];

  // History templates - playful backstory
  const historyTemplates = [
    () => `While we can't peek into their time machine, ${companyName} has been building their story at ${domain}. Every great company starts somewhere! 🏗️`,
    () => `${companyName}'s journey continues at ${domain}! We love seeing companies grow and evolve. Keep being awesome! 🌱`,
    () => `The ${companyName} adventure is happening right now at ${domain}. Who knows what exciting things are coming next? 🎢`,
    () => `From their home base at ${domain}, ${companyName} is writing their own story. We're here for it! 📖`,
    () => `${companyName} is out there doing their thing at ${domain}. The future looks bright! ☀️`,
  ];

  // Select variant based on regenerate flag (use random if regenerating, otherwise consistent)
  const variant = regenerate 
    ? Math.floor(Math.random() * summaryTemplates.length)
    : hashCode(domain) % summaryTemplates.length;
  
  return {
    summary: summaryTemplates[variant](),
    history: historyTemplates[variant](),
    variant: variant,
  };
}

/**
 * Simple hash function for consistent variant selection
 */
function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}
