// components/RightPanel.jsx
export default function RightPanel({ children }) {
  return (
    <div
      style={{
        border: '1px solid #eee',
        padding: '16px',
        borderRadius: '8px',
        backgroundColor: '#f9f9f9'
      }}
    >
      {children}
    </div>
  );
}
