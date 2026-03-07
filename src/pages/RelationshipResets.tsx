import React, { useState, useEffect } from 'react';
import Card from '../components/common/Card';
import Loading from '../components/common/Loading';

const RelationshipResets: React.FC = () => {
    const [resets, setResets] = useState<any[]>([]);
    const [clients, setClients] = useState<any[]>([]);
    const [developers, setDevelopers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState<any>({ resetDate: new Date().toISOString().slice(0, 10), status: 'active' });
    const [commitmentsInput, setCommitmentsInput] = useState('');

    useEffect(() => { loadAll(); }, []);

    const loadAll = async () => {
        setLoading(true);
        try {
            const [r, c, d] = await Promise.all([
                window.api.resets.getAll(),
                window.api.clients.getAll(),
                window.api.developers.getAll(),
            ]);
            setResets(r); setClients(c); setDevelopers(d);
        } finally { setLoading(false); }
    };

    const handleCreate = async () => {
        await window.api.resets.create({
            ...form,
            commitments: commitmentsInput ? commitmentsInput.split('\n').map((s: string) => s.trim()).filter(Boolean) : [],
        });
        setShowForm(false);
        setForm({ resetDate: new Date().toISOString().slice(0, 10), status: 'active' });
        setCommitmentsInput('');
        loadAll();
    };

    const handleClose = async (id: string) => {
        if (confirm('Mark this relationship reset as closed?')) {
            await window.api.resets.close(id);
            loadAll();
        }
    };

    const statusColor = (s: string) => s === 'active' ? '#6366f1' : s === 'reviewed' ? '#f59e0b' : '#10b981';

    return (
        <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: '1.6rem', fontWeight: 700, margin: '0 0 4px' }}>🔄 Relationship Resets</h1>
                    <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>Track formal relationship resets with commitments and review dates</p>
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>+ Log Reset</button>
            </div>

            {loading ? <Loading size="medium" text="Loading..." /> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {resets.map((r: any) => {
                        const commitments = r.commitments ? JSON.parse(r.commitments) : [];
                        return (
                            <Card key={r.id} style={{ padding: 20, borderLeft: `4px solid ${statusColor(r.status)}` }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                                            <h4 style={{ margin: 0, fontSize: '1rem' }}>{r.client?.name}</h4>
                                            <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: '0.73rem', fontWeight: 600, background: `${statusColor(r.status)}22`, color: statusColor(r.status) }}>
                                                {r.status}
                                            </span>
                                        </div>
                                        <div style={{ fontSize: '0.83rem', color: 'var(--color-text-secondary)', marginBottom: 8 }}>
                                            Reset on {new Date(r.resetDate).toLocaleDateString()} · Initiated by {r.initiatedBy?.fullName}
                                            {r.reviewDate ? ` · Review: ${new Date(r.reviewDate).toLocaleDateString()}` : ''}
                                        </div>
                                        <div style={{ fontSize: '0.88rem', marginBottom: 8 }}><strong>Reason:</strong> {r.reason}</div>
                                        {commitments.length > 0 && (
                                            <ul style={{ margin: '6px 0 0', padding: '0 0 0 18px', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                                                {commitments.map((c: string, i: number) => <li key={i}>{c}</li>)}
                                            </ul>
                                        )}
                                    </div>
                                    {r.status !== 'closed' && (
                                        <button className="btn btn-secondary btn-sm" onClick={() => handleClose(r.id)}>Close</button>
                                    )}
                                </div>
                            </Card>
                        );
                    })}
                    {resets.length === 0 && <div style={{ textAlign: 'center', padding: 48, color: 'var(--color-text-secondary)' }}>No relationship resets logged.</div>}
                </div>
            )}

            {showForm && (
                <div className="modal-overlay" onClick={() => setShowForm(false)}>
                    <div className="modal-box" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
                        <h2 className="modal-title">Log Relationship Reset</h2>
                        <div className="form-grid">
                            <select className="form-select" value={form.clientId || ''} onChange={e => setForm({ ...form, clientId: e.target.value })}>
                                <option value="">Select Client *</option>
                                {clients.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                            <select className="form-select" value={form.initiatedById || ''} onChange={e => setForm({ ...form, initiatedById: e.target.value })}>
                                <option value="">Initiated By *</option>
                                {developers.map((d: any) => <option key={d.id} value={d.id}>{d.fullName}</option>)}
                            </select>
                            <input className="form-input form-full" type="date" value={form.resetDate} onChange={e => setForm({ ...form, resetDate: e.target.value })} />
                            <textarea className="form-textarea form-full" placeholder="Reason for Reset *" value={form.reason || ''} onChange={e => setForm({ ...form, reason: e.target.value })} />
                            <textarea className="form-textarea form-full" placeholder="Commitments Made (one per line)" value={commitmentsInput} onChange={e => setCommitmentsInput(e.target.value)} />
                            <input className="form-input form-full" type="date" placeholder="Review Date" onChange={e => setForm({ ...form, reviewDate: e.target.value })} />
                        </div>
                        <div className="modal-actions">
                            <button className="btn btn-secondary btn-sm" onClick={() => setShowForm(false)}>Cancel</button>
                            <button className="btn btn-primary btn-sm" onClick={handleCreate}>Log Reset</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RelationshipResets;
