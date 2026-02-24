import React from 'react';
import { format, differenceInDays, isPast } from 'date-fns';
import Button from './Button';
import './GoalCard.css';

interface GoalCardProps {
    goal: any;
    onEdit?: () => void;
    onDelete?: () => void;
}

const GoalCard: React.FC<GoalCardProps> = ({ goal, onEdit, onDelete }) => {
    const goalTypeLabels: Record<string, string> = {
        productivity: 'Productivity Score',
        quality: 'Average Quality',
        velocity: 'Velocity',
        resolution_time: 'Avg Resolution Time'
    };

    const goalTypeUnits: Record<string, string> = {
        productivity: 'points',
        quality: '/5',
        velocity: 'issues/week',
        resolution_time: 'hrs'
    };

    const progress = goal.currentValue && goal.targetValue
        ? Math.min(Math.round((goal.currentValue / goal.targetValue) * 100), 100)
        : 0;

    const daysRemaining = differenceInDays(new Date(goal.endDate), new Date());
    const isExpired = isPast(new Date(goal.endDate));
    const isActive = goal.status === 'active';
    const isAchieved = goal.status === 'achieved';

    const getStatusColor = () => {
        if (isAchieved) return 'var(--color-success)';
        if (goal.status === 'missed') return 'var--color-danger)';
        if (goal.status === 'cancelled') return 'var(--color-text-secondary)';
        if (isExpired) return 'var(--color-danger)';
        if (progress >= 75) return 'var(--color-success)';
        if (progress >= 40) return 'var(--color-warning)';
        return 'var(--color-danger)';
    };

    const getStatusLabel = () => {
        if (isAchieved) return '✅ Achieved';
        if (goal.status === 'missed') return '❌ Missed';
        if (goal.status === 'cancelled') return '⊘ Cancelled';
        if (isExpired) return '⏰ Expired';
        if (daysRemaining < 7) return `⚠️ ${daysRemaining} days left`;
        return `📅 ${daysRemaining} days left`;
    };

    return (
        <div className={`goal-card goal-status-${goal.status}`}>
            <div className="goal-header">
                <div className="goal-type">
                    <span className="goal-type-label">{goalTypeLabels[goal.goalType]}</span>
                    <span className="goal-status-badge" style={{ color: getStatusColor() }}>
                        {getStatusLabel()}
                    </span>
                </div>
                {isActive && (
                    <div className="goal-actions">
                        {onEdit && <Button size="sm" variant="secondary" onClick={onEdit}>Edit</Button>}
                        {onDelete && <Button size="sm" variant="danger" onClick={onDelete}>Delete</Button>}
                    </div>
                )}
            </div>

            <div className="goal-target">
                <div className="goal-values">
                    <div className="current-value">
                        <span className="value">{goal.currentValue?.toFixed(1) || '0.0'}</span>
                        <span className="unit">{goalTypeUnits[goal.goalType]}</span>
                    </div>
                    <span className="separator">/</span>
                    <div className="target-value">
                        <span className="value">{goal.targetValue.toFixed(1)}</span>
                        <span className="unit">{goalTypeUnits[goal.goalType]}</span>
                    </div>
                </div>
            </div>

            <div className="goal-progress">
                <div className="progress-bar">
                    <div
                        className="progress-fill"
                        style={{
                            width: `${progress}%`,
                            backgroundColor: getStatusColor()
                        }}
                    />
                </div>
                <span className="progress-percentage">{progress}%</span>
            </div>

            <div className="goal-dates">
                <div className="goal-date">
                    <span className="date-label">Started:</span>
                    <span className="date-value">{format(new Date(goal.startDate), 'MMM d, yyyy')}</span>
                </div>
                <div className="goal-date">
                    <span className="date-label">Target:</span>
                    <span className="date-value">{format(new Date(goal.endDate), 'MMM d, yyyy')}</span>
                </div>
            </div>

            {goal.notes && (
                <div className="goal-notes">
                    <span className="notes-label">Notes:</span>
                    <p className="notes-text">{goal.notes}</p>
                </div>
            )}
        </div>
    );
};

export default GoalCard;
