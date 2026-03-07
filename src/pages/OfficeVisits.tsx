import React, { useState, useEffect } from 'react';
import Card from '../components/common/Card';
import Loading from '../components/common/Loading';

const OfficeVisits: React.FC = () => {
    const [visits, setVisits] = useState<any[]>([]);
    const [clients, setClients] = useState<any[]>([]);
    const [developers, setDevelopers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingVisit, setEditingVisit] = useState<any | null>(null);
    const [form, setForm] = useState<any>({ visitDate: new Date().toISOString().slice(0, 10) });
    const [attendeesInput, setAttendeesInput] = useState('');
    const [actionInput, setActionInput] = useState('');
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

    useEffect(() => { loadAll(); }, []);

    const loadAll = async () => {
        setLoading(true);
        try {
            const [v, c, d] = await Promise.all([
                window.api.officeVisits.getAll(),
                window.api.clients.getAll(),
                window.api.developers.getAll(),
            ]);
            setVisits(v); setClients(c); setDevelopers(d);
        } finally { setLoading(false); }
    };

    const openCreateForm = () => {
        setEditingVisit(null);
        setForm({ visitDate: new Date().toISOString().slice(0, 10) });
        setAttendeesInput('');
        setActionInput('');
        setShowForm(true);
    };

    const openEditForm = (v: any) => {
        setEditingVisit(v);
        setForm({
            clientId: v.clientId,
            visitedById: v.visitedById,
            visitDate: v.visitDate ? new Date(v.visitDate).toISOString().slice(0, 10) : '',
            agenda: v.agenda || '',
            summary: v.summary || '',
            nextVisitDate: v.nextVisitDate ? new Date(v.nextVisitDate).toISOString().slice(0, 10) : '',
        });
        const attendees = v.attendees ? JSON.parse(v.attendees) : [];
        const actions = v.actionItems ? JSON.parse(v.actionItems) : [];
        setAttendeesInput(attendees.join(', '));
        setActionInput(actions.join('\n'));
        setShowForm(true);
    };

    const handleSave = async () => {
        const payload = {
            ...form,
            attendees: attendeesInput ? attendeesInput.split(',').map((s: string) => s.trim()) : [],
            actionItems: actionInput ? actionInput.split('\n').map((s: string) => s.trim()).filter(Boolean) : [],
        };
        if (editingVisit) {
            await window.api.officeVisits.update(editingVisit.id, payload);
        } else {
            await window.api.officeVisits.create(payload);
        }
        setShowForm(false);
        setEditingVisit(null);
        setForm({ visitDate: new Date().toISOString().slice(0, 10) });
        setAttendeesInput('');
        setActionInput('');
        loadAll();
    };

    const handleDelete = async (id: string) => {
        await window.api.officeVisits.delete(id);
        setConfirmDeleteId(null);
        loadAll();
    };

    return (
        <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: '1.6rem', fontWeight: 700, margin: '0 0 4px' }}>🏢 Office Visit Log</h1>
                    <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>Track client visits, meetings, and action items</p>
                </div>
                <button className="btn btn-primary btn-sm" onClick={openCreateForm}>+ Log Visit</button>
            </div>

            {loading ? <Loading size="medium" text="Loading visits..." /> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {visits.map((v: any) => {
                        const attendees = v.attendees ? JSON.parse(v.attendees) : [];
                        const actions = v.actionItems ? JSON.parse(v.actionItems) : [];
                        return (
                            <Card key={v.id} style={{ padding: 20 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
                                    <div>
                                        <h4 style={{ margin: '0 0 4px', fontSize: '1rem' }}>Visit to {v.client?.name}</h4>
                                        <div style={{ fontSize: '0.83rem', color: 'var(--color-text-secondary)' }}>
                                            {new Date(v.visitDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} · By {v.visitedBy?.fullName}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        {v.nextVisitDate && (
                                            <div style={{ fontSize: '0.82rem', color: 'var(--color-primary)' }}>
                                                📅 Next: {new Date(v.nextVisitDate).toLocaleDateString()}
                                            </div>
                                        )}
                                        <button
                                            className="btn btn-secondary btn-sm"
                                            onClick={() => openEditForm(v)}
                                            title="Edit visit"
                                        >
                                            ✏️ Edit
                                        </button>
                                        <button
                                            className="btn btn-sm"
                                            style={{ background: 'var(--color-danger, #e53e3e)', color: '#fff', border: 'none' }}
                                            onClick={() => setConfirmDeleteId(v.id)}
                                            title="Delete visit"
                                        >
                                            🗑️ Delete
                                        </button>
                                    </div>
                                </div>
                                {v.agenda && <div style={{ marginBottom: 8, fontSize: '0.87rem' }}><strong>Agenda:</strong> {v.agenda}</div>}
                                {v.summary && <div style={{ marginBottom: 8, fontSize: '0.87rem', color: 'var(--color-text-secondary)' }}>{v.summary}</div>}
                                <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                                    {attendees.length > 0 && (
                                        <div style={{ fontSize: '0.82rem' }}>
                                            <strong>👥 Attendees:</strong> {attendees.join(', ')}
                                        </div>
                                    )}
                                    {actions.length > 0 && (
                                        <div style={{ fontSize: '0.82rem' }}>
                                            <strong>✅ Actions ({actions.length}):</strong> {actions.slice(0, 2).join(', ')}{actions.length > 2 ? '...' : ''}
                                        </div>
                                    )}
                                </div>
                            </Card>
                        );
                    })}
                    {visits.length === 0 && <div style={{ textAlign: 'center', padding: 48, color: 'var(--color-text-secondary)' }}>No visits logged yet.</div>}
                </div>
            )}

            {/* Create / Edit Modal */}
            {showForm && (
                <div className="modal-overlay" onClick={() => setShowForm(false)}>
                    <div className="modal-box" style={{ maxWidth: 580 }} onClick={e => e.stopPropagation()}>
                        <h2 className="modal-title">{editingVisit ? 'Edit Office Visit' : 'Log Office Visit'}</h2>
                        <div className="form-grid">
                            <select className="form-select" value={form.clientId || ''} onChange={e => setForm({ ...form, clientId: e.target.value })}>
                                <option value="">Select Client *</option>
                                {clients.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                            <select className="form-select" value={form.visitedById || ''} onChange={e => setForm({ ...form, visitedById: e.target.value })}>
                                <option value="">Visited By *</option>
                                {developers.map((d: any) => <option key={d.id} value={d.id}>{d.fullName}</option>)}
                            </select>
                            <input className="form-input form-full" type="date" value={form.visitDate} onChange={e => setForm({ ...form, visitDate: e.target.value })} />
                            <input className="form-input form-full" placeholder="Agenda" value={form.agenda || ''} onChange={e => setForm({ ...form, agenda: e.target.value })} />
                            <input className="form-input form-full" placeholder="Attendees (comma separated)" value={attendeesInput} onChange={e => setAttendeesInput(e.target.value)} />
                            <textarea className="form-textarea form-full" placeholder="Summary / Meeting Notes" value={form.summary || ''} onChange={e => setForm({ ...form, summary: e.target.value })} />
                            <textarea className="form-textarea form-full" placeholder="Action Items (one per line)" value={actionInput} onChange={e => setActionInput(e.target.value)} />
                            <input className="form-input form-full" type="date" placeholder="Next Visit Date" value={form.nextVisitDate || ''} onChange={e => setForm({ ...form, nextVisitDate: e.target.value })} />
                        </div>
                        <div className="modal-actions">
                            <button className="btn btn-secondary btn-sm" onClick={() => setShowForm(false)}>Cancel</button>
                            <button className="btn btn-primary btn-sm" onClick={handleSave}>
                                {editingVisit ? 'Save Changes' : 'Log Visit'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {confirmDeleteId && (
                <div className="modal-overlay" onClick={() => setConfirmDeleteId(null)}>
                    <div className="modal-box" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
                        <h2 className="modal-title">Delete Visit</h2>
                        <p style={{ color: 'var(--color-text-secondary)', marginBottom: 24 }}>
                            Are you sure you want to delete this visit log? This action cannot be undone.
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

export default OfficeVisits;
