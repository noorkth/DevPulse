import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Pagination from '../components/common/Pagination';
import { usePagination } from '../hooks/usePagination';
import './Users.css';

const Users: React.FC = () => {
    const navigate = useNavigate();
    const [developers, setDevelopers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
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

    return (
        <div className="users-page">
            <div className="page-header">
                <h2>Developers</h2>
                <Button
                    variant={usePaginationMode ? 'primary' : 'secondary'}
                    onClick={() => setUsePaginationMode(!usePaginationMode)}
                    size="sm"
                >
                    {usePaginationMode ? '✓ Pagination ON' : 'Pagination OFF'}
                </Button>
            </div>

            {loading ? (
                <div className="loading">Loading developers...</div>
            ) : (
                <>
                    <div className="developers-grid">
                        {developers.map((developer) => (
                            <Card key={developer.id}>
                                <div className="developer-card">
                                    <div className="developer-avatar">
                                        {developer.fullName.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="developer-info">
                                        <h3>{developer.fullName}</h3>
                                        <p className="developer-email">{developer.email}</p>
                                        <p className="developer-level">
                                            {developer.seniorityLevel?.charAt(0).toUpperCase() +
                                                developer.seniorityLevel?.slice(1) || 'Developer'}
                                        </p>
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
                                    <Button
                                        onClick={() => handleViewPerformance(developer.id)}
                                        variant="primary"
                                        size="sm"
                                    >
                                        View Performance
                                    </Button>
                                </div>
                            </Card>
                        ))}
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
        </div>
    );
};

export default Users;
