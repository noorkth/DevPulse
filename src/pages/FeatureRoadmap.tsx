import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import ClientSelector from '../components/governance/ClientSelector';
import { useAuth } from '../contexts/AuthContext';
import './FeatureRoadmap.css';
import { useToast } from '../components/common/Toast';

const STATUS_COLUMNS = ['requested', 'planned', 'in-progress', 'completed'];

const FeatureRoadmap: React.FC = () => {
    const { success, error } = useToast();
    const { user } = useAuth();
    const [selectedClient, setSelectedClient] = useState<string | null>(null);
    const [clients, setClients] = useState<any[]>([]);
    const [featureRequests, setFeatureRequests] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [newRequest, setNewRequest] = useState({ title: '', description: '', priority: 'medium' });

    useEffect(() => {
        loadData();
    }, [selectedClient]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [data, cl] = await Promise.all([
                window.api.featureRequests.getAll(selectedClient || undefined),
                window.api.clients.getAll()
            ]);
            setFeatureRequests(data);
            setClients(cl);
        } catch (err: any) {
            console.error('Failed to load roadmap:', err);
            error('Failed to load feature roadmap');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedClient) return error('Please select a client first');

        try {
            // Use the valid dev ID from AuthContext.
            const createdById = user?.id;

            if (!createdById) {
                alert('You must be logged in to create a feature request.');
                return;
            }

            await window.api.featureRequests.create({
                ...newRequest,
                clientId: selectedClient
            }, createdById);

            success('Feature Request logged');
            setIsFormOpen(false);
            setNewRequest({ title: '', description: '', priority: 'medium' });
            loadData();
        } catch (err: any) {
            error(err.message || 'Failed to create request');
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const deletedById = user?.id;
        if (!deletedById) {
            alert('You must be logged in to delete a feature request.');
            return;
        }
        try {
            await window.api.featureRequests.delete(id, deletedById);
            loadData();
        } catch (err: any) {
            error(err.message || 'Failed to delete request');
        }
    };

    const handleStatusChange = async (reqId: string, newStatus: string) => {
        try {
            const updatedById = user?.id;
            if (!updatedById) {
                alert('You must be logged in to update a feature request.');
                return;
            }
            await window.api.featureRequests.update(reqId, { status: newStatus }, updatedById);
            loadData();
        } catch (err: any) {
            error(err.message);
        }
    };

    const renderColumn = (status: string) => {
        const title = status.replace('-', ' ').toUpperCase();
        const items = featureRequests.filter(req => req.status === status);

        return (
            <div className={`roadmap-column column-${status}`} key={status}>
                <div className="roadmap-column-header">
                    <h3>{title}</h3>
                    <span className="count-badge">{items.length}</span>
                </div>
                <div className="roadmap-column-content">
                    {items.map(req => (
                        <div className="roadmap-card" key={req.id}>
                            <div className="roadmap-card-header">
                                <span className={`priority-indicator priority-${req.priority.toLowerCase()}`} title={`Priority: ${req.priority}`}></span>
                                <h4>{req.title}</h4>
                            </div>
                            <p className="roadmap-card-desc">{req.description}</p>

                            <div className="roadmap-card-footer">
                                <span className="client-tag">{req.client?.name}</span>
                            </div>

                            <div className="roadmap-card-actions">
                                {STATUS_COLUMNS.map(s => {
                                    if (s === status) return null;
                                    return (
                                        <button
                                            key={s}
                                            className="action-btn"
                                            onClick={() => handleStatusChange(req.id, s)}
                                        >
                                            Move to {s}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                    {items.length === 0 && (
                        <div className="empty-column-msg">No items</div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="page-container">
            <header className="page-header">
                <div>
                    <h1>Feature Roadmap</h1>
                    <p className="text-secondary">Track client feature requests and map them to internal projects.</p>
                </div>
                <div className="header-actions">
                    <ClientSelector
                        clients={clients}
                        value={selectedClient || ''}
                        onChange={setSelectedClient}
                        allLabel="All Clients"
                    />
                    <button
                        className="btn btn-primary btn-sm"
                        onClick={() => setIsFormOpen(true)}
                        disabled={!selectedClient}
                        title={!selectedClient ? "Select a client to add a feature" : ""}
                    >
                        + Log Request
                    </button>
                </div>
            </header>

            {isFormOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>New Feature Request</h2>
                        <form onSubmit={handleCreate}>
                            <div className="form-group">
                                <label>Title</label>
                                <input
                                    type="text"
                                    value={newRequest.title}
                                    onChange={e => setNewRequest({ ...newRequest, title: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Description & Business Value</label>
                                <textarea
                                    value={newRequest.description}
                                    onChange={e => setNewRequest({ ...newRequest, description: e.target.value })}
                                    rows={4}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Priority</label>
                                <select
                                    value={newRequest.priority}
                                    onChange={e => setNewRequest({ ...newRequest, priority: e.target.value })}
                                >
                                    <option value="high">High</option>
                                    <option value="medium">Medium</option>
                                    <option value="low">Low</option>
                                </select>
                            </div>
                            <div className="form-actions">
                                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIsFormOpen(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary btn-sm">Save Request</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isLoading ? (
                <div className="loading-state">Loading roadmap...</div>
            ) : (
                <div className="roadmap-board">
                    {STATUS_COLUMNS.map(renderColumn)}
                </div>
            )}
        </div>
    );
}

export default FeatureRoadmap;
