import React from 'react';
import { useLocation } from 'react-router-dom';
import './Header.css';

interface HeaderProps {
    theme: 'light' | 'dark';
    onToggleTheme: () => void;
}

const pageTitle = {
    '/dashboard': 'Dashboard',
    '/projects': 'Projects',
    '/issues': 'Issues',
    '/developers': 'Developers',
    '/analytics': 'Analytics',
    '/settings': 'Settings',
};

const Header: React.FC<HeaderProps> = ({ theme, onToggleTheme }) => {
    const location = useLocation();
    const title = pageTitle[location.pathname as keyof typeof pageTitle] || 'DevPulse';

    return (
        <header className="header">
            <h2 className="header-title">{title}</h2>

            <div className="header-actions">
                <button
                    className="theme-toggle"
                    onClick={onToggleTheme}
                    title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                >
                    {theme === 'light' ? '🌙' : '☀️'}
                </button>
            </div>
        </header>
    );
};

export default Header;
