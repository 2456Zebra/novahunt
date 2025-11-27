import React from 'react';

// CorporateProfile: cleaned and resilient.
// - Removes upload/edit UI and the "X contacts found" line (per request).
// - Shows only populated facts; uses sensible fallbacks.
// - Shows large logo if present; otherwise a subtle placeholder.
// - Shows description if present; otherwise omits that section.

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

  // Facts: prefer Clearbit-style mapping, then fallback to any facts present
  const factsToShow = [
    ['Date', ['Date','founded','Founded']],
    ['Ticker', ['Ticker','ticker','Symbol']],
    ['Share Price', ['Share Price','price','Price']],
    ['Market Cap', ['Market Cap','marketCap','Mkt Cap']],
    ['Annual Revenue', ['Annual Revenue','annualRevenue','Revenue']],
    ['Sector', ['Sector','sector']],
    ['Industry', ['Industry','industry']],
    ['CEO', ['CEO','ceo','chiefExecutive']],
    ['Headquarters', ['Headquarters','HQ','headquarters','location']]
  ];

  // Build the rendered facts list, only include entries with values
  const renderedFacts = factsToShow.map(([label, keys]) => {
    const val = getFact(data, keys);
    return val ? { label, value: val } : null;
  }).filter(Boolean);

  // Fallback bullets when no company-level facts exist (helpful for private companies)
  const fallbackBullets = [
    { label: 'Founded', value: getFact(data, ['founded','Date']) || '—' },
    { label: 'Location', value: getFact(data, ['Headquarters','HQ','headquarters']) || '—' },
    { label: 'Employees', value: getFact(data, ['employees','employeeCount']) || '—' },
    { label: 'Industry', value: getFact(data, ['Industry','industry']) || (data?.category?.industry || '') || '—' },
    { label: 'Website', value: data?.domain || domain || '—' }
  ];

  const description = data?.description || data?.narrative || data?.about || '';

  return (
    <div style={{ background:'#fff', border:'1px solid #e6edf3', borderRadius:8, padding:16, fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto' }}>
      <div style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
        <div style={{ width:100, height:100, borderRadius:8, background:'#fff', border:'1px solid #eef2f7', overflow:'hidden', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
          { data?.logo
            ? <img src={data.logo} alt={`${companyName} logo`} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
            : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', background:'#f3f4f6', fontWeight:800, fontSize:28, color:'#0b1220' }}>C</div>
          }
        </div>

        <div style={{ flex:1 }}>
          <div style={{ fontWeight:800, fontSize:18, lineHeight:1.1 }}>{companyName}</div>
          <div style={{ color:'#6b7280', marginTop:6, fontSize:13 }}>{data?.subTitle || data?.domain || domain || ''}</div>
        </div>
      </div>

      {/* facts: if we have any rendered facts show them, else show fallback bullets */}
      <div style={{ display:'grid', gridTemplateColumns: renderedFacts.length ? '1fr 1fr' : '1fr', gap:12, marginTop:14, fontSize:13 }}>
        { renderedFacts.length ? (
          <>
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
          </>
        ) : (
          <div>
            {fallbackBullets.map(f => (
              <div key={f.label} style={{ marginBottom:8 }}>
                <div style={{ fontWeight:700 }}>{f.label}:</div>
                <div style={{ color:'#6b7280' }}>{f.value}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* description (only if there is content) */}
      {description ? (
        <div style={{ marginTop:12, borderTop:'1px solid #f1f5f9', paddingTop:12, color:'#374151', fontSize:13, lineHeight:1.45 }}>
          {description}
        </div>
      ) : null}
    </div>
  );
}
