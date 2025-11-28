import React from 'react';

// CorporateProfile: uses enrichment narrative (safe, paraphrased) rather than raw OG copy.
// If enrichment.narrative exists we show a longer second card; otherwise show short conversational summary.

function getFact(data, keys) {
  if (!data) return '';
  for (const k of keys) {
    if (data[k] !== undefined && data[k] !== null && ('' + data[k]).trim() !== '') return data[k];
    if (data.metrics && data.metrics[k]) return data.metrics[k];
    if (data.facts && data.facts[k]) return data.facts[k];
  }
  return '';
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

  // logo fallback
  const logoSrc = data?.logo || (domain ? `https://logo.clearbit.com/${domain}?size=280` : null) || (data?.image || (data?.enrichment && data.enrichment.image)) || null;

  // Use narrative (friendly) if present; description is sanitized short excerpt
  const narrative = data?.narrative || (data?.enrichment && data.enrichment.narrative) || '';
  const shortDesc = data?.description || (data?.enrichment && data.enrichment.description) || '';

  return (
    <>
      <div style={{ background:'#fff', border:'1px solid #e6edf3', borderRadius:8, padding:16, fontFamily: 'Inter, system-ui, -apple-system, \"Segoe UI\", Roboto' }}>
        <div style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
          <div style={{ width:100, height:100, borderRadius:8, background:'#fff', border:'1px solid #eef2f7', overflow:'hidden', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
            { logoSrc ? <img src={logoSrc} alt={`${companyName} logo`} style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', background:'#f3f4f6', fontWeight:800, fontSize:28, color:'#0b1220' }}>C</div> }
          </div>

          <div style={{ flex:1 }}>
            <div style={{ fontWeight:800, fontSize:18, lineHeight:1.1 }}>{companyName}</div>
            { (data?.domain && data?.domain.toLowerCase() !== (companyName || '').toLowerCase()) ? <div style={{ color:'#6b7280', marginTop:6, fontSize:13 }}>{data?.domain || domain || ''}</div> : null }
          </div>
        </div>

        { renderedFacts.length ? (
          <div style={{ display:'grid', gridTemplateColumns: '1fr 1fr', gap:12, marginTop:14, fontSize:13 }}>
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

        { shortDesc ? (
          <div style={{ marginTop:12, borderTop:'1px solid #f1f5f9', paddingTop:12, color:'#374151', fontSize:13, lineHeight:1.5 }}>
            {shortDesc}
          </div>
        ) : null }
      </div>

      { narrative && narrative.length > 80 ? (
        <div style={{ marginTop:12, background:'#fff', border:'1px solid #e6edf3', borderRadius:8, padding:14, fontSize:13, color:'#374151' }}>
          <div style={{ fontWeight:700, marginBottom:8 }}>About {companyName}</div>
          <div style={{ lineHeight:1.5 }}>{narrative}</div>
          { data?.url ? (
            <div style={{ marginTop:8 }}>
              <a href={data.url} target="_blank" rel="noreferrer" style={{ color:'#2563eb', textDecoration:'underline' }}>Visit website</a>
            </div>
          ) : null }
        </div>
      ) : null}
    </>
  );
}
