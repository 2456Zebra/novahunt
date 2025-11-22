import React from 'react';

const SearchResults = ({ results }) => {
    return (
        <div className="search-results-container" style={{ display: 'flex' }}>
            {/* Left: Search Results */}
            <div className="results" style={{ flex: 1, paddingRight: '10px' }}>
                {results.map((result, index) => (
                    <div key={index} className="result-item" style={{ display: 'flex', alignItems: 'center' }}>
                        <span>{result.name}</span>
                        <button className="reveal-button" style={{ marginLeft: '10px', padding: '5px' }}>
                            Reveal
                        </button>
                    </div>
                ))}
            </div>
            
            {/* Right: Company Profile */}
            <div className="company-profile" style={{ flex: 1, paddingLeft: '10px', borderLeft: '1px solid #ccc' }}>
                <h2>Company Profile</h2>
                {/* Logo */}
                <img src="path/to/logo.png" alt="Company Logo" style={{ maxWidth: '100%', height: 'auto' }} />
                <div className="company-history">
                    <h3>Company History</h3>
                    <p>{/* Add company history details here */}</p>
                </div>
                <div className="additional-details">
                    <h3>Additional Details</h3>
                    <p>{/* Other informative details here */}</p>
                </div>
            </div>
        </div>
    );
};

export default SearchResults;
