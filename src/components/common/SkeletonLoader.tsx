import React from 'react';
import './SkeletonLoader.css';

interface SkeletonLoaderProps {
    type?: 'card' | 'list' | 'chart' | 'text';
    count?: number;
    className?: string;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
    type = 'card',
    count = 1,
    className = '',
}) => {
    const skeletons = Array.from({ length: count });

    if (type === 'text') {
        return (
            <div className={`skeleton-text-container ${className}`}>
                {skeletons.map((_, i) => (
                    <div key={i} className="skeleton skeleton-text" />
                ))}
            </div>
        );
    }

    if (type === 'list') {
        return (
            <div className={`skeleton-list-container ${className}`}>
                {skeletons.map((_, i) => (
                    <div key={i} className="skeleton-list-item">
                        <div className="skeleton skeleton-circle" style={{ width: 40, height: 40 }} />
                        <div className="skeleton-list-content">
                            <div className="skeleton skeleton-text" style={{ width: '60%' }} />
                            <div className="skeleton skeleton-text" style={{ width: '40%' }} />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (type === 'chart') {
        return (
            <div className={`skeleton-chart ${className}`}>
                <div className="skeleton" style={{ width: '100%', height: 300, borderRadius: 'var(--radius-lg)' }} />
            </div>
        );
    }

    // Default: card
    return (
        <div className={`skeleton-card-container ${className}`}>
            {skeletons.map((_, i) => (
                <div key={i} className="skeleton-card">
                    <div className="skeleton skeleton-text" style={{ width: '70%', marginBottom: 12 }} />
                    <div className="skeleton skeleton-text" style={{ width: '90%', marginBottom: 8 }} />
                    <div className="skeleton skeleton-text" style={{ width: '60%' }} />
                </div>
            ))}
        </div>
    );
};

export default SkeletonLoader;
