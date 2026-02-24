import React, { useState, useEffect } from 'react';
import Card from '../components/common/Card';
import {
    LineChart, Line, BarChart, Bar, AreaChart, Area,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import './Analytics.css';

const Analytics: React.FC = () => {
    const [rankings, setRankings] = useState<any[]>([]);
    const [featureStability, setFeatureStability] = useState<any[]>([]);
    const [recurrenceData, setRecurrenceData] = useState<any>(null);
    const [timeToFixData, setTimeToFixData] = useState<any>(null);

    useEffect(() => {
        loadAnalytics();
    }, []);

    const loadAnalytics = async () => {
        try {
            const [rankings, features, recurrence, timeToFix] = await Promise.all([
                window.api.analytics.getProductivityRankings(),
                window.api.analytics.getFeatureStability(),
                window.api.analytics.getRecurrenceAnalysis(),
                window.api.analytics.getTimeToFixData(),
            ]);

            setRankings(rankings);
            setFeatureStability(features);
            setRecurrenceData(recurrence);
            setTimeToFixData(timeToFix);
        } catch (error) {
            console.error('Error loading analytics:', error);
        }
    };

    const severityData = timeToFixData ? [
        { severity: 'Critical', avgTime: timeToFixData.bySeverity?.critical || 0 },
        { severity: 'High', avgTime: timeToFixData.bySeverity?.high || 0 },
        { severity: 'Medium', avgTime: timeToFixData.bySeverity?.medium || 0 },
        { severity: 'Low', avgTime: timeToFixData.bySeverity?.low || 0 },
    ] : [];

    return (
        <div className="analytics-page">
            <h2>Detailed Analytics</h2>

            {/* Productivity Rankings */}
            <Card>
                <h3 className="chart-title">Developer Productivity Rankings</h3>
                <div className="analytics-table">
                    <table className="simple-table">
                        <thead>
                            <tr>
                                <th>Developer</th>
                                <th>Productivity Score</th>
                                <th>Resolved</th>
                                <th>Recurring</th>
                                <th>Avg Time (h)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rankings.map((dev, idx) => (
                                <tr key={dev.developerId}>
                                    <td>
                                        <div className="rank-cell">
                                            <span className="rank-number">#{idx + 1}</span>
                                            {dev.developerName}
                                        </div>
                                    </td>
                                    <td>
                                        <span className="score-badge">
                                            {dev.productivityScore.toFixed(2)}
                                        </span>
                                    </td>
                                    <td>{dev.resolvedCount}</td>
                                    <td>
                                        {dev.recurringCount > 0 && (
                                            <span className="recurring-count">{dev.recurringCount}</span>
                                        )}
                                    </td>
                                    <td>{dev.avgResolutionTime.toFixed(1)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Time to Fix by Severity */}
            <Card>
                <h3 className="chart-title">Average Resolution Time by Severity</h3>
                <div className="chart-container">
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={severityData}>
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
                            <Legend />
                            <Bar dataKey="avgTime" fill="#6366f1" name="Avg Resolution Time (hours)" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </Card>

            {/* Recurrence Trends - Enhanced with AreaChart */}
            {recurrenceData?.monthlyTrends && (
                <Card>
                    <h3 className="chart-title">📈 Recurrence Trend (Last 6 Months)</h3>
                    <div className="chart-container">
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={recurrenceData.monthlyTrends}>
                                <defs>
                                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0.1} />
                                    </linearGradient>
                                    <linearGradient id="colorRecurring" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                                <XAxis dataKey="month" tick={{ fill: 'var(--color-text-secondary)' }} />
                                <YAxis tick={{ fill: 'var(--color-text-secondary)' }} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'var(--color-bg-secondary)',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: 'var(--radius-md)',
                                    }}
                                />
                                <Legend />
                                <Area
                                    type="monotone"
                                    dataKey="totalIssues"
                                    stroke="#6366f1"
                                    fillOpacity={1}
                                    fill="url(#colorTotal)"
                                    name="Total Issues"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="recurringIssues"
                                    stroke="#ef4444"
                                    fillOpacity={1}
                                    fill="url(#colorRecurring)"
                                    name="Recurring Issues"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            )}

            {/* Feature Stability */}
            <Card>
                <h3 className="chart-title">Feature Stability Scores</h3>
                <div className="analytics-table">
                    <table className="simple-table">
                        <thead>
                            <tr>
                                <th>Feature</th>
                                <th>Project</th>
                                <th>Stability Score</th>
                                <th>Total Bugs</th>
                                <th>Recurring</th>
                                <th>Critical</th>
                            </tr>
                        </thead>
                        <tbody>
                            {featureStability.slice(0, 10).map((feature) => (
                                <tr key={feature.featureId}>
                                    <td>{feature.featureName}</td>
                                    <td className="text-secondary">{feature.projectName}</td>
                                    <td>
                                        <div className="stability-bar">
                                            <div
                                                className="stability-fill"
                                                style={{
                                                    width: `${feature.stabilityScore}%`,
                                                    backgroundColor: feature.stabilityScore > 70 ? 'var(--color-success)' :
                                                        feature.stabilityScore > 40 ? 'var(--color-warning)' :
                                                            'var(--color-danger)'
                                                }}
                                            />
                                            <span className="stability-value">{feature.stabilityScore.toFixed(0)}%</span>
                                        </div>
                                    </td>
                                    <td>{feature.totalBugs}</td>
                                    <td>{feature.recurringBugs}</td>
                                    <td>{feature.criticalBugs}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default Analytics;
