import React, { useState, useEffect } from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { Link } from 'react-router-dom';
import Loading from '../components/common/Loading';
import EmptyState from '../components/common/EmptyState';
import Input from '../components/common/Input';
import './Clients.css';

const Clients: React.FC = () => {
    const [products, setProducts] = useState<any[]>([]);
    const [clients, setClients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingClient, setEditingClient] = useState<any | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        productId: '',
        contactInfo: '',
    });

    // Delete flow state
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [clientToDelete, setClientToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [productsData, clientsData] = await Promise.all([
                window.api.products.getAll(),
                window.api.clients.getAll(),
            ]);
            setProducts(productsData);
            setClients(clientsData);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            if (!formData.name.trim() || !formData.productId) {
                alert('Client name and product are required');
                return;
            }

            if (editingClient) {
                await window.api.clients.update(editingClient.id, formData);
            } else {
                await window.api.clients.create(formData);
            }

            setIsModalOpen(false);
            resetForm();
            loadData();
        } catch (error) {
            console.error('Error saving client:', error);
            alert('Error saving client: ' + (error as Error).message);
        }
    };

    const handleEdit = (client: any) => {
        setEditingClient(client);
        setFormData({
            name: client.name,
            productId: client.productId,
            contactInfo: client.contactInfo || '',
        });
        setIsModalOpen(true);
    };

    const handleDelete = (id: string) => {
        setClientToDelete(id);
        setIsConfirmOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!clientToDelete) return;

        try {
            setIsDeleting(true);
            await window.api.clients.delete(clientToDelete);
            loadData();
            setIsConfirmOpen(false);
            setClientToDelete(null);
        } catch (error) {
            console.error('Error deleting client:', error);
            alert('Error deleting client: ' + (error as Error).message);
        } finally {
            setIsDeleting(false);
        }
    };

    const resetForm = () => {
        setEditingClient(null);
        setFormData({
            name: '',
            productId: '',
            contactInfo: '',
        });
    };

    const handleOpenModal = () => {
        resetForm();
        setIsModalOpen(true);
    };

    // Group clients by product
    const clientsByProduct = products.map(product => {
        const productClients = clients.filter(c => c.productId === product.id);
        return {
            product,
            clients: productClients,
        };
    });

    return (
        <div className="clients-page">
            <div className="page-header">
                <div>
                    <h2>Clients</h2>
                    <p className="page-subtitle">Manage clients across all products</p>
                </div>
                <Button onClick={handleOpenModal}>+ New Client</Button>
            </div>

            {loading ? (
                <Loading size="medium" text="Loading clients..." />
            ) : products.length === 0 ? (
                <EmptyState
                    icon="📦"
                    title="Create a product first"
                    description="You need to create at least one product before adding clients"
                    action={{
                        label: 'Go to Products',
                        onClick: () => window.location.hash = '#/products'
                    }}
                />
            ) : clients.length === 0 ? (
                <EmptyState
                    icon="👥"
                    title="No clients yet"
                    description="Create your first client to start tracking projects"
                    action={{
                        label: 'Create Client',
                        onClick: handleOpenModal
                    }}
                />
            ) : (
                <>
                    {clientsByProduct.map(({ product, clients: productClients }) => (
                        <div key={product.id} className="product-section">
                            <div className="section-header">
                                <h3>📦 {product.name}</h3>
                                <span className="count-badge">{productClients.length} clients</span>
                            </div>

                            {productClients.length === 0 ? (
                                <p className="no-data">No clients in this product yet</p>
                            ) : (
                                <div className="clients-grid">
                                    {productClients.map((client) => (
                                        <Card key={client.id}>
                                            <div className="client-card">
                                                <div className="client-header">
                                                    <div className="client-avatar">
                                                        {client.name.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <div className="client-info">
                                                        <h4>{client.name}</h4>
                                                        <p className="product-label">📦 {product.name}</p>
                                                    </div>
                                                </div>

                                                {client.contactInfo && (
                                                    <p className="contact-info">📧 {client.contactInfo}</p>
                                                )}

                                                <div className="client-stats">
                                                    <div className="stat">
                                                        <span className="stat-value">{client._count?.projects || 0}</span>
                                                        <span className="stat-label">Projects</span>
                                                    </div>
                                                </div>

                                                <div className="client-actions">
                                                    <Button variant="secondary" size="sm" onClick={() => handleEdit(client)}>
                                                        Edit
                                                    </Button>
                                                    <Button variant="danger" size="sm" onClick={() => handleDelete(client.id)}>
                                                        Delete
                                                    </Button>
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </>
            )}

            <Modal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    resetForm();
                }}
                title={editingClient ? 'Edit Client' : 'New Client'}
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSave}>
                            {editingClient ? 'Update' : 'Create'}
                        </Button>
                    </>
                }
            >
                <div className="client-form">
                    <Input
                        label="Client Name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., Acme Corporation"
                        required
                    />

                    <div className="form-group">
                        <label className="input-label">Product *</label>
                        <select
                            className="input"
                            value={formData.productId}
                            onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
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

                    <Input
                        label="Contact Info"
                        value={formData.contactInfo}
                        onChange={(e) => setFormData({ ...formData, contactInfo: e.target.value })}
                        placeholder="Email, phone, or main contact person"
                    />

                    <div className="info-box">
                        <strong>💡 Tip:</strong> Clients belong to products. Each client can have multiple projects.
                    </div>
                </div>
            </Modal>

            <ConfirmDialog
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={handleDeleteConfirm}
                title="Delete Client"
                message="Are you sure you want to delete this client? This will also delete all associated projects and issues. This action cannot be undone."
                confirmText="Delete Client"
                variant="danger"
                isLoading={isDeleting}
            />
        </div >
    );
};

export default Clients;
