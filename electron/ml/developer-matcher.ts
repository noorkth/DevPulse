import { getPrisma } from '../prisma';

interface DeveloperScore {
    developerId: string;
    developerName: string;
    score: number;
    reasons: string[];
    currentWorkload: number;
    availability: 'high' | 'medium' | 'low';
    estimatedTime?: number;
}

export class DeveloperMatcher {
    /**
     * Recommend best developer(s) for an issue
     */
    static async recommendDeveloper(issueData: {
        severity: string;
        projectId: string;
        featureId?: string;
    }): Promise<DeveloperScore[]> {
        const prisma = getPrisma();

        try {
            // Get all developers working on this project
            const developers = await prisma.developer.findMany({
                include: {
                    issues: {
                        where: {
                            OR: [
                                { status: 'open' },
                                { status: 'in_progress' },
                            ],
                        },
                    },
                    projects: {
                        where: {
                            id: issueData.projectId,
                        },
                    },
                },
            });

            if (developers.length === 0) {
                return [];
            }

            const scores: DeveloperScore[] = [];

            for (const dev of developers) {
                let score = 0;
                const reasons: string[] = [];

                // Factor 1: Project Assignment (30 points)
                const isOnProject = dev.projects.length > 0;
                if (isOnProject) {
                    score += 30;
                    reasons.push('✅ Assigned to this project');
                } else {
                    reasons.push('⚠️ Not on project team');
                }

                // Factor 2: Experience with similar issues (25 points)
                const similarResolvedCount = await prisma.issue.count({
                    where: {
                        assignedToId: dev.id,
                        severity: issueData.severity,
                        status: 'resolved',
                        projectId: issueData.projectId,
                    },
                });

                if (similarResolvedCount > 0) {
                    const performanceScore = Math.min(25, similarResolvedCount * 5);
                    score += performanceScore;
                    reasons.push(`📊 Resolved ${similarResolvedCount} similar ${issueData.severity} issues`);
                }

                // Factor 3: Current Workload (20 points - inverse)
                const currentWorkload = dev.issues.length;
                const workloadScore = Math.max(0, 20 - currentWorkload * 4);
                score += workloadScore;

                let availability: 'high' | 'medium' | 'low' = 'high';
                if (currentWorkload > 5) {
                    availability = 'low';
                    reasons.push('⚠️ Heavy workload (' + currentWorkload + ' active issues)');
                } else if (currentWorkload > 2) {
                    availability = 'medium';
                    reasons.push('⚡ Moderate workload (' + currentWorkload + ' active issues)');
                } else {
                    reasons.push('✅ Available (' + currentWorkload + ' active issues)');
                }

                // Factor 4: Fix Quality (15 points)
                const qualityIssues = await prisma.issue.findMany({
                    where: {
                        assignedToId: dev.id,
                        status: 'resolved',
                        fixQuality: { not: null },
                    },
                    select: { fixQuality: true },
                    take: 20, // Last 20 resolved issues
                });

                if (qualityIssues.length > 0) {
                    const avgQuality =
                        qualityIssues.reduce((sum, i) => sum + (i.fixQuality || 0), 0) /
                        qualityIssues.length;
                    const qualityScore = avgQuality * 3; // 0-15 points
                    score += qualityScore;

                    if (avgQuality >= 4) {
                        reasons.push('⭐ High quality fixes (avg ' + avgQuality.toFixed(1) + '/5)');
                    }
                }

                // Factor 5: Resolution Speed (10 points)
                const avgTime = await this.getAvgResolutionTime(dev.id, issueData.projectId);
                if (avgTime !== null) {
                    if (avgTime < 24) {
                        score += 10;
                        reasons.push('⚡ Fast resolver (avg ' + Math.round(avgTime) + 'h)');
                    } else if (avgTime < 48) {
                        score += 5;
                    }
                }

                scores.push({
                    developerId: dev.id,
                    developerName: dev.fullName,
                    score: Math.round(score),
                    reasons,
                    currentWorkload,
                    availability,
                    estimatedTime: avgTime || undefined,
                });
            }

            // Sort by score (highest first)
            return scores.sort((a, b) => b.score - a.score);
        } catch (error) {
            console.error('Developer matching error:', error);
            return [];
        }
    }

    /**
     * Get average resolution time for developer
     */
    private static async getAvgResolutionTime(
        developerId: string,
        projectId?: string
    ): Promise<number | null> {
        const prisma = getPrisma();

        try {
            const where: any = {
                assignedToId: developerId,
                status: 'resolved',
                resolutionTime: { not: null },
            };

            if (projectId) {
                where.projectId = projectId;
            }

            const resolved = await prisma.issue.findMany({
                where,
                select: { resolutionTime: true },
                take: 20, // Last 20 issues
                orderBy: { resolvedAt: 'desc' },
            });

            if (resolved.length === 0) return null;

            const total = resolved.reduce((sum, i) => sum + (i.resolutionTime || 0), 0);
            return total / resolved.length;
        } catch (error) {
            return null;
        }
    }
}
