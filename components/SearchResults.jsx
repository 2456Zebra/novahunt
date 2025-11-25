export default function SearchResults({ results, onSelect }) {
  if (!results || results.length === 0) return <p>No results found</p>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {results.map((company, index) => (
        <div
          key={index}
          style={{
            padding: '12px',
            border: '1px solid #E5E7EB',
            borderRadius: '8px',
            cursor: 'pointer',
          }}
          onClick={() => onSelect(company)}
        >
          <p style={{ fontWeight: 'bold' }}>{company.name}</p>
          <p style={{ color: '#6B7280' }}>{company.domain}</p>
        </div>
      ))}
    </div>
  );
}
