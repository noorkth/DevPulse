import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import QuickCreateIssue from '../common/QuickCreateIssue';
import ThemeToggle from '../common/ThemeToggle';
import './Layout.css';

const Layout: React.FC = () => {
    return (
        <div className="layout">
            <Sidebar />
            <div className="main-content">
                <div className="content-header">
                    <div className="header-spacer"></div>
                    <ThemeToggle />
                </div>
                <div className="content-body">
                    <Outlet />
                </div>
            </div>
            <QuickCreateIssue />
        </div>
    );
};

export default Layout;
