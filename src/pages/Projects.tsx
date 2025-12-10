import React, { useState, useEffect } from 'react';
import Button from '../components/common/Button';
import Loading from '../components/common/Loading';
import EmptyState from '../components/common/EmptyState';
import Pagination from '../components/common/Pagination';
import ProductSection from '../components/projects/ProductSection';
import ProjectFormModal from '../components/projects/ProjectFormModal';
import { usePagination } from '../hooks/usePagination';
import './Projects.css';

const Projects: React.FC = () => {
    const [products, setProducts] = useState<any[]>([]);
    const [clients, setClients] = useState<any[]>([]);
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<any | null>(null);
    const [totalCount, setTotalCount] = useState(0);
    const [hasMore, setHasMore] = useState(false);
    const [usePaginationMode, setUsePaginationMode] = useState(false);

    // Pagination hook
    const {
        page,
        pageSize,
        setPage,
        setPageSize,
        getPaginationParams,
    } = usePagination({ initialPageSize: 20 });

    useEffect(() => {
        loadAllData();
    }, [page, pageSize, usePaginationMode]);

    const loadAllData = async () => {
        try {
            setLoading(true);

            // Always load products and clients (small datasets)
            const [productsData, clientsData] = await Promise.all([
                window.api.products.getAll(),
                window.api.clients.getAll(),
            ]);

            setProducts(productsData);
            setClients(clientsData);

            // Load projects with optional pagination
            if (usePaginationMode) {
                const paginationParams = getPaginationParams();
                const result: any = await window.api.projects.getAll(paginationParams);

                if (result && result.pagination) {
                    setProjects(Array.isArray(result.data) ? result.data : []);
                    setTotalCount(result.pagination.total);
                    setHasMore(result.pagination.hasMore);
                } else {
                    setProjects(Array.isArray(result) ? result : []);
                    setTotalCount(Array.isArray(result) ? result.length : 0);
                    setHasMore(false);
                }
            } else {
                const projectsData = await window.api.projects.getAll();
                setProjects(Array.isArray(projectsData) ? projectsData : []);
                setTotalCount(Array.isArray(projectsData) ? projectsData.length : 0);
                setHasMore(false);
            }
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateOrUpdateProject = async (data: any) => {
        try {
            if (editingProject) {
                await window.api.projects.update(editingProject.id, data);
            } else {
                await window.api.projects.create(data);
            }

            setIsModalOpen(false);
            setEditingProject(null);
            setPage(1);
            loadAllData();
        } catch (error) {
            console.error('Error saving project:', error);
            alert('Error saving project: ' + (error as Error).message);
        }
    };

    const handleEdit = (project: any) => {
        setEditingProject(project);
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

    const handleOpenModal = () => {
        setEditingProject(null);
        setIsModalOpen(true);
    };

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
                <div className="header-actions">
                    <Button
                        variant={usePaginationMode ? 'primary' : 'secondary'}
                        onClick={() => setUsePaginationMode(!usePaginationMode)}
                        size="sm"
                    >
                        {usePaginationMode ? '✓ Pagination ON' : 'Pagination OFF'}
                    </Button>
                    <Button onClick={handleOpenModal}>+ New Project</Button>
                </div>
            </div>

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
                <>
                    {projectsByProduct.map(({ product, projects: productProjects }) => (
                        <ProductSection
                            key={product.id}
                            product={product}
                            projects={productProjects}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                        />
                    ))}

                    {usePaginationMode && (
                        <Pagination
                            currentPage={page}
                            totalItems={totalCount}
                            pageSize={pageSize}
                            hasMore={hasMore}
                            onPageChange={setPage}
                            onPageSizeChange={setPageSize}
                        />
                    )}
                </>
            )}

            <ProjectFormModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingProject(null);
                }}
                onSubmit={handleCreateOrUpdateProject}
                project={editingProject}
                products={products}
                clients={clients}
            />
        </div>
    );
};

export default Projects;
