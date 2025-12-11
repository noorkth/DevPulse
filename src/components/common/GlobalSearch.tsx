import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './GlobalSearch.css';

interface SearchResult {
    type: 'product' | 'client' | 'project' | 'issue' | 'developer';
    id: string;
    title: string;
    subtitle?: string;
    metadata?: any;
    score: number;
}

interface GlobalSearchProps {
    isOpen: boolean;
    onClose: () => void;
}

const GlobalSearch: React.FC<GlobalSearchProps> = ({ isOpen, onClose }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();

    // Debounced search
    useEffect(() => {
        if (!query.trim()) {
            setResults([]);
            return;
        }

        setLoading(true);
        const timer = setTimeout(async () => {
            try {
                const searchResults = await window.api.search.global(query);
                setResults(searchResults);
                setSelectedIndex(0);
            } catch (error) {
                console.error('Search error:', error);
                setResults([]);
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    // Focus input when opened
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    // Handle keyboard navigation
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            onClose();
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => Math.max(prev - 1, 0));
        } else if (e.key === 'Enter' && results[selectedIndex]) {
            e.preventDefault();
            handleResultClick(results[selectedIndex]);
        }
    }, [results, selectedIndex, onClose]);

    // Navigate to result
    const handleResultClick = (result: SearchResult) => {
        onClose();
        setQuery('');

        // Navigate based on type
        switch (result.type) {
            case 'product':
                navigate('/products');
                break;
            case 'client':
                navigate('/clients');
                break;
            case 'project':
                navigate('/projects');
                break;
            case 'issue':
                navigate('/issues');
                break;
            case 'developer':
                navigate('/users');
                break;
        }
    };

    // Get icon for result type
    const getTypeIcon = (type: string) => {
        const icons: Record<string, string> = {
            product: '📦',
            client: '👤',
            project: '🗂️',
            issue: '🐛',
            developer: '👨‍💻',
        };
        return icons[type] || '📄';
    };

    // Get badge color for result type
    const getTypeBadgeColor = (type: string) => {
        const colors: Record<string, string> = {
            product: '#8b5cf6',
            client: '#3b82f6',
            project: '#10b981',
            issue: '#f59e0b',
            developer: '#ec4899',
        };
        return colors[type] || '#6b7280';
    };

    // Highlight matching text
    const highlightMatch = (text: string, query: string) => {
        if (!query.trim()) return text;

        const parts = text.split(new RegExp(`(${query})`, 'gi'));
        return parts.map((part, i) =>
            part.toLowerCase() === query.toLowerCase() ? (
                <mark key={i}>{part}</mark>
            ) : (
                <span key={i}>{part}</span>
            )
        );
    };

    if (!isOpen) return null;

    return (
        <div className="global-search-overlay" onClick={onClose}>
            <div className="global-search-modal" onClick={(e) => e.stopPropagation()}>
                <div className="search-input-container">
                    <span className="search-icon">🔍</span>
                    <input
                        ref={inputRef}
                        type="text"
                        className="search-input"
                        placeholder="Search products, clients, projects, issues, developers..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                    {loading && <span className="search-loading">⏳</span>}
                </div>

                <div className="search-results">
                    {query.trim() && results.length === 0 && !loading && (
                        <div className="search-empty">
                            No results found for "{query}"
                        </div>
                    )}

                    {results.map((result, index) => (
                        <div
                            key={`${result.type}-${result.id}`}
                            className={`search-result-item ${index === selectedIndex ? 'selected' : ''}`}
                            onClick={() => handleResultClick(result)}
                            onMouseEnter={() => setSelectedIndex(index)}
                        >
                            <div className="result-icon">{getTypeIcon(result.type)}</div>
                            <div className="result-content">
                                <div className="result-title">
                                    {highlightMatch(result.title, query)}
                                </div>
                                {result.subtitle && (
                                    <div className="result-subtitle">{result.subtitle}</div>
                                )}
                            </div>
                            <div
                                className="result-type-badge"
                                style={{ backgroundColor: getTypeBadgeColor(result.type) }}
                            >
                                {result.type}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="search-footer">
                    <div className="search-hints">
                        <span className="hint">↑↓ Navigate</span>
                        <span className="hint">↵ Select</span>
                        <span className="hint">Esc Close</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GlobalSearch;
