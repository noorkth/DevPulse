import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import './governance.css';

interface DataPoint {
    week: string;
    compliancePct: number;
}

interface SlaMetricsChartProps {
    data: DataPoint[];
    height?: number;
    title?: string;
    /** Show a reference line at 90% threshold */
    showThreshold?: boolean;
}

const SlaMetricsChart: React.FC<SlaMetricsChartProps> = ({
    data,
    height = 220,
    title = 'SLA Compliance Trend',
    showThreshold = true,
}) => (
    <div className="gov-chart">
        {title && <h3 className="gov-chart__title">{title}</h3>}
        {data.length === 0 ? (
            <div className="gov-chart__empty">No SLA data available yet.</div>
        ) : (
            <ResponsiveContainer width="100%" height={height}>
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis dataKey="week" tick={{ fill: 'var(--color-text-secondary)', fontSize: 11 }} />
                    <YAxis
                        domain={[0, 100]}
                        tick={{ fill: 'var(--color-text-secondary)' }}
                        tickFormatter={(v: number) => `${v}%`}
                    />
                    <Tooltip
                        contentStyle={{
                            background: 'var(--color-bg-secondary)',
                            border: '1px solid var(--color-border)',
                            borderRadius: 8,
                        }}
                        formatter={(v: number) => [`${v}%`, 'Compliance']}
                    />
                    <Line
                        type="monotone"
                        dataKey="compliancePct"
                        stroke="#10b981"
                        strokeWidth={2}
                        dot={{ r: 3, fill: '#10b981' }}
                        activeDot={{ r: 5 }}
                        name="Compliance %"
                    />
                    {showThreshold && (
                        <Line
                            type="monotone"
                            dataKey={() => 90}
                            stroke="#f59e0b"
                            strokeWidth={1}
                            strokeDasharray="4 4"
                            dot={false}
                            name="Target 90%"
                            legendType="line"
                        />
                    )}
                    <Legend />
                </LineChart>
            </ResponsiveContainer>
        )}
    </div>
);

export default SlaMetricsChart;
