// Custom Recharts Theme Configuration
export const chartColors = {
    // Primary color palette
    primary: [
        '#6366f1', // indigo-500
        '#8b5cf6', // violet-500
        '#10b981', // emerald-500
        '#f59e0b', // amber-500
        '#ef4444', // red-500
        '#3b82f6', // blue-500
        '#ec4899', // pink-500
        '#14b8a6', // teal-500
    ],

    // Severity colors
    severity: {
        critical: '#dc2626', // red-600
        high: '#ea580c', // orange-600
        medium: '#f59e0b', // amber-500
        low: '#10b981', // emerald-500
    },

    // Status colors
    status: {
        open: '#ef4444', // red-500
        in_progress: '#f59e0b', // amber-500
        resolved: '#10b981', // emerald-500
        closed: '#6b7280', // gray-500
    },

    // Gradient colors
    gradients: {
        primary: ['#6366f1', '#8b5cf6'],
        success: ['#10b981', '#14b8a6'],
        warning: ['#f59e0b', '#f97316'],
        danger: ['#ef4444', '#dc2626'],
    },
};

// Chart default configuration
export const chartDefaults = {
    fontSize: 12,
    fontFamily: 'var(--font-family)',
    fontWeight: 500,

    // Grid styling
    grid: {
        stroke: 'var(--color-border)',
        strokeDasharray: '3 3',
        opacity: 0.5,
    },

    // Axis styling
    axis: {
        stroke: 'var(--color-text-secondary)',
        fontSize: 11,
        fontWeight: 500,
    },

    // Tooltip styling
    tooltip: {
        cursor: {
            fill: 'rgba(99, 102, 241, 0.1)',
        },
    },

    // Animation
    animation: {
        duration: 400,
        easing: 'ease-out',
    },
};

// Custom tooltip component configuration
export const tooltipConfig = {
    contentStyle: {
        backgroundColor: 'var(--color-bg-secondary)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        padding: 'var(--spacing-md)',
        boxShadow: 'var(--shadow-lg)',
    },
    labelStyle: {
        color: 'var(--color-text-primary)',
        fontWeight: 600,
        marginBottom: 'var(--spacing-xs)',
    },
    itemStyle: {
        color: 'var(--color-text-secondary)',
        padding: 'var(--spacing-xs) 0',
    },
};

// Export chart configuration
export const getChartConfig = (type: 'line' | 'bar' | 'area' | 'pie') => {
    const baseConfig = {
        margin: { top: 10, right: 30, left: 0, bottom: 5 },
    };

    switch (type) {
        case 'line':
            return {
                ...baseConfig,
                strokeWidth: 2,
                dot: { r: 4, strokeWidth: 2 },
                activeDot: { r: 6 },
            };
        case 'bar':
            return {
                ...baseConfig,
                barSize: 40,
                radius: [8, 8, 0, 0],
            };
        case 'area':
            return {
                ...baseConfig,
                fillOpacity: 0.6,
                strokeWidth: 2,
            };
        case 'pie':
            return {
                innerRadius: 60,
                outerRadius: 80,
                paddingAngle: 2,
            };
        default:
            return baseConfig;
    }
};

export default {
    chartColors,
    chartDefaults,
    tooltipConfig,
    getChartConfig,
};
