import React, { useState, useEffect } from 'react';
import {
    LineChart,
    BarChart,
    PieChart,
    Bar,
    Pie,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,

    ResponsiveContainer
} from 'recharts';
import { MetricCard } from '../components/dashboard/MetricCard';
import './PerformanceDashboard.css';

interface DashboardStats {
    totalIssues: number;
    openIssues: number;
    resolvedIssues: number;
    recurringIssues: number;
    avgResolutionTime: number;
}

interface ProductivityRanking {
    developerId: string;
    developerName: string;
    productivityScore: number;
    resolvedCount: number;
    recurringCount: number;
    avgResolutionTime: number;
}

interface TimeToFixData {
    bySeverity: {
        critical: number;
        high: number;
        medium: number;
        low: number;
    };
    byDeveloper: Array<{
        developerId: string;
        developerName: string;
        avgTime: number;
        totalResolved: number;
    }>;
    overall: number;
}

export const PerformanceDashboard: React.FC = () => {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [productivity, setProductivity] = useState<ProductivityRanking[]>([]);
    const [timeToFix, setTimeToFix] = useState<TimeToFixData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        setLoading(true);
        try {
            const [statsData, productivityData, timeData] = await Promise.all([
                (window.api as any).analytics.getDashboardStats(),
                (window.api as any).analytics.getProductivityRankings(),
                (window.api as any).analytics.getTimeToFixData()
            ]);

            setStats(statsData);
            setProductivity(productivityData);
            setTimeToFix(timeData);
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading || !stats) {
        return (
            <div className="performance-dashboard">
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Loading performance data...</p>
                </div>
            </div>
        );
    }

    const severityData = timeToFix ? [
        { name: 'Critical', hours: Math.round(timeToFix.bySeverity.critical) },
        { name: 'High', hours: Math.round(timeToFix.bySeverity.high) },
        { name: 'Medium', hours: Math.round(timeToFix.bySeverity.medium) },
        { name: 'Low', hours: Math.round(timeToFix.bySeverity.low) }
    ] : [];

    const productivityChartData = productivity.slice(0, 10).map(dev => ({
        name: dev.developerName.split(' ')[0],
        score: Math.round(dev.productivityScore),
        resolved: dev.resolvedCount
    }));

    const statusPieData = [
        { name: 'Open', value: stats.openIssues, fill: '#f59e0b' },
        { name: 'Resolved', value: stats.resolvedIssues, fill: '#10b981' },
        { name: 'Recurring', value: stats.recurringIssues, fill: '#ef4444' }
    ];

    const resolutionRate = stats.totalIssues > 0
        ? Math.round((stats.resolvedIssues / stats.totalIssues) * 100)
        : 0;

    return (
        <div className="performance-dashboard">
            <div className="dashboard-header">
                <h2>📊 Performance Dashboard</h2>
                <button className="refresh-btn" onClick={loadDashboardData}>
                    🔄 Refresh
                </button>
            </div>

            <div className="kpi-cards">
                <MetricCard
                    title="Total Issues"
                    value={stats.totalIssues}
                    icon="🎯"
                    subtitle={`${stats.openIssues} open`}
                />
                <MetricCard
                    title="Resolution Rate"
                    value={`${resolutionRate}%`}
                    icon="✅"
                    trend={resolutionRate >= 70 ? 'up' : 'down'}
                    subtitle={`${stats.resolvedIssues} resolved`}
                />
                <MetricCard
                    title="Avg Fix Time"
                    value={`${Math.round(stats.avgResolutionTime)}h`}
                    icon="⏱️"
                    subtitle="mean time to resolution"
                />
                <MetricCard
                    title="Recurring Issues"
                    value={stats.recurringIssues}
                    icon="🔄"
                    trend={stats.recurringIssues > 5 ? 'down' : 'up'}
                    subtitle={`${Math.round((stats.recurringIssues / stats.totalIssues) * 100)}% of total`}
                />
            </div>

            <div className="charts-grid">
                <div className="chart-card">
                    <h3>👨‍💻 Developer Productivity</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={productivityChartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="score" fill="#3b82f6" name="Productivity Score" />
                            <Bar dataKey="resolved" fill="#10b981" name="Issues Resolved" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="chart-card">
                    <h3>⏱️ Avg Resolution Time by Severity</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={severityData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} />
                            <Tooltip />
                            <Bar dataKey="hours" fill="#f59e0b" name="Avg Hours" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="chart-card">
                    <h3>📈 Issue Status Distribution</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={statusPieData}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={80}
                                label={(entry) => `${entry.name}: ${entry.value}`}
                            />
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                <div className="chart-card">
                    <h3>🏆 Top Performers</h3>
                    <div className="top-performers-list">
                        {productivity.slice(0, 5).map((dev, index) => (
                            <div key={dev.developerId} className="performer-item">
                                <div className="performer-rank">#{index + 1}</div>
                                <div className="performer-info">
                                    <div className="performer-name">{dev.developerName}</div>
                                    <div className="performer-stats">
                                        {dev.resolvedCount} issues • {Math.round(dev.avgResolutionTime)}h avg
                                    </div>
                                </div>
                                <div className="performer-score">
                                    {Math.round(dev.productivityScore)}
                                </div>
                            </div>
                        ))}
                        {productivity.length === 0 && (
                            <div className="empty-state">
                                <p>No developer data available</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
