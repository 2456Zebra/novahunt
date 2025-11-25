import CorporateProfile from './CorporateProfile';

export default function RightPanel({ company }) {
  return (
    <aside style={{ width: '300px', padding: '16px', borderLeft: '1px solid #ddd' }}>
      <h2>Company Profile</h2>
      <CorporateProfile company={company} />
    </aside>
  );
}
