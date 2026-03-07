import React from 'react';
import './governance.css';

interface VisibilityToggleProps {
    visibility: 'internal' | 'client' | string;
    onChange: () => void;
    disabled?: boolean;
}

const VisibilityToggle: React.FC<VisibilityToggleProps> = ({ visibility, onChange, disabled = false }) => (
    <button
        className={`gov-vis-toggle gov-vis-toggle--${visibility}`}
        onClick={onChange}
        disabled={disabled}
        title={`Currently ${visibility}. Click to toggle.`}
    >
        {visibility === 'client' ? '👁 Client Visible' : '🔒 Internal Only'}
    </button>
);

export default VisibilityToggle;
