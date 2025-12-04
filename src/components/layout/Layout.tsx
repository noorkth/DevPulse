import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import './Layout.css';

interface LayoutProps {
    children: React.ReactNode;
    theme: 'light' | 'dark';
    onToggleTheme: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, theme, onToggleTheme }) => {
    return (
        <div className="layout">
            <Sidebar />

            <div className="main-container">
                <Header theme={theme} onToggleTheme={onToggleTheme} />

                <main className="main-content">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default Layout;
