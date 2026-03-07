import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Loading from '../components/common/Loading';
import { useAuth } from '../contexts/AuthContext';
import './SharedIssueDetail.css';

// ── helpers ──────────────────────────────────────────────────────────────────
const fmt = (d: string | Date | null) =>
    d ? new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

const fmtDate = (d: string | Date | null) =>
    d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

function SlaBar({ issue }: { issue: any }) {
    const slaStart = issue.slaStartedAt ? new Date(issue.slaStartedAt) : null;
    if (!slaStart || !issue.resolutionDeadline) return null;
    const total = new Date(issue.resolutionDeadline).getTime() - slaStart.getTime();
    const elapsed = Date.now() - slaStart.getTime();
    const pct = Math.min(100, Math.round((elapsed / total) * 100));
    const colorClass = issue.slaStatus === 'breached' ? 'breached' : issue.slaStatus === 'at-risk' ? 'at-risk' : 'on-track';
    return (
        <div className="sla-bar-wrap">
            <div className="sla-bar-labels">
                <span>SLA consumed: {pct}%</span>
                <span>Deadline: {fmt(issue.resolutionDeadline)}</span>
            </div>
            <div className="sla-bar-bg">
                <div className={`sla-bar-fill ${colorClass}`} style={{ width: `${pct}%` }} />
            </div>
        </div>
    );
}

function SlaBadge({ status }: { status: string }) {
    const map: Record<string, string> = {
        'on-track': '🟢 On Track',
        'at-risk': '🟡 At Risk',
        'breached': '🔴 Breached',
        'pending': '⏸ Pending',
    };
    return <span className={`badge sla-badge sla-${status}`}>{map[status] ?? status}</span>;
}

function SevBadge({ severity }: { severity: string }) {
    const map: Record<string, string> = { critical: '🔴', high: '🟠', medium: '🟡', low: '🔵' };
    return <span className={`badge sev-badge sev-${severity}`}>{map[severity] ?? ''} {severity}</span>;
}

function EscBadge({ level }: { level: number }) {
    const labels = ['', 'L1 — Team Lead', 'L2 — Director', 'L3 — Executive'];
    if (!level) return <span className="badge esc-none">None</span>;
    return <span className={`badge esc-badge esc-${level}`}>{labels[level]}</span>;
}

const ESCALATION_LABELS = ['None', 'L1 — Team Lead', 'L2 — Director', 'L3 — Executive'];
const STATUS_OPTIONS = ['open', 'in-progress', 'resolved', 'closed'];

