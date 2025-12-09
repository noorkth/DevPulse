import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { subWeeks, format } from 'date-fns';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import DateRangePicker from '../components/common/DateRangePicker';
import GoalModal from '../components/common/GoalModal';
import GoalCard from '../components/common/GoalCard';
import { generatePerformancePDF } from '../utils/pdfGenerator';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './DeveloperPerformance.css';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

const DeveloperPerformance: React.FC = () => {
    const { developerId } = useParams<{ developerId: string }>();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState({
        startDate: subWeeks(new Date(), 12),
        endDate: new Date()
    });
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showGoalModal, setShowGoalModal] = useState(false);
    const [goals, setGoals] = useState<any[]>([]);
    const [developerDetail, setDeveloperDetail] = useState<any>(null);
    const [velocityTrend, setVelocityTrend] = useState<any>(null);
    const [resolutionBreakdown, setResolutionBreakdown] = useState<any>(null);
    const [skillsUtilization, setSkillsUtilization] = useState<any[]>([]);
    const [qualityTrend, setQualityTrend] = useState<any[]>([]);
    const [teamComparison, setTeamComparison] = useState<any>(null);
    const [reopenedIssues, setReopenedIssues] = useState<any[]>([]);

    useEffect(() => {
        if (developerId) {
            loadPerformanceData();
            loadGoals();
        }
    }, [developerId, dateRange]);

    const loadPerformanceData = async () => {
        try {
            setLoading(true);
            const api = window.api as any; // Type assertion for build
            const timeframe = { startDate: dateRange.startDate, endDate: dateRange.endDate };

            const [detail, velocity, breakdown, skills, quality, comparison, reopened] = await Promise.all([
                api.performance.getDeveloperDetail(developerId!, timeframe),
                api.performance.getVelocityTrend(developerId!, 12, timeframe),
                api.performance.getResolutionTimeBreakdown(developerId!, timeframe),
                api.performance.getSkillsUtilization(developerId!, timeframe),
                api.performance.getQualityTrend(developerId!, 12, timeframe),
                api.performance.getTeamComparison(developerId!, timeframe),
                api.performance.getReopenedIssues(developerId!, timeframe)
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

    const handleDateRangeChange = (newRange: { startDate: Date; endDate: Date }) => {
        setDateRange(newRange);
        setShowDatePicker(false);
    };

    const handleExportPDF = async () => {
        if (!developerDetail) return;

        try {
            await generatePerformancePDF(developerDetail, dateRange);
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Failed to generate PDF. Please try again.');
        }
    };

    const loadGoals = async () => {
        try {
            const api = window.api as any;
            const goalsData = await api.goals.getForDeveloper(developerId!);
            setGoals(goalsData);
        } catch (error) {
            console.error('Error loading goals:', error);
        }
    };

    const handleCreateGoal = async (goalData: any) => {
        try {
            const api = window.api as any;
            await api.goals.create(goalData);
            setShowGoalModal(false);
            loadGoals();
        } catch (error) {
            console.error('Error creating goal:', error);
            alert('Failed to create goal. Please try again.');
        }
    };

    const handleDeleteGoal = async (goalId: string) => {
        if (!confirm('Are you sure you want to delete this goal?')) return;

        try {
            const api = window.api as any;
            await api.goals.delete(goalId);
            loadGoals();
        } catch (error) {
            console.error('Error deleting goal:', error);
            alert('Failed to delete goal. Please try again.');
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
                <div className="header-top">
                    <Button onClick={() => navigate('/users')} className="back-button">
                        ← Back to Users
                    </Button>
                    <div className="header-actions">
                        <Button onClick={() => setShowDatePicker(true)} variant="secondary">
                            📅 {format(dateRange.startDate, 'MMM d, yyyy')} - {format(dateRange.endDate, 'MMM d, yyyy')}
                        </Button>
                        <Button onClick={handleExportPDF} variant="primary">
                            📄 Export PDF
                        </Button>
                    </div>
                </div>
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

            {/* Date Range Picker Modal */}
            {showDatePicker && (
                <DateRangePicker
                    onRangeChange={handleDateRangeChange}
                    onClose={() => setShowDatePicker(false)}
                />
            )}

            {/* Goal Modal */}
            {showGoalModal && (
                <GoalModal
                    developerId={developerId!}
                    onClose={() => setShowGoalModal(false)}
                    onSave={handleCreateGoal}
                />
            )}

            {/* Goals & Targets Section */}
            <Card>
                <div className="section-header">
                    <h3 className="chart-title">Goals & Targets</h3>
                    <Button onClick={() => setShowGoalModal(true)}>+ Set New Goal</Button>
                </div>

                {goals.length === 0 ? (
                    <div className="empty-goals">
                        <p>No goals set yet. Create your first performance goal!</p>
                    </div>
                ) : (
                    <div className="goals-grid">
                        {goals.map((goal: any) => (
                            <GoalCard
                                key={goal.id}
                                goal={goal}
                                onDelete={() => handleDeleteGoal(goal.id)}
                            />
                        ))}
                    </div>
                )}
            </Card>

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
