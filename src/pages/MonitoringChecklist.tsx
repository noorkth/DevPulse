import React, { useState, useEffect } from 'react';
import Card from '../components/common/Card';
import Loading from '../components/common/Loading';
import PreventiveRecommendationCard from '../components/governance/PreventiveRecommendationCard';
import { useToast } from '../components/common/Toast';
import { useAuth } from '../contexts/AuthContext';

const CHECKLIST_ITEMS = [
    { key: 'channelUptime', obsKey: 'channelObservation', label: 'Channel Uptime Monitoring', icon: '📡' },
    { key: 'geoIpValidation', obsKey: 'geoIpObservation', label: 'Geo-IP Validation', icon: '🌍' },
    { key: 'stbAudit', obsKey: 'stbObservation', label: 'STB Audit Reconciliation', icon: '📦' },
    { key: 'techHealthCheck', obsKey: 'techObservation', label: 'Technical Health Check', icon: '🔧' },
    { key: 'streamingQuality', obsKey: 'streamingObservation', label: 'Streaming Quality Review', icon: '🎬' },
];

const MonitoringChecklist: React.FC = () => {
    const { user } = useAuth();
    const { success, error } = useToast();
    const [checklists, setChecklists] = useState<any[]>([]);
    const [recommendations, setRecommendations] = useState<any[]>([]);
    const [clients, setClients] = useState<any[]>([]);
    const [developers, setDevelopers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [generatingAi, setGeneratingAi] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [activeChecklist, setActiveChecklist] = useState<any>(null);
    const [form, setForm] = useState<any>({ checkDate: new Date().toISOString().slice(0, 10) });

    useEffect(() => { loadAll(); }, []);

    const loadAll = async () => {
        setLoading(true);
        try {
            const [cls, recs, cl, devs] = await Promise.all([
                window.api.monitoring.getAll(),
                window.api.aiPreventive.getAll(),
                window.api.clients.getAll(),
                window.api.developers.getAll(),
            ]);
            setChecklists(cls);
            setRecommendations(recs.filter((r: any) => r.status === 'pending'));
            setClients(cl);
            setDevelopers(devs);
        } finally { setLoading(false); }
    };

    const handleGenerateAI = async () => {
        setGeneratingAi(true);
        try {
            const result = await window.api.aiPreventive.generate();
            success(`Generated ${result.generatedCount} new recommendations`);
            loadAll();
        } catch (err: any) {
            error(err.message);
        } finally {
            setGeneratingAi(false);
        }
    };

    const handleCreate = async () => {
        await window.api.monitoring.create({ ...form, ownerId: form.ownerId || developers[0]?.id });
        setShowForm(false);
        setForm({ checkDate: new Date().toISOString().slice(0, 10) });
        loadAll();
    };

    const handleToggleItem = async (checklist: any, key: string) => {
        await window.api.monitoring.update(checklist.id, { [key]: !checklist[key] });
        loadAll();
        if (activeChecklist?.id === checklist.id) {
            setActiveChecklist({ ...checklist, [key]: !checklist[key] });
        }
    };

    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

    const handleComplete = async (id: string) => {
        try {
            await window.api.monitoring.complete(id);
            setActiveChecklist(null);
            loadAll();
        } catch (e: any) {
            alert(e.message);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await window.api.monitoring.delete(id, user?.id);
            setConfirmDeleteId(null);
            loadAll();
            success('Checklist deleted');
        } catch (err: any) {
            error(err.message);
        }
    };

    const getProgress = (cl: any) => CHECKLIST_ITEMS.filter(i => cl[i.key]).length;

    return (
        <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: '1.6rem', fontWeight: 700, margin: '0 0 4px' }}>🔍 Proactive Monitoring</h1>
                    <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>Weekly channel health & compliance checklists per client</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        className="btn btn-secondary btn-sm"
                        onClick={handleGenerateAI}
                        disabled={generatingAi}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        <span role="img" aria-label="ai">🤖</span>
                        {generatingAi ? 'Analyzing...' : 'Generate AI Insights'}
                    </button>
                    <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>+ New Checklist</button>
                </div>
            </div>

            {recommendations.length > 0 && (
                <div style={{ marginBottom: 32 }}>
                    <h2 style={{ fontSize: '1.2rem', marginBottom: 16 }}>Pending AI Recommendations</h2>
                    {recommendations.map(r => (
                        <PreventiveRecommendationCard
                            key={r.id}
                            recommendation={r}
                            onStatusChange={loadAll}
                        />
                    ))}
                </div>
            )}

            {loading ? <Loading size="medium" text="Loading checklists..." /> : (
                <div style={{ display: 'grid', gap: 14 }}>
                    {checklists.map((cl: any) => {
                        const done = getProgress(cl);
                        const pct = Math.round((done / 5) * 100);
                        const isComplete = !!cl.completedAt;
                        return (
                            <Card key={cl.id} style={{ padding: 20, cursor: 'pointer' }} onClick={() => setActiveChecklist(cl)}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                                    <div>
                                        <h4 style={{ margin: '0 0 4px', fontSize: '0.95rem' }}>{cl.client?.name}</h4>
                                        <div style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>
                                            {new Date(cl.checkDate).toLocaleDateString()} · Owner: {cl.owner?.fullName}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            {CHECKLIST_ITEMS.map(item => (
                                                <span key={item.key} title={item.label} style={{ opacity: cl[item.key] ? 1 : 0.3 }}>{item.icon}</span>
                                            ))}
                                        </div>
                                        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: isComplete ? '#10b981' : pct >= 40 ? '#f59e0b' : 'var(--color-text-secondary)' }}>
                                            {isComplete ? '✅ Complete' : `${done}/5 done`}
                                        </div>
                                        <div style={{ background: 'var(--color-bg-secondary)', borderRadius: 20, height: 6, width: 80, overflow: 'hidden' }}>
                                            <div style={{ height: '100%', width: `${pct}%`, background: isComplete ? '#10b981' : '#6366f1', transition: 'width 0.3s', borderRadius: 20 }} />
                                        </div>
                                        <button
                                            className="btn btn-sm"
                                            style={{ background: 'var(--color-danger, #e53e3e)', color: '#fff', border: 'none', marginLeft: 4 }}
                                            title="Delete checklist"
                                            onClick={e => { e.stopPropagation(); setConfirmDeleteId(cl.id); }}
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                    {checklists.length === 0 && <div style={{ textAlign: 'center', padding: 48, color: 'var(--color-text-secondary)' }}>No checklists yet.</div>}
                </div>
            )}

            {/* Active checklist detail modal */}
            {activeChecklist && (
                <div className="modal-overlay" onClick={() => setActiveChecklist(null)}>
                    <div className="modal-box" style={{ maxWidth: 620 }} onClick={e => e.stopPropagation()}>
                        <h2 className="modal-title">Checklist: {activeChecklist.client?.name}</h2>
                        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginTop: -8, marginBottom: 20 }}>
                            {new Date(activeChecklist.checkDate).toLocaleDateString()} · {activeChecklist.owner?.fullName}
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            {CHECKLIST_ITEMS.map(item => (
                                <div key={item.key} style={{ background: 'var(--color-bg-secondary)', borderRadius: 10, padding: 14 }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontWeight: 500 }}>
                                        <input
                                            type="checkbox"
                                            checked={!!activeChecklist[item.key]}
                                            onChange={() => handleToggleItem(activeChecklist, item.key)}
                                            style={{ width: 16, height: 16 }}
                                        />
                                        {item.icon} {item.label}
                                    </label>
                                    {activeChecklist[item.key] && (
                                        <input
                                            className="form-input"
                                            style={{ marginTop: 8 }}
                                            placeholder="Observations..."
                                            defaultValue={activeChecklist[item.obsKey] || ''}
                                            onBlur={async e => {
                                                await window.api.monitoring.update(activeChecklist.id, { [item.obsKey]: e.target.value });
                                            }}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                        <textarea
                            className="form-textarea form-full"
                            style={{ marginTop: 14 }}
                            placeholder="Recommendations..."
                            defaultValue={activeChecklist.recommendations || ''}
                            onBlur={async e => {
                                await window.api.monitoring.update(activeChecklist.id, { recommendations: e.target.value });
                            }}
                        />
                        <div className="modal-actions">
                            <button className="btn btn-secondary btn-sm" onClick={() => setActiveChecklist(null)}>Close</button>
                            {!activeChecklist.completedAt && (
                                <button className="btn btn-primary btn-sm" onClick={() => handleComplete(activeChecklist.id)}>Mark Complete ✅</button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Create form */}
            {showForm && (
                <div className="modal-overlay" onClick={() => setShowForm(false)}>
                    <div className="modal-box" onClick={e => e.stopPropagation()}>
                        <h2 className="modal-title">New Monitoring Checklist</h2>
                        <div className="form-grid">
                            <select className="form-select" value={form.clientId || ''} onChange={e => setForm({ ...form, clientId: e.target.value })}>
                                <option value="">Select Client *</option>
                                {clients.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                            <select className="form-select" value={form.ownerId || ''} onChange={e => setForm({ ...form, ownerId: e.target.value })}>
                                <option value="">Assign Owner</option>
                                {developers.map((d: any) => <option key={d.id} value={d.id}>{d.fullName}</option>)}
                            </select>
                            <input className="form-input form-full" type="date" value={form.checkDate} onChange={e => setForm({ ...form, checkDate: e.target.value })} />
                        </div>
                        <div className="modal-actions">
                            <button className="btn btn-secondary btn-sm" onClick={() => setShowForm(false)}>Cancel</button>
                            <button className="btn btn-primary btn-sm" onClick={handleCreate}>Create</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {confirmDeleteId && (
                <div className="modal-overlay" onClick={() => setConfirmDeleteId(null)}>
                    <div className="modal-box" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
                        <h2 className="modal-title">Delete Checklist</h2>
                        <p style={{ color: 'var(--color-text-secondary)', marginBottom: 24 }}>
                            Are you sure you want to delete this monitoring checklist? This cannot be undone.
                        </p>
                        <div className="modal-actions">
                            <button className="btn btn-secondary btn-sm" onClick={() => setConfirmDeleteId(null)}>Cancel</button>
                            <button
                                className="btn btn-sm"
                                style={{ background: 'var(--color-danger, #e53e3e)', color: '#fff', border: 'none' }}
                                onClick={() => handleDelete(confirmDeleteId)}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MonitoringChecklist;
