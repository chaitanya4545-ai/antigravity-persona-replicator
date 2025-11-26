import React, { useState, useEffect } from 'react';
import { useDebounce } from '../hooks/useDebounce';

export default function SearchBar({ onSearch, onClear, resultsCount, loading }) {
    const [query, setQuery] = useState('');
    const debouncedQuery = useDebounce(query, 300);

    useEffect(() => {
        if (debouncedQuery) {
            onSearch(debouncedQuery);
        } else if (query === '') {
            onClear();
        }
    }, [debouncedQuery, query, onSearch, onClear]);

    const handleClear = () => {
        setQuery('');
        onClear();
    };

    return (
        <div className="mb-4">
            <div className="relative">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search messages... (Ctrl+K)"
                    data-search-input
                    className="w-full px-4 py-2 pl-10 pr-10 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white"
                />
                <span className="absolute left-3 top-2.5 text-slate-400">🔍</span>
                {query && (
                    <button
                        onClick={handleClear}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    >
                        ✕
                    </button>
                )}
            </div>
            {loading && (
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Searching...</p>
            )}
            {!loading && resultsCount !== null && resultsCount >= 0 && query && (
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                    {resultsCount} result{resultsCount !== 1 ? 's' : ''} found
                </p>
            )}
        </div>
    );
}
