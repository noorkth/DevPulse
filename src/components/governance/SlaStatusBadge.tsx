import React from 'react';
import './governance.css';

type SlaStatus = 'on-track' | 'at-risk' | 'breached';

interface SlaStatusBadgeProps {
    status: SlaStatus | string;
    size?: 'sm' | 'md';
}

const LABELS: Record<string, string> = {
    'on-track': '🟢 On Track',
    'at-risk': '🟡 At Risk',
    'breached': '🔴 Breached',
};

const SlaStatusBadge: React.FC<SlaStatusBadgeProps> = ({ status, size = 'md' }) => (
    <span className={`gov-badge gov-sla gov-sla--${status} gov-badge--${size}`}>
        {LABELS[status] ?? status}
    </span>
);

export default SlaStatusBadge;
