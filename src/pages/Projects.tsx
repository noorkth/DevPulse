import React, { useState, useEffect } from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import Input from '../components/common/Input';
import Loading from '../components/common/Loading';
import EmptyState from '../components/common/EmptyState';
import './Projects.css';

const Projects: React.FC = () => {
    const [products, setProducts] = useState<any[]>([]);
    const [clients, setClients] = useState<any[]>([]);
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<any | null>(null);
    const [selectedProduct, setSelectedProduct] = useState<string>('');
    const [formData, setFormData] = useState({
        name: '',
        clientId: '',
        projectType: '',
        description: '',
        startDate: '',
        endDate: '',
        status: 'active',
    });

    useEffect(() => {
        loadAllData();
    }, []);

    const loadAllData = async () => {
        try {
            setLoading(true);
            const [productsData, clientsData, projectsData] = await Promise.all([
                window.api.products.getAll(),
                window.api.clients.getAll(),
                window.api.projects.getAll(),
            ]);

            setProducts(productsData);
            setClients(clientsData);
            setProjects(projectsData);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateProject = async () => {
        try {
            if (!formData.name || !formData.clientId || !formData.projectType || !formData.startDate) {
                alert('Please fill in all required fields');
                return;
            }

            if (editingProject) {
                await window.api.projects.update(editingProject.id, formData);
            } else {
                await window.api.projects.create(formData);
            }

            setIsModalOpen(false);
            resetForm();
            loadAllData();
        } catch (error) {
            console.error('Error saving project:', error);
            alert('Error saving project: ' + (error as Error).message);
        }
    };

    const handleEdit = (project: any) => {
        setEditingProject(project);
        setSelectedProduct(project.client.productId);
        setFormData({
            name: project.name,
            clientId: project.clientId,
            projectType: project.projectType,
            description: project.description || '',
            startDate: project.startDate.split('T')[0],
            endDate: project.endDate ? project.endDate.split('T')[0] : '',
            status: project.status,
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to archive this project?')) {
            try {
                await window.api.projects.delete(id);
                loadAllData();
            } catch (error) {
                console.error('Error deleting project:', error);
            }
        }
    };

    const resetForm = () => {
        setEditingProject(null);
        setSelectedProduct('');
        setFormData({
            name: '',
            clientId: '',
            projectType: '',
            description: '',
            startDate: '',
            endDate: '',
            status: 'active',
        });
    };

    const handleOpenModal = () => {
        resetForm();
        setIsModalOpen(true);
    };

    // Get filtered clients based on selected product
    const filteredClients = selectedProduct
        ? clients.filter((c) => c.productId === selectedProduct)
        : clients;

    // Group projects by product
    const projectsByProduct = products.map(product => {
        const productClients = clients.filter(c => c.productId === product.id);
        const productProjects = projects.filter(p =>
            productClients.some(c => c.id === p.clientId)
        );

        return {
            product,
            clients: productClients,
            projects: productProjects,
        };
    });

    return (
        <div className="projects-page">
            <div className="page-header">
                <h2>Projects</h2>
                <Button onClick={handleOpenModal}>+ New Project</Button>
            </div>

            {/* Projects organized by Product */}
            {loading ? (
                <Loading size="medium" text="Loading projects..." />
            ) : projects.length === 0 ? (
                <EmptyState
                    icon="📋"
                    title="No projects yet"
                    description="Create your first project to start tracking development work"
                    action={{
                        label: 'Create Project',
                        onClick: handleOpenModal
                    }}
                />
            ) : (
                projectsByProduct.map(({ product, projects: productProjects }) => (
                    <div key={product.id} className="product-section">
                        <div className="product-header">
                            <h3>📦 {product.name}</h3>
                            <span className="count-badge">{productProjects.length} projects</span>
                        </div>

                        {productProjects.length === 0 ? (
                            <p className="no-data">No projects in this product yet</p>
                        ) : (
                            <div className="projects-grid">
                                {productProjects.map((project) => (
                                    <Card key={project.id}>
                                        <div className="project-card">
                                            <div className="project-header">
                                                <h3>{project.name}</h3>
                                                <span className={`status-badge status-${project.status}`}>
                                                    {project.status}
                                                </span>
                                            </div>

                                            <div className="project-meta">
                                                <p className="product-name">🏢 {project.client.product.name}</p>
                                                <p className="client-name">👤 Client: {project.client.name}</p>
                                                <p className="project-type">🔧 {project.projectType}</p>
                                            </div>

                                            {project.description && (
                                                <p className="project-description">{project.description}</p>
                                            )}

                                            <div className="project-stats">
                                                <div className="stat">
                                                    <span className="stat-label">Issues:</span>
                                                    <span className="stat-value">{project._count?.issues || 0}</span>
                                                </div>
                                                <div className="stat">
                                                    <span className="stat-label">Developers:</span>
                                                    <span className="stat-value">{project._count?.developers || 0}</span>
                                                </div>
                                            </div>

                                            <div className="project-actions">
                                                <Button variant="secondary" size="sm" onClick={() => handleEdit(project)}>
                                                    Edit
                                                </Button>
                                                <Button variant="danger" size="sm" onClick={() => handleDelete(project.id)}>
                                                    Archive
                                                </Button>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                ))}

            {/* Create/Edit Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    resetForm();
                }}
                title={editingProject ? 'Edit Project' : 'New Project'}
                size="lg"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleCreateProject}>
                            {editingProject ? 'Update' : 'Create'}
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
                                setFormData({ ...formData, clientId: '' }); // Reset client when product changes
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

                    <Input
                        label="Project Type"
                        value={formData.projectType}
                        onChange={(e) => setFormData({ ...formData, projectType: e.target.value })}
                        placeholder="e.g., Web Application, Mobile App"
                        required
                    />

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
                        />
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
        </div>
    );
};

export default Projects;