// ── main component ────────────────────────────────────────────────────────────
const SharedIssueDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [issue, setIssue] = useState<any>(null);
    const [updates, setUpdates] = useState<any[]>([]);
    const [developers, setDevelopers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'timeline' | 'activity' | 'details'>('timeline');

    // forms
    const [updateText, setUpdateText] = useState('');
    const [updateType, setUpdateType] = useState<'update' | 'ack' | 'rca'>('update');
    const [addingUpdate, setAddingUpdate] = useState(false);
    const [showEditStatus, setShowEditStatus] = useState(false);
    const [showEditDetails, setShowEditDetails] = useState(false);
    const [editForm, setEditForm] = useState<any>({});

    const { user } = useAuth();
    const currentUserId = user?.id;

    const loadIssue = useCallback(async () => {
        if (!id) return;
        try {
            const [issueData, updateData, devData] = await Promise.all([
                window.api.sharedIssues.getById(id),
                window.api.incidents.getUpdates(id),
                window.api.developers.getAll(),
            ]);
            setIssue(issueData);
            setUpdates(updateData);
            setDevelopers(devData);
            setEditForm({
                title: issueData?.title,
                description: issueData?.description,
                severity: issueData?.severity,
                assignedOwnerId: issueData?.assignedOwnerId,
                expectedResolution: issueData?.expectedResolution
                    ? new Date(issueData.expectedResolution).toISOString().slice(0, 10)
                    : '',
                rootCause: issueData?.rootCause ?? '',
                resolutionSummary: issueData?.resolutionSummary ?? '',
                notes: issueData?.notes ?? '',
            });
        } catch (err) {
            console.error('Error loading issue:', err);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => { loadIssue(); }, [loadIssue]);

    const handleAddUpdate = async () => {
        if (!updateText.trim() || !id) return;
        const actorId = currentUserId || issue?.assignedOwnerId;
        if (!actorId) return;
        setAddingUpdate(true);
        try {
            await window.api.incidents.addUpdate({
                sharedIssueId: id,
                authorId: actorId,
                updateText,
                isAcknowledgement: updateType === 'ack',
                isRca: updateType === 'rca',
            });
            setUpdateText('');
            setUpdateType('update');
            await loadIssue();
        } finally {
            setAddingUpdate(false);
        }
    };

    const handleStatusChange = async (newStatus: string) => {
        if (!id) return;
        const actorId = currentUserId || issue?.assignedOwnerId;
        if (!actorId) return;
        await window.api.sharedIssues.updateStatus(id, newStatus, actorId);
        setShowEditStatus(false);
        loadIssue();
    };

    const handleEscalate = async () => {
        if (!id) return;
        const actorId = currentUserId || issue?.assignedOwnerId;
        if (!actorId) return;
        await window.api.sharedIssues.escalate(id, actorId);
        loadIssue();
    };

    const handleAcknowledge = async () => {
        if (!id) return;
        const actorId = currentUserId || issue?.assignedOwnerId;
        if (!actorId) return;
        try {
            await window.api.sharedIssues.acknowledge(id, actorId);
            loadIssue();
        } catch (err: any) {
            console.error('Acknowledge failed:', err);
        }
    };

    const handleToggleVisibility = async () => {
        if (!id) return;
        const actorId = currentUserId || issue?.assignedOwnerId;
        if (!actorId) return;
        await window.api.sharedIssues.toggleVisibility(id, actorId);
        loadIssue();
    };

    const handleSaveDetails = async () => {
        if (!id) return;
        // Use the assigned owner as the actor (no auth context available yet)
        const actorId = editForm.assignedOwnerId || issue?.assignedOwnerId;
        if (!actorId) return;
        await window.api.sharedIssues.update(id, editForm, actorId);
        setShowEditDetails(false);
        loadIssue();
    };

    const handleMarkNotified = async (updateId: string) => {
        await window.api.incidents.markClientNotified(updateId);
        loadIssue();
    };

    if (loading) return <Loading size="large" text="Loading issue..." />;
    if (!issue) return (
        <div className="sid-not-found">
            <p>Issue not found.</p>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/shared-issues')}>← Back</button>
        </div>
    );

    const isResolved = issue.status === 'resolved' || issue.status === 'closed';

    return (
        <div className="sid-page">
            {/* ── header ── */}
            <div className="sid-header">
                <button className="btn-back" onClick={() => navigate('/shared-issues')}>← Back</button>
                <div className="sid-header-meta">
                    <div className="sid-badges">
                        <SevBadge severity={issue.severity} />
                        <SlaBadge status={issue.slaStatus} />
                        <EscBadge level={issue.escalationLevel} />
                        <span className={`badge status-badge status-${issue.status}`}>{issue.status}</span>
                        <span className={`badge vis-badge ${issue.visibility}`}>
                            {issue.visibility === 'client' ? '👁 Client' : '🔒 Internal'}
                        </span>
                    </div>
                    <div className="sid-actions">
                        {/* Acknowledge CTA — shown until issue is acknowledged */}
                        {!issue.acknowledgedAt && !isResolved && (
                            <button className="ack-cta" onClick={handleAcknowledge}>
                                ✅ Acknowledge &amp; Start SLA
                            </button>
                        )}
                        <button className="btn btn-sm btn-secondary" onClick={handleToggleVisibility}>
                            {issue.visibility === 'client' ? '🔒 Make Internal' : '👁 Share with Client'}
                        </button>
                        {!isResolved && (
                            <button
                                className="btn btn-sm btn-warning"
                                onClick={handleEscalate}
                                disabled={issue.escalationLevel >= 3}
                            >
                                ↑ Escalate {issue.escalationLevel > 0 ? `to ${ESCALATION_LABELS[Math.min(issue.escalationLevel + 1, 3)]}` : ''}
                            </button>
                        )}
                        <button className="btn btn-sm btn-secondary" onClick={() => setShowEditStatus(true)}>
                            Change Status
                        </button>
                    </div>
                </div>
                <h1 className="sid-title">{issue.title}</h1>
                <div className="sid-subtitle">
                    <span>🏢 {issue.client?.name}</span>
                    <span>•</span>
                    <span>Raised {fmt(issue.raisedAt)}</span>
                    <span>•</span>
                    <span>Owner: {issue.assignedOwner?.fullName ?? '—'}</span>
                    {issue.firstResponseAt && <><span>•</span><span>✅ First response: {fmt(issue.firstResponseAt)}</span></>}
                </div>

                {/* SLA progress bar — only shown after acknowledgement */}
                {!isResolved && issue.slaStartedAt && <SlaBar issue={issue} />}
                {!isResolved && !issue.acknowledgedAt && (
                    <div className="ack-pending-banner">
                        ⏸ SLA timer has not started yet — click <strong>Acknowledge &amp; Start SLA</strong> to begin tracking.
                    </div>
                )}
                {isResolved && issue.resolvedAt && (
                    <div className="sid-resolved-note">✅ Resolved on {fmt(issue.resolvedAt)}</div>
                )}
            </div>

            {/* ── tabs ── */}
            <div className="sid-tabs">
                {(['timeline', 'activity', 'details'] as const).map(tab => (
                    <button
                        key={tab}
                        className={`sid-tab ${activeTab === tab ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab === 'timeline' ? '📡 Incident Timeline' : tab === 'activity' ? '📋 Activity Log' : '📝 Details'}
                    </button>
                ))}
            </div>

            <div className="sid-body">
                {/* ─── TIMELINE TAB ─── */}
                {activeTab === 'timeline' && (
                    <div className="sid-timeline">
                        {/* Add update form */}
                        {!isResolved && (
                            <div className="update-composer">
                                <div className="update-type-tabs">
                                    {(['update', 'ack', 'rca'] as const).map(t => (
                                        <button
                                            key={t}
                                            className={`update-type-btn ${updateType === t ? 'active' : ''}`}
                                            onClick={() => setUpdateType(t)}
                                        >
                                            {t === 'update' ? '📢 Status Update' : t === 'ack' ? '✅ Acknowledgement' : '🔍 RCA Upload'}
                                        </button>
                                    ))}
                                </div>
                                <textarea
                                    className="update-textarea"
                                    placeholder={
                                        updateType === 'ack' ? 'Describe acknowledgement and initial assessment…'
                                            : updateType === 'rca' ? 'Root Cause Analysis details. Include root cause, impact, and preventive measures…'
                                                : 'Provide a status update for this incident…'
                                    }
                                    value={updateText}
                                    onChange={e => setUpdateText(e.target.value)}
                                    rows={4}
                                />
                                <div className="update-composer-footer">
                                    <button
                                        className="btn btn-primary btn-sm"
                                        onClick={handleAddUpdate}
                                        disabled={addingUpdate || !updateText.trim()}
                                    >
                                        {addingUpdate ? 'Posting…' : 'Post Update'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Feed */}
                        {updates.length === 0 ? (
                            <div className="empty-feed">No incident updates yet. Post the first update above.</div>
                        ) : (
                            <div className="incident-feed">
                                {updates.map((u: any) => (
                                    <div key={u.id} className={`incident-entry ${u.isAcknowledgement ? 'ack' : u.isRca ? 'rca' : 'update'}`}>
                                        <div className="incident-entry-header">
                                            <div className="incident-entry-meta">
                                                {u.isAcknowledgement && <span className="entry-type-badge ack">✅ Acknowledgement</span>}
                                                {u.isRca && <span className="entry-type-badge rca">🔍 RCA</span>}
                                                {!u.isAcknowledgement && !u.isRca && <span className="entry-type-badge upd">📢 Update</span>}
                                                <span className="entry-author">{u.author?.fullName ?? 'System'}</span>
                                                <span className="entry-time">{fmt(u.createdAt)}</span>
                                            </div>
                                            {!u.notifiedClient && (
                                                <button
                                                    className="btn btn-xs btn-outline"
                                                    onClick={() => handleMarkNotified(u.id)}
                                                    title="Mark client as notified"
                                                >
                                                    Notify Client
                                                </button>
                                            )}
                                            {u.notifiedClient && <span className="notified-tag">📨 Client notified</span>}
                                        </div>
                                        <p className="incident-entry-text">{u.updateText}</p>
                                        {u.rcaFilePath && (
                                            <p className="rca-file">📎 RCA file: {u.rcaFilePath}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ─── ACTIVITY LOG TAB ─── */}
                {activeTab === 'activity' && (
                    <div className="sid-activity">
                        {issue.activities?.length === 0 ? (
                            <div className="empty-feed">No activity yet.</div>
                        ) : (
                            <div className="activity-list">
                                {(issue.activities ?? []).map((a: any) => {
                                    const details = a.details ? JSON.parse(a.details) : {};
                                    return (
                                        <div key={a.id} className="activity-entry">
                                            <div className="activity-dot" />
                                            <div className="activity-content">
                                                <span className="activity-actor">{a.user?.fullName ?? 'System'}</span>
                                                {' '}
                                                <span className="activity-action">
                                                    {a.activityType === 'status_changed'
                                                        ? `changed status from "${details.from}" → "${details.to}"`
                                                        : a.activityType === 'escalated'
                                                            ? `escalated from L${details.from} to L${details.to}`
                                                            : a.activityType === 'visibility_changed'
                                                                ? `changed visibility to "${details.to}"`
                                                                : a.activityType === 'first_response'
                                                                    ? 'marked first response'
                                                                    : a.activityType === 'rca_uploaded'
                                                                        ? 'uploaded RCA'
                                                                        : a.activityType === 'acknowledged'
                                                                            ? 'acknowledged the incident'
                                                                            : a.activityType}
                                                </span>
                                                <span className="activity-time">{fmt(a.createdAt)}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* ─── DETAILS TAB ─── */}
                {activeTab === 'details' && (
                    <div className="sid-details">
                        {!showEditDetails ? (
                            <>
                                <div className="details-grid">
                                    <div className="detail-row"><span className="detail-label">Client</span><span>{issue.client?.name}</span></div>
                                    <div className="detail-row"><span className="detail-label">Severity</span><SevBadge severity={issue.severity} /></div>
                                    <div className="detail-row"><span className="detail-label">Owner</span><span>{issue.assignedOwner?.fullName}</span></div>
                                    <div className="detail-row"><span className="detail-label">Status</span><span className={`badge status-badge status-${issue.status}`}>{issue.status}</span></div>
                                    <div className="detail-row"><span className="detail-label">Raised</span><span>{fmt(issue.raisedAt)}</span></div>
                                    <div className="detail-row"><span className="detail-label">Acknowledged</span><span>{issue.acknowledgedAt ? fmt(issue.acknowledgedAt) : <em className="text-muted">Not yet acknowledged</em>}</span></div>
                                    <div className="detail-row"><span className="detail-label">First Response</span><span>{issue.firstResponseAt ? fmt(issue.firstResponseAt) : <em className="text-muted">Not yet</em>}</span></div>
                                    <div className="detail-row"><span className="detail-label">Response Deadline</span><span>{fmt(issue.responseDeadline)}</span></div>
                                    <div className="detail-row"><span className="detail-label">Resolution Deadline</span><span>{fmt(issue.resolutionDeadline)}</span></div>
                                    <div className="detail-row"><span className="detail-label">Expected Resolution</span><span>{issue.expectedResolution ? fmtDate(issue.expectedResolution) : '—'}</span></div>
                                    <div className="detail-row"><span className="detail-label">Resolved</span><span>{issue.resolvedAt ? fmt(issue.resolvedAt) : '—'}</span></div>
                                    <div className="detail-row detail-full"><span className="detail-label">Description</span><p className="detail-text">{issue.description}</p></div>
                                    {issue.rootCause && <div className="detail-row detail-full"><span className="detail-label">Root Cause</span><p className="detail-text">{issue.rootCause}</p></div>}
                                    {issue.resolutionSummary && <div className="detail-row detail-full"><span className="detail-label">Resolution Summary</span><p className="detail-text">{issue.resolutionSummary}</p></div>}
                                    {issue.notes && <div className="detail-row detail-full"><span className="detail-label">Notes</span><p className="detail-text">{issue.notes}</p></div>}
                                </div>
                                <button className="btn btn-secondary btn-sm" onClick={() => setShowEditDetails(true)}>✏️ Edit Details</button>
                            </>
                        ) : (
                            <div className="edit-details-form">
                                <h3>Edit Issue Details</h3>
                                <div className="form-grid">
                                    <label className="form-label form-full">Title
                                        <input className="form-input" value={editForm.title || ''} onChange={e => setEditForm({ ...editForm, title: e.target.value })} />
                                    </label>
                                    <label className="form-label form-full">Description
                                        <textarea className="form-textarea" rows={4} value={editForm.description || ''} onChange={e => setEditForm({ ...editForm, description: e.target.value })} />
                                    </label>
                                    <label className="form-label">Severity
                                        <select className="form-select" value={editForm.severity} onChange={e => setEditForm({ ...editForm, severity: e.target.value })}>
                                            {['critical', 'high', 'medium', 'low'].map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </label>
                                    <label className="form-label">Owner
                                        <select className="form-select" value={editForm.assignedOwnerId || ''} onChange={e => setEditForm({ ...editForm, assignedOwnerId: e.target.value })}>
                                            {developers.map((d: any) => <option key={d.id} value={d.id}>{d.fullName}</option>)}
                                        </select>
                                    </label>
                                    <label className="form-label">Expected Resolution
                                        <input className="form-input" type="date" value={editForm.expectedResolution ? String(editForm.expectedResolution).slice(0, 10) : ''} onChange={e => setEditForm({ ...editForm, expectedResolution: e.target.value })} />
                                    </label>
                                    <label className="form-label form-full">Root Cause
                                        <textarea className="form-textarea" rows={3} value={editForm.rootCause || ''} placeholder="What caused this issue?" onChange={e => setEditForm({ ...editForm, rootCause: e.target.value })} />
                                    </label>
                                    <label className="form-label form-full">Resolution Summary
                                        <textarea className="form-textarea" rows={3} value={editForm.resolutionSummary || ''} placeholder="How was it resolved?" onChange={e => setEditForm({ ...editForm, resolutionSummary: e.target.value })} />
                                    </label>
                                    <label className="form-label form-full">Notes
                                        <textarea className="form-textarea" rows={2} value={editForm.notes || ''} onChange={e => setEditForm({ ...editForm, notes: e.target.value })} />
                                    </label>
                                </div>
                                <div className="form-actions">
                                    <button className="btn btn-secondary btn-sm" onClick={() => setShowEditDetails(false)}>Cancel</button>
                                    <button className="btn btn-primary btn-sm" onClick={handleSaveDetails}>Save Changes</button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ── Status change modal ── */}
            {showEditStatus && (
                <div className="modal-overlay" onClick={() => setShowEditStatus(false)}>
                    <div className="modal-box small" onClick={e => e.stopPropagation()}>
                        <h3>Change Status</h3>
                        <div className="status-options">
                            {STATUS_OPTIONS.map(s => (
                                <button
                                    key={s}
                                    className={`status-option-btn ${issue.status === s ? 'current' : ''}`}
                                    onClick={() => handleStatusChange(s)}
                                >
                                    <span className={`badge status-badge status-${s}`}>{s}</span>
                                </button>
                            ))}
                        </div>
                        <button className="btn btn-secondary btn-sm" style={{ marginTop: '1rem' }} onClick={() => setShowEditStatus(false)}>Cancel</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SharedIssueDetail;
