import React from 'react';
import Card from '../common/Card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ReopenedIssuesChartProps {
    data: any[];
}

const ReopenedIssuesChart: React.FC<ReopenedIssuesChartProps> = ({ data }) => {
    return (
        <Card>
            <h3 className="chart-title">🔄 Reopened Issues Analysis</h3>
            <div className="chart-container">
                <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={data || []}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                        <XAxis dataKey="title" tick={{ fill: 'var(--color-text-secondary)' }} />
                        <YAxis tick={{ fill: 'var(--color-text-secondary)' }} />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'var(--color-bg-secondary)',
                                border: '1px solid var(--color-border)',
                                borderRadius: 'var(--radius-md)',
                            }}
                        />
                        <Bar dataKey="reopenCount" fill="#ec4899" name="Reopen Count" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
};

export default ReopenedIssuesChart;
