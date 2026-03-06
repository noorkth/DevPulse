import React from 'react';
import './governance.css';

interface EscalationBadgeProps {
    level: number;
    showNone?: boolean;
}

const LABELS = ['None', 'L1 — Team Lead', 'L2 — Director', 'L3 — Executive'];
const COLORS = ['', 'orange', 'red', 'purple'];

const EscalationBadge: React.FC<EscalationBadgeProps> = ({ level, showNone = true }) => {
    if (!level && !showNone) return null;
    if (!level) return <span className="gov-badge gov-esc gov-esc--none">None</span>;
    return (
        <span className={`gov-badge gov-esc gov-esc--${COLORS[level] ?? 'purple'}`}>
            {LABELS[level] ?? `L${level}`}
        </span>
    );
};

export default EscalationBadge;
