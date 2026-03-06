import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    LineChart, Line, BarChart, Bar,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import Loading from '../components/common/Loading';
import Card from '../components/common/Card';
import './ClientHealthDetail.css';

const fmt = (d: string | Date | null) =>
    d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

function ScoreDial({ value, label }: { value: number; label: string }) {
    const color = value >= 80 ? '#22c55e' : value >= 50 ? '#f59e0b' : '#ef4444';
    return (
        <div className="score-dial">
            <svg viewBox="0 0 80 80" className="dial-svg">
                <circle cx="40" cy="40" r="34" fill="none" stroke="var(--color-bg-hover)" strokeWidth="8" />
                <circle
                    cx="40" cy="40" r="34"
                    fill="none"
                    stroke={color}
                    strokeWidth="8"
                    strokeDasharray={`${(value / 100) * 213.6} 213.6`}
                    strokeLinecap="round"
                    transform="rotate(-90 40 40)"
                />
                <text x="40" y="44" textAnchor="middle" fill={color} fontSize="16" fontWeight="700">{value}</text>
            </svg>
            <span className="dial-label">{label}</span>
        </div>
    );
}

const ClientHealthDetail: React.FC = () => {
    const { clientId } = useParams<{ clientId: string }>();
    const navigate = useNavigate();

    const [client, setClient] = useState<any>(null);
    const [summary, setSummary] = useState<any>(null);
    const [history, setHistory] = useState<any[]>([]);
    const [incidentTrend, setIncidentTrend] = useState<any[]>([]);
    const [complianceTrend, setComplianceTrend] = useState<any[]>([]);
    const [openIssues, setOpenIssues] = useState<any[]>([]);
    const [visits, setVisits] = useState<any[]>([]);
    const [resets, setResets] = useState<any[]>([]);
    const [mbrs, setMbrs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [snapshotLoading, setSnapshotLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'overview' | 'issues' | 'history' | 'relationship'>('overview');

    const load = useCallback(async () => {
        if (!clientId) return;
        setLoading(true);
        try {
            const [clients, dash, issues, hist, trend, compliance, visitData, resetData, mbrData] = await Promise.all([
                window.api.clients.getAll(),
                window.api.clientHealth.getDashboard(clientId),
                window.api.sharedIssues.getAll({ clientId }),
                window.api.clientHealth.getHistory(clientId, 12),
                window.api.clientHealth.getIncidentTrend(clientId, 8),
                window.api.sla.getComplianceTrend(clientId, 8),
                window.api.officeVisits.getAll(clientId),
                window.api.resets.getAll(clientId),
                window.api.mbr.getAll(clientId),
            ]);
            const found = clients.find((c: any) => c.id === clientId);
            setClient(found);
            setSummary(dash.find((d: any) => d.clientId === clientId) ?? dash[0] ?? null);
            setOpenIssues(issues.filter((i: any) => ['open', 'in-progress'].includes(i.status)));
            setHistory([...hist].reverse()); // oldest first for charts
            setIncidentTrend(trend);
            setComplianceTrend(compliance);
            setVisits(visitData.slice(0, 5));
            setResets(resetData.slice(0, 5));
            setMbrs(mbrData.slice(0, 5));
        } catch (err) {
            console.error('Error loading client health detail:', err);
        } finally {
            setLoading(false);
        }
    }, [clientId]);

    useEffect(() => { load(); }, [load]);

    const handleGenerateSnapshot = async () => {
        if (!clientId) return;
        setSnapshotLoading(true);
        try {
            await window.api.clientHealth.generateSnapshot(clientId);
            await load();
        } finally {
            setSnapshotLoading(false);
        }
    };

    if (loading) return <Loading size="large" text="Loading client detail..." fullScreen />;
    if (!client) return (
        <div className="chd-not-found">
            <p>Client not found.</p>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/client-health')}>← Back</button>
        </div>
    );

    const getSlaColor = (v: number) => v >= 90 ? '#22c55e' : v >= 70 ? '#f59e0b' : '#ef4444';

    return (
        <div className="chd-page">
            {/* header */}
            <div className="chd-header">
                <button className="btn-back" onClick={() => navigate('/client-health')}>← Client Health</button>
                <div className="chd-header-top">
                    <div>
                        <h1 className="chd-title">🏢 {client.name}</h1>
                        <p className="chd-sub">{client.email ?? ''} {client.phone ? `• ${client.phone}` : ''}</p>
                    </div>
                    <button
                        className="btn btn-secondary btn-sm"
                        onClick={handleGenerateSnapshot}
                        disabled={snapshotLoading}
                    >
                        {snapshotLoading ? '⏳ Generating…' : '📸 Snapshot Now'}
                    </button>
                </div>

                {/* top metric row */}
                {summary && (
                    <div className="chd-metrics">
                        <div className="chd-metric">
                            <span className="chd-metric-val">{summary.openIssues}</span>
                            <span className="chd-metric-lbl">Open Issues</span>
                        </div>
                        <div className="chd-metric danger">
                            <span className="chd-metric-val">{summary.slaBreaches}</span>
                            <span className="chd-metric-lbl">SLA Breaches</span>
                        </div>
                        <div className="chd-metric warn">
                            <span className="chd-metric-val">{summary.escalations}</span>
                            <span className="chd-metric-lbl">Escalations</span>
                        </div>
                        <div className="chd-metric good">
                            <span className="chd-metric-val">{summary.preventiveActions}</span>
                            <span className="chd-metric-lbl">Preventive Actions</span>
                        </div>
                        <ScoreDial value={Math.round(summary.slaCompliancePct ?? 100)} label="SLA %" />
                        <ScoreDial value={Math.round(summary.stabilityScore ?? 100)} label="Stability" />
                    </div>
                )}
            </div>

            {/* tabs */}
            <div className="chd-tabs">
                {(['overview', 'issues', 'history', 'relationship'] as const).map(tab => (
                    <button
                        key={tab}
                        className={`chd-tab ${activeTab === tab ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab === 'overview' ? '📊 Overview' : tab === 'issues' ? `🔗 Issues (${openIssues.length})` : tab === 'history' ? '📈 History' : '🤝 Relationship'}
                    </button>
                ))}
            </div>

            {/* ── OVERVIEW ── */}
            {activeTab === 'overview' && (
                <div className="chd-charts">
                    <Card className="chart-card">
                        <h3 className="chart-title">SLA Compliance Trend (8 weeks)</h3>
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
                        <h3 className="chart-title">Incident Frequency (8 weeks)</h3>
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={incidentTrend}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                                <XAxis dataKey="week" tick={{ fill: 'var(--color-text-secondary)', fontSize: 11 }} />
                                <YAxis tick={{ fill: 'var(--color-text-secondary)' }} />
                                <Tooltip contentStyle={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: 8 }} />
                                <Bar dataKey="incidents" fill="#6366f1" name="Incidents" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="breaches" fill="#ef4444" name="SLA Breaches" radius={[4, 4, 0, 0]} />
                                <Legend />
                            </BarChart>
                        </ResponsiveContainer>
                    </Card>
                    {history.length > 0 && (
                        <Card className="chart-card chart-card--wide">
                            <h3 className="chart-title">Weekly Health Score History</h3>
                            <ResponsiveContainer width="100%" height={220}>
                                <LineChart data={history.map(h => ({
                                    week: fmt(h.weekStart),
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
                </div>
            )}

            {/* ── ISSUES TAB ── */}
            {activeTab === 'issues' && (
                <Card className="chd-issues-card">
                    <div className="chd-card-header">
                        <h3>Open Shared Issues</h3>
                        <button className="btn btn-primary btn-sm" onClick={() => navigate('/shared-issues')}>+ New Issue</button>
                    </div>
                    {openIssues.length === 0 ? (
                        <div className="empty-state">🎉 No open issues for this client</div>
                    ) : (
                        <table className="gov-table">
                            <thead>
                                <tr>
                                    <th>Title</th>
                                    <th>Severity</th>
                                    <th>SLA</th>
                                    <th>Escalation</th>
                                    <th>Owner</th>
                                    <th>Raised</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {openIssues.map((issue: any) => (
                                    <tr key={issue.id} className="clickable-row" onClick={() => navigate(`/shared-issues/${issue.id}`)}>
                                        <td className="issue-title">{issue.title}</td>
                                        <td><span className={`badge sev-badge sev-${issue.severity}`}>{issue.severity}</span></td>
                                        <td><span className={`badge sla-badge sla-${issue.slaStatus}`}>{issue.slaStatus}</span></td>
                                        <td>
                                            {issue.escalationLevel > 0
                                                ? <span className="badge esc-badge">L{issue.escalationLevel}</span>
                                                : <span className="text-secondary">—</span>}
                                        </td>
                                        <td>{issue.assignedOwner?.fullName ?? '—'}</td>
                                        <td className="text-secondary">{fmt(issue.raisedAt)}</td>
                                        <td><button className="btn-link">View →</button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </Card>
            )}

            {/* ── HISTORY TAB ── */}
            {activeTab === 'history' && (
                <Card className="chd-history-card">
                    <h3 className="chd-card-title">Weekly Health Snapshots</h3>
                    {history.length === 0 ? (
                        <div className="empty-state">
                            <p>No weekly snapshots yet.</p>
                            <button className="btn btn-primary btn-sm" onClick={handleGenerateSnapshot} disabled={snapshotLoading}>
                                {snapshotLoading ? 'Generating…' : '📸 Generate First Snapshot'}
                            </button>
                        </div>
                    ) : (
                        <table className="gov-table">
                            <thead>
                                <tr>
                                    <th>Week</th>
                                    <th>Open</th>
                                    <th>Resolved</th>
                                    <th>SLA Breaches</th>
                                    <th>Escalations</th>
                                    <th>SLA %</th>
                                    <th>Stability</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[...history].reverse().map((h: any) => (
                                    <tr key={h.id}>
                                        <td>{fmt(h.weekStart)}</td>
                                        <td>{h.openIssues}</td>
                                        <td>{h.resolvedIssues}</td>
                                        <td>
                                            <span style={{ color: h.slaBreaches > 0 ? '#ef4444' : 'inherit' }}>
                                                {h.slaBreaches}
                                            </span>
                                        </td>
                                        <td>{h.escalations}</td>
                                        <td>
                                            <span style={{ color: getSlaColor(h.slaCompliancePct), fontWeight: 600 }}>
                                                {Math.round(h.slaCompliancePct)}%
                                            </span>
                                        </td>
                                        <td>
                                            <span style={{ color: getSlaColor(h.stabilityScore), fontWeight: 600 }}>
                                                {Math.round(h.stabilityScore)}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </Card>
            )}

            {/* ── RELATIONSHIP TAB ── */}
            {activeTab === 'relationship' && (
                <div className="chd-relationship">
                    {/* Office Visits */}
                    <Card className="rel-card">
                        <div className="chd-card-header">
                            <h3>Recent Office Visits</h3>
                            <button className="btn btn-sm btn-secondary" onClick={() => navigate('/office-visits')}>View All</button>
                        </div>
                        {visits.length === 0 ? (
                            <div className="empty-state-small">No office visits logged yet.</div>
                        ) : (
                            <div className="rel-list">
                                {visits.map((v: any) => (
                                    <div key={v.id} className="rel-entry">
                                        <div className="rel-entry-date">{fmt(v.visitDate)}</div>
                                        <div className="rel-entry-body">
                                            <p className="rel-entry-title">Visited by {v.visitedBy?.fullName ?? '—'}</p>
                                            {v.agenda && <p className="rel-entry-sub">Agenda: {v.agenda}</p>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>

                    {/* Relationship Resets */}
                    <Card className="rel-card">
                        <div className="chd-card-header">
                            <h3>Relationship Resets</h3>
                            <button className="btn btn-sm btn-secondary" onClick={() => navigate('/relationship-resets')}>View All</button>
                        </div>
                        {resets.length === 0 ? (
                            <div className="empty-state-small">No relationship resets recorded.</div>
                        ) : (
                            <div className="rel-list">
                                {resets.map((r: any) => (
                                    <div key={r.id} className={`rel-entry reset-entry reset-${r.status}`}>
                                        <div className="rel-entry-date">{fmt(r.resetDate)}</div>
                                        <div className="rel-entry-body">
                                            <p className="rel-entry-title">{r.reason}</p>
                                            <span className={`badge status-badge status-${r.status}`}>{r.status}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>

                    {/* MBR */}
                    <Card className="rel-card rel-card--wide">
                        <div className="chd-card-header">
                            <h3>Monthly Business Reviews</h3>
                            <button className="btn btn-sm btn-secondary" onClick={() => navigate('/mbr')}>View All</button>
                        </div>
                        {mbrs.length === 0 ? (
                            <div className="empty-state-small">No MBRs yet for this client.</div>
                        ) : (
                            <table className="gov-table">
                                <thead>
                                    <tr>
                                        <th>Month</th>
                                        <th>Status</th>
                                        <th>Uptime</th>
                                        <th>SLA %</th>
                                        <th>Issues</th>
                                        <th>Escalations</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {mbrs.map((m: any) => (
                                        <tr key={m.id}>
                                            <td>{fmt(m.reviewMonth)}</td>
                                            <td><span className={`badge status-badge status-${m.status}`}>{m.status}</span></td>
                                            <td>{m.uptimePct != null ? `${m.uptimePct}%` : '—'}</td>
                                            <td>{m.slaCompliancePct != null ? `${m.slaCompliancePct}%` : '—'}</td>
                                            <td>{m.totalIssues ?? '—'}</td>
                                            <td>{m.escalationCount ?? '—'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </Card>
                </div>
            )}
        </div>
    );
};

export default ClientHealthDetail;
