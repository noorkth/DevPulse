import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import QuickCreateIssue from '../common/QuickCreateIssue';
import ThemeToggle from '../common/ThemeToggle';
import GlobalSearch from '../common/GlobalSearch';
import './Layout.css';

const Layout: React.FC = () => {
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    // Listen for Ctrl+K / Cmd+K
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setIsSearchOpen(true);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
        <div className="layout">
            <Sidebar />
            <div className="main-content">
                <div className="content-header">
                    <button
                        className="search-trigger-button"
                        onClick={() => setIsSearchOpen(true)}
                        title="Search (Ctrl+K)"
                    >
                        <span className="search-icon">🔍</span>
                        <span className="search-text">Search...</span>
                        <span className="search-shortcut">Ctrl+K</span>
                    </button>
                    <ThemeToggle />
                </div>
                <div className="content-body">
                    <Outlet />
                </div>
            </div>
            <QuickCreateIssue />
            <GlobalSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
        </div>
    );
};

export default Layout;
