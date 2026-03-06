import React, { useEffect, useState } from 'react';
import './governance.css';

interface SlaTimerBarProps {
    raisedAt: string | Date;
    deadline: string | Date | null;
    slaStatus: string;
    showLabel?: boolean;
}

const SlaTimerBar: React.FC<SlaTimerBarProps> = ({ raisedAt, deadline, slaStatus, showLabel = true }) => {
    const [pct, setPct] = useState(0);

    useEffect(() => {
        const update = () => {
            if (!deadline) return;
            const total = new Date(deadline).getTime() - new Date(raisedAt).getTime();
            const elapsed = Date.now() - new Date(raisedAt).getTime();
            setPct(Math.min(100, Math.round((elapsed / total) * 100)));
        };
        update();
        const timer = setInterval(update, 60_000);
        return () => clearInterval(timer);
    }, [raisedAt, deadline]);

    if (!deadline) return null;

    const deadlineFmt = new Date(deadline).toLocaleString('en-US', {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });

    return (
        <div className="gov-sla-bar">
            {showLabel && (
                <div className="gov-sla-bar__labels">
                    <span>SLA consumed: {pct}%</span>
                    <span>Deadline: {deadlineFmt}</span>
                </div>
            )}
            <div className="gov-sla-bar__track">
                <div
                    className={`gov-sla-bar__fill gov-sla-bar__fill--${slaStatus}`}
                    style={{ width: `${pct}%` }}
                />
            </div>
        </div>
    );
};

export default SlaTimerBar;
