import React, { useState, useEffect } from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import Input from '../components/common/Input';
import './Issues.css';

const severityColors = {
    critical: 'var(--color-severity-critical)',
    high: 'var(--color-severity-high)',
    medium: 'var(--color-severity-medium)',
    low: 'var(--color-severity-low)',
};

const Issues: React.FC = () => {
    const [issues, setIssues] = useState<any[]>([]);
    const [projects, setProjects] = useState<any[]>([]);
    const [developers, setDevelopers] = useState<any[]>([]);
    const [features, setFeatures] = useState<any[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
    const [selectedIssue, setSelectedIssue] = useState<any>(null);
    const [fixQuality, setFixQuality] = useState(3);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        severity: 'medium',
        projectId: '',
        featureId: '',
        assignedToId: '',
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [issuesData, projectsData, developersData] = await Promise.all([
                window.api.issues.getAll(),
                window.api.projects.getAll(),
                window.api.developers.getAll(),
            ]);

            setIssues(issuesData);
            setProjects(projectsData);
            setDevelopers(developersData);
        } catch (error) {
            console.error('Error loading data:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            await window.api.issues.create(formData);
            setIsModalOpen(false);
            resetForm();
            loadData();
        } catch (error) {
            console.error('Error creating issue:', error);
        }
    };

    const handleResolve = async () => {
        if (!selectedIssue) return;

        try {
            await window.api.issues.resolve(selectedIssue.id, fixQuality);
            setIsResolveModalOpen(false);
            setSelectedIssue(null);
            loadData();
        } catch (error) {
            console.error('Error resolving issue:', error);
        }
    };

    const openResolveModal = (issue: any) => {
        setSelectedIssue(issue);
        setFixQuality(3);
        setIsResolveModalOpen(true);
    };

    const resetForm = () => {
        setFormData({
            title: '',
            description: '',
            severity: 'medium',
            projectId: '',
            featureId: '',
            assignedToId: '',
        });
    };

    return (
        <div className="issues-page">
            <div className="page-header">
                <h2>Issues</h2>
                <Button onClick={() => setIsModalOpen(true)}>+ New Issue</Button>
            </div>

            <div className="issues-list">
                {issues.map((issue) => (
                    <Card key={issue.id}>
                        <div className="issue-card">
                            <div className="issue-header">
                                <h3>{issue.title}</h3>
                                <div className="issue-badges">
                                    <span
                                        className="severity-badge"
                                        style={{ backgroundColor: severityColors[issue.severity as keyof typeof severityColors] }}
                                    >
                                        {issue.severity}
                                    </span>
                                    <span className={`status-badge status-${issue.status}`}>
                                        {issue.status}
                                    </span>
                                    {issue.isRecurring && (
                                        <span className="recurring-badge">🔄 Recurring</span>
                                    )}
                                </div>
                            </div>

                            <p className="issue-description">{issue.description}</p>

                            <div className="issue-meta">
                                <div className="meta-item">
                                    <span className="meta-label">Project:</span>
                                    <span>{issue.project?.name || 'N/A'}</span>
                                </div>
                                <div className="meta-item">
                                    <span className="meta-label">Assigned to:</span>
                                    <span>{issue.assignedTo?.fullName || 'Unassigned'}</span>
                                </div>
                                {issue.feature && (
                                    <div className="meta-item">
                                        <span className="meta-label">Feature:</span>
                                        <span>{issue.feature.name}</span>
                                    </div>
                                )}
                                {issue.resolutionTime && (
                                    <div className="meta-item">
                                        <span className="meta-label">Resolution Time:</span>
                                        <span>{issue.resolutionTime}h</span>
                                    </div>
                                )}
                            </div>

                            {issue.status === 'open' || issue.status === 'in-progress' ? (
                                <Button variant="primary" size="sm" onClick={() => openResolveModal(issue)}>
                                    Mark as Resolved
                                </Button>
                            ) : null}
                        </div>
                    </Card>
                ))}
            </div>

            {/* Create Issue Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="New Issue"
                size="lg"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleSubmit}>Create Issue</Button>
                    </>
                }
            >
                <form onSubmit={handleSubmit} className="issue-form">
                    <Input
                        label="Title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        required
                    />

                    <Input
                        label="Description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        isTextarea
                        rows={4}
                        required
                    />

                    <div className="form-row">
                        <div className="form-group">
                            <label className="input-label">Severity</label>
                            <select
                                className="input"
                                value={formData.severity}
                                onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="critical">Critical</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="input-label">Project</label>
                            <select
                                className="input"
                                value={formData.projectId}
                                onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                                required
                            >
                                <option value="">Select project</option>
                                {projects.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="input-label">Assigned To</label>
                        <select
                            className="input"
                            value={formData.assignedToId}
                            onChange={(e) => setFormData({ ...formData, assignedToId: e.target.value })}
                        >
                            <option value="">Unassigned</option>
                            {developers.map(d => (
                                <option key={d.id} value={d.id}>{d.fullName}</option>
                            ))}
                        </select>
                    </div>
                </form>
            </Modal>

            {/* Resolve Issue Modal */}
            <Modal
                isOpen={isResolveModalOpen}
                onClose={() => setIsResolveModalOpen(false)}
                title="Resolve Issue"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setIsResolveModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleResolve}>Resolve</Button>
                    </>
                }
            >
                <div className="resolve-form">
                    <p>Rate the fix quality (1-5):</p>
                    <div className="quality-rating">
                        {[1, 2, 3, 4, 5].map(rating => (
                            <button
                                key={rating}
                                type="button"
                                className={`star-btn ${rating <= fixQuality ? 'active' : ''}`}
                                onClick={() => setFixQuality(rating)}
                            >
                                ⭐
                            </button>
                        ))}
                    </div>
                    <p className="text-secondary">Selected: {fixQuality} / 5</p>
                </div>
            </Modal>
        </div>
    );
};

export default Issues;
