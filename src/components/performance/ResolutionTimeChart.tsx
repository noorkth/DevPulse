import React from 'react';
import Card from '../common/Card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ResolutionTimeChartProps {
    data: {
        bySeverity: any[];
    } | null;
}

const ResolutionTimeChart: React.FC<ResolutionTimeChartProps> = ({ data }) => {
    if (!data) return null;

    return (
        <Card>
            <h3 className="chart-title">Avg Resolution Time by Severity</h3>
            <div className="chart-container">
                <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={data.bySeverity || []}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                        <XAxis dataKey="severity" tick={{ fill: 'var(--color-text-secondary)' }} />
                        <YAxis
                            tick={{ fill: 'var(--color-text-secondary)' }}
                            label={{ value: 'Hours', angle: -90, position: 'insideLeft' }}
                        />
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
    );
};

export default ResolutionTimeChart;
