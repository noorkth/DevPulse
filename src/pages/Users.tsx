import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Pagination from '../components/common/Pagination';
import { usePagination } from '../hooks/usePagination';
import AddDeveloperModal from '../components/developers/AddDeveloperModal';
import './Users.css';

const Users: React.FC = () => {
    const navigate = useNavigate();
    const [developers, setDevelopers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalCount, setTotalCount] = useState(0);
    const [hasMore, setHasMore] = useState(false);
    const [usePaginationMode, setUsePaginationMode] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingDeveloper, setEditingDeveloper] = useState<any | null>(null);

    // Pagination hook
    const {
        page,
        pageSize,
        setPage,
        setPageSize,
        getPaginationParams,
    } = usePagination({ initialPageSize: 20 });

    useEffect(() => {
        loadDevelopers();
    }, [page, pageSize, usePaginationMode]);

    const loadDevelopers = async () => {
        try {
            setLoading(true);

            if (usePaginationMode) {
                const paginationParams = getPaginationParams();
                const result: any = await window.api.developers.getAll(paginationParams);

                if (result && result.pagination) {
                    setDevelopers(result.data);
                    setTotalCount(result.pagination.total);
                    setHasMore(result.pagination.hasMore);
                } else {
                    setDevelopers(Array.isArray(result) ? result : []);
                    setTotalCount(Array.isArray(result) ? result.length : 0);
                    setHasMore(false);
                }
            } else {
                const developersData = await window.api.developers.getAll();
                setDevelopers(developersData);
                setTotalCount(developersData.length);
                setHasMore(false);
            }
        } catch (error) {
            console.error('Error loading developers:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleViewPerformance = (developerId: string) => {
        navigate(`/performance/${developerId}`);
    };

    const handleEdit = (developer: any) => {
        setEditingDeveloper(developer);
        setIsAddModalOpen(true);
    };

    const handleDeveloperAdded = (newDeveloper: any) => {
        // Refresh list
        loadDevelopers();
    };

    const parseSkills = (skillsJson: string) => {
        try {
            const parsed = JSON.parse(skillsJson || '[]');
            return Array.isArray(parsed) ? parsed.slice(0, 3) : []; // Show top 3
        } catch {
            return [];
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            year: 'numeric'
        });
    };

    const handleOpenAddModal = () => {
        setEditingDeveloper(null);
        setIsAddModalOpen(true);
    };

    return (
        <div className="users-page">
            <div className="page-header">
                <h2>Users</h2>
                <div className="header-actions">
                    <Button
                        variant={usePaginationMode ? 'primary' : 'secondary'}
                        onClick={() => setUsePaginationMode(!usePaginationMode)}
                        size="sm"
                    >
                        {usePaginationMode ? '✓ Pagination ON' : 'Pagination OFF'}
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleOpenAddModal}
                        size="sm"
                    >
                        + Add Users
                    </Button>
                </div>
            </div>

            {loading ? (
                <div className="loading">Loading developers...</div>
            ) : (
                <>
                    {/* Project Managers Section */}
                    {developers.some(d => d.role === 'manager') && (
                        <div className="section-container">
                            <h3 className="section-title">Project Managers</h3>
                            <div className="developers-grid">
                                {developers.filter(d => d.role === 'manager').map((developer) => (
                                    <Card key={developer.id}>
                                        <div className="developer-card">
                                            <div className="developer-header">
                                                <div className="developer-avatar pm-avatar">
                                                    {developer.fullName.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="joined-date">
                                                    Joined {formatDate(developer.createdAt)}
                                                </div>
                                            </div>
                                            <div className="developer-info">
                                                <h3>{developer.fullName}</h3>
                                                <p className="developer-email">{developer.email}</p>
                                                <p className="developer-level">
                                                    {developer.seniorityLevel?.charAt(0).toUpperCase() +
                                                        developer.seniorityLevel?.slice(1) || 'Senior'}
                                                    <span className="role-badge">PM</span>
                                                </p>
                                                <div className="skills-container">
                                                    {parseSkills(developer.skills).map((skill: string, i: number) => (
                                                        <span key={i} className="skill-tag">{skill}</span>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="developer-stats">
                                                <div className="stat">
                                                    <span className="stat-label">Projects:</span>
                                                    <span className="stat-value">{developer._count?.projects || 0}</span>
                                                </div>
                                            </div>
                                            <div className="developer-actions" style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                                                <Button
                                                    onClick={() => handleEdit(developer)}
                                                    variant="secondary"
                                                    size="sm"
                                                    style={{ flex: 1 }}
                                                >
                                                    Edit
                                                </Button>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Developers Section */}
                    <div className="section-container">
                        <h3 className="section-title">Developers</h3>
                        <div className="developers-grid">
                            {developers.filter(d => d.role !== 'manager').map((developer) => (
                                <Card key={developer.id}>
                                    <div className="developer-card">
                                        <div className="developer-header">
                                            <div className="developer-avatar">
                                                {developer.fullName.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="joined-date">
                                                Joined {formatDate(developer.createdAt)}
                                            </div>
                                        </div>
                                        <div className="developer-info">
                                            <h3>{developer.fullName}</h3>
                                            <p className="developer-email">{developer.email}</p>
                                            <p className="developer-level">
                                                {developer.seniorityLevel?.charAt(0).toUpperCase() +
                                                    developer.seniorityLevel?.slice(1) || 'Developer'}
                                            </p>
                                            <div className="skills-container">
                                                {parseSkills(developer.skills).map((skill: string, i: number) => (
                                                    <span key={i} className="skill-tag">{skill}</span>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="developer-stats">
                                            <div className="stat">
                                                <span className="stat-label">Issues:</span>
                                                <span className="stat-value">{developer._count?.issues || 0}</span>
                                            </div>
                                            <div className="stat">
                                                <span className="stat-label">Projects:</span>
                                                <span className="stat-value">{developer._count?.projects || 0}</span>
                                            </div>
                                        </div>
                                        <div className="developer-actions" style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                                            <Button
                                                onClick={() => handleViewPerformance(developer.id)}
                                                variant="primary"
                                                size="sm"
                                                style={{ flex: 1 }}
                                            >
                                                Stats
                                            </Button>
                                            <Button
                                                onClick={() => handleEdit(developer)}
                                                variant="secondary"
                                                size="sm"
                                                style={{ flex: 1 }}
                                            >
                                                Edit
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>

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

            <AddDeveloperModal
                isOpen={isAddModalOpen}
                onClose={() => {
                    setIsAddModalOpen(false);
                    setEditingDeveloper(null);
                }}
                onSuccess={handleDeveloperAdded}
                developer={editingDeveloper}
            />
        </div>
    );
};

export default Users;
