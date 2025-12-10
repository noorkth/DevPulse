import React from 'react';
import Card from '../common/Card';

const severityColors = {
    critical: 'var(--color-severity-critical)',
    high: 'var(--color-severity-high)',
    medium: 'var(--color-severity-medium)',
    low: 'var(--color-severity-low)',
};

interface IssueCardProps {
    issue: any;
    onResolve: (issue: any) => void;
}

const IssueCard: React.FC<IssueCardProps> = ({ issue, onResolve }) => {
    return (
        <Card>
            <div className="issue-card">
                <div className="issue-header">
                    <h3>{issue.title}</h3>
                    <div className="issue-badges">
                        <span
                            className="severity-badge"
                            style={{ backgroundColor: severityColors[issue.severity as keyof typeof severityColors] }}
                        >
                            {issue.severity}
                        </span>
                        <span className={`status-badge status-${issue.status}`}>
                            {issue.status}
                        </span>
                        {issue.isRecurring && (
                            <span className="recurring-badge">🔄 Recurring</span>
                        )}
                    </div>
                </div>

                <p className="issue-description">{issue.description}</p>

                <div className="issue-meta">
                    <div className="meta-item">
                        <span className="meta-label">Project:</span>
                        <span>{issue.project?.name || 'N/A'}</span>
                    </div>
                    <div className="meta-item">
                        <span className="meta-label">Assigned to:</span>
                        <span>{issue.assignedTo?.fullName || 'Unassigned'}</span>
                    </div>
                    {issue.feature && (
                        <div className="meta-item">
                            <span className="meta-label">Feature:</span>
                            <span>{issue.feature.name}</span>
                        </div>
                    )}
                    {issue.resolutionTime && (
                        <div className="meta-item">
                            <span className="meta-label">Resolution Time:</span>
                            <span>{issue.resolutionTime}h</span>
                        </div>
                    )}
                </div>

                {(issue.status === 'open' || issue.status === 'in-progress') && (
                    <button
                        className="btn btn-primary btn-sm"
                        onClick={() => onResolve(issue)}
                    >
                        Mark as Resolved
                    </button>
                )}
            </div>
        </Card>
    );
};

export default IssueCard;
