import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProjectCard from '../../src/components/projects/ProjectCard';

describe('ProjectCard Component', () => {
    const mockProject = {
        id: 'p1',
        name: 'Test Project',
        status: 'active',
        description: 'A test project description',
        projectType: 'web',
        startDate: '2024-01-01T00:00:00Z',
        client: {
            name: 'Test Client',
            product: {
                name: 'Test Product',
            },
        },
        _count: {
            issues: 10,
            developers: 5,
        },
    };

    const mockOnEdit = jest.fn();
    const mockOnDelete = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should render project information correctly', () => {
        render(<ProjectCard project={mockProject} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

        expect(screen.getByText('Test Project')).toBeInTheDocument();
        expect(screen.getByText('🟢 Active')).toBeInTheDocument();
        expect(screen.getByText(/Test Product/i)).toBeInTheDocument();
        expect(screen.getByText(/Test Client/i)).toBeInTheDocument();
        expect(screen.getByText(/web/i)).toBeInTheDocument();
    });

    it('should display project description when provided', () => {
        render(<ProjectCard project={mockProject} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

        expect(screen.getByText('A test project description')).toBeInTheDocument();
    });

    it('should display project statistics', () => {
        const projectWithDevs = {
            ...mockProject,
            developers: [
                { id: 'd1', fullName: 'Dev One', role: 'developer' },
                { id: 'd2', fullName: 'Dev Two', role: 'developer' },
                { id: 'd3', fullName: 'Dev Three', role: 'developer' },
                { id: 'd4', fullName: 'Dev Four', role: 'developer' },
                { id: 'd5', fullName: 'Dev Five', role: 'developer' },
            ],
        };
        render(<ProjectCard project={projectWithDevs} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

        // Component shows counts when developers array is present
        expect(screen.getByText(/5 Devs/i)).toBeInTheDocument();
        expect(screen.getByText('10')).toBeInTheDocument(); // Issues count
    });

    it('should call onEdit when Edit button is clicked', () => {
        render(<ProjectCard project={mockProject} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

        const editButton = screen.getByTitle('Edit project');
        fireEvent.click(editButton);

        expect(mockOnEdit).toHaveBeenCalledWith(mockProject);
        expect(mockOnEdit).toHaveBeenCalledTimes(1);
    });

    it('should call onDelete when Archive button is clicked', () => {
        render(<ProjectCard project={mockProject} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

        const deleteButton = screen.getByTitle('Archive project');
        fireEvent.click(deleteButton);

        expect(mockOnDelete).toHaveBeenCalledWith('p1');
        expect(mockOnDelete).toHaveBeenCalledTimes(1);
    });

    it('should render status badge with correct class', () => {
        render(<ProjectCard project={mockProject} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

        const statusBadge = screen.getByText('🟢 Active');
        expect(statusBadge).toHaveClass('status-badge');
        expect(statusBadge).toHaveClass('status-active');
    });

    it('should handle project without description', () => {
        const projectWithoutDesc = { ...mockProject, description: undefined };
        render(<ProjectCard project={projectWithoutDesc} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

        expect(screen.queryByText('A test project description')).not.toBeInTheDocument();
    });

    it('should handle zero counts correctly', () => {
        const projectWithZeroCounts = {
            ...mockProject,
            developers: [],
            _count: { issues: 0, developers: 0 },
        };
        render(<ProjectCard project={projectWithZeroCounts} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

        // Component conditionally renders counts only when > 0
        // So with zero counts, these elements should not exist
        expect(screen.queryByText(/Devs/i)).not.toBeInTheDocument();
        expect(screen.queryByText('0')).not.toBeInTheDocument();
    });
});
