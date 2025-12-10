import React, { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';

interface ResolveIssueModalProps {
    isOpen: boolean;
    onClose: () => void;
    onResolve: (fixQuality: number) => void;
    issue: any | null;
}

const ResolveIssueModal: React.FC<ResolveIssueModalProps> = ({
    isOpen,
    onClose,
    onResolve,
    issue
}) => {
    const [fixQuality, setFixQuality] = useState(3);

    if (!issue) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Resolve Issue"
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button onClick={() => onResolve(fixQuality)}>Resolve</Button>
                </>
            }
        >
            <div className="resolve-form">
                <p>Rate the fix quality (1-5):</p>
                <div className="quality-rating">
                    {[1, 2, 3, 4, 5].map(rating => (
                        <button
                            key={rating}
                            type="button"
                            className={`star-btn ${rating <= fixQuality ? 'active' : ''}`}
                            onClick={() => setFixQuality(rating)}
                        >
                            ⭐
                        </button>
                    ))}
                </div>
                <p className="text-secondary">Selected: {fixQuality} / 5</p>
            </div>
        </Modal>
    );
};

export default ResolveIssueModal;
