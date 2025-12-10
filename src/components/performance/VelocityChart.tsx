import React from 'react';
import Card from '../common/Card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface VelocityChartProps {
    data: {
        currentVelocity: number;
        trendData: any[];
    } | null;
}

const VelocityChart: React.FC<VelocityChartProps> = ({ data }) => {
    if (!data) return null;

    return (
        <Card>
            <h3 className="chart-title">📊 Weekly Velocity Trend</h3>
            <div className="chart-subtitle">
                Current velocity: {data.currentVelocity || 0} issues/week
            </div>
            <div className="chart-container">
                <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={data.trendData || []}>
                        <defs>
                            <linearGradient id="colorVelocity" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0.1} />
                            </linearGradient>
                        </defs>
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
                        <Area
                            type="monotone"
                            dataKey="resolved"
                            stroke="#6366f1"
                            fillOpacity={1}
                            fill="url(#colorVelocity)"
                            name="Issues Resolved"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
};

export default VelocityChart;
