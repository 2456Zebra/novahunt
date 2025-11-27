import React from 'react';

// CorporateProfile: cleaned up logo, single company title, clear bullets (real facts),
// and a nicely formatted description. Falls back gracefully when `data` is missing.
export default function CorporateProfile({ domain, data }) {
  const companyName = data
    ? data.name
    : domain
      ? domain.split('.')[0].replace(/-/g,' ').replace(/\b\w/g, c => c.toUpperCase())
      : 'Company';

  // Prefer a long narrative/description if provided under common keys
  const description = data && (data.narrative || data.description || data.about) 
    ? (data.narrative || data.description || data.about)
    : `Meet ${companyName}: a scrappy team solving problems in surprisingly delightful ways.`;

  // Map of facts to show (orderable, uses available keys from data.facts)
  const facts = data && data.facts ? data.facts : {
    Date: '2010',
    Ticker: '',
    'Share Price': '',
    'Market Cap': '',
    'Annual Revenue': '',
    Sector: '',
    Industry: '',
    CEO: '',
    Headquarters: domain || '—'
  };

  // Helper to read multiple possible field names and return first present
  function factValue(keys) {
    for (const k of keys) {
      if (facts[k] !== undefined && facts[k] !== '') return facts[k];
    }
    return '';
  }

  return (
    <div style={{ background:'#fff', border:'1px solid #e6edf3', borderRadius:8, padding:16 }}>
      {/* Logo + title block */}
      <div style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
        <div style={{ width:100, height:100, borderRadius:10, background:'#fff', border:'1px solid #eef2f7', overflow:'hidden', flexShrink:0 }}>
          {data && data.logo
            ? <img src={data.logo} alt={companyName + ' logo'} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
            : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', background:'#f3f4f6', fontWeight:900, fontSize:28 }}>C</div>
          }
        </div>

        <div style={{ flex:1 }}>
          <div style={{ fontWeight:800, fontSize:18, lineHeight:1.1 }}>{companyName}</div>
          <div style={{ color:'#6b7280', marginTop:6, fontSize:13 }}>{data && data.subTitle ? data.subTitle : 'Company profile' }</div>

          {/* summary line */}
          <div style={{ marginTop:10, color:'#374151', fontSize:13 }}>
            {data && data.contacts ? `${data.contacts.length} contacts found` : 'No contact data available'}
          </div>
        </div>
      </div>

      {/* Bulleted facts (two-column list on larger widths) */}
      <div style={{ display:'grid', gridTemplateColumns: '1fr 1fr', gap:12, marginTop:14, fontSize:13 }}>
        <div>
          <div style={{ fontWeight:700 }}>Date:</div>
          <div style={{ color:'#6b7280', marginBottom:8 }}>{factValue(['Date'])}</div>

          <div style={{ fontWeight:700 }}>Ticker:</div>
          <div style={{ color:'#6b7280', marginBottom:8 }}>{factValue(['Ticker','Symbol'])}</div>

          <div style={{ fontWeight:700 }}>Share Price:</div>
          <div style={{ color:'#6b7280', marginBottom:8 }}>{factValue(['Share Price','Price'])}</div>

          <div style={{ fontWeight:700 }}>Market Cap:</div>
          <div style={{ color:'#6b7280', marginBottom:8 }}>{factValue(['Market Cap','Mkt Cap'])}</div>
        </div>

        <div>
          <div style={{ fontWeight:700 }}>Annual Revenue:</div>
          <div style={{ color:'#6b7280', marginBottom:8 }}>{factValue(['Annual Revenue','Revenue'])}</div>

          <div style={{ fontWeight:700 }}>Sector:</div>
          <div style={{ color:'#6b7280', marginBottom:8 }}>{factValue(['Sector'])}</div>

          <div style={{ fontWeight:700 }}>Industry:</div>
          <div style={{ color:'#6b7280', marginBottom:8 }}>{factValue(['Industry'])}</div>

          <div style={{ fontWeight:700 }}>CEO:</div>
          <div style={{ color:'#6b7280', marginBottom:8 }}>{factValue(['CEO','Chief Executive'])}</div>

          <div style={{ fontWeight:700 }}>Headquarters:</div>
          <div style={{ color:'#6b7280', marginBottom:8 }}>{factValue(['Headquarters','HQ'])}</div>
        </div>
      </div>

      {/* Description / narrative */}
      <div style={{ marginTop:12, borderTop:'1px solid #f1f5f9', paddingTop:12, color:'#374151', fontSize:13, lineHeight:1.45 }}>
        {description}
      </div>
    </div>
  );
}
