import React, { useState } from 'react';
import './governance.css';

interface Update {
    id: string;
    updateText: string;
    isAcknowledgement: boolean;
    isRca: boolean;
    notifiedClient: boolean;
    rcaFilePath?: string | null;
    createdAt: string | Date;
    author?: { fullName: string } | null;
}

interface IncidentUpdateFeedProps {
    updates: Update[];
    onMarkNotified?: (updateId: string) => void;
    /** If provided, renders the compose form */
    onAddUpdate?: (text: string, type: 'update' | 'ack' | 'rca') => Promise<void>;
    readonly?: boolean;
}

const fmt = (d: string | Date) =>
    new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

const IncidentUpdateFeed: React.FC<IncidentUpdateFeedProps> = ({
    updates,
    onMarkNotified,
    onAddUpdate,
    readonly = false,
}) => {
    const [text, setText] = useState('');
    const [type, setType] = useState<'update' | 'ack' | 'rca'>('update');
    const [posting, setPosting] = useState(false);

    const handlePost = async () => {
        if (!text.trim() || !onAddUpdate) return;
        setPosting(true);
        try {
            await onAddUpdate(text, type);
            setText('');
        } finally {
            setPosting(false);
        }
    };

    return (
        <div className="gov-feed">
            {/* Compose */}
            {!readonly && onAddUpdate && (
                <div className="gov-feed__composer">
                    <div className="gov-feed__type-tabs">
                        {(['update', 'ack', 'rca'] as const).map(t => (
                            <button
                                key={t}
                                className={`gov-feed__type-btn ${type === t ? 'active' : ''}`}
                                onClick={() => setType(t)}
                            >
                                {t === 'update' ? '📢 Status Update' : t === 'ack' ? '✅ Acknowledgement' : '🔍 RCA'}
                            </button>
                        ))}
                    </div>
                    <textarea
                        className="gov-feed__textarea"
                        rows={4}
                        placeholder={
                            type === 'ack' ? 'Describe acknowledgement and initial assessment…'
                                : type === 'rca' ? 'Root Cause, impact, and preventive measures…'
                                    : 'Provide a status update…'
                        }
                        value={text}
                        onChange={e => setText(e.target.value)}
                    />
                    <div className="gov-feed__composer-footer">
                        <button className="btn btn-primary btn-sm" onClick={handlePost} disabled={posting || !text.trim()}>
                            {posting ? 'Posting…' : 'Post Update'}
                        </button>
                    </div>
                </div>
            )}

            {/* Feed */}
            {updates.length === 0 ? (
                <div className="gov-feed__empty">No incident updates yet.</div>
            ) : (
                <div className="gov-feed__list">
                    {updates.map(u => (
                        <div key={u.id} className={`gov-feed__entry gov-feed__entry--${u.isAcknowledgement ? 'ack' : u.isRca ? 'rca' : 'upd'}`}>
                            <div className="gov-feed__entry-header">
                                <div className="gov-feed__entry-meta">
                                    {u.isAcknowledgement && <span className="gov-feed__type-label gov-feed__type-label--ack">✅ Acknowledgement</span>}
                                    {u.isRca && <span className="gov-feed__type-label gov-feed__type-label--rca">🔍 RCA</span>}
                                    {!u.isAcknowledgement && !u.isRca && <span className="gov-feed__type-label gov-feed__type-label--upd">📢 Update</span>}
                                    <span className="gov-feed__author">{u.author?.fullName ?? 'System'}</span>
                                    <span className="gov-feed__time">{fmt(u.createdAt)}</span>
                                </div>
                                {!u.notifiedClient && onMarkNotified && (
                                    <button className="gov-btn-xs" onClick={() => onMarkNotified(u.id)}>Notify Client</button>
                                )}
                                {u.notifiedClient && <span className="gov-feed__notified">📨 Notified</span>}
                            </div>
                            <p className="gov-feed__text">{u.updateText}</p>
                            {u.rcaFilePath && <p className="gov-feed__rca-file">📎 {u.rcaFilePath}</p>}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default IncidentUpdateFeed;
