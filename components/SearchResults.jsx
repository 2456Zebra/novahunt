import RightPanel from './RightPanel';
import ResultItem from './ResultItem';

export default function SearchResults({ results, selectedCompany }) {
  return (
    <div style={{ display: 'flex', gap: '16px' }}>
      <div style={{ flex: 1 }}>
        {results.map((result) => (
          <ResultItem key={result.email} result={result} />
        ))}
      </div>
      <RightPanel company={selectedCompany} />
    </div>
  );
}
