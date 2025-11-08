<div style={{ 
  maxWidth: '600px', 
  margin: '40px auto', 
  padding: '0 20px',
  textAlign: 'center'
}}>
  <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
    <input
      type="text"
      placeholder="Enter domain e.g. vercel.com"
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      style={{ 
        flex: '1 1 300px', 
        padding: '12px', 
        fontSize: '16px', 
        border: '1px solid #ccc', 
        borderRadius: '8px' 
      }}
    />
    <button 
      onClick={handleSearch} 
      disabled={loading}
      style={{ 
        padding: '12px 24px', 
        backgroundColor: loading ? '#aaa' : '#2563eb', 
        color: 'white', 
        border: 'none', 
        borderRadius: '8px', 
        fontWeight: 'bold',
        minWidth: '120px'
      }}
    >
      {loading ? 'Searching...' : 'Search'}
    </button>
  </div>
</div>
