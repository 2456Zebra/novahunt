// components/ResultItem.jsx
export default function ResultItem({ item, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        border: '1px solid #ddd',
        padding: '12px',
        marginBottom: '12px',
        cursor: 'pointer'
      }}
    >
      <h3>{item.name}</h3>
      <p>{item.email}</p>
    </div>
  );
}
