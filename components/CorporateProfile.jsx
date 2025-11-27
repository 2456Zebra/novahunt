import React from 'react';

// CorporateProfile: big decorative C (or logo), company name derived from domain (from props.data), bullets + narrative.
export default function CorporateProfile({ domain, data }) {
  const companyName = data ? data.name : (domain ? domain.split('.')[0].replace(/-/g,' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Company');
  const facts = data ? data.facts : { Date: '2010', Headquarters: 'New York, NY', Employees: '~120', Industry: 'Technology', Website: domain || '—' };
  const summary = data ? `${(data.contacts || []).length} contacts found` : 'Meet Company: a scrappy team solving problems in surprisingly delightful ways.';

  return (
    <div style={{ background:'#fff', border:'1px solid #e6edf3', borderRadius:8, padding:16 }}>
      <div style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
        <div style={{ width:86, height:86, borderRadius:10, background:'#f3f4f6', display:'flex', alignItems:'center', justifyContent:'center', fontSize:40, fontWeight:900 }}>
          {data && data.logo ? <img src={data.logo} alt={companyName} style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:10 }} /> : 'C'}
        </div>

        <div style={{ flex:1 }}>
          <div style={{ fontWeight:700, fontSize:18 }}>{companyName}</div>
          <div style={{ color:'#6b7280', marginTop:8 }}>{summary}</div>

          <dl style={{ marginTop:12, fontSize:13, color:'#111827' }}>
            <dt style={{ fontWeight:700, marginTop:8 }}>Date:</dt>
            <dd style={{ margin:0, color:'#6b7280' }}>{facts.Date}</dd>

            <dt style={{ fontWeight:700, marginTop:8 }}>Headquarters:</dt>
            <dd style={{ margin:0, color:'#6b7280' }}>{facts.Headquarters || facts.HQ || facts.HQ}</dd>

            <dt style={{ fontWeight:700, marginTop:8 }}>Industry:</dt>
            <dd style={{ margin:0, color:'#6b7280' }}>{facts.Industry}</dd>

            <dt style={{ fontWeight:700, marginTop:8 }}>Website:</dt>
            <dd style={{ margin:0, color:'#6b7280' }}>{facts.Website || domain || '—'}</dd>
          </dl>
        </div>
      </div>
    </div>
  );
}
