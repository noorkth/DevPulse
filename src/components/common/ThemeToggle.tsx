import React, { useState, useEffect } from 'react';
import './ThemeToggle.css';

const ThemeToggle: React.FC = () => {
    const [theme, setTheme] = useState<'light' | 'dark'>('dark');

    useEffect(() => {
        // Get initial theme
        const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;

        if (savedTheme) {
            setTheme(savedTheme);
            document.documentElement.setAttribute('data-theme', savedTheme);
        } else {
            // Detect system preference
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            const systemTheme = prefersDark ? 'dark' : 'light';
            setTheme(systemTheme);
            document.documentElement.setAttribute('data-theme', systemTheme);
        }

        // Listen for storage changes (from Settings page)
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'theme' && e.newValue) {
                const newTheme = e.newValue as 'light' | 'dark';
                setTheme(newTheme);
                document.documentElement.setAttribute('data-theme', newTheme);
            }
        };

        // Listen for custom theme change event
        const handleThemeChange = (e: CustomEvent) => {
            const newTheme = e.detail.theme;
            setTheme(newTheme);
            document.documentElement.setAttribute('data-theme', newTheme);
        };

        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('themechange' as any, handleThemeChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('themechange' as any, handleThemeChange);
        };
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);

        // Update DOM
        document.documentElement.setAttribute('data-theme', newTheme);

        // Save to localStorage
        localStorage.setItem('theme', newTheme);

        // Dispatch custom event for other components
        window.dispatchEvent(new CustomEvent('themechange', { detail: { theme: newTheme } }));

        // Update Electron store if available
        if (window.api?.theme) {
            window.api.theme.set(newTheme);
        }
    };

    return (
        <button
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
            <div className="theme-toggle-track">
                <div className={`theme-toggle-thumb ${theme}`}>
                    {theme === 'light' ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="5" fill="currentColor" />
                            <path
                                d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                            />
                        </svg>
                    ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
                        </svg>
                    )}
                </div>
            </div>
        </button>
    );
};

export default ThemeToggle;
