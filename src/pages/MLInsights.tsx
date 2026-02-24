import React, { useEffect, useState } from 'react';
import './MLInsights.css';

interface Hotspot {
    id: string;
    name: string;
    type: string;
    bugCount: number;
    bugDensity: number;
    recurringRate: number;
    criticalCount: number;
    riskScore: number;
    trend: 'increasing' | 'stable' | 'decreasing';
    recommendation: string;
}

export const MLInsights: React.FC = () => {
    const [hotspots, setHotspots] = useState<Hotspot[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadHotspots();
    }, []);

    const loadHotspots = async () => {
        setLoading(true);
        try {
            const result = await (window.api as any).ml.detectHotspots();
            if (result.success) {
                setHotspots(result.hotspots);
            }
        } catch (error) {
            console.error('Failed to load hotspots:', error);
        } finally {
            setLoading(false);
        }
    };

    const getRiskColor = (score: number) => {
        if (score >= 70) return '#ef4444';
        if (score >= 50) return '#f59e0b';
        if (score >= 30) return '#eab308';
        return '#10b981';
    };

    const getTrendIcon = (trend: string) => {
        if (trend === 'increasing') return '📈';
        if (trend === 'decreasing') return '📉';
        return '➡️';
    };

    if (loading) {
        return (
            <div className="ml-insights">
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Analyzing bug patterns...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="ml-insights">
            <div className="insights-header">
                <h2>🤖 ML Insights</h2>
                <button className="refresh-btn" onClick={loadHotspots}>
                    🔄 Refresh
                </button>
            </div>

            <div className="hotspots-section">
                <h3>🔥 Bug Hotspots ({hotspots.length})</h3>
                <p className="section-subtitle">
                    AI-powered detection of high-risk code areas
                </p>

                {hotspots.length === 0 ? (
                    <div className="empty-state">
                        <p>✅ No significant hotspots detected</p>
                        <span>Your codebase is looking healthy!</span>
                    </div>
                ) : (
                    <div className="hotspots-grid">
                        {hotspots.map(hotspot => (
                            <div key={hotspot.id} className="hotspot-card">
                                <div className="hotspot-header">
                                    <h4>{hotspot.name}</h4>
                                    <div
                                        className="risk-badge"
                                        style={{ backgroundColor: getRiskColor(hotspot.riskScore) }}
                                    >
                                        Risk: {hotspot.riskScore}
                                    </div>
                                </div>

                                <div className="hotspot-metrics">
                                    <div className="metric">
                                        <span className="metric-label">Total Bugs:</span>
                                        <span className="metric-value">{hotspot.bugCount}</span>
                                    </div>
                                    <div className="metric">
                                        <span className="metric-label">Critical:</span>
                                        <span className="metric-value critical">
                                            {hotspot.criticalCount}
                                        </span>
                                    </div>
                                    <div className="metric">
                                        <span className="metric-label">Bug Density:</span>
                                        <span className="metric-value">
                                            {hotspot.bugDensity.toFixed(2)}/day
                                        </span>
                                    </div>
                                    <div className="metric">
                                        <span className="metric-label">Recurrence:</span>
                                        <span className="metric-value">
                                            {Math.round(hotspot.recurringRate * 100)}%
                                        </span>
                                    </div>
                                </div>

                                <div className="hotspot-trend">
                                    <span className="trend-icon">{getTrendIcon(hotspot.trend)}</span>
                                    <span className={`trend-text ${hotspot.trend}`}>
                                        {hotspot.trend}
                                    </span>
                                </div>

                                <div className="hotspot-recommendation">
                                    {hotspot.recommendation}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
