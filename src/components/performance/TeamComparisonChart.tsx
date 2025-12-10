import React from 'react';
import Card from '../common/Card';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

interface TeamComparisonChartProps {
    data: {
        radarData: any[];
    } | null;
}

const TeamComparisonChart: React.FC<TeamComparisonChartProps> = ({ data }) => {
    if (!data) return null;

    return (
        <Card>
            <h3 className="chart-title">Team Comparison</h3>
            <div className="chart-subtitle">Performance vs Team Average</div>
            <div className="chart-container">
                <ResponsiveContainer width="100%" height={300}>
                    <RadarChart data={data.radarData || []}>
                        <PolarGrid stroke="var(--color-border)" />
                        <PolarAngleAxis dataKey="metric" tick={{ fill: 'var(--color-text-secondary)' }} />
                        <PolarRadiusAxis tick={{ fill: 'var(--color-text-secondary)' }} />
                        <Radar
                            name="Developer"
                            dataKey="developer"
                            stroke="#6366f1"
                            fill="#6366f1"
                            fillOpacity={0.6}
                        />
                        <Radar
                            name="Team Avg"
                            dataKey="teamAvg"
                            stroke="#10b981"
                            fill="#10b981"
                            fillOpacity={0.3}
                        />
                    </RadarChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
};

export default TeamComparisonChart;
