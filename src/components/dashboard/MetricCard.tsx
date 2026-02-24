import React from 'react';
import './MetricCard.css';

interface MetricCardProps {
    title: string;
    value: string | number;
    change?: number;
    trend?: 'up' | 'down' | 'neutral';
    icon?: string;
    subtitle?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
    title,
    value,
    change,
    trend = 'neutral',
    icon,
    subtitle
}) => {
    const getTrendColor = () => {
        if (trend === 'up') return 'var(--success-color)';
        if (trend === 'down') return 'var(--error-color)';
        return 'var(--text-secondary)';
    };

    const getTrendIcon = () => {
        if (trend === 'up') return '↑';
        if (trend === 'down') return '↓';
        return '→';
    };

    return (
        <div className="metric-card">
            <div className="metric-header">
                <span className="metric-title">{title}</span>
                {icon && <span className="metric-icon">{icon}</span>}
            </div>
            <div className="metric-value">{value}</div>
            {subtitle && <div className="metric-subtitle">{subtitle}</div>}
            {change !== undefined && (
                <div className="metric-change" style={{ color: getTrendColor() }}>
                    <span className="trend-icon">{getTrendIcon()}</span>
                    <span>{Math.abs(change)}%</span>
                    {trend !== 'neutral' && (
                        <span className="trend-label">
                            {trend === 'up' ? ' vs last period' : ' vs last period'}
                        </span>
                    )}
                </div>
            )}
        </div>
    );
};
