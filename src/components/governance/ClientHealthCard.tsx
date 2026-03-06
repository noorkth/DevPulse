import React from 'react';
import './governance.css';

interface ClientHealthCardProps {
    clientName: string;
    openIssues: number;
    slaBreaches: number;
    escalations: number;
    slaCompliancePct: number;
    stabilityScore: number;
    preventiveActions?: number;
    onClick?: () => void;
}

function getSlaColor(v: number) {
    return v >= 90 ? '#22c55e' : v >= 70 ? '#f59e0b' : '#ef4444';
}

const ClientHealthCard: React.FC<ClientHealthCardProps> = ({
    clientName, openIssues, slaBreaches, escalations,
    slaCompliancePct, stabilityScore, preventiveActions, onClick,
}) => (
    <div className={`gov-health-card ${onClick ? 'gov-health-card--clickable' : ''}`} onClick={onClick}>
        <h4 className="gov-health-card__name">{clientName}</h4>

        <div className="gov-health-card__metrics">
            <div className="gov-health-card__metric">
                <span className="gov-health-card__val">{openIssues}</span>
                <span className="gov-health-card__lbl">Open</span>
            </div>
            <div className="gov-health-card__metric gov-health-card__metric--danger">
                <span className="gov-health-card__val">{slaBreaches}</span>
                <span className="gov-health-card__lbl">Breaches</span>
            </div>
            <div className="gov-health-card__metric gov-health-card__metric--warn">
                <span className="gov-health-card__val">{escalations}</span>
                <span className="gov-health-card__lbl">Escalations</span>
            </div>
            {preventiveActions !== undefined && (
                <div className="gov-health-card__metric gov-health-card__metric--good">
                    <span className="gov-health-card__val">{preventiveActions}</span>
                    <span className="gov-health-card__lbl">Preventive</span>
                </div>
            )}
        </div>

        <div className="gov-health-card__bars">
            <div className="gov-health-card__bar-row">
                <span className="gov-health-card__bar-label">SLA {slaCompliancePct}%</span>
                <div className="gov-health-card__bar-track">
                    <div
                        className="gov-health-card__bar-fill"
                        style={{ width: `${slaCompliancePct}%`, background: getSlaColor(slaCompliancePct) }}
                    />
                </div>
            </div>
            <div className="gov-health-card__bar-row">
                <span className="gov-health-card__bar-label">Stability {stabilityScore}</span>
                <div className="gov-health-card__bar-track">
                    <div
                        className="gov-health-card__bar-fill"
                        style={{ width: `${stabilityScore}%`, background: getSlaColor(stabilityScore) }}
                    />
                </div>
            </div>
        </div>

        {onClick && <div className="gov-health-card__link">View Detail →</div>}
    </div>
);

export default ClientHealthCard;
