import React from 'react';
import Card from '../common/Card';

interface PerformanceMetricsGridProps {
    metrics: {
        totalIssues: number;
        avgResolutionTime: number;
        avgFixQuality: number;
        reopenedCount: number;
    };
}

const PerformanceMetricsGrid: React.FC<PerformanceMetricsGridProps> = ({ metrics }) => {
    return (
        <div className="metrics-grid">
            <Card>
                <div className="metric-card">
                    <div className="metric-icon">🎯</div>
                    <div className="metric-content">
                        <h3>Total Issues</h3>
                        <p className="metric-value">{metrics.totalIssues}</p>
                    </div>
                </div>
            </Card>

            <Card>
                <div className="metric-card">
                    <div className="metric-icon">⏱️</div>
                    <div className="metric-content">
                        <h3>Avg Resolution Time</h3>
                        <p className="metric-value">{metrics.avgResolutionTime}h</p>
                    </div>
                </div>
            </Card>

            <Card>
                <div className="metric-card">
                    <div className="metric-icon">⭐</div>
                    <div className="metric-content">
                        <h3>Avg Fix Quality</h3>
                        <p className="metric-value">{metrics.avgFixQuality.toFixed(1)} / 5</p>
                    </div>
                </div>
            </Card>

            <Card>
                <div className="metric-card">
                    <div className="metric-icon">🔄</div>
                    <div className="metric-content">
                        <h3>Reopened Issues</h3>
                        <p className="metric-value">{metrics.reopenedCount}</p>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default PerformanceMetricsGrid;
