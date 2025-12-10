import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';

interface ProjectFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
    project: any | null;
    products: any[];
    clients: any[];
}

const ProjectFormModal: React.FC<ProjectFormModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    project,
    products,
    clients
}) => {
    const [selectedProduct, setSelectedProduct] = useState<string>('');
    const [isOngoing, setIsOngoing] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        clientId: '',
        projectType: '',
        description: '',
        startDate: '',
        endDate: '',
        status: 'active',
    });

    // Initialize form when editing
    useEffect(() => {
        if (project) {
            setSelectedProduct(project.client.productId);
            setIsOngoing(!project.endDate);

            const formatDateForInput = (dateValue: any) => {
                if (!dateValue) return '';
                const date = typeof dateValue === 'string' ? dateValue : dateValue.toISOString();
                return date.split('T')[0];
            };

            setFormData({
                name: project.name,
                clientId: project.clientId,
                projectType: project.projectType,
                description: project.description || '',
                startDate: formatDateForInput(project.startDate),
                endDate: formatDateForInput(project.endDate),
                status: project.status,
            });
        } else {
            setSelectedProduct('');
            setIsOngoing(false);
            setFormData({
                name: '',
                clientId: '',
                projectType: '',
                description: '',
                startDate: '',
                endDate: '',
                status: 'active',
            });
        }
    }, [project, isOpen]);

    const filteredClients = selectedProduct
        ? clients.filter((c) => c.productId === selectedProduct)
        : clients;

    const handleSubmit = () => {
        if (!formData.name || !formData.clientId || !formData.projectType || !formData.startDate) {
            alert('Please fill in all required fields');
            return;
        }

        // Prepare data with proper formatting
        const submitData = {
            ...formData,
            startDate: new Date(formData.startDate).toISOString(),
            endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
        };

        onSubmit(submitData);
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={project ? 'Edit Project' : 'New Project'}
            size="lg"
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit}>
                        {project ? 'Update' : 'Create'}
                    </Button>
                </>
            }
        >
            <div className="project-form">
                <Input
                    label="Project Name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                />

                <div className="form-group">
                    <label className="input-label">Product *</label>
                    <select
                        className="input"
                        value={selectedProduct}
                        onChange={(e) => {
                            setSelectedProduct(e.target.value);
                            setFormData({ ...formData, clientId: '' });
                        }}
                        required
                    >
                        <option value="">Select product...</option>
                        {products.map((p) => (
                            <option key={p.id} value={p.id}>
                                {p.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <label className="input-label">Client *</label>
                    <select
                        className="input"
                        value={formData.clientId}
                        onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                        required
                        disabled={!selectedProduct}
                    >
                        <option value="">Select client...</option>
                        {filteredClients.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <label className="input-label">Project Type *</label>
                    <select
                        className="input"
                        value={formData.projectType}
                        onChange={(e) => setFormData({ ...formData, projectType: e.target.value })}
                        required
                    >
                        <option value="">Select type...</option>
                        <option value="web">Web Application</option>
                        <option value="mobile">Mobile App</option>
                        <option value="desktop">Desktop App</option>
                        <option value="api">API/Backend</option>
                        <option value="aosp_stb">AOSP STB</option>
                        <option value="catv_stb">CATV STB</option>
                        <option value="other">Other</option>
                    </select>
                </div>

                <Input
                    label="Description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    isTextarea
                    rows={3}
                />

                <div className="form-row">
                    <Input
                        label="Start Date"
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        required
                    />

                    <Input
                        label="End Date"
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                        disabled={isOngoing}
                    />
                </div>

                <div className="form-group">
                    <label className="checkbox-label">
                        <input
                            type="checkbox"
                            checked={isOngoing}
                            onChange={(e) => {
                                setIsOngoing(e.target.checked);
                                if (e.target.checked) {
                                    setFormData({ ...formData, endDate: '' });
                                }
                            }}
                        />
                        <span>🔄 Ongoing Project (No end date)</span>
                    </label>
                </div>

                <div className="form-group">
                    <label className="input-label">Status</label>
                    <select
                        className="input"
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                        <option value="active">Active</option>
                        <option value="completed">Completed</option>
                        <option value="on-hold">On Hold</option>
                        <option value="archived">Archived</option>
                    </select>
                </div>
            </div>
        </Modal>
    );
};

export default ProjectFormModal;
