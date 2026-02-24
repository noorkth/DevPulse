import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Login from './pages/Login';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Clients from './pages/Clients';
import Projects from './pages/Projects';
import Issues from './pages/Issues';
import Users from './pages/Users';
import Analytics from './pages/Analytics';
import { PerformanceDashboard } from './pages/PerformanceDashboard';
import DeveloperPerformance from './pages/DeveloperPerformance';
import { MLInsights } from './pages/MLInsights';
import Settings from './pages/Settings';
import EmailSettings from './pages/EmailSettings';
import EmailScheduler from './pages/EmailScheduler';
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
            <AuthProvider>
                <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                    <Routes>
                        {/* Public routes */}
                        <Route path="/login" element={<Login />} />

                        {/* Protected routes */}
                        <Route path="/" element={
                            <ProtectedRoute>
                                <Layout />
                            </ProtectedRoute>
                        }>
                            <Route index element={<Navigate to="/dashboard" replace />} />
                            <Route path="dashboard" element={<Dashboard />} />
                            <Route path="projects" element={<Projects />} />
                            <Route path="issues" element={<Issues />} />
                            <Route path="performance/:developerId" element={<DeveloperPerformance />} />

                            {/* PM-only routes */}
                            <Route path="products" element={
                                <ProtectedRoute requiredRole="manager">
                                    <Products />
                                </ProtectedRoute>
                            } />
                            <Route path="clients" element={
                                <ProtectedRoute requiredRole="manager">
                                    <Clients />
                                </ProtectedRoute>
                            } />
                            <Route path="users" element={
                                <ProtectedRoute requiredRole="manager">
                                    <Users />
                                </ProtectedRoute>
                            } />
                            <Route path="analytics" element={
                                <ProtectedRoute requiredRole="manager">
                                    <Analytics />
                                </ProtectedRoute>
                            } />
                            <Route path="performance" element={
                                <ProtectedRoute requiredRole="manager">
                                    <PerformanceDashboard />
                                </ProtectedRoute>
                            } />
                            <Route path="ml-insights" element={
                                <ProtectedRoute requiredRole="manager">
                                    <MLInsights />
                                </ProtectedRoute>
                            } />
                            <Route path="settings" element={
                                <ProtectedRoute requiredRole="manager">
                                    <Settings />
                                </ProtectedRoute>
                            } />
                            <Route path="email-settings" element={
                                <ProtectedRoute requiredRole="manager">
                                    <EmailSettings />
                                </ProtectedRoute>
                            } />
                            <Route path="email-scheduler" element={
                                <ProtectedRoute requiredRole="manager">
                                    <EmailScheduler />
                                </ProtectedRoute>
                            } />
                        </Route>
                    </Routes>
                </HashRouter>
            </AuthProvider>
        </ToastProvider>
    );
}

export default App;
