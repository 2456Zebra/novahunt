// Lightweight company info endpoint with image scraping.
// - Extracts meta description / og:description
// - Extracts og:image and other absolute images from the homepage
// - Returns company.photos (preferred og:image first), company.logo (clearbit fallback), summary (playful templates)
// - regenerate=1 produces varied templates

import { URL } from 'url';

function unique(array) {
  return Array.from(new Set(array || []));
}

function pick(arr, seed = 0) {
  if (!arr || arr.length === 0) return null;
  return arr[Math.abs(seed) % arr.length];
}

function inferIndustry(text = '') {
  const t = (text || '').toLowerCase();
  if (t.includes('ai') || t.includes('machine learning')) return 'AI / ML';
  if (t.includes('saas') || t.includes('software') || t.includes('platform')) return 'Software';
  if (t.includes('bank') || t.includes('finance')) return 'Finance';
  if (t.includes('health')) return 'Healthcare';
  return null;
}

function generatePlayfulSummary(name, description, industry, seed = 0) {
  const templates = [
    (n, d, i) => `${n} — where curiosity meets hustle. ${d ? d : 'They build delightful things.'} ${i ? `Mostly in ${i}.` : ''}`,
    (n, d, i) => `Imagine ${n}: small team, big dreams, and a knack for solving tricky problems. ${d ? d : ''}`,
    (n, d, i) => `${n} likes to keep things fun and practical. ${d ? d : d.substring(0, 140) + (d.length > 140 ? '...' : '')}`,
    (n, d, i) => `Say hello to ${n}. They enjoy making users smile — and making good software while they’re at it.`,
  ];
  const t = pick(templates, seed) || templates[0];
  return t(name, description, industry);
}

// Use global fetch with AbortController for timeout
async function fetchText(url, timeout = 4000) {
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    const res = await fetch(url, { redirect: 'follow', signal: controller.signal });
    clearTimeout(id);
    if (!res.ok) return null;
    return await res.text();
  } catch (err) {
    return null;
  }
}

function extractMetaDescription(html) {
  if (!html) return null;
  const metaMatch =
    html.match(/<meta[^>]+name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/i) ||
    html.match(/<meta[^>]+property=["']og:description["'][^>]*content=["']([^"']+)["'][^>]*>/i) ||
    html.match(/<meta[^>]+name=["']twitter:description["'][^>]*content=["']([^"']+)["'][^>]*>/i);
  if (metaMatch && metaMatch[1]) return metaMatch[1].trim();
  // fallback: first reasonably long paragraph
  const paraMatch = html.match(/<p[^>]*>([^<]{60,400})<\/p>/i);
  if (paraMatch && paraMatch[1]) return paraMatch[1].replace(/<[^>]+>/g, '').trim();
  return null;
}

function extractOgImage(html) {
  if (!html) return null;
  const og = html.match(/<meta[^>]+property=["']og:image["'][^>]*content=["']([^"']+)["'][^>]*>/i) ||
             html.match(/<meta[^>]+name=["']og:image["'][^>]*content=["']([^"']+)["'][^>]*>/i) ||
             html.match(/<meta[^>]+name=["']twitter:image["'][^>]*content=["']([^"']+)["'][^>]*>/i);
  if (og && og[1]) return og[1].trim();
  return null;
}

function extractImages(html, baseDomain) {
  if (!html) return [];
  const imgs = [];
  const re = /<img[^>]+src=["']([^"']+)["'][^>]*>/ig;
  let m;
  while ((m = re.exec(html)) !== null) {
    try {
      let src = m[1].trim();
      if (!src) continue;
      // normalize protocol-relative URLs
      if (src.startsWith('//')) src = 'https:' + src;
      // Only keep absolute URLs
      if (src.startsWith('http')) {
        try {
          const u = new URL(src);
          // prefer images that reference the same domain OR are clearly absolute assets
          if (u.hostname === baseDomain || u.hostname.endsWith('.' + baseDomain) || /cdn|assets|images|img|photo/.test(u.pathname)) {
            imgs.push(src);
          }
        } catch (e) {
          // ignore malformed
        }
      }
    } catch (e) {
      // ignore per-image errors
    }
  }
  return imgs;
}

export default async function handler(req, res) {
  const { domain, regenerate } = req.query;
  if (!domain) {
    return res.status(400).json({ error: 'domain required' });
  }

  // normalize domain
  const normalized = domain.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  const siteUrl = `https://${normalized}`;

  // fetch homepage text
  const html = await fetchText(siteUrl, 4000);

  const description = extractMetaDescription(html);
  const ogImage = extractOgImage(html);
  const images = extractImages(html, normalized);
  const deduped = unique([ogImage, ...images].filter(Boolean));
  // prefer up to 3 photos; if none, fallback to logo clearbit
  const photos = deduped.slice(0, 3);
  if (photos.length === 0) {
    photos.push(`https://logo.clearbit.com/${normalized}`);
  }

  const company = {
    name: normalized.replace(/^www\./, ''),
    website: siteUrl,
    logo: `https://logo.clearbit.com/${normalized}`,
    description: description || null,
    photos,
  };

  const industry = inferIndustry(description || '');
  const seed = regenerate ? Date.now() % 1000 : 0;
  company.summary = generatePlayfulSummary(company.name, company.description, industry, seed);
  if (industry) company.industry = industry;

  return res.status(200).json({ company });
}
