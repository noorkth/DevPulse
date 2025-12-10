import React from 'react';
import Card from '../common/Card';

interface ProjectCardProps {
    project: any;
    onEdit: (project: any) => void;
    onDelete: (id: string) => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onEdit, onDelete }) => {
    return (
        <Card>
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
                    <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => onEdit(project)}
                    >
                        Edit
                    </button>
                    <button
                        className="btn btn-danger btn-sm"
                        onClick={() => onDelete(project.id)}
                    >
                        Archive
                    </button>
                </div>
            </div>
        </Card>
    );
};

export default ProjectCard;
