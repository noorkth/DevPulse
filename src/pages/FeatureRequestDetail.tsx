import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Loading from '../components/common/Loading';
import { useAuth } from '../contexts/AuthContext';
import './FeatureRequestDetail.css';

const fmt = (d: string | Date | null) =>
    d ? new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

export default function FeatureRequestDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [request, setRequest] = useState<any>(null);
    const [activities, setActivities] = useState<any[]>([]);
    const [comments, setComments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'details' | 'timeline' | 'activity'>('details');

    const [commentText, setCommentText] = useState('');
    const [addingComment, setAddingComment] = useState(false);

    const [showEditStatus, setShowEditStatus] = useState(false);
    const STATUS_OPTIONS = ['requested', 'planned', 'in-progress', 'completed', 'declined'];

    const loadData = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        try {
            // Find request by asking backend to fetch all, and finding ours - 
            // since we don't have a getById handler for featureRequests yet, we can filter getAll
            const allReqs = await window.api.featureRequests.getAll();
            const foundReq = allReqs.find((r: any) => r.id === id);
            setRequest(foundReq);

            const [acts, comms] = await Promise.all([
                window.api.featureRequestActivity.getActivities(id),
                window.api.featureRequestActivity.getComments(id)
            ]);
            setActivities(acts);
            setComments(comms);
        } catch (err) {
            console.error('Failed to load feature request details:', err);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleAddComment = async () => {
        if (!commentText.trim() || !id || !user?.id) return;
        setAddingComment(true);
        try {
            await window.api.featureRequestActivity.addComment(id, user.id, commentText);
            setCommentText('');
            await loadData(); // Reload to fetch new comments/activity
        } catch (err) {
            console.error('Error adding comment:', err);
        } finally {
            setAddingComment(false);
        }
    };

    const handleStatusChange = async (newStatus: string) => {
        if (!id || !user?.id) return;
        await window.api.featureRequests.update(id, { status: newStatus }, user.id);
        setShowEditStatus(false);
        loadData();
    };

    if (loading) return <Loading size="large" text="Loading feature request..." />;
    if (!request) return (
        <div className="frd-not-found">
            <p>Feature request not found.</p>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/feature-roadmap')}>← Back to Roadmap</button>
        </div>
    );

    return (
        <div className="frd-page">
            <div className="frd-header">
                <button className="btn-back" onClick={() => navigate('/feature-roadmap')}>← Roadmap</button>
                <div className="frd-header-meta">
                    <div className="frd-badges">
                        <span className={`priority-indicator priority-${request.priority.toLowerCase()}`} title={`Priority: ${request.priority}`}></span>
                        <span className={`badge status-badge status-${request.status}`}>{request.status.replace('-', ' ')}</span>
                    </div>
                    <div className="frd-actions">
                        <button className="btn btn-sm btn-secondary" onClick={() => setShowEditStatus(true)}>
                            Change Status
                        </button>
                    </div>
                </div>
                <h1 className="frd-title">{request.title}</h1>
                <div className="frd-subtitle">
                    <span>🏢 {request.client?.name || 'N/A'}</span>
                    <span>•</span>
                    <span>Logged by: {request.createdBy?.fullName || 'System'}</span>
                    <span>•</span>
                    <span>Created: {fmt(request.createdAt)}</span>
                </div>
            </div>

            <div className="frd-tabs">
                {(['details', 'timeline', 'activity'] as const).map(tab => (
                    <button
                        key={tab}
                        className={`frd-tab ${activeTab === tab ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab === 'details' ? '📝 Details' : tab === 'timeline' ? '💬 Timeline & Comments' : '📋 Activity Log'}
                    </button>
                ))}
            </div>

            <div className="frd-body">
                {activeTab === 'details' && (
                    <div className="frd-details">
                        <div className="details-grid">
                            <div className="detail-row"><span className="detail-label">Client</span><span>{request.client?.name || 'None'}</span></div>
                            <div className="detail-row"><span className="detail-label">Status</span><span className={`badge status-badge status-${request.status}`}>{request.status}</span></div>
                            <div className="detail-row"><span className="detail-label">Priority</span><span>{request.priority}</span></div>
                            <div className="detail-row"><span className="detail-label">Logged By</span><span>{request.createdBy?.fullName || 'System'}</span></div>
                            <div className="detail-row detail-full">
                                <span className="detail-label">Business Value & Description</span>
                                <div className="frd-desc-box">
                                    {request.description}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'timeline' && (
                    <div className="frd-timeline">
                        <div className="update-composer">
                            <textarea
                                className="update-textarea"
                                placeholder="Add a comment, update, or note to this feature request..."
                                value={commentText}
                                onChange={e => setCommentText(e.target.value)}
                                rows={3}
                            />
                            <div className="update-composer-footer">
                                <button
                                    className="btn btn-primary btn-sm"
                                    onClick={handleAddComment}
                                    disabled={addingComment || !commentText.trim()}
                                >
                                    {addingComment ? 'Posting…' : 'Post Comment'}
                                </button>
                            </div>
                        </div>

                        {comments.length === 0 ? (
                            <div className="empty-feed">No comments yet.</div>
                        ) : (
                            <div className="incident-feed">
                                {comments.map((c: any) => (
                                    <div key={c.id} className="incident-entry update">
                                        <div className="incident-entry-header">
                                            <div className="incident-entry-meta">
                                                <span className="entry-author">{c.author?.fullName ?? 'Unknown'}</span>
                                                <span className="entry-time">{fmt(c.createdAt)}</span>
                                            </div>
                                        </div>
                                        <p className="incident-entry-text">{c.text}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'activity' && (
                    <div className="frd-activity">
                        {activities.length === 0 ? (
                            <div className="empty-feed">No activity logged.</div>
                        ) : (
                            <div className="activity-list">
                                {activities.map((a: any) => {
                                    const details = a.details ? JSON.parse(a.details) : {};
                                    return (
                                        <div key={a.id} className="activity-entry">
                                            <div className="activity-dot" />
                                            <div className="activity-content">
                                                <span className="activity-actor">{a.user?.fullName ?? 'System'}</span>
                                                {' '}
                                                <span className="activity-action">
                                                    {a.activityType === 'created'
                                                        ? 'logged this feature request'
                                                        : a.activityType === 'status_changed'
                                                            ? `changed status from "${details.from}" → "${details.to}"`
                                                            : a.activityType === 'priority_changed'
                                                                ? `changed priority from "${details.from}" → "${details.to}"`
                                                                : a.activityType === 'commented'
                                                                    ? 'added a comment'
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
            </div>

            {showEditStatus && (
                <div className="modal-overlay" onClick={() => setShowEditStatus(false)}>
                    <div className="modal-box small" onClick={e => e.stopPropagation()}>
                        <h3>Change Status</h3>
                        <div className="status-options">
                            {STATUS_OPTIONS.map(s => (
                                <button
                                    key={s}
                                    className={`status-option-btn ${request.status === s ? 'current' : ''}`}
                                    onClick={() => handleStatusChange(s)}
                                >
                                    <span className={`badge status-badge status-${s}`}>{s.replace('-', ' ')}</span>
                                </button>
                            ))}
                        </div>
                        <button className="btn btn-secondary btn-sm" style={{ marginTop: '1rem' }} onClick={() => setShowEditStatus(false)}>Cancel</button>
                    </div>
                </div>
            )}
        </div>
    );
}
