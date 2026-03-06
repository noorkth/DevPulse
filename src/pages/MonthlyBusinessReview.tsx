import React, { useState, useEffect } from 'react';
import Card from '../components/common/Card';
import Loading from '../components/common/Loading';
import { useAuth } from '../contexts/AuthContext';
import { generateMbrPDF } from '../utils/pdfGenerator';

const MonthlyBusinessReview: React.FC = () => {
    const { user } = useAuth();
    const [reviews, setReviews] = useState<any[]>([]);
    const [clients, setClients] = useState<any[]>([]);
    const [developers, setDevelopers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedReview, setSelectedReview] = useState<any>(null);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState<any>({ status: 'draft', reviewMonth: new Date().toISOString().slice(0, 7) });

    useEffect(() => { loadAll(); }, []);

    const loadAll = async () => {
        setLoading(true);
        try {
            const [mbrs, cl, devs] = await Promise.all([
                window.api.mbr.getAll(),
                window.api.clients.getAll(),
                window.api.developers.getAll(),
            ]);
            setReviews(mbrs);
            setClients(cl);
            setDevelopers(devs);
        } finally { setLoading(false); }
    };

    const handleCreate = async () => {
        if (!form.clientId || !form.reviewMonth) return;
        await window.api.mbr.create({ ...form, createdById: user?.id || developers[0]?.id, reviewMonth: `${form.reviewMonth}-01` });
        setShowForm(false);
        setForm({ status: 'draft', reviewMonth: new Date().toISOString().slice(0, 7) });
        loadAll();
    };

    const handlePublish = async (id: string) => {
        await window.api.mbr.publish(id);
        loadAll();
    };

    const handleAutoPopulate = async () => {
        if (!form.clientId) return;
        const data = await window.api.mbr.autoPopulate(form.clientId, `${form.reviewMonth}-01`);
        setForm((prev: any) => ({ ...prev, ...data }));
    };

    return (
        <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: '1.6rem', fontWeight: 700, margin: '0 0 4px' }}>📑 Monthly Business Reviews</h1>
                    <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>Track downtime, performance, revenue impact, and improvement roadmaps</p>
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>+ New MBR</button>
            </div>

            {loading ? <Loading size="medium" text="Loading MBRs..." /> : (
                <div style={{ display: 'grid', gap: 16 }}>
                    {reviews.map((r: any) => (
                        <Card key={r.id} style={{ padding: 20 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                                <div>
                                    <h3 style={{ margin: '0 0 4px', fontSize: '1rem' }}>{r.client?.name} — {new Date(r.reviewMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h3>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                                        By {r.createdBy?.fullName} · {r.status === 'published' ? '✅ Published' : '📝 Draft'}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: '0.85rem' }}>
                                    {r.uptimePct != null && <span>⬆️ Uptime: <strong>{r.uptimePct}%</strong></span>}
                                    {r.slaCompliancePct != null && <span>📊 SLA: <strong>{r.slaCompliancePct}%</strong></span>}
                                    {r.totalIssues != null && <span>🐛 Issues: <strong>{r.totalIssues}</strong></span>}
                                    {r.escalationCount != null && <span>🔺 Escalations: <strong>{r.escalationCount}</strong></span>}
                                </div>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button className="btn btn-secondary btn-sm" onClick={() => setSelectedReview(r)}>View</button>
                                    <button className="btn btn-secondary btn-sm" title="Export PDF" onClick={() => generateMbrPDF(r)}>📄 PDF</button>
                                    {r.status === 'draft' && (
                                        <button className="btn btn-primary btn-sm" onClick={() => handlePublish(r.id)}>Publish</button>
                                    )}
                                </div>
                            </div>
                        </Card>
                    ))}
                    {reviews.length === 0 && <div style={{ textAlign: 'center', padding: 48, color: 'var(--color-text-secondary)' }}>No MBRs yet. Create the first one.</div>}
                </div>
            )}

            {/* MBR Detail Modal */}
            {selectedReview && (
                <div className="modal-overlay" onClick={() => setSelectedReview(null)}>
                    <div className="modal-box" style={{ maxWidth: 700 }} onClick={e => e.stopPropagation()}>
                        <h2 className="modal-title">{selectedReview.client?.name} — {new Date(selectedReview.reviewMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                            {[
                                ['Uptime', `${selectedReview.uptimePct ?? '—'}%`],
                                ['Downtime', `${selectedReview.downtimeMinutes ?? '—'} min`],
                                ['SLA Compliance', `${selectedReview.slaCompliancePct ?? '—'}%`],
                                ['Total Issues', selectedReview.totalIssues ?? '—'],
                                ['Resolved', selectedReview.resolvedIssues ?? '—'],
                                ['Escalations', selectedReview.escalationCount ?? '—'],
                                ['Subscriber Impact', selectedReview.subscriberImpact ?? '—'],
                                ['Revenue Impact', selectedReview.revenueImpact ?? '—'],
                            ].map(([label, value]) => (
                                <div key={label as string} style={{ background: 'var(--color-bg-secondary)', borderRadius: 8, padding: '12px 16px' }}>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: 4 }}>{label}</div>
                                    <div style={{ fontWeight: 700, fontSize: '1rem' }}>{value}</div>
                                </div>
                            ))}
                        </div>
                        {selectedReview.performanceSummary && <div style={{ marginBottom: 12 }}><strong>Performance Summary:</strong><p style={{ margin: '4px 0', color: 'var(--color-text-secondary)' }}>{selectedReview.performanceSummary}</p></div>}
                        {selectedReview.improvementRoadmap && <div style={{ marginBottom: 12 }}><strong>Improvement Roadmap:</strong><p style={{ margin: '4px 0', color: 'var(--color-text-secondary)' }}>{selectedReview.improvementRoadmap}</p></div>}
                        <div className="modal-actions">
                            <button className="btn btn-secondary btn-sm" onClick={() => setSelectedReview(null)}>Close</button>
                            <button className="btn btn-primary btn-sm" onClick={() => generateMbrPDF(selectedReview)}>📄 Export PDF</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Form Modal */}
            {showForm && (
                <div className="modal-overlay" onClick={() => setShowForm(false)}>
                    <div className="modal-box" style={{ maxWidth: 640 }} onClick={e => e.stopPropagation()}>
                        <h2 className="modal-title">New Monthly Business Review</h2>
                        <div className="form-grid">
                            <select className="form-select" value={form.clientId || ''} onChange={e => setForm({ ...form, clientId: e.target.value })}>
                                <option value="">Select Client *</option>
                                {clients.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                            <input className="form-input" type="month" value={form.reviewMonth} onChange={e => setForm({ ...form, reviewMonth: e.target.value })} />
                            <div className="form-full" style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <button className="btn btn-secondary btn-sm" onClick={handleAutoPopulate} disabled={!form.clientId}>Auto-populate from data</button>
                            </div>
                            <input className="form-input" type="number" step="0.1" placeholder="Uptime %" value={form.uptimePct || ''} onChange={e => setForm({ ...form, uptimePct: parseFloat(e.target.value) })} />
                            <input className="form-input" type="number" placeholder="Downtime (minutes)" value={form.downtimeMinutes || ''} onChange={e => setForm({ ...form, downtimeMinutes: parseInt(e.target.value) })} />
                            <input className="form-input" type="number" step="0.1" placeholder="SLA Compliance %" value={form.slaCompliancePct || ''} onChange={e => setForm({ ...form, slaCompliancePct: parseFloat(e.target.value) })} />
                            <input className="form-input" type="number" placeholder="Escalations" value={form.escalationCount || ''} onChange={e => setForm({ ...form, escalationCount: parseInt(e.target.value) })} />
                            <input className="form-input" type="number" placeholder="Subscriber Impact" value={form.subscriberImpact || ''} onChange={e => setForm({ ...form, subscriberImpact: parseInt(e.target.value) })} />
                            <input className="form-input" placeholder="Revenue Impact Description" value={form.revenueImpact || ''} onChange={e => setForm({ ...form, revenueImpact: e.target.value })} />
                            <textarea className="form-textarea form-full" placeholder="Performance Summary" value={form.performanceSummary || ''} onChange={e => setForm({ ...form, performanceSummary: e.target.value })} />
                            <textarea className="form-textarea form-full" placeholder="Improvement Roadmap" value={form.improvementRoadmap || ''} onChange={e => setForm({ ...form, improvementRoadmap: e.target.value })} />
                        </div>
                        <div className="modal-actions">
                            <button className="btn btn-secondary btn-sm" onClick={() => setShowForm(false)}>Cancel</button>
                            <button className="btn btn-primary btn-sm" onClick={handleCreate}>Create MBR</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MonthlyBusinessReview;
