import React from 'react';
import ProjectCard from './ProjectCard';

interface ProjectListProps {
    projects: any[];
    onEdit: (project: any) => void;
    onDelete: (id: string) => void;
}

const ProjectList: React.FC<ProjectListProps> = ({ projects, onEdit, onDelete }) => {
    if (projects.length === 0) {
        return <p className="no-data">No projects in this product yet</p>;
    }

    return (
        <div className="projects-grid">
            {projects.map((project) => (
                <ProjectCard
                    key={project.id}
                    project={project}
                    onEdit={onEdit}
                    onDelete={onDelete}
                />
            ))}
        </div>
    );
};

export default ProjectList;
