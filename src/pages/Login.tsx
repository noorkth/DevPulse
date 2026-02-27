import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Login.css';

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const from = (location.state as any)?.from?.pathname || '/dashboard';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!username.trim() || !password.trim()) {
            setError('Please enter your username and password.');
            return;
        }
        setError('');
        setIsLoading(true);
        try {
            await login(username.trim(), password);
            navigate(from, { replace: true });
        } catch (err: any) {
            setError(err?.message || 'Invalid username or password.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-card">
                <div className="login-logo">
                    <span className="login-logo-icon">⚡</span>
                    <span className="login-logo-text">DevPulse</span>
                </div>
                <h1 className="login-title">Welcome back</h1>
                <p className="login-subtitle">Sign in to your workspace</p>

                <form className="login-form" onSubmit={handleSubmit}>
                    <div className="login-field">
                        <label htmlFor="username" className="login-label">Username</label>
                        <input
                            id="username"
                            type="text"
                            className="login-input"
                            placeholder="Enter your username"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            autoComplete="username"
                            autoFocus
                            disabled={isLoading}
                        />
                    </div>

                    <div className="login-field">
                        <label htmlFor="password" className="login-label">Password</label>
                        <input
                            id="password"
                            type="password"
                            className="login-input"
                            placeholder="Enter your password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            autoComplete="current-password"
                            disabled={isLoading}
                        />
                    </div>

                    {error && (
                        <div className="login-error" role="alert">
                            <span>⚠️</span> {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="login-btn"
                        disabled={isLoading}
                        id="login-submit-btn"
                    >
                        {isLoading ? (
                            <span className="login-btn-loading">
                                <span className="login-spinner" />
                                Signing in...
                            </span>
                        ) : 'Sign In'}
                    </button>
                </form>

                <p className="login-footer">
                    DevPulse · Developer Productivity & Issue Intelligence
                </p>
            </div>
        </div>
    );
}
