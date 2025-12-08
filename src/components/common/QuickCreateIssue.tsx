import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './QuickCreateIssue.css';

interface QuickCreateIssueProps {
    onClose?: () => void;
}

const QuickCreateIssue: React.FC<QuickCreateIssueProps> = ({ onClose }) => {
    const navigate = useNavigate();
    const [showTooltip, setShowTooltip] = useState(false);

    const handleClick = () => {
        navigate('/issues', { state: { openModal: true } });
    };

    return (
        <div
            className="quick-create-fab"
            onClick={handleClick}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
        >
            <span className="fab-icon">🐛+</span>
            {showTooltip && (
                <div className="fab-tooltip">Create Issue</div>
            )}
        </div>
    );
};

export default QuickCreateIssue;
