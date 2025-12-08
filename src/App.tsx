import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Clients from './pages/Clients';
import Projects from './pages/Projects';
import Issues from './pages/Issues';
import Users from './pages/Users';
import Analytics from './pages/Analytics';
import { PerformanceDashboard } from './pages/PerformanceDashboard';
import { MLInsights } from './pages/MLInsights';
import Settings from './pages/Settings';
import { ToastProvider } from './components/common/Toast';

function App() {
    const [theme, setTheme] = useState<'light' | 'dark'>('dark');

    useEffect(() => {
        // Get initial theme from system
        if (window.api) {
            window.api.theme.get().then(systemTheme => {
                setTheme(systemTheme);
                document.documentElement.setAttribute('data-theme', systemTheme);
            });
        }
    }, []);

    const toggleTheme = async () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);

        if (window.api) {
            await window.api.theme.set(newTheme);
        }
    };

    return (
        <ToastProvider>
            <BrowserRouter>
                <Layout theme={theme} onToggleTheme={toggleTheme}>
                    <Routes>
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/products" element={<Products />} />
                        <Route path="/clients" element={<Clients />} />
                        <Route path="/projects" element={<Projects />} />
                        <Route path="/issues" element={<Issues />} />
                        <Route path="/developers" element={<Users />} />
                        <Route path="/users" element={<Users />} />
                        <Route path="/analytics" element={<Analytics />} />
                        <Route path="/performance" element={<PerformanceDashboard />} />
                        <Route path="/ml-insights" element={<MLInsights />} />
                        <Route path="/settings" element={<Settings />} />
                    </Routes>
                </Layout>
            </BrowserRouter>
        </ToastProvider>
    );
}

export default App;
