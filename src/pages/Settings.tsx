import React, { useState, useEffect } from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import './Settings.css';

const Settings: React.FC = () => {
    const [theme, setTheme] = useState<'light' | 'dark'>('dark');
    const [appVersion, setAppVersion] = useState<string>('Loading...');
    const [isProcessing, setIsProcessing] = useState(false);

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

    const handleExportData = async () => {
        if (isProcessing) return;

        try {
            setIsProcessing(true);
            console.log('📦 Exporting data...');

            const result = await (window.api as any).data.export();

            if (result.success) {
                alert(`✅ ${result.message}`);
            } else {
                alert(`❌ ${result.message}`);
            }
        } catch (error) {
            console.error('Export error:', error);
            alert('❌ Export failed: ' + (error as Error).message);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleImportData = async () => {
        if (isProcessing) return;

        try {
            setIsProcessing(true);
            console.log('📥 Importing data...');

            const result = await (window.api as any).data.import();

            if (result.success) {
                alert(`✅ ${result.message}\n\nThe application will refresh to show the imported data.`);
                // Refresh the page to show imported data
                window.location.reload();
            } else if (result.message !== 'Import canceled') {
                alert(`❌ ${result.message}`);
            }
        } catch (error) {
            console.error('Import error:', error);
            alert('❌ Import failed: ' + (error as Error).message);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleClearCache = async () => {
        if (isProcessing) return;

        setIsProcessing(true);
        try {
            console.log('🧹 Clearing cache...');
            const result = await (window.api as any).data.clearCache();

            if (result.success) {
                // Backend handles restart dialog, just show message
                if (!result.needsRestart) {
                    // User chose to restart later
                    alert(result.message);
                }
                // If user chose restart now, app will close automatically
            } else {
                alert(result.message || 'Failed to clear cache');
            }
        } catch (error) {
            console.error('Clear cache error:', error);
            alert('Failed to clear cache: ' + (error instanceof Error ? error.message : 'Unknown error'));
        } finally {
            setIsProcessing(false);
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
                                <code className="code-text">~/Library/Application Support/devpulse/devpulse.db</code>
                            </p>
                        </div>
                    </div>

                    <div className="setting-actions">
                        <Button
                            variant="secondary"
                            onClick={handleExportData}
                            disabled={isProcessing}
                        >
                            {isProcessing ? '⏳ Exporting...' : '📦 Export Data'}
                        </Button>
                        <Button
                            variant="secondary"
                            onClick={handleImportData}
                            disabled={isProcessing}
                        >
                            {isProcessing ? '⏳ Importing...' : '📥 Import Data'}
                        </Button>
                        <Button
                            variant="danger"
                            onClick={handleClearCache}
                            disabled={isProcessing}
                        >
                            {isProcessing ? '⏳ Clearing...' : '🧹 Clear Cache'}
                        </Button>
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
                        <p className="developer-credit">Developed by <strong>noorkth</strong></p>

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
