import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
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
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
// Governance Layer
import ClientHealth from './pages/ClientHealth';
import ClientHealthDetail from './pages/ClientHealthDetail';
import SharedIssues from './pages/SharedIssues';
import SharedIssueDetail from './pages/SharedIssueDetail';
import MonthlyBusinessReview from './pages/MonthlyBusinessReview';
import MonitoringChecklist from './pages/MonitoringChecklist';
import OfficeVisits from './pages/OfficeVisits';
import RelationshipResets from './pages/RelationshipResets';
import FeatureRoadmap from './pages/FeatureRoadmap';

function AppRoutes() {
    const { user } = useAuth();
    const [theme, setTheme] = useState<'light' | 'dark'>('dark');

    useEffect(() => {
        if (window.api) {
            window.api.theme.get().then(systemTheme => {
                setTheme(systemTheme);
                document.documentElement.setAttribute('data-theme', systemTheme);
            });
        }
    }, []);

    if (!user) return <LoginPage />;

    return (
        <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Routes>
                <Route path="/" element={<Layout />}>
                    <Route index element={<Navigate to="/dashboard" replace />} />
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="products" element={<Products />} />
                    <Route path="clients" element={<Clients />} />
                    <Route path="projects" element={<Projects />} />
                    <Route path="issues" element={<Issues />} />
                    <Route path="users" element={<Users />} />
                    <Route path="analytics" element={<Analytics />} />
                    <Route path="performance" element={<PerformanceDashboard />} />
                    <Route path="performance/:developerId" element={<DeveloperPerformance />} />
                    <Route path="ml-insights" element={<MLInsights />} />
                    <Route path="settings" element={<Settings />} />
                    <Route path="email-settings" element={<EmailSettings />} />
                    <Route path="email-scheduler" element={<EmailScheduler />} />
                    {/* Governance Layer */}
                    <Route path="client-health" element={<ClientHealth />} />
                    <Route path="client-health/:clientId" element={<ClientHealthDetail />} />
                    <Route path="shared-issues" element={<SharedIssues />} />
                    <Route path="shared-issues/:id" element={<SharedIssueDetail />} />
                    <Route path="mbr" element={<MonthlyBusinessReview />} />
                    <Route path="monitoring" element={<MonitoringChecklist />} />
                    <Route path="office-visits" element={<OfficeVisits />} />
                    <Route path="relationship-resets" element={<RelationshipResets />} />
                    <Route path="feature-roadmap" element={<FeatureRoadmap />} />
                </Route>
            </Routes>
        </HashRouter>
    );
}

function App() {
    return (
        <AuthProvider>
            <ToastProvider>
                <AppRoutes />
            </ToastProvider>
        </AuthProvider>
    );
}

export default App;
