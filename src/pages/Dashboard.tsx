import React, { useState, useEffect } from 'react';
import Card from '../components/common/Card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { DashboardStats } from '../types';
import Loading from '../components/common/Loading';
import EmptyState from '../components/common/EmptyState';
import './Dashboard.css';

const SEVERITY_COLORS = {
    critical: '#dc2626',
    high: '#ea580c',
    medium: '#f59e0b',
    low: '#3b82f6',
};

const STATUS_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444'];

const Dashboard: React.FC = () => {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [rankings, setRankings] = useState<any[]>([]);
    const [features, setFeatures] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            setLoading(true);

            const [dashboardStats, productivityRankings, featureStability] = await Promise.all([
                window.api.analytics.getDashboardStats(),
                window.api.analytics.getProductivityRankings(),
                window.api.analytics.getFeatureStability(),
            ]);

            setStats(dashboardStats);
            setRankings(productivityRankings.slice(0, 5));
            setFeatures(featureStability);
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <Loading size="large" text="Loading dashboard data..." fullScreen />;
    }

    if (!stats || stats.totalIssues === 0) {
        return (
            <EmptyState
                icon="📊"
                title="No data available yet"
                description="Start tracking issues, developers, and projects to see your dashboard analytics."
                action={{
                    label: 'Refresh Dashboard',
                    onClick: loadDashboardData
                }}
            />
        );
    }

    const severityData = stats.severityDistribution.map(item => ({
        name: item.severity,
        value: item._count,
    }));

    const statusData = stats.statusDistribution.map(item => ({
        name: item.status,
        value: item._count,
    }));

    const topBuggy = features
        .sort((a, b) => b.totalBugs - a.totalBugs)
        .slice(0, 5);

    const topStable = features
        .sort((a, b) => b.stabilityScore - a.stabilityScore)
        .slice(0, 5);

    return (
        <div className="dashboard">
            {/* Key Metrics */}
            <div className="metrics-grid stagger-children">
                <Card className="animate-slide-up">
                    <div className="metric">
                        <div className="metric-icon">📊</div>
                        <div className="metric-content">
                            <p className="metric-label">Total Issues</p>
                            <h2 className="metric-value">{stats.totalIssues}</h2>
                        </div>
                    </div>
                </Card>

                <Card className="animate-slide-up">
                    <div className="metric">
                        <div className="metric-icon">🔓</div>
                        <div className="metric-content">
                            <p className="metric-label">Open Issues</p>
                            <h2 className="metric-value">{stats.openIssues}</h2>
                        </div>
                    </div>
                </Card>

                <Card className="animate-slide-up">
                    <div className="metric">
                        <div className="metric-icon">✅</div>
                        <div className="metric-content">
                            <p className="metric-label">Resolved Issues</p>
                            <h2 className="metric-value">{stats.resolvedIssues}</h2>
                        </div>
                    </div>
                </Card>

                <Card className="animate-slide-up">
                    <div className="metric">
                        <div className="metric-icon">⏱️</div>
                        <div className="metric-content">
                            <p className="metric-label">Avg Resolution Time</p>
                            <h2 className="metric-value">{stats.avgResolutionTime}h</h2>
                        </div>
                    </div>
                </Card>

                <Card className="animate-slide-up">
                    <div className="metric">
                        <div className="metric-icon">🔄</div>
                        <div className="metric-content">
                            <p className="metric-label">Recurring Issues</p>
                            <h2 className="metric-value">{stats.recurringIssues}</h2>
                        </div>
                    </div>
                </Card>

                <Card className="animate-slide-up">
                    <div className="metric">
                        <div className="metric-icon">📈</div>
                        <div className="metric-content">
                            <p className="metric-label">Resolution Rate</p>
                            <h2 className="metric-value">
                                {stats.totalIssues > 0
                                    ? Math.round((stats.resolvedIssues / stats.totalIssues) * 100)
                                    : 0}%
                            </h2>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Charts Row */}
            <div className="charts-grid">
                <Card>
                    <h3 className="chart-title">Top 5 Productive Developers</h3>
                    <div className="chart-container">
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={rankings}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                                <XAxis
                                    dataKey="developerName"
                                    tick={{ fill: 'var(--color-text-secondary)' }}
                                    angle={-15}
                                    textAnchor="end"
                                    height={80}
                                />
                                <YAxis tick={{ fill: 'var(--color-text-secondary)' }} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'var(--color-bg-secondary)',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: 'var(--radius-md)',
                                    }}
                                />
                                <Legend />
                                <Bar dataKey="productivityScore" fill="#6366f1" name="Productivity Score" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                <Card>
                    <h3 className="chart-title">Issues by Severity</h3>
                    <div className="chart-container">
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={severityData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={(entry) => `${entry.name}: ${entry.value}`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {severityData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={SEVERITY_COLORS[entry.name as keyof typeof SEVERITY_COLORS] || '#999'}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'var(--color-bg-secondary)',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: 'var(--radius-md)',
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                <Card>
                    <h3 className="chart-title">Issues by Status</h3>
                    <div className="chart-container">
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={statusData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={(entry) => `${entry.name}: ${entry.value}`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {statusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'var(--color-bg-secondary)',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: 'var(--radius-md)',
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>

            {/* Tables Row */}
            <div className="tables-grid">
                <Card>
                    <h3 className="table-title">🔥 Top 5 Buggy Features</h3>
                    <div className="table-container">
                        <table className="simple-table">
                            <thead>
                                <tr>
                                    <th>Feature</th>
                                    <th>Project</th>
                                    <th>Total Bugs</th>
                                    <th>Recurring</th>
                                    <th>Critical</th>
                                </tr>
                            </thead>
                            <tbody>
                                {topBuggy.map((feature) => (
                                    <tr key={feature.featureId}>
                                        <td>{feature.featureName}</td>
                                        <td className="text-secondary">{feature.projectName}</td>
                                        <td>
                                            <span className="badge badge-danger">{feature.totalBugs}</span>
                                        </td>
                                        <td>{feature.recurringBugs}</td>
                                        <td>{feature.criticalBugs}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>

                <Card>
                    <h3 className="table-title">⭐ Top 5 Stable Features</h3>
                    <div className="table-container">
                        <table className="simple-table">
                            <thead>
                                <tr>
                                    <th>Feature</th>
                                    <th>Project</th>
                                    <th>Stability Score</th>
                                    <th>Total Bugs</th>
                                </tr>
                            </thead>
                            <tbody>
                                {topStable.map((feature) => (
                                    <tr key={feature.featureId}>
                                        <td>{feature.featureName}</td>
                                        <td className="text-secondary">{feature.projectName}</td>
                                        <td>
                                            <span className="badge badge-success">
                                                {feature.stabilityScore.toFixed(0)}%
                                            </span>
                                        </td>
                                        <td>{feature.totalBugs}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default Dashboard;
