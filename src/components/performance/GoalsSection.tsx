import React from 'react';
import Card from '../common/Card';
import Button from '../common/Button';
import GoalCard from '../common/GoalCard';

interface GoalsSectionProps {
    goals: any[];
    onCreateGoal: () => void;
    onDeleteGoal: (goalId: string) => void;
}

const GoalsSection: React.FC<GoalsSectionProps> = ({ goals, onCreateGoal, onDeleteGoal }) => {
    return (
        <Card>
            <div className="section-header">
                <h3 className="chart-title">Goals & Targets</h3>
                <Button onClick={onCreateGoal}>+ Set New Goal</Button>
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
                            onDelete={() => onDeleteGoal(goal.id)}
                        />
                    ))}
                </div>
            )}
        </Card>
    );
};

export default GoalsSection;
