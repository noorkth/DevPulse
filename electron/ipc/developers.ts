import { ipcMain } from 'electron';
import { getPrisma } from "../prisma";

// Using shared getPrisma()

export function setupDeveloperHandlers() {
    // Get all developers
    ipcMain.handle('developers:getAll', async () => {
        try {
            const developers = await prisma.developer.findMany({
                include: {
                    _count: {
                        select: {
                            issues: true,
                            projects: true,
                        },
                    },
                },
                orderBy: { fullName: 'asc' },
            });

            return developers;
        } catch (error) {
            console.error('Error fetching developers:', error);
            throw error;
        }
    });

    // Get developer by ID with detailed stats
    ipcMain.handle('developers:getById', async (_, id: string) => {
        try {
            const developer = await prisma.developer.findUnique({
                where: { id },
                include: {
                    issues: {
                        include: {
                            project: true,
                            feature: true,
                        },
                        orderBy: { createdAt: 'desc' },
                    },
                    projects: {
                        include: {
                            project: true,
                        },
                    },
                },
            });

            if (!developer) {
                throw new Error('Developer not found');
            }

            // Calculate stats
            const totalIssues = developer.issues.length;
            const resolvedIssues = developer.issues.filter(
                i => i.status === 'resolved' || i.status === 'closed'
            ).length;
            const activeIssues = developer.issues.filter(
                i => i.status === 'open' || i.status === 'in-progress'
            ).length;
            const recurringBugs = developer.issues.filter(i => i.isRecurring).length;

            const avgFixQuality = developer.issues
                .filter(i => i.fixQuality)
                .reduce((acc, i) => acc + (i.fixQuality || 0), 0) /
                (developer.issues.filter(i => i.fixQuality).length || 1);

            const avgResolutionTime = developer.issues
                .filter(i => i.resolutionTime)
                .reduce((acc, i) => acc + (i.resolutionTime || 0), 0) /
                (developer.issues.filter(i => i.resolutionTime).length || 1);

            return {
                ...developer,
                stats: {
                    totalIssues,
                    resolvedIssues,
                    activeIssues,
                    recurringBugs,
                    avgFixQuality: avgFixQuality.toFixed(1),
                    avgResolutionTime: Math.round(avgResolutionTime),
                },
            };
        } catch (error) {
            console.error('Error fetching developer:', error);
            throw error;
        }
    });

    // Create new developer
    ipcMain.handle('developers:create', async (_, data: any) => {
        try {
            const developer = await prisma.developer.create({
                data: {
                    fullName: data.fullName,
                    email: data.email,
                    skills: JSON.stringify(data.skills || []),
                    seniorityLevel: data.seniorityLevel,
                },
            });

            // Assign to projects if provided
            if (data.projectIds && data.projectIds.length > 0) {
                await Promise.all(
                    data.projectIds.map((projectId: string) =>
                        prisma.developerProject.create({
                            data: {
                                developerId: developer.id,
                                projectId,
                            },
                        })
                    )
                );
            }

            return developer;
        } catch (error) {
            console.error('Error creating developer:', error);
            throw error;
        }
    });

    // Update developer
    ipcMain.handle('developers:update', async (_, id: string, data: any) => {
        try {
            const developer = await prisma.developer.update({
                where: { id },
                data: {
                    fullName: data.fullName,
                    email: data.email,
                    skills: data.skills ? JSON.stringify(data.skills) : undefined,
                    seniorityLevel: data.seniorityLevel,
                },
            });

            // Update project assignments if provided
            if (data.projectIds) {
                // Remove existing assignments
                await prisma.developerProject.deleteMany({
                    where: { developerId: id },
                });

                // Add new assignments
                await Promise.all(
                    data.projectIds.map((projectId: string) =>
                        prisma.developerProject.create({
                            data: {
                                developerId: id,
                                projectId,
                            },
                        })
                    )
                );
            }

            return developer;
        } catch (error) {
            console.error('Error updating developer:', error);
            throw error;
        }
    });

    // Delete developer
    ipcMain.handle('developers:delete', async (_, id: string) => {
        try {
            await prisma.developer.delete({
                where: { id },
            });

            return { success: true };
        } catch (error) {
            console.error('Error deleting developer:', error);
            throw error;
        }
    });

    // Get developer productivity score
    ipcMain.handle('developers:getProductivityScore', async (_, id: string, timeframe?: any) => {
        try {
            const developer = await prisma.developer.findUnique({
                where: { id },
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

            if (!developer) {
                throw new Error('Developer not found');
            }

            // Calculate productivity score
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
                score: Math.max(0, productivityScore).toFixed(2),
                resolvedCount: resolvedIssues.length,
                recurringCount: recurringBugs,
                avgFixQuality: resolvedIssues.reduce((acc, i) => acc + (i.fixQuality || 0), 0) / (resolvedIssues.length || 1),
                totalHours: totalTimeSpent,
            };
        } catch (error) {
            console.error('Error calculating productivity score:', error);
            throw error;
        }
    });
}
