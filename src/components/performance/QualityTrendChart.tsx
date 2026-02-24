import React from 'react';
import Card from '../common/Card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface QualityTrendChartProps {
    data: any[];
}

const QualityTrendChart: React.FC<QualityTrendChartProps> = ({ data }) => {
    return (
        <Card>
            <h3 className="chart-title">⭐ Fix Quality Over Time</h3>
            <div className="chart-subtitle">Average fix quality rating (1-5 stars)</div>
            <div className="chart-container">
                <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={data || []}>
                        <defs>
                            <linearGradient id="colorQuality" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                            </linearGradient>
                        </defs>
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
                        <Area
                            type="monotone"
                            dataKey="avgQuality"
                            stroke="#10b981"
                            fillOpacity={1}
                            fill="url(#colorQuality)"
                            name="Avg Quality"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
};

export default QualityTrendChart;
