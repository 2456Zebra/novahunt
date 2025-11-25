// components/SearchResults.jsx
import RightPanel from './RightPanel';
import ResultItem from './ResultItem';

export default function SearchResults({ results = [], selectedCompany }) {
  return (
    <div style={{ display: 'flex', gap: '16px' }}>
      <div style={{ flex: 2 }}>
        {results.map((result, index) => (
          <ResultItem
            key={result.email || index} // fallback key
            item={result}               // pass as `item` prop
          />
        ))}
      </div>
      <div style={{ flex: 1 }}>
        <RightPanel company={selectedCompany} />
      </div>
    </div>
  );
}
