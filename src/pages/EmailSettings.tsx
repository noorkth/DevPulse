import React, { useState, useEffect } from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import ConfirmDialog from '../components/common/ConfirmDialog';
import './EmailSettings.css';

const EmailSettings: React.FC = () => {
    const [smtpConfig, setSmtpConfig] = useState({
        host: 'smtp.gmail.com',
        port: '587',
        user: '',
        pass: '',
        from: '',
    });

    const [testEmail, setTestEmail] = useState('');
    const [status, setStatus] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');

    // Confirm dialog flow
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [isSendingReport, setIsSendingReport] = useState(false);

    useEffect(() => {
        loadSchedulerStatus();
    }, []);

    const loadSchedulerStatus = async () => {
        try {
            const api = window.api as any;
            const result = await api.email.getSchedulerStatus();
            if (result.success) {
                setStatus(result.status);
            }
        } catch (error) {
            console.error('Error loading scheduler status:', error);
        }
    };

    const handleTestConnection = async () => {
        setLoading(true);
        setConnectionStatus('idle');
        try {
            const api = window.api as any;
            const result = await api.email.testConnection(smtpConfig);
            setConnectionStatus(result.success ? 'success' : 'error');
            if (result.success) {
                alert('✅ SMTP Connection Successful!');
            } else {
                alert('❌ Connection Failed: ' + (result.error || 'Unknown error'));
            }
        } catch (error) {
            setConnectionStatus('error');
            alert('❌ Connection Error: ' + error);
        }
        setLoading(false);
    };

    const handleSendTest = async () => {
        if (!testEmail) {
            alert('Please enter an email address');
            return;
        }

        setLoading(true);
        try {
            const api = window.api as any;
            const result = await api.email.sendTest(testEmail, smtpConfig);
            if (result.success) {
                alert('✅ Test email sent! Check your inbox.');
            } else {
                alert('❌ Failed to send: ' + (result.error || 'Unknown error'));
            }
        } catch (error) {
            alert('❌ Error: ' + error);
        }
        setLoading(false);
    };

    const handleTriggerWeeklyReports = () => {
        setIsConfirmOpen(true);
    };

    const handleTriggerConfirm = async () => {
        setIsSendingReport(true);
        try {
            const api = window.api as any;
            const result = await api.email.triggerWeeklyReports();
            if (result.success) {
                alert('✅ Weekly reports sent successfully!');
                setIsConfirmOpen(false);
            } else {
                alert('❌ Failed: ' + (result.error || 'Unknown error'));
            }
        } catch (error) {
            alert('❌ Error: ' + error);
        } finally {
            setIsSendingReport(false);
        }
    };

    return (
        <div className="email-settings-page">
            <div className="page-header">
                <h1>📧 Email Settings</h1>
                <p>Configure SMTP and manage automated reports</p>
            </div>

            {/* SMTP Configuration */}
            <Card>
                <h2 className="section-title">SMTP Configuration</h2>
                <div className="config-grid">
                    <div className="form-group">
                        <label>SMTP Host</label>
                        <input
                            type="text"
                            value={smtpConfig.host}
                            onChange={(e) => setSmtpConfig({ ...smtpConfig, host: e.target.value })}
                            placeholder="smtp.gmail.com"
                        />
                    </div>

                    <div className="form-group">
                        <label>Port</label>
                        <input
                            type="text"
                            value={smtpConfig.port}
                            onChange={(e) => setSmtpConfig({ ...smtpConfig, port: e.target.value })}
                            placeholder="587"
                        />
                    </div>

                    <div className="form-group">
                        <label>Email Address</label>
                        <input
                            type="email"
                            value={smtpConfig.user}
                            onChange={(e) => setSmtpConfig({ ...smtpConfig, user: e.target.value, from: e.target.value })}
                            placeholder="your-email@gmail.com"
                        />
                    </div>

                    <div className="form-group">
                        <label>App Password</label>
                        <input
                            type="password"
                            value={smtpConfig.pass}
                            onChange={(e) => setSmtpConfig({ ...smtpConfig, pass: e.target.value })}
                            placeholder="16-character app password"
                        />
                        <small>
                            <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener">
                                Generate Gmail App Password →
                            </a>
                        </small>
                    </div>
                </div>

                <div className="action-buttons">
                    <Button
                        onClick={handleTestConnection}
                        disabled={loading || !smtpConfig.user || !smtpConfig.pass}
                        variant={connectionStatus === 'success' ? 'primary' : 'secondary'}
                    >
                        {loading ? 'Testing...' : connectionStatus === 'success' ? '✅ Connected' : '🔌 Test Connection'}
                    </Button>
                </div>

                {connectionStatus === 'error' && (
                    <div className="error-message">
                        ❌ Connection failed. Check your credentials.
                    </div>
                )}
            </Card>

            {/* Test Email */}
            <Card>
                <h2 className="section-title">Test Email</h2>
                <div className="test-email-section">
                    <div className="form-group">
                        <label>Send test email to:</label>
                        <input
                            type="email"
                            value={testEmail}
                            onChange={(e) => setTestEmail(e.target.value)}
                            placeholder="recipient@example.com"
                        />
                    </div>
                    <Button
                        onClick={handleSendTest}
                        disabled={loading || !testEmail || connectionStatus !== 'success'}
                    >
                        📨 Send Test Email
                    </Button>
                </div>
            </Card>

            {/* Scheduler Status */}
            <Card>
                <h2 className="section-title">Automated Reports Scheduler</h2>
                {status ? (
                    <div className="scheduler-status">
                        <div className="schedule-item">
                            <div className="schedule-label">
                                <span className="status-icon">{status.weekly.running ? '🟢' : '🔴'}</span>
                                <strong>Weekly Reports</strong>
                            </div>
                            <div className="schedule-value">{status.weekly.schedule}</div>
                        </div>

                        <div className="schedule-item">
                            <div className="schedule-label">
                                <span className="status-icon">{status.monthly.running ? '🟢' : '🔴'}</span>
                                <strong>Monthly Reports</strong>
                            </div>
                            <div className="schedule-value">{status.monthly.schedule}</div>
                        </div>
                    </div>
                ) : (
                    <p>Loading scheduler status...</p>
                )}

                <div className="action-buttons">
                    <Button
                        onClick={handleTriggerWeeklyReports}
                        disabled={loading || connectionStatus !== 'success'}
                        variant="primary"
                    >
                        🚀 Send Weekly Reports Now
                    </Button>
                </div>
            </Card>

            {/* Instructions */}
            <Card>
                <h2 className="section-title">📖 Setup Instructions</h2>
                <ol className="instructions-list">
                    <li>
                        <strong>Enable 2FA on Gmail:</strong>{' '}
                        <a href="https://myaccount.google.com/security" target="_blank" rel="noopener">
                            Go to Security Settings
                        </a>
                    </li>
                    <li>
                        <strong>Generate App Password:</strong>{' '}
                        <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener">
                            Create App Password
                        </a>
                    </li>
                    <li>Enter your email and the 16-character app password above</li>
                    <li>Click "Test Connection" to verify</li>
                    <li>Send a test email to confirm it works</li>
                    <li>Weekly reports will automatically send every Monday at 9:00 AM</li>
                </ol>
            </Card>

            <ConfirmDialog
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={handleTriggerConfirm}
                title="Send Weekly Reports"
                message="Are you sure you want to trigger weekly reports for ALL developers immediately? This will send emails to all configured recipients."
                confirmText="Send Reports Now"
                variant="info"
                isLoading={isSendingReport}
            />
        </div>
    );
};

export default EmailSettings;
