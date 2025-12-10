import React from 'react';
import ProjectList from './ProjectList';

interface ProductSectionProps {
    product: any;
    projects: any[];
    onEdit: (project: any) => void;
    onDelete: (id: string) => void;
}

const ProductSection: React.FC<ProductSectionProps> = ({ product, projects, onEdit, onDelete }) => {
    return (
        <div className="product-section">
            <div className="product-header">
                <h3>📦 {product.name}</h3>
                <span className="count-badge">{projects.length} projects</span>
            </div>

            <ProjectList
                projects={projects}
                onEdit={onEdit}
                onDelete={onDelete}
            />
        </div>
    );
};

export default ProductSection;
