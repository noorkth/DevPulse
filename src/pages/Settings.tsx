import React, { useState, useEffect } from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import './Settings.css';

const Settings: React.FC = () => {
    const [theme, setTheme] = useState<'light' | 'dark'>('dark');
    const [appVersion, setAppVersion] = useState<string>('Loading...');

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            console.log('⏳ Loading settings...');
            const currentTheme = await window.api.theme.get();
            console.log('✅ Theme loaded:', currentTheme);
            setTheme(currentTheme);

            // Load version via IPC (works in both dev and production)
            console.log('⏳ Getting version...');
            const version = await (window.api as any).app.getVersion();
            console.log('✅ Version loaded:', version);
            setAppVersion(version);
        } catch (error) {
            console.error('❌ Error loading settings:', error);
            setAppVersion('Unknown'); // Fallback version
        }
    };

    const handleThemeChange = async (newTheme: 'light' | 'dark') => {
        try {
            await window.api.theme.set(newTheme);
            setTheme(newTheme);
            document.documentElement.setAttribute('data-theme', newTheme);
        } catch (error) {
            console.error('Error changing theme:', error);
        }
    };

    return (
        <div className="settings-page">
            <h2>Settings</h2>

            {/* Appearance */}
            <Card>
                <div className="settings-section">
                    <h3 className="section-title">Appearance</h3>
                    <p className="section-description">Customize the look and feel of DevPulse</p>

                    <div className="setting-item">
                        <div className="setting-info">
                            <label className="setting-label">Theme</label>
                            <p className="setting-description">Choose your preferred color theme</p>
                        </div>
                        <div className="theme-options">
                            <button
                                className={`theme-option ${theme === 'light' ? 'active' : ''}`}
                                onClick={() => handleThemeChange('light')}
                            >
                                ☀️ Light
                            </button>
                            <button
                                className={`theme-option ${theme === 'dark' ? 'active' : ''}`}
                                onClick={() => handleThemeChange('dark')}
                            >
                                🌙 Dark
                            </button>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Data Management */}
            <Card>
                <div className="settings-section">
                    <h3 className="section-title">Data Management</h3>
                    <p className="section-description">Manage your application data</p>

                    <div className="setting-item">
                        <div className="setting-info">
                            <label className="setting-label">Database Location</label>
                            <p className="setting-description">
                                <code className="code-text">./prisma/devpulse.db</code>
                            </p>
                        </div>
                    </div>

                    <div className="setting-actions">
                        <Button variant="secondary">Export Data</Button>
                        <Button variant="secondary">Import Data</Button>
                        <Button variant="danger">Clear Cache</Button>
                    </div>
                </div>
            </Card>

            {/* About */}
            <Card>
                <div className="settings-section">
                    <h3 className="section-title">About DevPulse</h3>
                    <div className="about-content">
                        <div className="about-logo">⚡</div>
                        <h2>DevPulse</h2>
                        <p className="about-tagline">Developer Productivity & Issue Intelligence</p>
                        <p className="version">Version {appVersion}</p>

                        <div className="about-info">
                            <p>Built with Electron, React, and Prisma</p>
                            <p>Track bugs, analyze productivity, and improve code quality</p>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default Settings;
