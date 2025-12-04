import React, { useState, useEffect } from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import Input from '../components/common/Input';
import './Products.css';

const Products: React.FC = () => {
    const [products, setProducts] = useState<any[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<any | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
    });

    useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = async () => {
        try {
            const data = await window.api.products.getAll();
            setProducts(data);
        } catch (error) {
            console.error('Error loading products:', error);
        }
    };

    const handleSave = async () => {
        try {
            if (!formData.name.trim()) {
                alert('Product name is required');
                return;
            }

            if (editingProduct) {
                await window.api.products.update(editingProduct.id, formData);
            } else {
                await window.api.products.create(formData);
            }

            setIsModalOpen(false);
            resetForm();
            loadProducts();
        } catch (error) {
            console.error('Error saving product:', error);
            alert('Error saving product: ' + (error as Error).message);
        }
    };

    const handleEdit = (product: any) => {
        setEditingProduct(product);
        setFormData({
            name: product.name,
            description: product.description || '',
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure? This will delete all associated clients and projects!')) {
            try {
                await window.api.products.delete(id);
                loadProducts();
            } catch (error) {
                console.error('Error deleting product:', error);
                alert('Error deleting product: ' + (error as Error).message);
            }
        }
    };

    const resetForm = () => {
        setEditingProduct(null);
        setFormData({
            name: '',
            description: '',
        });
    };

    const handleOpenModal = () => {
        resetForm();
        setIsModalOpen(true);
    };

    return (
        <div className="products-page">
            <div className="page-header">
                <div>
                    <h2>Products</h2>
                    <p className="page-subtitle">Manage your product lines or service categories</p>
                </div>
                <Button onClick={handleOpenModal}>+ New Product</Button>
            </div>

            {products.length === 0 ? (
                <Card>
                    <div className="empty-state">
                        <div className="empty-icon">📦</div>
                        <h3>No products yet</h3>
                        <p>Create your first product to organize clients and projects</p>
                        <Button onClick={handleOpenModal}>Create Product</Button>
                    </div>
                </Card>
            ) : (
                <div className="products-grid">
                    {products.map((product) => (
                        <Card key={product.id}>
                            <div className="product-card">
                                <div className="product-header">
                                    <div className="product-icon">📦</div>
                                    <h3>{product.name}</h3>
                                </div>

                                {product.description && (
                                    <p className="product-description">{product.description}</p>
                                )}

                                <div className="product-stats">
                                    <div className="stat">
                                        <span className="stat-icon">👥</span>
                                        <span className="stat-value">{product._count?.clients || 0}</span>
                                        <span className="stat-label">Clients</span>
                                    </div>
                                </div>

                                <div className="product-actions">
                                    <Button variant="secondary" size="sm" onClick={() => handleEdit(product)}>
                                        Edit
                                    </Button>
                                    <Button variant="danger" size="sm" onClick={() => handleDelete(product.id)}>
                                        Delete
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            <Modal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    resetForm();
                }}
                title={editingProduct ? 'Edit Product' : 'New Product'}
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSave}>
                            {editingProduct ? 'Update' : 'Create'}
                        </Button>
                    </>
                }
            >
                <div className="product-form">
                    <Input
                        label="Product Name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., VU Gear, Enterprise Solutions, Mobile Apps"
                        required
                    />

                    <Input
                        label="Description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Brief description of this product line"
                        isTextarea
                        rows={3}
                    />

                    <div className="info-box">
                        <strong>💡 Tip:</strong> Products are top-level categories. Create products for different service lines, product families, or business units.
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Products;
