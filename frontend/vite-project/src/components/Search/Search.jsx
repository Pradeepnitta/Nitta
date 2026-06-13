import { useEffect, useRef, useState } from 'react';
import './Search.css';

// Mock searchable list to simulate dynamic search
const SEARCH_ITEMS = [
    { id: 'dash', title: 'User Dashboard', type: 'page', path: '/dashboard', category: 'Pages' },
    { id: 'admin-dash', title: 'Admin Dashboard', type: 'page', path: '/admin/dashboard', category: 'Pages' },
    { id: 'profile', title: 'Profile Settings', type: 'action', action: 'profile', category: 'Actions' },
    { id: 'logout', title: 'Log Out Session', type: 'action', action: 'logout', category: 'Actions' },
    { id: 'users-list', title: 'Manage Users', type: 'page', path: '/admin/dashboard', category: 'Pages' },
    { id: 'sec', title: 'Security Settings', type: 'action', action: 'security', category: 'Actions' },
    { id: 'support', title: 'Help & Support', type: 'action', action: 'support', category: 'Actions' }
];

function Search({ isOpen, onClose, onNavigate, onAction }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef(null);
    const modalRef = useRef(null);

    // Filter results on query change
    useEffect(() => {
        if (!query.trim()) {
            // Show recent items by default
            setResults(SEARCH_ITEMS.slice(0, 4));
            setSelectedIndex(0);
            return;
        }

        const filtered = SEARCH_ITEMS.filter(item =>
            item.title.toLowerCase().includes(query.toLowerCase()) ||
            item.category.toLowerCase().includes(query.toLowerCase())
        );
        setResults(filtered);
        setSelectedIndex(0);
    }, [query]);

    // Handle focus and window scroll lock
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            setTimeout(() => inputRef.current?.focus(), 50);
        } else {
            document.body.style.overflow = '';
            setQuery('');
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    // Handle outside clicks to close
    useEffect(() => {
        const handleOutsideClick = (e) => {
            if (modalRef.current && !modalRef.current.contains(e.target)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleOutsideClick);
        }
        return () => {
            document.removeEventListener('mousedown', handleOutsideClick);
        };
    }, [isOpen, onClose]);

    // Handle Keyboard Navigation within search results
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!isOpen) return;

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => (results.length > 0 ? (prev + 1) % results.length : 0));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => (results.length > 0 ? (prev - 1 + results.length) % results.length : 0));
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (results[selectedIndex]) {
                    handleSelect(results[selectedIndex]);
                }
            } else if (e.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, results, selectedIndex]);

    const handleSelect = (item) => {
        if (item.type === 'page' && onNavigate) {
            onNavigate(item.path);
        } else if (item.type === 'action' && onAction) {
            onAction(item.action);
        }
        onClose();
    };

    if (!isOpen) return null;

    // Group results by category
    const groupedResults = results.reduce((acc, item) => {
        if (!acc[item.category]) acc[item.category] = [];
        acc[item.category].push(item);
        return acc;
    }, {});

    // Flat list of items for visual index selection
    let flatIndex = 0;

    return (
        <div className="search-backdrop">
            <div className="search-modal" ref={modalRef}>
                <div className="search-input-wrapper">
                    <svg className="search-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Search pages, settings, actions..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="search-input"
                    />
                    <button className="search-close-btn" onClick={onClose} aria-label="Close search">
                        <kbd>ESC</kbd>
                    </button>
                </div>

                <div className="search-body">
                    {results.length === 0 ? (
                        <div className="search-empty-state">
                            <svg className="empty-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p>No results found for &ldquo;<span>{query}</span>&rdquo;</p>
                            <span>Try searching for &ldquo;dashboard&rdquo; or &ldquo;profile&rdquo;</span>
                        </div>
                    ) : (
                        <div className="search-results-list">
                            {Object.entries(groupedResults).map(([category, items]) => (
                                <div key={category} className="search-category-group">
                                    <div className="search-category-header">{category}</div>
                                    {items.map((item) => {
                                        const currentIndex = flatIndex;
                                        flatIndex++;
                                        const isSelected = currentIndex === selectedIndex;

                                        return (
                                            <div
                                                key={item.id}
                                                className={`search-result-item ${isSelected ? 'selected' : ''}`}
                                                onClick={() => handleSelect(item)}
                                                onMouseEnter={() => setSelectedIndex(currentIndex)}
                                            >
                                                <div className="result-item-icon">
                                                    {item.type === 'page' ? (
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" width="18" height="18">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                        </svg>
                                                    ) : (
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" width="18" height="18">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        </svg>
                                                    )}
                                                </div>
                                                <div className="result-item-content">
                                                    <span className="result-item-title">{item.title}</span>
                                                    {item.path && <span className="result-item-url">{item.path}</span>}
                                                </div>
                                                {isSelected && (
                                                    <span className="result-item-enter-hint">
                                                        <span>Select</span> <kbd>↵</kbd>
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="search-footer">
                    <div className="search-keys-hint">
                        <span><kbd>↑↓</kbd> Navigation</span>
                        <span><kbd>↵</kbd> Select</span>
                        <span><kbd>ESC</kbd> Close</span>
                    </div>
                    <div className="search-brand-hint">
                        Search provided by <span>Nitta UI</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Search;
