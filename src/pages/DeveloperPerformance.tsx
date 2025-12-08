import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './DeveloperPerformance.css';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

const DeveloperPerformance: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [developerDetail, setDeveloperDetail] = useState<any>(null);
    const [velocityTrend, setVelocityTrend] = useState<any>(null);
    const [resolutionBreakdown, setResolutionBreakdown] = useState<any>(null);
    const [skillsUtilization, setSkillsUtilization] = useState<any[]>([]);
    const [qualityTrend, setQualityTrend] = useState<any[]>([]);
    const [teamComparison, setTeamComparison] = useState<any>(null);
    const [reopenedIssues, setReopenedIssues] = useState<any[]>([]);

    useEffect(() => {
        if (id) {
            loadPerformanceData();
        }
    }, [id]);

    const loadPerformanceData = async () => {
        try {
            setLoading(true);
            const [detail, velocity, breakdown, skills, quality, comparison, reopened] = await Promise.all([
                window.api.performance.getDeveloperDetail(id!),
                window.api.performance.getVelocityTrend(id!, 12),
                window.api.performance.getResolutionTimeBreakdown(id!),
                window.api.performance.getSkillsUtilization(id!),
                window.api.performance.getQualityTrend(id!, 12),
                window.api.performance.getTeamComparison(id!),
                window.api.performance.getReopenedIssues(id!)
            ]);

            setDeveloperDetail(detail);
            setVelocityTrend(velocity);
            setResolutionBreakdown(breakdown);
            setSkillsUtilization(skills);
            setQualityTrend(quality);
            setTeamComparison(comparison);
            setReopenedIssues(reopened);
        } catch (error) {
            console.error('Error loading performance data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="developer-performance-page">
                <div className="loading">Loading performance data...</div>
            </div>
        );
    }

    if (!developerDetail) {
        return (
            <div className="developer-performance-page">
                <div className="error">Developer not found</div>
            </div>
        );
    }

    const { developer, metrics } = developerDetail;

    return (
        <div className="developer-performance-page">
            {/* Header */}
            <div className="performance-header">
                <Button onClick={() => navigate('/users')} className="back-button">
                    ← Back to Users
                </Button>
                <div className="developer-info">
                    <div className="developer-avatar">{developer.fullName.charAt(0)}</div>
                    <div>
                        <h1>{developer.fullName}</h1>
                        <p className="developer-title">
                            {developer.seniorityLevel.charAt(0).toUpperCase() + developer.seniorityLevel.slice(1)} Developer
                        </p>
                    </div>
                </div>
                <div className="key-metrics">
                    <div className="metric-card">
                        <div className="metric-value">{metrics.productivityScore.toFixed(2)}</div>
                        <div className="metric-label">Productivity Score</div>
                    </div>
                    <div className="metric-card">
                        <div className="metric-value">{metrics.completionRate.toFixed(1)}%</div>
                        <div className="metric-label">Completion Rate</div>
                    </div>
                    <div className="metric-card">
                        <div className="metric-value">{metrics.avgFixQuality.toFixed(1)}</div>
                        <div className="metric-label">Avg Quality</div>
                    </div>
                </div>
            </div>

            {/* Charts Grid */}
            <div className="charts-grid">
                {/* Velocity Trend */}
                <Card>
                    <h3 className="chart-title">Weekly Velocity Trend</h3>
                    <div className="chart-subtitle">
                        Current velocity: {velocityTrend?.currentVelocity || 0} issues/week
                    </div>
                    <div className="chart-container">
                        <ResponsiveContainer width="100%" height={250}>
                            <LineChart data={velocityTrend?.trendData || []}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                                <XAxis dataKey="week" tick={{ fill: 'var(--color-text-secondary)' }} />
                                <YAxis tick={{ fill: 'var(--color-text-secondary)' }} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'var(--color-bg-secondary)',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: 'var(--radius-md)',
                                    }}
                                />
                                <Legend />
                                <Line type="monotone" dataKey="resolved" stroke="#6366f1" name="Issues Resolved" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* Resolution Time Breakdown */}
                <Card>
                    <h3 className="chart-title">Avg Resolution Time by Severity</h3>
                    <div className="chart-container">
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={resolutionBreakdown?.bySeverity || []}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                                <XAxis dataKey="severity" tick={{ fill: 'var(--color-text-secondary)' }} />
                                <YAxis tick={{ fill: 'var(--color-text-secondary)' }} label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'var(--color-bg-secondary)',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: 'var(--radius-md)',
                                    }}
                                />
                                <Bar dataKey="avgTime" fill="#6366f1" name="Avg Time (hours)" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* Skills Utilization */}
                <Card>
                    <h3 className="chart-title">Tech Stack Utilization</h3>
                    <div className="chart-container">
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie
                                    data={skillsUtilization}
                                    dataKey="count"
                                    nameKey="skill"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={80}
                                    label={(entry) => `${entry.skill} (${entry.percentage}%)`}
                                >
                                    {skillsUtilization.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* Quality Trend */}
                <Card>
                    <h3 className="chart-title">Fix Quality Over Time</h3>
                    <div className="chart-subtitle">Average fix quality rating (1-5 stars)</div>
                    <div className="chart-container">
                        <ResponsiveContainer width="100%" height={250}>
                            <LineChart data={qualityTrend}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                                <XAxis dataKey="week" tick={{ fill: 'var(--color-text-secondary)' }} />
                                <YAxis domain={[0, 5]} tick={{ fill: 'var(--color-text-secondary)' }} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'var(--color-bg-secondary)',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: 'var(--radius-md)',
                                    }}
                                />
                                <Legend />
                                <Line type="monotone" dataKey="avgQuality" stroke="#10b981" name="Avg Quality" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>

            {/* Team Comparison */}
            {teamComparison && (
                <Card>
                    <h3 className="chart-title">Team Comparison</h3>
                    <div className="team-comparison">
                        <div className="comparison-metrics">
                            <div className="comparison-item">
                                <div className="comparison-label">Avg Resolution Time</div>
                                <div className="comparison-values">
                                    <span className="developer-value">{metrics.avgResolutionTime}h</span>
                                    <span className="vs">vs</span>
                                    <span className="team-value">{teamComparison.teamAverage.avgResolutionTime}h (team)</span>
                                </div>
                            </div>
                            <div className="comparison-item">
                                <div className="comparison-label">Avg Fix Quality</div>
                                <div className="comparison-values">
                                    <span className="developer-value">{metrics.avgFixQuality}</span>
                                    <span className="vs">vs</span>
                                    <span className="team-value">{teamComparison.teamAverage.avgQuality} (team)</span>
                                </div>
                            </div>
                            <div className="comparison-item">
                                <div className="comparison-label">Completion Rate</div>
                                <div className="comparison-values">
                                    <span className="developer-value">{metrics.completionRate}%</span>
                                    <span className="vs">vs</span>
                                    <span className="team-value">{teamComparison.teamAverage.completionRate}% (team)</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>
            )}

            {/* Reopened Issues */}
            {reopenedIssues.length > 0 && (
                <Card>
                    <h3 className="chart-title">Recurring Issues ({reopenedIssues.length})</h3>
                    <div className="reopened-issues-table">
                        <table className="simple-table">
                            <thead>
                                <tr>
                                    <th>Title</th>
                                    <th>Project</th>
                                    <th>Severity</th>
                                    <th>Recurrence Count</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reopenedIssues.map((issue) => (
                                    <tr key={issue.id}>
                                        <td>{issue.title}</td>
                                        <td className="text-secondary">{issue.project}</td>
                                        <td>
                                            <span className={`severity-badge severity-${issue.severity}`}>
                                                {issue.severity}
                                            </span>
                                        </td>
                                        <td>
                                            <span className="recurrence-badge">{issue.recurrenceCount}×</span>
                                        </td>
                                        <td>
                                            <span className={`status-badge status-${issue.status}`}>
                                                {issue.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}
        </div>
    );
};

export default DeveloperPerformance;
