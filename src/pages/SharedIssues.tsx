import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/common/Card';
import Loading from '../components/common/Loading';
import { useAuth } from '../contexts/AuthContext';
import { exportSharedIssuesCsv } from '../utils/pdfGenerator';
import './SharedIssues.css';

const STATUS_OPTIONS = ['open', 'in-progress', 'resolved', 'closed'];
const SEVERITY_OPTIONS = ['critical', 'high', 'medium', 'low'];
const SLA_OPTIONS = ['on-track', 'at-risk', 'breached'];

const SharedIssues: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [issues, setIssues] = useState<any[]>([]);
    const [clients, setClients] = useState<any[]>([]);
    const [developers, setDevelopers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState<any>({});
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState<any>({ severity: 'high', visibility: 'internal' });

    useEffect(() => {
        loadAll();
    }, []);

    useEffect(() => {
        loadIssues();
    }, [filters]);

    const loadAll = async () => {
        const [allClients, allDevs] = await Promise.all([
            window.api.clients.getAll(),
            window.api.developers.getAll(),
        ]);
        setClients(allClients);
        setDevelopers(allDevs.filter((d: any) => d.role === 'developer' || d.role === 'manager'));
        await loadIssues();
    };

    const loadIssues = async () => {
        setLoading(true);
        try {
            const data = await window.api.sharedIssues.getAll(filters);
            setIssues(data);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!form.clientId || !form.title || !form.description || !form.assignedOwnerId) return;

        await window.api.sharedIssues.create({ ...form, createdById: user?.id || form.assignedOwnerId });
        setShowForm(false);
        setForm({ severity: 'high', visibility: 'internal' });
        loadIssues();
    };

    const handleAcknowledge = async (issue: any, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await window.api.sharedIssues.acknowledge(issue.id, user?.id || issue.assignedOwnerId);
            loadIssues();
        } catch (err: any) {
            console.error('Acknowledge failed:', err);
        }
    };

    const handleEscalationChange = async (issue: any, newLevel: number) => {
        await window.api.sharedIssues.setEscalation(issue.id, newLevel, user?.id || issue.assignedOwnerId);
        loadIssues();
    };

    const handleToggleVisibility = async (issue: any, e: React.MouseEvent) => {
        e.stopPropagation();
        await window.api.sharedIssues.toggleVisibility(issue.id, user?.id || issue.assignedOwnerId);
        loadIssues();
    };

    const setFilter = (key: string, value: string) => {
        setFilters((prev: any) => value ? { ...prev, [key]: value } : Object.fromEntries(Object.entries(prev).filter(([k]) => k !== key)));
    };

    return (
        <div className="shared-issues-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">🔗 Shared Issue Tracker</h1>
                    <p className="page-subtitle">Client-facing issues with SLA tracking and escalation management</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => exportSharedIssuesCsv(issues)} disabled={issues.length === 0}>
                        ⬇️ CSV
                    </button>
                    <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>+ New Issue</button>
                </div>
            </div>

            {/* Filters */}
            <Card className="filters-card">
                <div className="filters-row">
                    <select className="filter-select" onChange={e => setFilter('clientId', e.target.value)}>
                        <option value="">All Clients</option>
                        {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <select className="filter-select" onChange={e => setFilter('severity', e.target.value)}>
                        <option value="">All Severities</option>
                        {SEVERITY_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <select className="filter-select" onChange={e => setFilter('status', e.target.value)}>
                        <option value="">All Statuses</option>
                        {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <select className="filter-select" onChange={e => setFilter('slaStatus', e.target.value)}>
                        <option value="">All SLA</option>
                        {SLA_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
            </Card>

            {/* Issue table */}
            {loading ? <Loading size="medium" text="Loading issues..." /> : (
                <Card className="table-card">
                    <div className="results-count">{issues.length} issues</div>
                    <div className="table-responsive">
                        <table className="gov-table">
                            <thead>
                                <tr>
                                    <th>Title</th>
                                    <th>Client</th>
                                    <th>Severity</th>
                                    <th>SLA Status</th>
                                    <th>Acknowledge</th>
                                    <th>Escalation</th>
                                    <th>Visibility</th>
                                    <th>Owner</th>
                                    <th>Raised</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {issues.map((issue: any) => (
                                    <tr key={issue.id} onClick={() => navigate(`/shared-issues/${issue.id}`)} className="clickable-row">
                                        <td className="issue-title">{issue.title}</td>
                                        <td className="text-secondary">{issue.client?.name}</td>
                                        <td><span className={`sev-badge sev-${issue.severity}`}>{issue.severity}</span></td>
                                        <td>
                                            <span className={`sla-badge sla-${issue.slaStatus}`}>
                                                {issue.slaStatus === 'pending' ? '⏸ Pending' : issue.slaStatus}
                                            </span>
                                        </td>
                                        <td onClick={e => e.stopPropagation()}>
                                            {!issue.acknowledgedAt ? (
                                                <button
                                                    className="ack-btn"
                                                    onClick={e => handleAcknowledge(issue, e)}
                                                    title="Acknowledge issue and start SLA clock"
                                                >
                                                    ✅ Acknowledge
                                                </button>
                                            ) : (
                                                <span className="ack-done">✅ Acknowledged</span>
                                            )}
                                        </td>
                                        <td onClick={e => e.stopPropagation()}>
                                            <select
                                                className="esc-select"
                                                value={issue.escalationLevel}
                                                onChange={e => handleEscalationChange(issue, Number(e.target.value))}
                                            >
                                                <option value={0}>None</option>
                                                <option value={1}>L1</option>
                                                <option value={2}>L2</option>
                                                <option value={3}>L3</option>
                                            </select>
                                        </td>
                                        <td>
                                            <button
                                                className={`vis-toggle ${issue.visibility}`}
                                                onClick={e => handleToggleVisibility(issue, e)}
                                                title="Toggle visibility"
                                            >
                                                {issue.visibility === 'client' ? '👁 Client' : '🔒 Internal'}
                                            </button>
                                        </td>
                                        <td>{issue.assignedOwner?.fullName}</td>
                                        <td className="text-secondary">{new Date(issue.raisedAt).toLocaleDateString()}</td>
                                        <td>
                                            <div className="action-buttons" onClick={e => e.stopPropagation()}>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {issues.length === 0 && <div className="empty-state-small">No issues found</div>}
                </Card>
            )}

            {/* Create Modal */}
            {showForm && (
                <div className="modal-overlay" onClick={() => setShowForm(false)}>
                    <div className="modal-box" onClick={e => e.stopPropagation()}>
                        <h2 className="modal-title">New Shared Issue</h2>
                        <div className="form-grid">
                            <select className="form-select" value={form.clientId || ''} onChange={e => setForm({ ...form, clientId: e.target.value })}>
                                <option value="">Select Client *</option>
                                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                            <input className="form-input" placeholder="Issue Title *" value={form.title || ''} onChange={e => setForm({ ...form, title: e.target.value })} />
                            <textarea className="form-textarea form-full" placeholder="Description *" value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} />
                            <select className="form-select" value={form.severity} onChange={e => setForm({ ...form, severity: e.target.value })}>
                                {SEVERITY_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                            <select className="form-select" value={form.assignedOwnerId || ''} onChange={e => setForm({ ...form, assignedOwnerId: e.target.value })}>
                                <option value="">Assign Owner *</option>
                                {developers.map((d: any) => <option key={d.id} value={d.id}>{d.fullName}</option>)}
                            </select>
                            <select className="form-select" value={form.visibility} onChange={e => setForm({ ...form, visibility: e.target.value })}>
                                <option value="internal">Internal Only</option>
                                <option value="client">Visible to Client</option>
                            </select>
                            <input className="form-input form-full" type="datetime-local" placeholder="Expected Resolution" onChange={e => setForm({ ...form, expectedResolution: e.target.value })} />
                        </div>
                        <div className="modal-actions">
                            <button className="btn btn-secondary btn-sm" onClick={() => setShowForm(false)}>Cancel</button>
                            <button className="btn btn-primary btn-sm" onClick={handleCreate}>Create Issue</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SharedIssues;
