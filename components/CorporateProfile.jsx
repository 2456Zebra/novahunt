import React from 'react';

// CorporateProfile updated to avoid duplicate raw copy.
// Shows short sanitized description; shows longer 'About' narrative only if it differs

function getFact(data, keys) {
  if (!data) return '';
  for (const k of keys) {
    if (data[k] !== undefined && data[k] !== null && ('' + data[k]).trim() !== '') return data[k];
    if (data.metrics && data.metrics[k]) return data.metrics[k];
    if (data.facts && data.facts[k]) return data.facts[k];
  }
  return '';
}

function sanitize(text) {
  if (!text) return '';
  // remove repetitive whitespace, trim
  return text.replace(/\s+/g,' ').trim();
}

export default function CorporateProfile({ domain, data }) {
  const companyName = data?.name || (domain ? domain.split('.')[0].replace(/-/g,' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Company');

  const factsToShow = [
    ['Founded', ['inception', 'founded','Date']],
    ['Industry', ['Industry','industry']],
    ['Headquarters', ['Headquarters','HQ','headquarters','location']],
    ['Employees', ['employees','employeeCount']]
  ];

  const renderedFacts = factsToShow.map(([label, keys]) => {
    const val = getFact(data, keys) || (data?.facts && data.facts[label.toLowerCase()]) || '';
    return val ? { label, value: val } : null;
  }).filter(Boolean);

  const logoSrc = data?.logo || (domain ? `https://logo.clearbit.com/${domain}?size=400` : null) || (data?.image || (data?.enrichment && data.enrichment.image)) || null;

  const shortDesc = sanitize(data?.description || (data?.enrichment && data.enrichment.description) || '');
  const narrative = sanitize(data?.narrative || (data?.enrichment && data.enrichment.narrative) || '');

  // avoid duplication: if narrative contains shortDesc verbatim, prefer narrative only once
  const showShort = shortDesc && (!narrative || !narrative.includes(shortDesc));
  const showNarrative = narrative && narrative.length > 120 && (!shortDesc || !shortDesc.includes(narrative));

  return (
    <>
      <div style={{ background:'#fff', border:'1px solid #e6edf3', borderRadius:8, padding:18, fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto' }}>
        <div style={{ display:'flex', gap:14, alignItems:'flex-start' }}>
          <div style={{ width:140, height:140, borderRadius:10, background:'#fff', border:'1px solid #eef2f7', overflow:'hidden', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
            { logoSrc ? <img src={logoSrc} alt={`${companyName} logo`} style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', background:'#f3f4f6', fontWeight:800, fontSize:36, color:'#0b1220' }}>C</div> }
          </div>

          <div style={{ flex:1 }}>
            <div style={{ fontWeight:800, fontSize:20, lineHeight:1.05 }}>{companyName}</div>
            { (data?.domain && data?.domain.toLowerCase() !== (companyName || '').toLowerCase()) ? <div style={{ color:'#6b7280', marginTop:8, fontSize:13 }}>{data?.domain || domain || ''}</div> : null }

            { renderedFacts.length ? (
              <div style={{ display:'grid', gridTemplateColumns: '1fr 1fr', gap:10, marginTop:12, fontSize:13 }}>
                <div>{renderedFacts.slice(0, Math.ceil(renderedFacts.length/2)).map(f => (
                  <div key={f.label} style={{ marginBottom:8 }}>
                    <div style={{ fontWeight:700 }}>{f.label}:</div>
                    <div style={{ color:'#6b7280' }}>{f.value}</div>
                  </div>
                ))}</div>
                <div>{renderedFacts.slice(Math.ceil(renderedFacts.length/2)).map(f => (
                  <div key={f.label} style={{ marginBottom:8 }}>
                    <div style={{ fontWeight:700 }}>{f.label}:</div>
                    <div style={{ color:'#6b7280' }}>{f.value}</div>
                  </div>
                ))}</div>
              </div>
            ) : null }
          </div>
        </div>

        { showShort ? (
          <div style={{ marginTop:14, borderTop:'1px solid #f1f5f9', paddingTop:12, color:'#374151', fontSize:14, lineHeight:1.5 }}>
            {shortDesc}
          </div>
        ) : null }
      </div>

      { showNarrative ? (
        <div style={{ marginTop:12, background:'#fff', border:'1px solid #e6edf3', borderRadius:8, padding:16, fontSize:14, color:'#374151' }}>
          <div style={{ fontWeight:700, marginBottom:8 }}>About {companyName}</div>
          <div style={{ lineHeight:1.6 }}>{narrative}</div>
          { data?.url ? (
            <div style={{ marginTop:10 }}>
              <a href={data.url} target="_blank" rel="noreferrer" style={{ color:'#2563eb', textDecoration:'underline' }}>Visit website</a>
            </div>
          ) : null }
        </div>
      ) : null}
    </>
  );
}
