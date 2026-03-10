import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
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
    const [mttrTrend, setMttrTrend] = useState<any[]>([]);
    const [history, setHistory] = useState<any[]>([]);
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
    };

    const loadDashboard = async () => {
        setLoading(true);
        try {
            const [dash, issues] = await Promise.all([
                window.api.clientHealth.getDashboard(selectedClientId || undefined),
                window.api.sharedIssues.getAll({ ...(selectedClientId ? { clientId: selectedClientId } : {}), status: 'open' }),
            ]);
            setDashboard(dash);
            setOpenIssues(issues);

            const [trend, compliance, mttrData, histData] = await Promise.all([
                window.api.clientHealth.getIncidentTrend(selectedClientId || undefined),
                window.api.sla.getComplianceTrend(selectedClientId || undefined),
                window.api.clientHealth.getMTTRTrend(selectedClientId || undefined),
                window.api.clientHealth.getHistory(selectedClientId || undefined, 12),
            ]);
            setIncidentTrend(trend);
            setComplianceTrend(compliance);
            setMttrTrend(mttrData);
            setHistory([...histData].reverse());
        } catch (e) {
            console.error('Error loading client health:', e);
        } finally {
            setLoading(false);
        }
    };

    const summary = React.useMemo(() => {
        if (selectedClientId) {
            return dashboard.find(d => d.clientId === selectedClientId) ?? dashboard[0];
        }
        if (!dashboard.length) return null;

        return {
            openIssues: dashboard.reduce((sum, d) => sum + (d.openIssues || 0), 0),
            slaBreaches: dashboard.reduce((sum, d) => sum + (d.slaBreaches || 0), 0),
            escalations: dashboard.reduce((sum, d) => sum + (d.escalations || 0), 0),
            preventiveActions: dashboard.reduce((sum, d) => sum + (d.preventiveActions || 0), 0),
            slaCompliancePct: dashboard.reduce((sum, d) => sum + (d.slaCompliancePct || 100), 0) / dashboard.length,
            stabilityScore: dashboard.reduce((sum, d) => sum + (d.stabilityScore || 100), 0) / dashboard.length,
        };
    }, [dashboard, selectedClientId]);

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

    const portfolioHealthData = React.useMemo(() => {
        if (!dashboard.length) return [];
        let healthy = 0;
        let atRisk = 0;
        let critical = 0;
        dashboard.forEach(d => {
            if (d.stabilityScore >= 80) healthy++;
            else if (d.stabilityScore >= 50) atRisk++;
            else critical++;
        });
        return [
            { name: 'Healthy', value: healthy, color: '#10b981' },
            { name: 'At Risk', value: atRisk, color: '#f59e0b' },
            { name: 'Critical', value: critical, color: '#ef4444' }
        ].filter(d => d.value > 0);
    }, [dashboard]);

    const severityData = React.useMemo(() => {
        const counts = { critical: 0, high: 0, medium: 0, low: 0 };
        openIssues.forEach(i => {
            const sev = (i.severity || 'low').toLowerCase() as keyof typeof counts;
            if (counts[sev] !== undefined) counts[sev]++;
            else counts.low++;
        });
        return [
            { name: 'Critical', value: counts.critical, color: '#ef4444' },
            { name: 'High', value: counts.high, color: '#f59e0b' },
            { name: 'Medium', value: counts.medium, color: '#eab308' },
            { name: 'Low', value: counts.low, color: '#3b82f6' }
        ].filter(d => d.value > 0);
    }, [openIssues]);

    const radarData = React.useMemo(() => {
        if (!summary) return [];
        return [
            { subject: 'SLA %', A: summary.slaCompliancePct ?? 100, fullMark: 100 },
            { subject: 'Stability', A: summary.stabilityScore ?? 100, fullMark: 100 },
            { subject: 'Preventive', A: Math.min((summary.preventiveActions ?? 0) * 10, 100), fullMark: 100 },
            { subject: 'Issues', A: Math.max(100 - ((summary.openIssues ?? 0) * 5), 0), fullMark: 100 },
            { subject: 'Escalations', A: Math.max(100 - ((summary.escalations ?? 0) * 20), 0), fullMark: 100 },
        ];
    }, [summary]);

    const fmtDate = (d: string | Date | null) =>
        d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—';

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

            {/* All clients grid (when no client selected) */}
            {!selectedClientId && dashboard.length > 0 && (
                <div className="portfolio-overview" style={{ marginTop: '2rem', marginBottom: '2rem' }}>
                    <h3 className="table-title" style={{ marginBottom: '1rem' }}>Client Overview Directory</h3>
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
                </div>
            )}

            {/* Charts */}
            <div className="charts-row" style={{ marginTop: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                {!selectedClientId && (
                    <Card className="chart-card">
                        <h3 className="chart-title">Overall Portfolio Health</h3>
                        <ResponsiveContainer width="100%" height={220}>
                            <PieChart>
                                <Pie
                                    data={portfolioHealthData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {portfolioHealthData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: 8 }} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </Card>
                )}

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

                {history.length > 0 && (
                    <Card className="chart-card chart-card--wide" style={{ gridColumn: '1 / -1' }}>
                        <h3 className="chart-title">Weekly Health Score History</h3>
                        <ResponsiveContainer width="100%" height={220}>
                            <LineChart data={history.map(h => ({
                                week: fmtDate(h.weekStart),
                                stability: Math.round(h.stabilityScore),
                                sla: Math.round(h.slaCompliancePct),
                            }))}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                                <XAxis dataKey="week" tick={{ fill: 'var(--color-text-secondary)', fontSize: 11 }} />
                                <YAxis domain={[0, 100]} tick={{ fill: 'var(--color-text-secondary)' }} />
                                <Tooltip contentStyle={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: 8 }} />
                                <Line type="monotone" dataKey="stability" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} name="Stability Score" />
                                <Line type="monotone" dataKey="sla" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} name="SLA %" />
                                <Legend />
                            </LineChart>
                        </ResponsiveContainer>
                    </Card>
                )}

                <Card className="chart-card">
                    <h3 className="chart-title">MTTR Trend (8 weeks)</h3>
                    <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={mttrTrend}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                            <XAxis dataKey="week" tick={{ fill: 'var(--color-text-secondary)', fontSize: 11 }} />
                            <YAxis tick={{ fill: 'var(--color-text-secondary)' }} />
                            <Tooltip contentStyle={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: 8 }} />
                            <Line type="monotone" dataKey="mttr" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} name="MTTR (Hours)" />
                        </LineChart>
                    </ResponsiveContainer>
                </Card>

                <Card className="chart-card">
                    <h3 className="chart-title">Open Issues by Severity</h3>
                    {severityData.length === 0 ? (
                        <div className="empty-state-small" style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>No open issues</div>
                    ) : (
                        <ResponsiveContainer width="100%" height={220}>
                            <PieChart>
                                <Pie
                                    data={severityData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {severityData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: 8 }} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </Card>

                {radarData.length > 0 && (
                    <Card className="chart-card">
                        <h3 className="chart-title">Stability Components</h3>
                        <ResponsiveContainer width="100%" height={220}>
                            <RadarChart outerRadius={70} data={radarData}>
                                <PolarGrid />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--color-text-secondary)', fontSize: 11 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                <Radar name="Health" dataKey="A" stroke="#6366f1" fill="#6366f1" fillOpacity={0.5} />
                                <Tooltip contentStyle={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: 8 }} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </Card>
                )}

                <Card className="chart-card">
                    <h3 className="chart-title">Preventive vs Reactive</h3>
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={[...history].reverse().map(h => ({
                            week: fmtDate(h.weekStart),
                            preventive: h.preventiveActions ?? 0,
                            reactive: (h.incidentCount ?? 0) + (h.slaBreaches ?? 0)
                        }))}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                            <XAxis dataKey="week" tick={{ fill: 'var(--color-text-secondary)', fontSize: 11 }} />
                            <YAxis tick={{ fill: 'var(--color-text-secondary)' }} />
                            <Tooltip contentStyle={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: 8 }} />
                            <Bar dataKey="preventive" stackId="a" fill="#10b981" name="Preventive Actions" />
                            <Bar dataKey="reactive" stackId="a" fill="#ef4444" name="Reactive (Breaches & Incidents)" />
                            <Legend />
                        </BarChart>
                    </ResponsiveContainer>
                </Card>
            </div>

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


        </div>
    );
};

export default ClientHealth;
