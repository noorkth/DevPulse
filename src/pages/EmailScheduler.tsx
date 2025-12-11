import React, { useState, useEffect } from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import ConfirmDialog from '../components/common/ConfirmDialog';
import './EmailScheduler.css';

interface EmailSchedule {
    id: string;
    name: string;
    reportType: 'performance' | 'issues' | 'analytics' | 'summary';
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
    dayOfWeek?: number;
    dayOfMonth?: number;
    time: string;
    recipients: string;
    ccList?: string;
    enabled: boolean;
    lastRun?: Date;
    nextRun?: Date;
}

const EmailScheduler: React.FC = () => {
    const [schedules, setSchedules] = useState<EmailSchedule[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingSchedule, setEditingSchedule] = useState<EmailSchedule | null>(null);

    // Delete flow state
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [scheduleToDelete, setScheduleToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        loadSchedules();
    }, []);

    const loadSchedules = async () => {
        try {
            setLoading(true);
            const data = await window.api.emailSchedules.getAll();
            setSchedules(data);
        } catch (error) {
            console.error('Error loading schedules:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = async (id: string, enabled: boolean) => {
        try {
            await window.api.emailSchedules.toggle(id, !enabled);
            await loadSchedules();
        } catch (error) {
            console.error('Error toggling schedule:', error);
            alert('Failed to toggle schedule');
        }
    };

    const handleDelete = (id: string) => {
        setScheduleToDelete(id);
        setIsConfirmOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!scheduleToDelete) return;

        try {
            setIsDeleting(true);
            await window.api.emailSchedules.delete(scheduleToDelete);
            await loadSchedules();
            setIsConfirmOpen(false);
            setScheduleToDelete(null);
        } catch (error) {
            console.error('Error deleting schedule:', error);
            alert('Failed to delete schedule');
        } finally {
            setIsDeleting(false);
        }
    };

    const getFrequencyLabel = (schedule: EmailSchedule) => {
        switch (schedule.frequency) {
            case 'daily':
                return `Daily at ${schedule.time}`;
            case 'weekly':
                const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                return `Weekly on ${days[schedule.dayOfWeek || 1]} at ${schedule.time}`;
            case 'monthly':
                return `Monthly on day ${schedule.dayOfMonth || 1} at ${schedule.time}`;
            case 'quarterly':
                return `Quarterly on day ${schedule.dayOfMonth || 1} at ${schedule.time}`;
        }
    };

    const formatDateTime = (date?: Date) => {
        if (!date) return 'Never';
        return new Date(date).toLocaleString();
    };

    const getReportTypeIcon = (type: string) => {
        const icons: Record<string, string> = {
            performance: '📊',
            issues: '🐛',
            analytics: '📈',
            summary: '📋',
        };
        return icons[type] || '📄';
    };

    if (loading) {
        return <div className="email-scheduler-page"><div className="loading">Loading schedules...</div></div>;
    }

    return (
        <div className="email-scheduler-page">
            <div className="page-header">
                <div>
                    <h2>📧 Email Report Scheduler</h2>
                    <p className="page-subtitle">Automate your performance reports with custom schedules</p>
                </div>
                <Button onClick={() => {
                    setEditingSchedule(null);
                    setShowModal(true);
                }}>
                    + Create Schedule
                </Button>
            </div>

            {schedules.length === 0 ? (
                <Card>
                    <div className="empty-state">
                        <div className="empty-icon">📅</div>
                        <h3>No schedules yet</h3>
                        <p>Create your first automated email report schedule</p>
                        <Button onClick={() => setShowModal(true)}>Create Schedule</Button>
                    </div>
                </Card>
            ) : (
                <div className="schedules-grid">
                    {schedules.map((schedule) => (
                        <Card key={schedule.id}>
                            <div className="schedule-card">
                                <div className="schedule-header">
                                    <div className="schedule-title">
                                        <span className="report-icon">{getReportTypeIcon(schedule.reportType)}</span>
                                        <h3>{schedule.name}</h3>
                                    </div>
                                    <label className="toggle-switch">
                                        <input
                                            type="checkbox"
                                            checked={schedule.enabled}
                                            onChange={() => handleToggle(schedule.id, schedule.enabled)}
                                        />
                                        <span className="slider"></span>
                                    </label>
                                </div>

                                <div className="schedule-info">
                                    <div className="info-item">
                                        <span className="label">Report Type:</span>
                                        <span className="value">{schedule.reportType}</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="label">Frequency:</span>
                                        <span className="value">{getFrequencyLabel(schedule)}</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="label">Recipients:</span>
                                        <span className="value">
                                            {JSON.parse(schedule.recipients).length} recipient(s)
                                        </span>
                                    </div>
                                    {schedule.nextRun && (
                                        <div className="info-item">
                                            <span className="label">Next Run:</span>
                                            <span className="value next-run">
                                                {formatDateTime(schedule.nextRun)}
                                            </span>
                                        </div>
                                    )}
                                    {schedule.lastRun && (
                                        <div className="info-item">
                                            <span className="label">Last Run:</span>
                                            <span className="value">{formatDateTime(schedule.lastRun)}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="schedule-actions">
                                    <Button
                                        variant="secondary"
                                        onClick={() => {
                                            setEditingSchedule(schedule);
                                            setShowModal(true);
                                        }}
                                    >
                                        ✏️ Edit
                                    </Button>
                                    <Button
                                        variant="danger"
                                        onClick={() => handleDelete(schedule.id)}
                                    >
                                        🗑️ Delete
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {showModal && (
                <ScheduleModal
                    schedule={editingSchedule}
                    onClose={() => {
                        setShowModal(false);
                        setEditingSchedule(null);
                    }}
                    onSave={async () => {
                        setShowModal(false);
                        setEditingSchedule(null);
                        await loadSchedules();
                    }}
                />
            )}

            <ConfirmDialog
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={handleDeleteConfirm}
                title="Delete Schedule"
                message="Are you sure you want to delete this schedule? This will stop future email reports for this schedule."
                confirmText="Delete Schedule"
                variant="danger"
                isLoading={isDeleting}
            />
        </div>
    );
};

// Schedule Modal Component
const ScheduleModal: React.FC<{
    schedule: EmailSchedule | null;
    onClose: () => void;
    onSave: () => void;
}> = ({ schedule, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        name: schedule?.name || '',
        reportType: schedule?.reportType || 'performance',
        frequency: schedule?.frequency || 'weekly',
        dayOfWeek: schedule?.dayOfWeek?.toString() || '1',
        dayOfMonth: schedule?.dayOfMonth?.toString() || '1',
        time: schedule?.time || '09:00',
        recipients: schedule ? JSON.parse(schedule.recipients).join(', ') : '',
        ccList: schedule?.ccList ? JSON.parse(schedule.ccList).join(', ') : '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const data = {
                ...formData,
                dayOfWeek: formData.frequency === 'weekly' ? parseInt(formData.dayOfWeek) : undefined,
                dayOfMonth: ['monthly', 'quarterly'].includes(formData.frequency) ? parseInt(formData.dayOfMonth) : undefined,
                recipients: JSON.stringify(formData.recipients.split(',').map(e => e.trim()).filter(Boolean)),
                ccList: formData.ccList ? JSON.stringify(formData.ccList.split(',').map(e => e.trim()).filter(Boolean)) : undefined,
            };

            if (schedule) {
                await window.api.emailSchedules.update(schedule.id, data);
            } else {
                await window.api.emailSchedules.create(data);
            }

            onSave();
        } catch (error) {
            console.error('Error saving schedule:', error);
            alert('Failed to save schedule');
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content schedule-modal" onClick={(e) => e.stopPropagation()}>
                <h2>{schedule ? 'Edit Schedule' : 'Create Schedule'}</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Schedule Name</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g., Weekly Developer Reports"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Report Type</label>
                        <select
                            value={formData.reportType}
                            onChange={(e) => setFormData({ ...formData, reportType: e.target.value as any })}
                        >
                            <option value="performance">📊 Performance Report</option>
                            <option value="issues">🐛 Issues Report</option>
                            <option value="analytics">📈 Analytics Report</option>
                            <option value="summary">📋 Summary Report</option>
                        </select>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Frequency</label>
                            <select
                                value={formData.frequency}
                                onChange={(e) => setFormData({ ...formData, frequency: e.target.value as any })}
                            >
                                <option value="daily">Daily</option>
                                <option value="weekly">Weekly</option>
                                <option value="monthly">Monthly</option>
                                <option value="quarterly">Quarterly</option>
                            </select>
                        </div>

                        {formData.frequency === 'weekly' && (
                            <div className="form-group">
                                <label>Day of Week</label>
                                <select
                                    value={formData.dayOfWeek}
                                    onChange={(e) => setFormData({ ...formData, dayOfWeek: e.target.value })}
                                >
                                    <option value="0">Sunday</option>
                                    <option value="1">Monday</option>
                                    <option value="2">Tuesday</option>
                                    <option value="3">Wednesday</option>
                                    <option value="4">Thursday</option>
                                    <option value="5">Friday</option>
                                    <option value="6">Saturday</option>
                                </select>
                            </div>
                        )}

                        {['monthly', 'quarterly'].includes(formData.frequency) && (
                            <div className="form-group">
                                <label>Day of Month</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="31"
                                    value={formData.dayOfMonth}
                                    onChange={(e) => setFormData({ ...formData, dayOfMonth: e.target.value })}
                                />
                            </div>
                        )}

                        <div className="form-group">
                            <label>Time</label>
                            <input
                                type="time"
                                value={formData.time}
                                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Recipients (comma-separated emails)</label>
                        <textarea
                            value={formData.recipients}
                            onChange={(e) => setFormData({ ...formData, recipients: e.target.value })}
                            placeholder="developer1@example.com, developer2@example.com"
                            rows={2}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>CC List (optional, comma-separated)</label>
                        <textarea
                            value={formData.ccList}
                            onChange={(e) => setFormData({ ...formData, ccList: e.target.value })}
                            placeholder="manager@example.com"
                            rows={2}
                        />
                    </div>

                    <div className="modal-actions">
                        <Button type="button" variant="secondary" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit">
                            {schedule ? 'Update Schedule' : 'Create Schedule'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EmailScheduler;
