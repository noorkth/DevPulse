import React from 'react';

interface IssueFiltersProps {
    filters: {
        severity: string;
        status: string;
        developerId: string;
        projectId: string;
        clientId: string;
    };
    onChange: (filters: any) => void;
    onReset: () => void;
    count: number;
    total: number;
    projects: any[];
    developers: any[];
    clients: any[];
}

const IssueFilters: React.FC<IssueFiltersProps> = ({
    filters,
    onChange,
    onReset,
    count,
    total,
    projects,
    developers,
    clients
}) => {
    return (
        <div className="filters-container">
            <div className="filters-row">
                <div className="filter-group">
                    <label className="filter-label">Severity</label>
                    <select
                        className="filter-select"
                        value={filters.severity}
                        onChange={(e) => onChange({ ...filters, severity: e.target.value })}
                    >
                        <option value="all">All Severities</option>
                        <option value="critical">🔴 Critical</option>
                        <option value="high">🟠 High</option>
                        <option value="medium">🟡 Medium</option>
                        <option value="low">🟢 Low</option>
                    </select>
                </div>

                <div className="filter-group">
                    <label className="filter-label">Status</label>
                    <select
                        className="filter-select"
                        value={filters.status}
                        onChange={(e) => onChange({ ...filters, status: e.target.value })}
                    >
                        <option value="all">All Statuses</option>
                        <option value="open">Open</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                    </select>
                </div>

                <div className="filter-group">
                    <label className="filter-label">Developer</label>
                    <select
                        className="filter-select"
                        value={filters.developerId}
                        onChange={(e) => onChange({ ...filters, developerId: e.target.value })}
                    >
                        <option value="all">All Developers</option>
                        {developers.map((dev) => (
                            <option key={dev.id} value={dev.id}>
                                {dev.fullName}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="filter-group">
                    <label className="filter-label">Project</label>
                    <select
                        className="filter-select"
                        value={filters.projectId}
                        onChange={(e) => onChange({ ...filters, projectId: e.target.value })}
                    >
                        <option value="all">All Projects</option>
                        {projects.map((project) => (
                            <option key={project.id} value={project.id}>
                                {project.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="filter-group">
                    <label className="filter-label">Client</label>
                    <select
                        className="filter-select"
                        value={filters.clientId}
                        onChange={(e) => onChange({ ...filters, clientId: e.target.value })}
                    >
                        <option value="all">All Clients</option>
                        {clients.map((client) => (
                            <option key={client.id} value={client.id}>
                                {client.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="filter-actions">
                    <button className="btn btn-secondary btn-sm" onClick={onReset}>
                        Reset
                    </button>
                    <span className="filter-count">
                        {count} of {total} issues
                    </span>
                </div>
            </div>
        </div>
    );
};

export default IssueFilters;
