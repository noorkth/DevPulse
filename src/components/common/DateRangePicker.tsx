import React, { useState } from 'react';
import { DateRange } from 'react-date-range';
import { subDays, subWeeks, subMonths, subYears, startOfDay, endOfDay } from 'date-fns';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import './DateRangePicker.css';

interface DateRangePickerProps {
    onRangeChange: (range: { startDate: Date; endDate: Date }) => void;
    onClose?: () => void;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({ onRangeChange, onClose }) => {
    const [selectionRange, setSelectionRange] = useState({
        startDate: subWeeks(new Date(), 12),
        endDate: new Date(),
        key: 'selection'
    });

    const presetRanges = [
        { label: 'Last 7 Days', days: 7 },
        { label: 'Last 30 Days', days: 30 },
        { label: 'Last 90 Days', days: 90 },
        { label: 'Last 6 Months', days: 180 },
        { label: 'Last Year', days: 365 }
    ];

    const handlePresetClick = (days: number) => {
        const range = {
            startDate: startOfDay(subDays(new Date(), days)),
            endDate: endOfDay(new Date()),
            key: 'selection'
        };
        setSelectionRange(range);
    };

    const handleSelect = (ranges: any) => {
        setSelectionRange(ranges.selection);
    };

    const handleApply = () => {
        onRangeChange({
            startDate: selectionRange.startDate,
            endDate: selectionRange.endDate
        });
        if (onClose) onClose();
    };

    const handleCancel = () => {
        if (onClose) onClose();
    };

    return (
        <div className="date-range-picker-overlay">
            <div className="date-range-picker-container">
                <div className="date-range-header">
                    <h3>Select Date Range</h3>
                    <button className="close-btn" onClick={handleCancel}>×</button>
                </div>

                <div className="date-range-content">
                    {/* Preset Buttons */}
                    <div className="preset-buttons">
                        <h4>Quick Select:</h4>
                        {presetRanges.map((preset) => (
                            <button
                                key={preset.label}
                                className="preset-btn"
                                onClick={() => handlePresetClick(preset.days)}
                            >
                                {preset.label}
                            </button>
                        ))}
                    </div>

                    {/* Calendar */}
                    <div className="calendar-container">
                        <DateRange
                            ranges={[selectionRange]}
                            onChange={handleSelect}
                            months={2}
                            direction="horizontal"
                            showDateDisplay={true}
                            maxDate={new Date()}
                        />
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="date-range-actions">
                    <button className="cancel-btn" onClick={handleCancel}>
                        Cancel
                    </button>
                    <button className="apply-btn" onClick={handleApply}>
                        Apply Range
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DateRangePicker;
