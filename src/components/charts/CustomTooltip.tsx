import React from 'react';
import './CustomTooltip.css';

interface TooltipProps {
    active?: boolean;
    payload?: any[];
    label?: string;
    type?: 'default' | 'performance' | 'severity';
}

const CustomTooltip: React.FC<TooltipProps> = ({ active, payload, label, type = 'default' }) => {
    if (!active || !payload || payload.length === 0) {
        return null;
    }

    const formatValue = (value: any, name: string) => {
        if (typeof value === 'number') {
            // Format based on metric type
            if (name.toLowerCase().includes('time') || name.toLowerCase().includes('duration')) {
                return `${value.toFixed(1)}h`;
            }
            if (name.toLowerCase().includes('rate') || name.toLowerCase().includes('percent')) {
                return `${value.toFixed(1)}%`;
            }
            return value.toLocaleString();
        }
        return value;
    };

    const getIcon = (dataKey: string) => {
        const key = dataKey.toLowerCase();
        if (key.includes('velocity')) return '⚡';
        if (key.includes('quality')) return '✨';
        if (key.includes('time')) return '⏱️';
        if (key.includes('issue')) return '🐛';
        if (key.includes('resolved')) return '✅';
        if (key.includes('critical')) return '🔴';
        if (key.includes('high')) return '🟠';
        if (key.includes('medium')) return '🟡';
        if (key.includes('low')) return '🟢';
        return '📊';
    };

    return (
        <div className="custom-tooltip">
            {label && <div className="tooltip-label">{label}</div>}
            <div className="tooltip-items">
                {payload.map((entry, index) => (
                    <div key={`item-${index}`} className="tooltip-item">
                        <span className="tooltip-icon">{getIcon(entry.dataKey)}</span>
                        <span className="tooltip-name" style={{ color: entry.color }}>
                            {entry.name}:
                        </span>
                        <span className="tooltip-value">
                            {formatValue(entry.value, entry.name)}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CustomTooltip;
