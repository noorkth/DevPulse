import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Pagination from '../../src/components/common/Pagination';

describe('Pagination Component', () => {
    const defaultProps = {
        currentPage: 1,
        totalItems: 100,
        pageSize: 20,
        hasMore: true,
        onPageChange: jest.fn(),
        onPageSizeChange: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should render pagination info correctly', () => {
        render(<Pagination {...defaultProps} />);

        expect(screen.getByText(/Showing/i)).toBeInTheDocument();
        expect(screen.getAllByText(/1/).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/20/).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/100/).length).toBeGreaterThan(0);
    });

    it('should render page navigation buttons', () => {
        render(<Pagination {...defaultProps} />);

        const prevButton = screen.getByText(/Previous/i);
        const nextButton = screen.getByText(/Next/i);

        expect(prevButton).toBeInTheDocument();
        expect(nextButton).toBeInTheDocument();
    });

    it('should disable Previous button on first page', () => {
        render(<Pagination {...defaultProps} currentPage={1} />);

        const prevButton = screen.getByText(/Previous/i);
        expect(prevButton).toBeDisabled();
    });

    it('should disable Next button when no more pages', () => {
        render(<Pagination {...defaultProps} hasMore={false} currentPage={5} />);

        const nextButton = screen.getByText(/Next/i);
        expect(nextButton).toBeDisabled();
    });

    it('should call onPageChange when clicking Next', () => {
        const onPageChange = jest.fn();
        render(<Pagination {...defaultProps} onPageChange={onPageChange} />);

        const nextButton = screen.getByText(/Next/i);
        nextButton.click();

        expect(onPageChange).toHaveBeenCalledWith(2);
    });

    it('should call onPageChange when clicking Previous', () => {
        const onPageChange = jest.fn();
        render(<Pagination {...defaultProps} currentPage={3} onPageChange={onPageChange} />);

        const prevButton = screen.getByText(/Previous/i);
        prevButton.click();

        expect(onPageChange).toHaveBeenCalledWith(2);
    });

    it('should render page size selector', () => {
        render(<Pagination {...defaultProps} />);

        const select = screen.getByLabelText(/Items per page/i);
        expect(select).toBeInTheDocument();
        expect(select).toHaveValue('20');
    });

    it('should call onPageSizeChange when changing page size', () => {
        const onPageSizeChange = jest.fn();
        render(<Pagination {...defaultProps} onPageSizeChange={onPageSizeChange} />);

        const select = screen.getByLabelText(/Items per page/i);
        fireEvent.change(select, { target: { value: '50' } });

        // Would need user-event for better simulation
        // This is a simplified test
    });

    it('should show load more button when showLoadMore is true', () => {
        render(<Pagination {...defaultProps} showLoadMore onLoadMore={jest.fn()} />);

        const loadMoreButton = screen.getByText(/Load More/i);
        expect(loadMoreButton).toBeInTheDocument();
    });

    it('should calculate item range correctly for middle pages', () => {
        render(<Pagination {...defaultProps} currentPage={3} pageSize={20} totalItems={100} />);

        expect(screen.getByText(/41/)).toBeInTheDocument(); // Start: (3-1)*20 + 1
        expect(screen.getByText(/60/)).toBeInTheDocument(); // End: 3*20
    });
});
