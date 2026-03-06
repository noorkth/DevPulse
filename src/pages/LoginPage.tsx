import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './LoginPage.css';

const LoginPage: React.FC = () => {
    const { login } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(username, password);
        } catch (err: any) {
            setError(err.message || 'Invalid username or password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-bg">
            <div className="login-glow" />
            <div className="login-card">
                {/* Logo + branding */}
                <div className="login-header">
                    <div className="login-logo">⚡</div>
                    <h1 className="login-title">DevPulse</h1>
                    <p className="login-subtitle">Client Governance & Insights Platform</p>
                </div>

                <form className="login-form" onSubmit={handleSubmit}>
                    <div className="login-field">
                        <label className="login-label">Username</label>
                        <input
                            className="login-input"
                            type="text"
                            autoComplete="username"
                            placeholder="Enter your username"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            autoFocus
                        />
                    </div>
                    <div className="login-field">
                        <label className="login-label">Password</label>
                        <input
                            className="login-input"
                            type="password"
                            autoComplete="current-password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                        />
                    </div>

                    {error && (
                        <div className="login-error">
                            <span>⚠️</span> {error}
                        </div>
                    )}

                    <button
                        className="login-btn"
                        type="submit"
                        disabled={loading || !username || !password}
                    >
                        {loading ? (
                            <span className="login-spinner" />
                        ) : (
                            'Sign In →'
                        )}
                    </button>
                </form>

                <p className="login-footer">DevPulse · Internal Use Only</p>
            </div>
        </div>
    );
};

export default LoginPage;
