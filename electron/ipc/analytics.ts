import { ipcMain } from 'electron';
import { getPrisma } from "../prisma";
import { differenceInDays, sub } from 'date-fns';

// Using shared getPrisma()

export function setupAnalyticsHandlers() {
    // Get dashboard statistics
    ipcMain.handle('analytics:getDashboardStats', async () => {
        const prisma = getPrisma();
        try {
            const totalIssues = await prisma.issue.count();
            const openIssues = await prisma.issue.count({ where: { status: 'open' } });
            const resolvedIssues = await prisma.issue.count({
                where: { OR: [{ status: 'resolved' }, { status: 'closed' }] },
            });
            const recurringIssues = await prisma.issue.count({ where: { isRecurring: true } });

            const issuesWithResolutionTime = await prisma.issue.findMany({
                where: { resolutionTime: { not: null } },
                select: { resolutionTime: true },
            });

            const avgResolutionTime = issuesWithResolutionTime.length > 0
                ? issuesWithResolutionTime.reduce((acc, i) => acc + (i.resolutionTime || 0), 0) /
                issuesWithResolutionTime.length
                : 0;

            // Get severity distribution
            const severityDistribution = await prisma.issue.groupBy({
                by: ['severity'],
                _count: true,
            });

            // Get status distribution
            const statusDistribution = await prisma.issue.groupBy({
                by: ['status'],
                _count: true,
            });

            return {
                totalIssues,
                openIssues,
                resolvedIssues,
                recurringIssues,
                avgResolutionTime: Math.round(avgResolutionTime),
                severityDistribution,
                statusDistribution,
            };
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
            throw error;
        }
    });

    // Get productivity rankings
    ipcMain.handle('analytics:getProductivityRankings', async (_, timeframe?: any) => {
        const prisma = getPrisma();
        try {
            const developers = await prisma.developer.findMany({
                include: {
                    issues: {
                        where: timeframe?.startDate ? {
                            createdAt: {
                                gte: new Date(timeframe.startDate),
                                lte: timeframe.endDate ? new Date(timeframe.endDate) : new Date(),
                            },
                        } : {},
                    },
                },
            });

            const rankings = developers.map(developer => {
                const resolvedIssues = developer.issues.filter(
                    i => i.status === 'resolved' || i.status === 'closed'
                );

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

                const recurringBugs = developer.issues.filter(i => i.isRecurring).length;
                const recurrencePenalty = recurringBugs * 5;

                const totalTimeSpent = resolvedIssues.reduce(
                    (acc, i) => acc + (i.resolutionTime || 0),
                    0
                ) || 1;

                const productivityScore = (weightedIssues - recurrencePenalty) / (totalTimeSpent / 24);

                return {
                    developerId: developer.id,
                    developerName: developer.fullName,
                    productivityScore: Math.max(0, productivityScore),
                    resolvedCount: resolvedIssues.length,
                    recurringCount: recurringBugs,
                    avgResolutionTime: totalTimeSpent / (resolvedIssues.length || 1),
                };
            });

            return rankings.sort((a, b) => b.productivityScore - a.productivityScore);
        } catch (error) {
            console.error('Error fetching productivity rankings:', error);
            throw error;
        }
    });

    // Get feature stability scores
    ipcMain.handle('analytics:getFeatureStability', async (_, projectId?: string) => {
        const prisma = getPrisma();
        try {
            const features = await prisma.feature.findMany({
                where: projectId ? { projectId } : {},
                include: {
                    issues: true,
                    project: true,
                },
            });

            const stabilityScores = features.map(feature => {
                const totalBugs = feature.issues.length;
                const recurringBugs = feature.issues.filter(i => i.isRecurring).length;
                const criticalBugs = feature.issues.filter(i => i.severity === 'critical').length;

                const daysSinceCreation = differenceInDays(new Date(), feature.createdAt);
                const bugWeight = totalBugs * 1 + criticalBugs * 2;

                const stabilityScore = Math.max(
                    0,
                    100 - ((bugWeight + recurringBugs * 10) / (daysSinceCreation || 1))
                );

                return {
                    featureId: feature.id,
                    featureName: feature.name,
                    projectName: feature.project.name,
                    stabilityScore: Math.min(100, stabilityScore),
                    totalBugs,
                    recurringBugs,
                    criticalBugs,
                };
            });

            return stabilityScores.sort((a, b) => b.stabilityScore - a.stabilityScore);
        } catch (error) {
            console.error('Error fetching feature stability:', error);
            throw error;
        }
    });

    // Get recurrence analysis
    ipcMain.handle('analytics:getRecurrenceAnalysis', async () => {
        const prisma = getPrisma();
        try {
            const developers = await prisma.developer.findMany({
                include: {
                    issues: true,
                },
            });

            const recurrenceData = developers.map(developer => {
                const totalIssues = developer.issues.length;
                const recurringIssues = developer.issues.filter(i => i.isRecurring).length;
                const recurrenceRate = totalIssues > 0 ? (recurringIssues / totalIssues) * 100 : 0;

                const avgFixQuality = developer.issues
                    .filter(i => i.fixQuality)
                    .reduce((acc, i) => acc + (i.fixQuality || 0), 0) /
                    (developer.issues.filter(i => i.fixQuality).length || 1);

                return {
                    developerId: developer.id,
                    developerName: developer.fullName,
                    totalIssues,
                    recurringIssues,
                    recurrenceRate,
                    avgFixQuality,
                };
            });

            // Overall recurrence trends
            const allIssues = await prisma.issue.findMany({
                orderBy: { createdAt: 'asc' },
            });

            const monthlyRecurrence = [];
            const monthsToAnalyze = 6;

            for (let i = monthsToAnalyze - 1; i >= 0; i--) {
                const startDate = sub(new Date(), { months: i + 1 });
                const endDate = sub(new Date(), { months: i });

                const monthIssues = allIssues.filter(
                    issue => issue.createdAt >= startDate && issue.createdAt < endDate
                );

                const recurringCount = monthIssues.filter(i => i.isRecurring).length;

                monthlyRecurrence.push({
                    month: endDate.toLocaleString('default', { month: 'short', year: 'numeric' }),
                    totalIssues: monthIssues.length,
                    recurringIssues: recurringCount,
                    recurrenceRate: monthIssues.length > 0 ? (recurringCount / monthIssues.length) * 100 : 0,
                });
            }

            return {
                developerRecurrence: recurrenceData,
                monthlyTrends: monthlyRecurrence,
            };
        } catch (error) {
            console.error('Error fetching recurrence analysis:', error);
            throw error;
        }
    });

    // Get time-to-fix data
    ipcMain.handle('analytics:getTimeToFixData', async (_, filters?: any) => {
        const prisma = getPrisma();
        try {
            const where: any = { resolutionTime: { not: null } };

            if (filters?.projectId) where.projectId = filters.projectId;
            if (filters?.developerId) where.assignedToId = filters.developerId;
            if (filters?.severity) where.severity = filters.severity;

            const issues = await prisma.issue.findMany({
                where,
                include: {
                    assignedTo: true,
                    project: true,
                },
            });

            // By severity
            const bySeverity = {
                critical: issues.filter(i => i.severity === 'critical'),
                high: issues.filter(i => i.severity === 'high'),
                medium: issues.filter(i => i.severity === 'medium'),
                low: issues.filter(i => i.severity === 'low'),
            };

            const severityAvg = {
                critical: bySeverity.critical.reduce((acc, i) => acc + (i.resolutionTime || 0), 0) /
                    (bySeverity.critical.length || 1),
                high: bySeverity.high.reduce((acc, i) => acc + (i.resolutionTime || 0), 0) /
                    (bySeverity.high.length || 1),
                medium: bySeverity.medium.reduce((acc, i) => acc + (i.resolutionTime || 0), 0) /
                    (bySeverity.medium.length || 1),
                low: bySeverity.low.reduce((acc, i) => acc + (i.resolutionTime || 0), 0) /
                    (bySeverity.low.length || 1),
            };

            // By developer
            const developers = await prisma.developer.findMany({
                include: {
                    issues: {
                        where: { resolutionTime: { not: null } },
                    },
                },
            });

            const developerAvg = developers.map(dev => ({
                developerId: dev.id,
                developerName: dev.fullName,
                avgTime: dev.issues.reduce((acc, i) => acc + (i.resolutionTime || 0), 0) /
                    (dev.issues.length || 1),
                totalResolved: dev.issues.length,
            }));

            return {
                bySeverity: severityAvg,
                byDeveloper: developerAvg,
                overall: issues.reduce((acc, i) => acc + (i.resolutionTime || 0), 0) /
                    (issues.length || 1),
            };
        } catch (error) {
            console.error('Error fetching time-to-fix data:', error);
            throw error;
        }
    });

    // Get project comparison
    ipcMain.handle('analytics:getProjectComparison', async () => {
        const prisma = getPrisma();
        try {
            const projects = await prisma.project.findMany({
                where: { status: { not: 'archived' } },
                include: {
                    issues: true,
                    developers: true,
                },
            });

            const comparison = projects.map(project => {
                const totalIssues = project.issues.length;
                const openIssues = project.issues.filter(i => i.status === 'open').length;
                const resolvedIssues = project.issues.filter(
                    i => i.status === 'resolved' || i.status === 'closed'
                ).length;
                const criticalIssues = project.issues.filter(i => i.severity === 'critical').length;
                const recurringIssues = project.issues.filter(i => i.isRecurring).length;

                const avgResolutionTime = project.issues
                    .filter(i => i.resolutionTime)
                    .reduce((acc, i) => acc + (i.resolutionTime || 0), 0) /
                    (project.issues.filter(i => i.resolutionTime).length || 1);

                const healthScore = Math.max(
                    0,
                    100 - (openIssues * 2) - (criticalIssues * 5) - (recurringIssues * 10)
                );

                return {
                    projectId: project.id,
                    projectName: project.name,
                    totalIssues,
                    openIssues,
                    resolvedIssues,
                    criticalIssues,
                    recurringIssues,
                    avgResolutionTime: Math.round(avgResolutionTime),
                    developerCount: project.developers.length,
                    healthScore: Math.min(100, healthScore),
                };
            });

            return comparison;
        } catch (error) {
            console.error('Error fetching project comparison:', error);
            throw error;
        }
    });
}
