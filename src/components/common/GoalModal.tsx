import React, { useState } from 'react';
import Button from './Button';
import Input from './Input';
import Modal from './Modal';
import { format, addDays } from 'date-fns';
import './GoalModal.css';

interface GoalModalProps {
    developerId: string;
    onClose: () => void;
    onSave: (goalData: any) => void;
    existingGoal?: any;
}

const GoalModal: React.FC<GoalModalProps> = ({ developerId, onClose, onSave, existingGoal }) => {
    const [goalType, setGoalType] = useState(existingGoal?.goalType || 'productivity');
    const [targetValue, setTargetValue] = useState(existingGoal?.targetValue?.toString() || '');
    const [endDate, setEndDate] = useState(
        existingGoal?.endDate
            ? format(new Date(existingGoal.endDate), 'yyyy-MM-dd')
            : format(addDays(new Date(), 30), 'yyyy-MM-dd')
    );
    const [notes, setNotes] = useState(existingGoal?.notes || '');

    const goalTypes = [
        { value: 'productivity', label: 'Productivity Score', unit: 'points' },
        { value: 'quality', label: 'Average Quality', unit: 'rating (1-5)' },
        { value: 'velocity', label: 'Velocity', unit: 'issues/week' },
        { value: 'resolution_time', label: 'Avg Resolution Time', unit: 'hours' }
    ];

    const selectedGoalType = goalTypes.find(gt => gt.value === goalType);

    const handleSubmit = () => {
        if (!targetValue || !endDate) {
            alert('Please fill in all required fields');
            return;
        }

        const goalData = {
            developerId,
            goalType,
            targetValue: parseFloat(targetValue),
            startDate: existingGoal?.startDate || new Date(),
            endDate: new Date(endDate),
            notes: notes || undefined
        };

        onSave(goalData);
    };

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title={existingGoal ? 'Edit Goal' : 'Set New Goal'}
            size="md"
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSubmit}>
                        {existingGoal ? 'Update Goal' : 'Create Goal'}
                    </Button>
                </>
            }
        >
            <div className="goal-modal-content">
                {/* Goal Type */}
                <div className="form-group">
                    <label>Goal Type *</label>
                    <select
                        value={goalType}
                        onChange={(e) => setGoalType(e.target.value)}
                        className="goal-select"
                    >
                        {goalTypes.map(type => (
                            <option key={type.value} value={type.value}>
                                {type.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Target Value */}
                <div className="form-group">
                    <label>Target Value * ({selectedGoalType?.unit})</label>
                    <Input
                        type="number"
                        value={targetValue}
                        onChange={(e) => setTargetValue(e.target.value)}
                        placeholder={`Enter target ${selectedGoalType?.unit}`}
                        step={goalType === 'quality' ? '0.1' : '1'}
                        min="0"
                    />
                </div>

                {/* End Date */}
                <div className="form-group">
                    <label>Target Date *</label>
                    <Input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        min={format(new Date(), 'yyyy-MM-dd')}
                    />
                </div>

                {/* Notes */}
                <div className="form-group">
                    <label>Notes (Optional)</label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Add notes or description for this goal..."
                        className="goal-textarea"
                        rows={3}
                    />
                </div>

                <div className="goal-help-text">
                    * Required fields
                </div>
            </div>
        </Modal>
    );
};

export default GoalModal;
