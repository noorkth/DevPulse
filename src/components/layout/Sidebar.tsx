import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Sidebar.css';

// Embedded logo as base64 - works in both dev and production
const LOGO_BASE64 = 'data:image/png;base64,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';

const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/products', label: 'Products', icon: '📦' },
    { path: '/clients', label: 'Clients', icon: '👥' },
    { path: '/projects', label: 'Projects', icon: '🗂️' },
    { path: '/issues', label: 'Issues', icon: '🐛' },
    { path: '/developers', label: 'Developers', icon: '👨‍💻' },
    { path: '/analytics', label: 'Analytics', icon: '📈' },
    { path: '/performance', label: 'Performance', icon: '⚡' },
    { path: '/ml-insights', label: 'ML Insights', icon: '🤖' },
    { path: '/settings', label: 'Settings', icon: '⚙️' },
];

const Sidebar: React.FC = () => {
    const location = useLocation();

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <img src={LOGO_BASE64} alt="DevPulse" className="sidebar-logo-icon" />
                <span className="sidebar-logo-text">DevPulse</span>
            </div>

            <nav className="sidebar-nav">
                {menuItems.map(item => (
                    <Link
                        key={item.path}
                        to={item.path}
                        className={`sidebar-item ${location.pathname === item.path ? 'active' : ''}`}
                    >
                        <span className="sidebar-item-icon">{item.icon}</span>
                        <span className="sidebar-item-label">{item.label}</span>
                    </Link>
                ))}
            </nav>
        </aside>
    );
};

export default Sidebar;
