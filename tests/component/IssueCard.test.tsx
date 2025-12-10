import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import IssueCard from '../../../src/components/issues/IssueCard';

describe('IssueCard Component', () => {
    const mockIssue = {
        id: 'i1',
        title: 'Bug in login',
        description: 'Users cannot log in',
        severity: 'critical',
        status: 'open',
        isRecurring: false,
        project: { name: 'Web App' },
        assignedTo: { fullName: 'John Doe' },
        feature: { name: 'Authentication' },
        resolutionTime: null,
    };

    const mockOnResolve = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should render issue information correctly', () => {
        render(<IssueCard issue={mockIssue} onResolve={mockOnResolve} />);

        expect(screen.getByText('Bug in login')).toBeInTheDocument();
        expect(screen.getByText('Users cannot log in')).toBeInTheDocument();
        expect(screen.getByText('critical')).toBeInTheDocument();
        expect(screen.getByText('open')).toBeInTheDocument();
    });

    it('should show recurring badge for recurring issues', () => {
        const recurringIssue = { ...mockIssue, isRecurring: true };
        render(<IssueCard issue={recurringIssue} onResolve={mockOnResolve} />);

        expect(screen.getByText(/Recurring/i)).toBeInTheDocument();
    });

    it('should display project and assignee info', () => {
        render(<IssueCard issue={mockIssue} onResolve={mockOnResolve} />);

        expect(screen.getByText(/Web App/i)).toBeInTheDocument();
        expect(screen.getByText(/John Doe/i)).toBeInTheDocument();
    });

    it('should show resolve button for open issues', () => {
        render(<IssueCard issue={mockIssue} onResolve={mockOnResolve} />);

        const resolveButton = screen.getByText(/Mark as Resolved/i);
        expect(resolveButton).toBeInTheDocument();
    });

    it('should not show resolve button for resolved issues', () => {
        const resolvedIssue = { ...mockIssue, status: 'resolved' };
        render(<IssueCard issue={resolvedIssue} onResolve={mockOnResolve} />);

        expect(screen.queryByText(/Mark as Resolved/i)).not.toBeInTheDocument();
    });

    it('should call onResolve when resolve button clicked', () => {
        render(<IssueCard issue={mockIssue} onResolve={mockOnResolve} />);

        const resolveButton = screen.getByText(/Mark as Resolved/i);
        resolveButton.click();

        expect(mockOnResolve).toHaveBeenCalledWith(mockIssue);
    });

    it('should display resolution time when available', () => {
        const resolvedIssue = { ...mockIssue, resolutionTime: 24, status: 'resolved' };
        render(<IssueCard issue={resolvedIssue} onResolve={mockOnResolve} />);

        expect(screen.getByText(/24h/i)).toBeInTheDocument();
    });
});
