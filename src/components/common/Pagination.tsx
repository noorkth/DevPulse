import React from 'react';
import Button from './Button';
import './Pagination.css';

interface PaginationProps {
    currentPage: number;
    totalItems: number;
    pageSize: number;
    hasMore: boolean;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
    onLoadMore?: () => void;
    showLoadMore?: boolean;
}

const Pagination: React.FC<PaginationProps> = ({
    currentPage,
    totalItems,
    pageSize,
    hasMore,
    onPageChange,
    onPageSizeChange,
    onLoadMore,
    showLoadMore = false,
}) => {
    const totalPages = Math.ceil(totalItems / pageSize);
    const startItem = (currentPage - 1) * pageSize + 1;
    const endItem = Math.min(currentPage * pageSize, totalItems);

    const handlePrevious = () => {
        if (currentPage > 1) {
            onPageChange(currentPage - 1);
        }
    };

    const handleNext = () => {
        if (hasMore || currentPage < totalPages) {
            onPageChange(currentPage + 1);
        }
    };

    return (
        <div className="pagination-container">
            <div className="pagination-info">
                <span className="pagination-count">
                    Showing <strong>{startItem}</strong> to <strong>{endItem}</strong> of{' '}
                    <strong>{totalItems}</strong> items
                </span>

                <div className="pagination-size-selector">
                    <label htmlFor="pageSize">Items per page:</label>
                    <select
                        id="pageSize"
                        value={pageSize}
                        onChange={(e) => onPageSizeChange(Number(e.target.value))}
                        className="pagination-select"
                    >
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                    </select>
                </div>
            </div>

            <div className="pagination-controls">
                {showLoadMore && hasMore ? (
                    <Button
                        variant="secondary"
                        onClick={onLoadMore}
                        className="load-more-btn"
                    >
                        Load More
                    </Button>
                ) : (
                    <>
                        <Button
                            variant="secondary"
                            onClick={handlePrevious}
                            disabled={currentPage === 1}
                            size="sm"
                        >
                            ← Previous
                        </Button>

                        <div className="pagination-pages">
                            <span className="pagination-page">
                                Page <strong>{currentPage}</strong>
                                {totalPages > 0 && <> of <strong>{totalPages}</strong></>}
                            </span>
                        </div>

                        <Button
                            variant="secondary"
                            onClick={handleNext}
                            disabled={!hasMore && currentPage >= totalPages}
                            size="sm"
                        >
                            Next →
                        </Button>
                    </>
                )}
            </div>
        </div>
    );
};

export default Pagination;
