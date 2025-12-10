import React, { useState, useEffect } from 'react';
import Button from '../components/common/Button';
import Pagination from '../components/common/Pagination';
import IssueFilters from '../components/issues/IssueFilters';
import IssueList from '../components/issues/IssueList';
import IssueFormModal from '../components/issues/IssueFormModal';
import ResolveIssueModal from '../components/issues/ResolveIssueModal';
import CSVImport from '../components/issues/CSVImport';
import { usePagination } from '../hooks/usePagination';
import './Issues.css';

const Issues: React.FC = () => {
    const [issues, setIssues] = useState<any[]>([]);
    const [projects, setProjects] = useState<any[]>([]);
    const [developers, setDevelopers] = useState<any[]>([]);
    const [clients, setClients] = useState<any[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
    const [selectedIssue, setSelectedIssue] = useState<any>(null);
    const [totalCount, setTotalCount] = useState(0);
    const [hasMore, setHasMore] = useState(false);
    const [usePaginationMode, setUsePaginationMode] = useState(false); // Toggle for demo

    // Pagination hook
    const {
        page,
        pageSize,
        setPage,
        setPageSize,
        getPaginationParams,
    } = usePagination({ initialPageSize: 20 });

    // Filter states
    const [filters, setFilters] = useState({
        severity: 'all',
        developerId: 'all',
        projectId: 'all',
        clientId: 'all',
        status: 'all',
    });

    useEffect(() => {
        loadData();
    }, [page, pageSize, usePaginationMode]);

    useEffect(() => {
        // Load supporting data once
        loadSupportingData();
    }, []);

    const loadSupportingData = async () => {
        try {
            const [projectsData, developersData, clientsData] = await Promise.all([
                window.api.projects.getAll(),
                window.api.developers.getAll(),
                window.api.clients.getAll(),
            ]);

            // Ensure arrays - handle both array and PaginationResult responses
            setProjects(Array.isArray(projectsData) ? projectsData : []);

            // Filter out managers - only show developers
            const devArray = Array.isArray(developersData) ? developersData : [];
            const onlyDevelopers = devArray.filter((dev: any) => dev.role === 'developer');
            setDevelopers(onlyDevelopers);

            setClients(Array.isArray(clientsData) ? clientsData : []);
        } catch (error) {
            console.error('Error loading supporting data:', error);
        }
    };

    const loadData = async () => {
        try {
            if (usePaginationMode) {
                // Use pagination - pass empty object for filters, then pagination params
                const paginationParams = getPaginationParams();
                const result: any = await window.api.issues.getAll({}, paginationParams);

                // Backend returns PaginationResult when pagination is used
                if (result && result.pagination) {
                    setIssues(Array.isArray(result.data) ? result.data : []);
                    setTotalCount(result.pagination.total);
                    setHasMore(result.pagination.hasMore);
                } else {
                    // Fallback if something went wrong
                    setIssues(Array.isArray(result) ? result : []);
                    setTotalCount(Array.isArray(result) ? result.length : 0);
                    setHasMore(false);
                }
            } else {
                // Load all (backwards compatible)
                const issuesData = await window.api.issues.getAll();
                setIssues(Array.isArray(issuesData) ? issuesData : []);
                setTotalCount(Array.isArray(issuesData) ? issuesData.length : 0);
                setHasMore(false);
            }
        } catch (error) {
            console.error('Error loading issues:', error);
        }
    };

    // Filter issues client-side (or we could send filters to backend)
    const filteredIssues = issues.filter(issue => {
        if (filters.severity !== 'all' && issue.severity !== filters.severity) return false;
        if (filters.developerId !== 'all' && issue.assignedToId !== filters.developerId) return false;
        if (filters.projectId !== 'all' && issue.projectId !== filters.projectId) return false;
        if (filters.status !== 'all' && issue.status !== filters.status) return false;

        // Client filter - check if issue's project belongs to selected client
        if (filters.clientId !== 'all') {
            const issueProject = projects.find(p => p.id === issue.projectId);
            if (!issueProject || issueProject.clientId !== filters.clientId) return false;
        }

        return true;
    });

    const resetFilters = () => {
        setFilters({
            severity: 'all',
            developerId: 'all',
            projectId: 'all',
            clientId: 'all',
            status: 'all',
        });
    };

    const handleSubmit = async (data: any) => {
        try {
            await window.api.issues.create(data);
            setIsModalOpen(false);
            setPage(1); // Reset to first page
            loadData();
        } catch (error) {
            console.error('Error creating issue:', error);
        }
    };

    const handleResolve = async (fixQuality: number) => {
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
        setIsResolveModalOpen(true);
    };

    return (
        <div className="issues-page">
            <div className="issues-header">
                <h2>Issues</h2>
                <div className="header-actions">
                    <Button
                        variant={usePaginationMode ? 'primary' : 'secondary'}
                        onClick={() => setUsePaginationMode(!usePaginationMode)}
                        size="sm"
                    >
                        {usePaginationMode ? '✓ Pagination ON' : 'Pagination OFF'}
                    </Button>
                    <CSVImport onImportComplete={loadData} />
                    <Button variant="primary" onClick={() => setIsModalOpen(true)}>
                        + Create Issue
                    </Button>
                </div>
            </div>

            <IssueFilters
                filters={filters}
                onChange={setFilters}
                onReset={resetFilters}
                count={filteredIssues.length}
                total={usePaginationMode ? totalCount : issues.length}
                projects={projects}
                developers={developers}
                clients={clients}
            />

            <IssueList
                issues={filteredIssues}
                onResolve={openResolveModal}
            />

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

            <IssueFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleSubmit}
                projects={projects}
                developers={developers}
            />

            <ResolveIssueModal
                isOpen={isResolveModalOpen}
                onClose={() => setIsResolveModalOpen(false)}
                onResolve={handleResolve}
                issue={selectedIssue}
            />
        </div>
    );
};

export default Issues;
