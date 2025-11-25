// components/RightPanel.jsx
import CorporateProfile from './CorporateProfile';

export default function RightPanel({ domain, result }) {
  // Use first item from search results for corporate profile
  const company = result.items && result.items.length > 0 ? result.items[0] : null;

  return (
    <aside style={{ width: '360px' }}>
      <CorporateProfile company={company} />
    </aside>
  );
}
