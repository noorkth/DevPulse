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
        expect(screen.getByText('active')).toBeInTheDocument();
        expect(screen.getByText(/Test Product/i)).toBeInTheDocument();
        expect(screen.getByText(/Test Client/i)).toBeInTheDocument();
        expect(screen.getByText(/web/i)).toBeInTheDocument();
    });

    it('should display project description when provided', () => {
        render(<ProjectCard project={mockProject} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

        expect(screen.getByText('A test project description')).toBeInTheDocument();
    });

    it('should display project statistics', () => {
        render(<ProjectCard project={mockProject} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

        expect(screen.getByText('10')).toBeInTheDocument(); // Issues count
        expect(screen.getByText('5')).toBeInTheDocument(); // Developers count
    });

    it('should call onEdit when Edit button is clicked', () => {
        render(<ProjectCard project={mockProject} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

        const editButton = screen.getByText(/Edit/i);
        fireEvent.click(editButton);

        expect(mockOnEdit).toHaveBeenCalledWith(mockProject);
        expect(mockOnEdit).toHaveBeenCalledTimes(1);
    });

    it('should call onDelete when Archive button is clicked', () => {
        render(<ProjectCard project={mockProject} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

        const deleteButton = screen.getByText(/Archive/i);
        fireEvent.click(deleteButton);

        expect(mockOnDelete).toHaveBeenCalledWith('p1');
        expect(mockOnDelete).toHaveBeenCalledTimes(1);
    });

    it('should render status badge with correct class', () => {
        render(<ProjectCard project={mockProject} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

        const statusBadge = screen.getByText('active');
        expect(statusBadge).toHaveClass('status-active');
    });

    it('should handle project without description', () => {
        const projectWithoutDesc = { ...mockProject, description: null };
        render(<ProjectCard project={projectWithoutDesc} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

        expect(screen.queryByText('A test project description')).not.toBeInTheDocument();
    });

    it('should handle zero counts correctly', () => {
        const projectWithZeroCounts = {
            ...mockProject,
            _count: { issues: 0, developers: 0 },
        };
        render(<ProjectCard project={projectWithZeroCounts} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

        const counts = screen.getAllByText('0');
        expect(counts).toHaveLength(2);
    });
});
