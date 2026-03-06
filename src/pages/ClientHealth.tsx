import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import Card from '../components/common/Card';
import Loading from '../components/common/Loading';
import './ClientHealth.css';

const ClientHealth: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [clients, setClients] = useState<any[]>([]);
    const [selectedClientId, setSelectedClientId] = useState<string>('');
    const [dashboard, setDashboard] = useState<any[]>([]);
    const [incidentTrend, setIncidentTrend] = useState<any[]>([]);
    const [complianceTrend, setComplianceTrend] = useState<any[]>([]);
    const [openIssues, setOpenIssues] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadClients();
    }, []);

    // Re-fetch whenever we navigate to this page (picks up new shared issues)
    useEffect(() => {
        loadDashboard();
    }, [selectedClientId, location.key]);

    const loadClients = async () => {
        const all = await window.api.clients.getAll();
        setClients(all);
        if (all.length > 0) setSelectedClientId(all[0].id);
    };

    const loadDashboard = async () => {
        setLoading(true);
        try {
            const [dash, issues] = await Promise.all([
                window.api.clientHealth.getDashboard(selectedClientId || undefined),
                selectedClientId
                    ? window.api.sharedIssues.getAll({ clientId: selectedClientId, status: 'open' })
                    : Promise.resolve([]),
            ]);
            setDashboard(dash);
            setOpenIssues(issues);

            if (selectedClientId) {
                const [trend, compliance] = await Promise.all([
                    window.api.clientHealth.getIncidentTrend(selectedClientId),
                    window.api.sla.getComplianceTrend(selectedClientId),
                ]);
                setIncidentTrend(trend);
                setComplianceTrend(compliance);
            }
        } catch (e) {
            console.error('Error loading client health:', e);
        } finally {
            setLoading(false);
        }
    };

    const activeDashboard = selectedClientId
        ? dashboard.filter(d => d.clientId === selectedClientId)
        : dashboard;

    const summary = activeDashboard[0];

    const getSlaColor = (pct: number) => {
        if (pct >= 90) return '#10b981';
        if (pct >= 70) return '#f59e0b';
        return '#ef4444';
    };

    const getStabilityColor = (score: number) => {
        if (score >= 80) return '#10b981';
        if (score >= 50) return '#f59e0b';
        return '#ef4444';
    };

    if (loading) return <Loading size="large" text="Loading client health data..." fullScreen />;

    return (
        <div className="client-health-page">
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">🏥 Client Health Dashboard</h1>
                    <p className="page-subtitle">Real-time SLA, escalation, and incident metrics per client</p>
                </div>
                <div className="header-actions">
                    <select
                        className="client-selector"
                        value={selectedClientId}
                        onChange={e => setSelectedClientId(e.target.value)}
                    >
                        <option value="">All Clients</option>
                        {clients.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                    <button className="btn btn-primary btn-sm" onClick={() => navigate('/shared-issues')}>
                        + New Issue
                    </button>
                </div>
            </div>

            {/* Summary Metric Cards */}
            {summary && (
                <div className="metrics-grid">
                    <Card className="metric-card">
                        <div className="metric-icon-wrap" style={{ color: '#6366f1' }}>📋</div>
                        <div className="metric-info">
                            <p className="metric-label">Open Issues</p>
                            <h2 className="metric-value">{summary.openIssues}</h2>
                        </div>
                    </Card>
                    <Card className="metric-card metric-card--danger">
                        <div className="metric-icon-wrap" style={{ color: '#ef4444' }}>⚠️</div>
                        <div className="metric-info">
                            <p className="metric-label">SLA Breaches</p>
                            <h2 className="metric-value">{summary.slaBreaches}</h2>
                        </div>
                    </Card>
                    <Card className="metric-card">
                        <div className="metric-icon-wrap" style={{ color: '#f59e0b' }}>🔺</div>
                        <div className="metric-info">
                            <p className="metric-label">Escalations</p>
                            <h2 className="metric-value">{summary.escalations}</h2>
                        </div>
                    </Card>
                    <Card className="metric-card">
                        <div className="metric-icon-wrap" style={{ color: '#10b981' }}>✅</div>
                        <div className="metric-info">
                            <p className="metric-label">Preventive Actions</p>
                            <h2 className="metric-value">{summary.preventiveActions}</h2>
                        </div>
                    </Card>
                    <Card className="metric-card">
                        <div className="metric-icon-wrap" style={{ color: getSlaColor(summary.slaCompliancePct) }}>📊</div>
                        <div className="metric-info">
                            <p className="metric-label">SLA Compliance</p>
                            <h2 className="metric-value" style={{ color: getSlaColor(summary.slaCompliancePct) }}>
                                {summary.slaCompliancePct}%
                            </h2>
                        </div>
                    </Card>
                    <Card className="metric-card">
                        <div className="metric-icon-wrap" style={{ color: getStabilityColor(summary.stabilityScore) }}>🏆</div>
                        <div className="metric-info">
                            <p className="metric-label">Stability Score</p>
                            <h2 className="metric-value" style={{ color: getStabilityColor(summary.stabilityScore) }}>
                                {summary.stabilityScore?.toFixed(0)}
                            </h2>
                        </div>
                    </Card>
                </div>
            )}

            {/* Charts */}
            {selectedClientId && (
                <div className="charts-row">
                    <Card className="chart-card">
                        <h3 className="chart-title">SLA Compliance Trend</h3>
                        <ResponsiveContainer width="100%" height={220}>
                            <LineChart data={complianceTrend}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                                <XAxis dataKey="week" tick={{ fill: 'var(--color-text-secondary)', fontSize: 11 }} />
                                <YAxis domain={[0, 100]} tick={{ fill: 'var(--color-text-secondary)' }} />
                                <Tooltip contentStyle={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: 8 }} />
                                <Line type="monotone" dataKey="compliancePct" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} name="Compliance %" />
                            </LineChart>
                        </ResponsiveContainer>
                    </Card>
                    <Card className="chart-card">
                        <h3 className="chart-title">Incident Frequency (8 Weeks)</h3>
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={incidentTrend}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                                <XAxis dataKey="week" tick={{ fill: 'var(--color-text-secondary)', fontSize: 11 }} />
                                <YAxis tick={{ fill: 'var(--color-text-secondary)' }} />
                                <Tooltip contentStyle={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: 8 }} />
                                <Bar dataKey="incidents" fill="#6366f1" name="Incidents" />
                                <Bar dataKey="breaches" fill="#ef4444" name="SLA Breaches" />
                                <Legend />
                            </BarChart>
                        </ResponsiveContainer>
                    </Card>
                </div>
            )}

            {/* Open Issues Table */}
            <Card className="issues-table-card">
                <div className="table-header">
                    <h3 className="table-title">Open Shared Issues</h3>
                    <button className="btn btn-secondary btn-sm" onClick={() => navigate('/shared-issues')}>View All →</button>
                </div>
                {openIssues.length === 0 ? (
                    <div className="empty-state-small">No open issues 🎉</div>
                ) : (
                    <table className="gov-table">
                        <thead>
                            <tr>
                                <th>Issue</th>
                                <th>Severity</th>
                                <th>SLA Status</th>
                                <th>Escalation</th>
                                <th>Owner</th>
                                <th>Raised</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {openIssues.slice(0, 10).map((issue: any) => (
                                <tr key={issue.id} onClick={() => navigate(`/shared-issues/${issue.id}`)} className="clickable-row">
                                    <td className="issue-title">{issue.title}</td>
                                    <td><span className={`sev-badge sev-${issue.severity}`}>{issue.severity}</span></td>
                                    <td><span className={`sla-badge sla-${issue.slaStatus}`}>{issue.slaStatus}</span></td>
                                    <td>
                                        {issue.escalationLevel > 0
                                            ? <span className="esc-badge">L{issue.escalationLevel}</span>
                                            : '—'
                                        }
                                    </td>
                                    <td>{issue.assignedOwner?.fullName ?? '—'}</td>
                                    <td className="text-secondary">{new Date(issue.raisedAt).toLocaleDateString()}</td>
                                    <td><button className="btn-link">View →</button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </Card>

            {/* All clients grid (when no client selected) */}
            {!selectedClientId && dashboard.length > 0 && (
                <div className="clients-grid">
                    {dashboard.map(client => (
                        <Card
                            key={client.clientId}
                            className="client-summary-card"
                            style={{ cursor: 'pointer' }}
                            onClick={() => navigate(`/client-health/${client.clientId}`)}
                        >
                            <h4>{client.clientName}</h4>
                            <div className="client-stats">
                                <span>Open: <strong>{client.openIssues}</strong></span>
                                <span>Breaches: <strong style={{ color: client.slaBreaches > 0 ? '#ef4444' : 'inherit' }}>{client.slaBreaches}</strong></span>
                                <span>SLA: <strong style={{ color: getSlaColor(client.slaCompliancePct) }}>{client.slaCompliancePct}%</strong></span>
                            </div>
                            <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--color-primary)' }}>View Detail →</div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ClientHealth;
