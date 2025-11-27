import React, { useState } from 'react';

// CorporateProfile: cleaned, typed layout with facts wired to the API's normalized company object.
// - data: { name, domain, logo, description, headquarters, ticker, sector, industry, metrics }
// - includes a small Upload/Edit logo preview (client-only) that returns a base64 preview via onLogoChange (optional).
export default function CorporateProfile({ domain, data, onLogoChange }) {
  const companyName = data?.name || (domain ? domain.split('.')[0].replace(/-/g,' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Company');

  // facts mapping: try multiple keys in data.metrics or data fields
  const facts = {
    Date: data?.facts?.Date || data?.founded || data?.metrics?.founded || '',
    Ticker: data?.ticker || data?.facts?.Ticker || '',
    'Share Price': data?.facts?.['Share Price'] || data?.price || '',
    'Market Cap': data?.facts?.['Market Cap'] || data?.metrics?.marketCap || '',
    'Annual Revenue': data?.facts?.['Annual Revenue'] || data?.metrics?.annualRevenue || '',
    Sector: data?.sector || data?.facts?.Sector || '',
    Industry: data?.industry || data?.facts?.Industry || '',
    CEO: data?.ceo || data?.facts?.CEO || '',
    Headquarters: data?.headquarters || data?.facts?.Headquarters || data?.city || ''
  };

  const description = data?.description || data?.narrative || data?.about || '';

  // local state for previewing an uploaded logo (client-only preview)
  const [logoPreview, setLogoPreview] = useState(null);

  function handleLogoFile(e) {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setLogoPreview(ev.target.result);
      if (typeof onLogoChange === 'function') onLogoChange(ev.target.result, f);
    };
    reader.readAsDataURL(f);
  }

  return (
    <div style={{ background:'#fff', border:'1px solid #e6edf3', borderRadius:8, padding:16, fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto' }}>
      <div style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
        <div style={{ width:104, height:104, borderRadius:12, background:'#fff', border:'1px solid #eef2f7', overflow:'hidden', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
          { logoPreview ? (
            <img src={logoPreview} alt={`${companyName} logo preview`} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
          ) : ( data?.logo ? (
            <img src={data.logo} alt={`${companyName} logo`} loading="lazy" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/placeholder-company.svg'; }} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
          ) : (
            <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', background:'#f3f4f6', fontWeight:900, fontSize:36, color:'#0b1220' }}>
              C
            </div>
          ) ) }
        </div>

        <div style={{ flex:1 }}>
          <div style={{ fontWeight:800, fontSize:18, lineHeight:1.15 }}>{companyName}</div>
          <div style={{ color:'#6b7280', marginTop:6, fontSize:13 }}>{data?.subTitle || data?.domain || domain || ''}</div>

          <div style={{ marginTop:10, color:'#374151', fontSize:13 }}>
            {data?.contacts ? `${data.contacts.length} contacts found` : 'No contacts available'}
          </div>

          {/* Upload / edit logo (client preview) */}
          <div style={{ marginTop:10 }}>
            <label style={{ display:'inline-flex', gap:8, alignItems:'center', cursor:'pointer', fontSize:13, color:'#2563eb' }}>
              <input type="file" accept="image/*" style={{ display:'none' }} onChange={handleLogoFile} />
              Edit / Upload logo
            </label>
          </div>
        </div>
      </div>

      {/* facts as two columns */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginTop:14, fontSize:13 }}>
        <div>
          <div style={{ fontWeight:700 }}>Date:</div>
          <div style={{ color:'#6b7280', marginBottom:8 }}>{facts.Date}</div>

          <div style={{ fontWeight:700 }}>Ticker:</div>
          <div style={{ color:'#6b7280', marginBottom:8 }}>{facts.Ticker}</div>

          <div style={{ fontWeight:700 }}>Share Price:</div>
          <div style={{ color:'#6b7280', marginBottom:8 }}>{facts['Share Price']}</div>

          <div style={{ fontWeight:700 }}>Market Cap:</div>
          <div style={{ color:'#6b7280', marginBottom:8 }}>{facts['Market Cap']}</div>
        </div>

        <div>
          <div style={{ fontWeight:700 }}>Annual Revenue:</div>
          <div style={{ color:'#6b7280', marginBottom:8 }}>{facts['Annual Revenue']}</div>

          <div style={{ fontWeight:700 }}>Sector:</div>
          <div style={{ color:'#6b7280', marginBottom:8 }}>{facts.Sector}</div>

          <div style={{ fontWeight:700 }}>Industry:</div>
          <div style={{ color:'#6b7280', marginBottom:8 }}>{facts.Industry}</div>

          <div style={{ fontWeight:700 }}>CEO:</div>
          <div style={{ color:'#6b7280', marginBottom:8 }}>{facts.CEO}</div>

          <div style={{ fontWeight:700 }}>Headquarters:</div>
          <div style={{ color:'#6b7280', marginBottom:8 }}>{facts.Headquarters}</div>
        </div>
      </div>

      {/* description */}
      {description ? (
        <div style={{ marginTop:12, borderTop:'1px solid #f1f5f9', paddingTop:12, color:'#374151', fontSize:13, lineHeight:1.45 }}>
          {description}
        </div>
      ) : null}
    </div>
  );
}
