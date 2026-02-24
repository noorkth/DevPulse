import React from 'react';
import Card from '../common/Card';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

interface SkillsUtilizationChartProps {
    data: any[];
}

const SkillsUtilizationChart: React.FC<SkillsUtilizationChartProps> = ({ data }) => {
    return (
        <Card>
            <h3 className="chart-title">Tech Stack Utilization</h3>
            <div className="chart-container">
                <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                        <Pie
                            data={data || []}
                            dataKey="count"
                            nameKey="skill"
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            label={(entry) => `${entry.skill} (${entry.percentage}%)`}
                        >
                            {(data || []).map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
};

export default SkillsUtilizationChart;
