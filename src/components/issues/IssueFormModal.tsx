import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';

interface IssueFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
    projects: any[];
    developers: any[];
}

const IssueFormModal: React.FC<IssueFormModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    projects,
    developers
}) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        severity: 'medium',
        projectId: '',
        featureId: '',
        assignedToId: '',
    });

    useEffect(() => {
        if (!isOpen) {
            // Reset form when modal closes
            setFormData({
                title: '',
                description: '',
                severity: 'medium',
                projectId: '',
                featureId: '',
                assignedToId: '',
            });
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Convert empty strings to null for optional fields
        const submitData = {
            ...formData,
            featureId: formData.featureId || null,
            assignedToId: formData.assignedToId || null,
        };

        onSubmit(submitData);
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="New Issue"
            size="lg"
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
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
    );
};

export default IssueFormModal;
