import React from 'react';
import IssueCard from './IssueCard';

interface IssueListProps {
    issues: any[];
    onResolve: (issue: any) => void;
}

const IssueList: React.FC<IssueListProps> = ({ issues, onResolve }) => {
    return (
        <div className="issues-grid">
            {issues.map((issue) => (
                <IssueCard
                    key={issue.id}
                    issue={issue}
                    onResolve={onResolve}
                />
            ))}
        </div>
    );
};

export default IssueList;
