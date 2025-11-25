// components/SearchResults.jsx
import ResultItem from './ResultItem';

export default function SearchResults({ results = [], selectedCompany }) {
  return (
    <div style={{ display: 'grid', gap: '12px' }}>
      {results.items?.map((item, idx) => (
        <ResultItem
          key={item.email || idx}
          item={item}
          selected={selectedCompany?.domain === item.domain}
        />
      ))}
    </div>
  );
}
