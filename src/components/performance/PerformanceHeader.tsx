import React from 'react';
import Button from '../common/Button';

interface PerformanceHeaderProps {
    developer: any;
    dateRange: {
        startDate: Date;
        endDate: Date;
    };
    onBack: () => void;
    onDateRangeToggle: () => void;
    onExportPDF: () => void;
}

const PerformanceHeader: React.FC<PerformanceHeaderProps> = ({
    developer,
    dateRange,
    onBack,
    onDateRangeToggle,
    onExportPDF
}) => {
    return (
        <div className="performance-header">
            <div className="header-top">
                <Button onClick={onBack} className="back-button">
                    ← Back to Developers
                </Button>
                <div className="header-actions">
                    <Button variant="secondary" onClick={onDateRangeToggle}>
                        📅 Change Date Range
                    </Button>
                    <Button onClick={onExportPDF}>
                        📄 Export PDF
                    </Button>
                </div>
            </div>

            <div className="developer-info">
                <div className="developer-avatar">
                    {developer.fullName.charAt(0).toUpperCase()}
                </div>
                <div className="developer-details">
                    <h1>{developer.fullName}</h1>
                    <p className="developer-role">{developer.role || 'Developer'}</p>
                    <p className="developer-email">{developer.email}</p>
                </div>
            </div>

            <div className="date-range-display">
                <span>📊 Performance Period: </span>
                <strong>
                    {dateRange.startDate.toLocaleDateString()} - {dateRange.endDate.toLocaleDateString()}
                </strong>
            </div>
        </div>
    );
};

export default PerformanceHeader;
