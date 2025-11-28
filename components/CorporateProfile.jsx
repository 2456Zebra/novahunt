import React, { useState } from 'react';

function getFact(data, keys) {
  if (!data) return '';
  for (const k of keys) {
    if (data[k] !== undefined && data[k] !== null && ('' + data[k]).trim() !== '') return data[k];
    if (data.metrics && data.metrics[k]) return data.metrics[k];
    if (data.facts && data.facts[k]) return data.facts[k];
  }
  return '';
}

function makeConversational(companyName, description, industry) {
  if (!description || description.trim().length < 30) {
    if (industry) return `${companyName} is a ${industry.toLowerCase()} company focused on serving customers with high-quality products and services.`;
    return `${companyName} is a company focused on delivering great work and building lasting relationships with customers.`;
  }
  const trimmed = description.trim();
  if (trimmed.endsWith('.')) return trimmed;
  return trimmed + '.';
}

export default function CorporateProfile({ domain, data }) {
  const companyName = data?.name || (domain ? domain.split('.')[0].replace(/-/g,' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Company');

  const renderedFacts = [
    { label: 'Ticker', value: getFact(data, ['Ticker','ticker']) },
    { label: 'Sector', value: getFact(data, ['Sector','sector']) },
    { label: 'Industry', value: getFact(data, ['Industry','industry']) },
    { label: 'Headquarters', value: getFact(data, ['Headquarters','HQ','headquarters','location']) },
  ].filter(Boolean).filter(f => f.value);

  // logo preference: explicit logo -> clearbit fallback -> enrichment image
  const logoSrc = data?.logo || (domain ? `https://logo.clearbit.com/${domain}?size=280` : null) || (data?.enrichment && data.enrichment.image) || null;

  // description: prefer explicit description, then enrichment, then small fallback
  const rawDescription = data?.description || (data?.enrichment && data.enrichment.description) || '';
  const description = makeConversational(companyName, rawDescription, data?.industry || getFact(data, ['Industry','industry']));

  // Extended profile: only when enrichment source is 'wikipedia' or 'kg' (not raw OG/meta)
  const extended = (data && data.enrichment && (data.enrichment.source === 'wikipedia' || data.enrichment.source === 'kg')) ? data.enrichment : null;

  return (
    <>
      <div style={{ background:'#fff', border:'1px solid #e6edf3', borderRadius:8, padding:16, fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto' }}>
        <div style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
          <div style={{ width:100, height:100, borderRadius:8, background:'#fff', border:'1px solid #eef2f7', overflow:'hidden', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
            { logoSrc ? (
                <img src={logoSrc} alt={`${companyName} logo`} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
              ) : (
                <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', background:'#f3f4f6', fontWeight:800, fontSize:28, color:'#0b1220' }}>C</div>
              )
            }
          </div>

          <div style={{ flex:1 }}>
            <div style={{ fontWeight:800, fontSize:18, lineHeight:1.1 }}>{companyName}</div>
            { (data?.name && data.name.toLowerCase() !== (domain || '').toLowerCase()) ? <div style={{ color:'#6b7280', marginTop:6, fontSize:13 }}>{data?.domain || domain || ''}</div> : null}
          </div>
        </div>

        { renderedFacts.length ? (
          <div style={{ display:'grid', gridTemplateColumns: '1fr 1fr', gap:12, marginTop:14, fontSize:13 }}>
            <div>
              {renderedFacts.slice(0, Math.ceil(renderedFacts.length/2)).map(f => (
                <div key={f.label} style={{ marginBottom:8 }}>
                  <div style={{ fontWeight:700 }}>{f.label}:</div>
                  <div style={{ color:'#6b7280' }}>{f.value}</div>
                </div>
              ))}
            </div>
            <div>
              {renderedFacts.slice(Math.ceil(renderedFacts.length/2)).map(f => (
                <div key={f.label} style={{ marginBottom:8 }}>
                  <div style={{ fontWeight:700 }}>{f.label}:</div>
                  <div style={{ color:'#6b7280' }}>{f.value}</div>
                </div>
              ))}
            </div>
          </div>
        ) : null }

        { description ? (
          <div style={{ marginTop:12, borderTop:'1px solid #f1f5f9', paddingTop:12, color:'#374151', fontSize:13, lineHeight:1.5 }}>
            {description}
          </div>
        ) : null}
      </div>

      {/* Only show extended profile for Wikipedia / KG sources (avoid raw OG promotional text) */}
      { extended && extended.description && extended.source && (extended.source === 'wikipedia' || extended.source === 'kg') && extended.description.length > 120 ? (
        <div style={{ marginTop:12, background:'#fff', border:'1px solid #e6edf3', borderRadius:8, padding:14, fontSize:13, color:'#374151' }}>
          <div style={{ fontWeight:700, marginBottom:8 }}>Company profile</div>
          <div style={{ lineHeight:1.5 }}>{extended.description}</div>
          { extended.url ? (
            <div style={{ marginTop:8 }}>
              <a href={extended.url} target="_blank" rel="noreferrer" style={{ color:'#2563eb', textDecoration:'underline' }}>Read more</a>
            </div>
          ) : null }
        </div>
      ) : null}
    </>
  );
}
