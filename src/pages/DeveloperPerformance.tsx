import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { subWeeks } from 'date-fns';
import DateRangePicker from '../components/common/DateRangePicker';
import GoalModal from '../components/common/GoalModal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { generatePerformancePDF } from '../utils/pdfGenerator';
import PerformanceHeader from '../components/performance/PerformanceHeader';
import PerformanceMetricsGrid from '../components/performance/PerformanceMetricsGrid';
import GoalsSection from '../components/performance/GoalsSection';
import VelocityChart from '../components/performance/VelocityChart';
import ResolutionTimeChart from '../components/performance/ResolutionTimeChart';
import SkillsUtilizationChart from '../components/performance/SkillsUtilizationChart';
import QualityTrendChart from '../components/performance/QualityTrendChart';
import TeamComparisonChart from '../components/performance/TeamComparisonChart';
import ReopenedIssuesChart from '../components/performance/ReopenedIssuesChart';
import './DeveloperPerformance.css';

const DeveloperPerformance: React.FC = () => {
    const { developerId } = useParams<{ developerId: string }>();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState({
        startDate: subWeeks(new Date(), 12),
        endDate: new Date()
    });
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showGoalModal, setShowGoalModal] = useState(false);
    const [goals, setGoals] = useState<any[]>([]);

    // Delete goal flow
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [goalToDelete, setGoalToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const [developerDetail, setDeveloperDetail] = useState<any>(null);
    const [velocityTrend, setVelocityTrend] = useState<any>(null);
    const [resolutionBreakdown, setResolutionBreakdown] = useState<any>(null);
    const [skillsUtilization, setSkillsUtilization] = useState<any[]>([]);
    const [qualityTrend, setQualityTrend] = useState<any[]>([]);
    const [teamComparison, setTeamComparison] = useState<any>(null);
    const [reopenedIssues, setReopenedIssues] = useState<any[]>([]);

    useEffect(() => {
        if (developerId) {
            loadPerformanceData();
            loadGoals();
        }
    }, [developerId, dateRange]);

    const loadPerformanceData = async () => {
        try {
            setLoading(true);
            const api = window.api as any;
            const timeframe = { startDate: dateRange.startDate, endDate: dateRange.endDate };

            const [detail, velocity, breakdown, skills, quality, comparison, reopened] = await Promise.all([
                api.performance.getDeveloperDetail(developerId!, timeframe),
                api.performance.getVelocityTrend(developerId!, 12, timeframe),
                api.performance.getResolutionTimeBreakdown(developerId!, timeframe),
                api.performance.getSkillsUtilization(developerId!, timeframe),
                api.performance.getQualityTrend(developerId!, 12, timeframe),
                api.performance.getTeamComparison(developerId!, timeframe),
                api.performance.getReopenedIssues(developerId!, timeframe)
            ]);

            setDeveloperDetail(detail);
            setVelocityTrend(velocity);
            setResolutionBreakdown(breakdown);
            setSkillsUtilization(skills);
            setQualityTrend(quality);
            setTeamComparison(comparison);
            setReopenedIssues(reopened);
        } catch (error) {
            console.error('Error loading performance data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDateRangeChange = (newRange: { startDate: Date; endDate: Date }) => {
        setDateRange(newRange);
        setShowDatePicker(false);
    };

    const handleExportPDF = async () => {
        if (!developerDetail) return;

        try {
            await generatePerformancePDF(developerDetail, dateRange);
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Failed to generate PDF. Please try again.');
        }
    };

    const loadGoals = async () => {
        try {
            const api = window.api as any;
            const goalsData = await api.goals.getForDeveloper(developerId!);
            setGoals(goalsData);
        } catch (error) {
            console.error('Error loading goals:', error);
        }
    };

    const handleCreateGoal = async (goalData: any) => {
        try {
            const api = window.api as any;
            await api.goals.create(goalData);
            setShowGoalModal(false);
            loadGoals();
        } catch (error) {
            console.error('Error creating goal:', error);
            alert('Failed to create goal. Please try again.');
        }
    };

    const handleDeleteGoal = (goalId: string) => {
        setGoalToDelete(goalId);
        setIsConfirmOpen(true);
    };

    const handleDeleteGoalConfirm = async () => {
        if (!goalToDelete) return;

        try {
            setIsDeleting(true);
            const api = window.api as any;
            await api.goals.delete(goalToDelete);
            loadGoals();
            setIsConfirmOpen(false);
            setGoalToDelete(null);
        } catch (error) {
            console.error('Error deleting goal:', error);
            alert('Failed to delete goal. Please try again.');
        } finally {
            setIsDeleting(false);
        }
    };

    if (loading) {
        return (
            <div className="developer-performance-page">
                <div className="loading">Loading performance data...</div>
            </div>
        );
    }

    if (!developerDetail) {
        return (
            <div className="developer-performance-page">
                <div className="error">Developer not found</div>
            </div>
        );
    }

    const { developer, metrics } = developerDetail;

    return (
        <div className="developer-performance-page">
            <PerformanceHeader
                developer={developer}
                dateRange={dateRange}
                onBack={() => navigate('/users')}
                onDateRangeToggle={() => setShowDatePicker(true)}
                onExportPDF={handleExportPDF}
            />

            {showDatePicker && (
                <DateRangePicker
                    onRangeChange={handleDateRangeChange}
                    onClose={() => setShowDatePicker(false)}
                />
            )}

            {showGoalModal && (
                <GoalModal
                    developerId={developerId!}
                    onClose={() => setShowGoalModal(false)}
                    onSave={handleCreateGoal}
                />
            )}

            <PerformanceMetricsGrid metrics={metrics} />

            <GoalsSection
                goals={goals}
                onCreateGoal={() => setShowGoalModal(true)}
                onDeleteGoal={handleDeleteGoal}
            />

            <div className="charts-grid">
                <VelocityChart data={velocityTrend} />
                <ResolutionTimeChart data={resolutionBreakdown} />
                <SkillsUtilizationChart data={skillsUtilization} />
                <QualityTrendChart data={qualityTrend} />
                <TeamComparisonChart data={teamComparison} />
                <ReopenedIssuesChart data={reopenedIssues} />
            </div>

            <ConfirmDialog
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={handleDeleteGoalConfirm}
                title="Delete Goal"
                message="Are you sure you want to delete this goal? This action cannot be undone."
                confirmText="Delete Goal"
                variant="danger"
                isLoading={isDeleting}
            />
        </div>
    );
};

export default DeveloperPerformance;
