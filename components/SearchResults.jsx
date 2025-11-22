import React from "react";

const SearchResults = ({ results, company }) => {
    return (
        <div className="flex w-full gap-6">
            
            {/* LEFT SIDE — Search Results */}
            <div className="flex-1 space-y-3">
                {results.map((result, index) => (
                    <div 
                        key={index} 
                        className="flex items-center justify-between p-3 border rounded-lg bg-white shadow-sm"
                    >
                        {/* Contact Name + Title */}
                        <div>
                            <div className="font-semibold text-gray-900">{result.name}</div>
                            {result.title && (
                                <div className="text-sm text-gray-600">{result.title}</div>
                            )}
                        </div>

                        {/* SMALL REVEAL BUTTON — moved left, compact */}
                        <button 
                            className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            onClick={() => result.onReveal && result.onReveal(result)}
                        >
                            Reveal
                        </button>
                    </div>
                ))}
            </div>


            {/* RIGHT SIDE — Company Profile */}
            <div className="w-80 p-4 border-l bg-white rounded-lg shadow-sm">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Company Profile</h2>

                {/* Logo */}
                {company?.logo && (
                    <img 
                        src={company.logo} 
                        alt="Company Logo" 
                        className="w-full h-auto mb-4 rounded"
                    />
                )}

                {/* Company Name */}
                {company?.name && (
                    <div className="text-lg font-semibold mb-2">{company.name}</div>
                )}

                {/* Description / History */}
                {company?.description && (
                    <p className="text-sm text-gray-700 mb-4">
                        {company.description}
                    </p>
                )}

                {/* Additional Info */}
                {company?.details && (
                    <div className="text-sm text-gray-600 space-y-2">
                        {company.details}
                    </div>
                )}
            </div>

        </div>
    );
};

export default SearchResults;
