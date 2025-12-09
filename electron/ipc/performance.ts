import { ipcMain } from 'electron';
import { getPrisma } from '../prisma';
import { differenceInDays, subWeeks, startOfWeek, endOfWeek, format } from 'date-fns';

export function setupPerformanceHandlers() {
    const prisma = getPrisma();

    // Get comprehensive developer performance detail
    ipcMain.handle('performance:getDeveloperDetail', async (_, developerId: string, timeframe?: { startDate?: Date, endDate?: Date }) => {
        try {
            const startDate = timeframe?.startDate ? new Date(timeframe.startDate) : subWeeks(new Date(), 12);
            const endDate = timeframe?.endDate ? new Date(timeframe.endDate) : new Date();

            const developer = await prisma.developer.findUnique({
                where: { id: developerId },
                include: {
                    issues: {
                        where: {
                            createdAt: { gte: startDate }
                        },
                        include: {
                            project: true,
                            feature: true
                        }
                    },
                    projects: {
                        include: {
                            project: true
                        }
                    }
                }
            });

            if (!developer) {
                throw new Error('Developer not found');
            }

            // Calculate metrics
            const totalIssues = developer.issues.length;
            const resolvedIssues = developer.issues.filter(i => i.status === 'resolved' || i.status === 'closed');
            const openIssues = developer.issues.filter(i => i.status === 'open');
            const inProgressIssues = developer.issues.filter(i => i.status === 'in_progress');
            const recurringIssues = developer.issues.filter(i => i.isRecurring);

            // Completion rate
            const completionRate = totalIssues > 0 ? (resolvedIssues.length / totalIssues) * 100 : 0;

            // Average resolution time
            const issuesWithTime = resolvedIssues.filter(i => i.resolutionTime);
            const avgResolutionTime = issuesWithTime.length > 0
                ? issuesWithTime.reduce((sum, i) => sum + (i.resolutionTime || 0), 0) / issuesWithTime.length
                : 0;

            // Average fix quality
            const issuesWithQuality = resolvedIssues.filter(i => i.fixQuality);
            const avgFixQuality = issuesWithQuality.length > 0
                ? issuesWithQuality.reduce((sum, i) => sum + (i.fixQuality || 0), 0) / issuesWithQuality.length
                : 0;

            // Productivity score calculation
            let weightedIssues = 0;
            resolvedIssues.forEach(issue => {
                let severityWeight = 1;
                switch (issue.severity) {
                    case 'critical': severityWeight = 4; break;
                    case 'high': severityWeight = 3; break;
                    case 'medium': severityWeight = 2; break;
                    case 'low': severityWeight = 1; break;
                }
                const qualityMultiplier = issue.fixQuality || 3;
                weightedIssues += severityWeight * qualityMultiplier;
            });

            const recurrencePenalty = recurringIssues.length * 5;
            const totalTimeSpent = issuesWithTime.reduce((sum, i) => sum + (i.resolutionTime || 0), 0) || 1;
            const productivityScore = Math.max(0, (weightedIssues - recurrencePenalty) / (totalTimeSpent / 24));

            return {
                developer: {
                    id: developer.id,
                    fullName: developer.fullName,
                    email: developer.email,
                    skills: developer.skills,
                    seniorityLevel: developer.seniorityLevel,
                    role: developer.role
                },
                metrics: {
                    totalIssues,
                    resolvedCount: resolvedIssues.length,
                    openCount: openIssues.length,
                    inProgressCount: inProgressIssues.length,
                    recurringCount: recurringIssues.length,
                    completionRate: Math.round(completionRate * 10) / 10,
                    avgResolutionTime: Math.round(avgResolutionTime * 10) / 10,
                    avgFixQuality: Math.round(avgFixQuality * 10) / 10,
                    productivityScore: Math.round(productivityScore * 100) / 100
                },
                currentProjects: developer.projects.length
            };
        } catch (error) {
            console.error('Error getting developer detail:', error);
            throw error;
        }
    });

    // Get weekly velocity trend
    ipcMain.handle('performance:getVelocityTrend', async (_, developerId: string, weeks: number = 12, timeframe?: { startDate?: Date, endDate?: Date }) => {
        try {
            const startDate = timeframe?.startDate ? new Date(timeframe.startDate) : subWeeks(new Date(), weeks);
            const endDate = timeframe?.endDate ? new Date(timeframe.endDate) : new Date();

            const issues = await prisma.issue.findMany({
                where: {
                    assignedToId: developerId,
                    resolvedAt: { gte: startDate, not: null }
                },
                select: {
                    resolvedAt: true,
                    severity: true
                }
            });

            // Group by week
            const weekMap = new Map<string, { week: string; count: number; byWeek: Date }>();

            issues.forEach(issue => {
                if (issue.resolvedAt) {
                    const weekStart = startOfWeek(issue.resolvedAt);
                    const weekKey = format(weekStart, 'yyyy-MM-dd');
                    const weekLabel = format(weekStart, 'MMM dd');

                    if (!weekMap.has(weekKey)) {
                        weekMap.set(weekKey, { week: weekLabel, count: 0, byWeek: weekStart });
                    }
                    weekMap.get(weekKey)!.count++;
                }
            });

            // Convert to array and sort
            const trendData = Array.from(weekMap.values())
                .sort((a, b) => a.byWeek.getTime() - b.byWeek.getTime())
                .map(({ week, count }) => ({ week, resolved: count }));

            // Calculate velocity (4-week rolling average)
            const velocity = trendData.length >= 4
                ? trendData.slice(-4).reduce((sum, d) => sum + d.resolved, 0) / 4
                : trendData.reduce((sum, d) => sum + d.resolved, 0) / (trendData.length || 1);

            return {
                trendData,
                currentVelocity: Math.round(velocity * 10) / 10,
                totalResolved: issues.length
            };
        } catch (error) {
            console.error('Error getting velocity trend:', error);
            throw error;
        }
    });

    // Get resolution time breakdown
    ipcMain.handle('performance:getResolutionTimeBreakdown', async (_, developerId: string, timeframe?: { startDate?: Date, endDate?: Date }) => {
        try {
            const startDate = timeframe?.startDate ? new Date(timeframe.startDate) : subWeeks(new Date(), 12);
            const endDate = timeframe?.endDate ? new Date(timeframe.endDate) : new Date();
            const issues = await prisma.issue.findMany({
                where: {
                    assignedToId: developerId,
                    createdAt: { gte: startDate, lte: endDate },
                    resolutionTime: { not: null }
                },
                select: {
                    severity: true,
                    resolutionTime: true,
                    project: {
                        select: {
                            name: true
                        }
                    }
                }
            });

            // By severity
            const bySeverity: Record<string, { total: number; count: number; avg: number }> = {};
            const byProject: Record<string, { total: number; count: number; avg: number }> = {};

            issues.forEach(issue => {
                // By severity
                if (!bySeverity[issue.severity]) {
                    bySeverity[issue.severity] = { total: 0, count: 0, avg: 0 };
                }
                bySeverity[issue.severity].total += issue.resolutionTime || 0;
                bySeverity[issue.severity].count++;

                // By project
                const projectName = issue.project.name;
                if (!byProject[projectName]) {
                    byProject[projectName] = { total: 0, count: 0, avg: 0 };
                }
                byProject[projectName].total += issue.resolutionTime || 0;
                byProject[projectName].count++;
            });

            // Calculate averages
            Object.keys(bySeverity).forEach(severity => {
                const data = bySeverity[severity];
                data.avg = Math.round((data.total / data.count) * 10) / 10;
            });

            Object.keys(byProject).forEach(project => {
                const data = byProject[project];
                data.avg = Math.round((data.total / data.count) * 10) / 10;
            });

            return {
                bySeverity: Object.entries(bySeverity).map(([severity, data]) => ({
                    severity,
                    avgTime: data.avg,
                    count: data.count
                })),
                byProject: Object.entries(byProject)
                    .map(([project, data]) => ({
                        project,
                        avgTime: data.avg,
                        count: data.count
                    }))
                    .sort((a, b) => b.avgTime - a.avgTime)
                    .slice(0, 5) // Top 5 projects
            };
        } catch (error) {
            console.error('Error getting resolution time breakdown:', error);
            throw error;
        }
    });

    // Get skills utilization
    ipcMain.handle('performance:getSkillsUtilization', async (_, developerId: string, timeframe?: { startDate?: Date, endDate?: Date }) => {
        try {
            const startDate = timeframe?.startDate ? new Date(timeframe.startDate) : subWeeks(new Date(), 12);
            const endDate = timeframe?.endDate ? new Date(timeframe.endDate) : new Date();
            const developer = await prisma.developer.findUnique({
                where: { id: developerId },
                select: { skills: true }
            });

            if (!developer) {
                throw new Error('Developer not found');
            }

            const issues = await prisma.issue.findMany({
                where: {
                    assignedToId: developerId,
                    createdAt: { gte: startDate, lte: endDate }
                },
                include: {
                    project: {
                        select: {
                            name: true,
                            projectType: true
                        }
                    }
                }
            });

            // Group by project type (proxy for skills)
            const utilization: Record<string, number> = {};

            issues.forEach(issue => {
                const type = issue.project.projectType || 'Other';
                utilization[type] = (utilization[type] || 0) + 1;
            });

            return Object.entries(utilization).map(([skill, count]) => ({
                skill,
                count,
                percentage: Math.round((count / issues.length) * 100)
            }));
        } catch (error) {
            console.error('Error getting skills utilization:', error);
            throw error;
        }
    });

    // Get reopened issues
    ipcMain.handle('performance:getReopenedIssues', async (_, developerId: string, timeframe?: { startDate?: Date, endDate?: Date }) => {
        try {
            const startDate = timeframe?.startDate ? new Date(timeframe.startDate) : subWeeks(new Date(), 12);
            const endDate = timeframe?.endDate ? new Date(timeframe.endDate) : new Date();
            // For now, use recurring issues as proxy for reopened
            const reopenedIssues = await prisma.issue.findMany({
                where: {
                    assignedToId: developerId,
                    createdAt: { gte: startDate, lte: endDate },
                    isRecurring: true
                },
                include: {
                    project: {
                        select: {
                            name: true
                        }
                    },
                    feature: {
                        select: {
                            name: true
                        }
                    }
                },
                orderBy: {
                    recurrenceCount: 'desc'
                }
            });

            return reopenedIssues.map(issue => ({
                id: issue.id,
                title: issue.title,
                project: issue.project.name,
                feature: issue.feature?.name,
                severity: issue.severity,
                recurrenceCount: issue.recurrenceCount,
                status: issue.status
            }));
        } catch (error) {
            console.error('Error getting reopened issues:', error);
            throw error;
        }
    });

    // Get quality score trend over time
    ipcMain.handle('performance:getQualityTrend', async (_, developerId: string, weeks: number = 12, timeframe?: { startDate?: Date, endDate?: Date }) => {
        try {
            const startDate = timeframe?.startDate ? new Date(timeframe.startDate) : subWeeks(new Date(), weeks);
            const endDate = timeframe?.endDate ? new Date(timeframe.endDate) : new Date();


            const issues = await prisma.issue.findMany({
                where: {
                    assignedToId: developerId,
                    resolvedAt: { gte: startDate, not: null },
                    fixQuality: { not: null }
                },
                select: {
                    resolvedAt: true,
                    fixQuality: true
                },
                orderBy: {
                    resolvedAt: 'asc'
                }
            });

            // Group by week
            const weekMap = new Map<string, { week: string; qualities: number[]; byWeek: Date }>();

            issues.forEach(issue => {
                if (issue.resolvedAt && issue.fixQuality) {
                    const weekStart = startOfWeek(issue.resolvedAt);
                    const weekKey = format(weekStart, 'yyyy-MM-dd');
                    const weekLabel = format(weekStart, 'MMM dd');

                    if (!weekMap.has(weekKey)) {
                        weekMap.set(weekKey, { week: weekLabel, qualities: [], byWeek: weekStart });
                    }
                    weekMap.get(weekKey)!.qualities.push(issue.fixQuality);
                }
            });

            // Calculate average quality per week
            const trendData = Array.from(weekMap.values())
                .map(({ week, qualities, byWeek }) => ({
                    week,
                    avgQuality: Math.round((qualities.reduce((sum, q) => sum + q, 0) / qualities.length) * 10) / 10,
                    count: qualities.length,
                    byWeek
                }))
                .sort((a, b) => a.byWeek.getTime() - b.byWeek.getTime());

            return trendData;
        } catch (error) {
            console.error('Error getting quality trend:', error);
            throw error;
        }
    });

    // Get workload distribution
    ipcMain.handle('performance:getWorkloadDistribution', async (_, developerId?: string) => {
        try {
            const where = developerId ? { assignedToId: developerId } : {};

            const issues = await prisma.issue.findMany({
                where: {
                    ...where,
                    status: { in: ['open', 'in_progress'] }
                },
                include: {
                    assignedTo: {
                        select: {
                            id: true,
                            fullName: true,
                            role: true
                        }
                    },
                    project: {
                        select: {
                            name: true
                        }
                    }
                }
            });

            if (developerId) {
                // Single developer workload
                const bySeverity: Record<string, number> = {};
                const byProject: Record<string, number> = {};

                issues.forEach(issue => {
                    bySeverity[issue.severity] = (bySeverity[issue.severity] || 0) + 1;
                    byProject[issue.project.name] = (byProject[issue.project.name] || 0) + 1;
                });

                return {
                    totalActive: issues.length,
                    bySeverity: Object.entries(bySeverity).map(([severity, count]) => ({
                        severity,
                        count
                    })),
                    byProject: Object.entries(byProject)
                        .map(([project, count]) => ({ project, count }))
                        .sort((a, b) => b.count - a.count)
                };
            } else {
                // Team-wide workload
                const byDeveloper: Record<string, { name: string; count: number; critical: number; high: number }> = {};

                issues.forEach(issue => {
                    if (issue.assignedTo && issue.assignedTo.role === 'developer') {
                        const devId = issue.assignedTo.id;
                        if (!byDeveloper[devId]) {
                            byDeveloper[devId] = {
                                name: issue.assignedTo.fullName,
                                count: 0,
                                critical: 0,
                                high: 0
                            };
                        }
                        byDeveloper[devId].count++;
                        if (issue.severity === 'critical') byDeveloper[devId].critical++;
                        if (issue.severity === 'high') byDeveloper[devId].high++;
                    }
                });

                return Object.entries(byDeveloper).map(([id, data]) => ({
                    developerId: id,
                    ...data
                }));
            }
        } catch (error) {
            console.error('Error getting workload distribution:', error);
            throw error;
        }
    });

    // Get team comparison for a developer
    ipcMain.handle('performance:getTeamComparison', async (_, developerId: string, timeframe?: { startDate?: Date, endDate?: Date }) => {
        try {
            const startDate = timeframe?.startDate ? new Date(timeframe.startDate) : subWeeks(new Date(), 12);
            const endDate = timeframe?.endDate ? new Date(timeframe.endDate) : new Date();
            // Get all developers (excluding managers)
            const developers = await prisma.developer.findMany({
                where: { role: 'developer' },
                include: {
                    issues: {
                        where: {
                            createdAt: { gte: startDate, lte: endDate }
                        }
                    }
                }
            });

            const comparisons = developers.map(dev => {
                const resolvedIssues = dev.issues.filter(i => i.status === 'resolved' || i.status === 'closed');
                const issuesWithTime = resolvedIssues.filter(i => i.resolutionTime);
                const issuesWithQuality = resolvedIssues.filter(i => i.fixQuality);

                const avgResolutionTime = issuesWithTime.length > 0
                    ? issuesWithTime.reduce((sum, i) => sum + (i.resolutionTime || 0), 0) / issuesWithTime.length
                    : 0;

                const avgQuality = issuesWithQuality.length > 0
                    ? issuesWithQuality.reduce((sum, i) => sum + (i.fixQuality || 0), 0) / issuesWithQuality.length
                    : 0;

                const completionRate = dev.issues.length > 0
                    ? (resolvedIssues.length / dev.issues.length) * 100
                    : 0;

                return {
                    developerId: dev.id,
                    name: dev.fullName,
                    resolvedCount: resolvedIssues.length,
                    avgResolutionTime: Math.round(avgResolutionTime * 10) / 10,
                    avgQuality: Math.round(avgQuality * 10) / 10,
                    completionRate: Math.round(completionRate * 10) / 10,
                    isTarget: dev.id === developerId
                };
            });

            // Calculate team averages
            const teamAvg = {
                avgResolutionTime: comparisons.reduce((sum, d) => sum + d.avgResolutionTime, 0) / comparisons.length,
                avgQuality: comparisons.reduce((sum, d) => sum + d.avgQuality, 0) / comparisons.length,
                completionRate: comparisons.reduce((sum, d) => sum + d.completionRate, 0) / comparisons.length
            };

            return {
                comparisons,
                teamAverage: {
                    avgResolutionTime: Math.round(teamAvg.avgResolutionTime * 10) / 10,
                    avgQuality: Math.round(teamAvg.avgQuality * 10) / 10,
                    completionRate: Math.round(teamAvg.completionRate * 10) / 10
                }
            };
        } catch (error) {
            console.error('Error getting team comparison:', error);
            throw error;
        }
    });
}
