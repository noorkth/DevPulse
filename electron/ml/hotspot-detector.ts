import { getPrisma } from '../prisma';

interface Hotspot {
    id: string;
    name: string;
    type: 'feature' | 'project';
    bugCount: number;
    bugDensity: number;
    recurringRate: number;
    criticalCount: number;
    riskScore: number;
    trend: 'increasing' | 'stable' | 'decreasing';
    recommendation: string;
}

export class HotspotDetector {
    /**
     * Detect bug hotspots across features
     */
    static async detectHotspots(): Promise<Hotspot[]> {
        const prisma = getPrisma();

        try {
            // Get features with their issues
            const features = await prisma.feature.findMany({
                include: {
                    issues: true,
                    project: true,
                },
            });

            const hotspots: Hotspot[] = [];

            for (const feature of features) {
                const bugs = feature.issues;

                // Skip if no bugs
                if (bugs.length === 0) continue;

                // Calculate age in days
                const daysSinceCreation = Math.max(
                    1,
                    (Date.now() - feature.createdAt.getTime()) / (1000 * 60 * 60 * 24)
                );

                // Count metrics
                const recurringBugs = bugs.filter(b => b.isRecurring).length;
                const criticalBugs = bugs.filter(b => b.severity === 'critical').length;
                const highBugs = bugs.filter(b => b.severity === 'high').length;
                const openBugs = bugs.filter(b => ['open', 'in_progress'].includes(b.status)).length;

                // Calculate bug density (bugs per day)
                const bugDensity = bugs.length / daysSinceCreation;

                // Calculate recurrence rate
                const recurringRate = bugs.length > 0 ? recurringBugs / bugs.length : 0;

                // Calculate risk score (0-100)
                let riskScore = 0;
                riskScore += bugDensity * 10; // Bug frequency
                riskScore += recurringRate * 30; // Recurrence penalty
                riskScore += criticalBugs * 15; // Critical bugs
                riskScore += highBugs * 8; // High bugs
                riskScore += (openBugs / bugs.length) * 20; // Open issue ratio

                riskScore = Math.min(100, Math.round(riskScore));

                // Determine trend
                const trend = await this.calculateTrend(feature.id);

                // Generate recommendation
                const recommendation = this.generateRecommendation(
                    riskScore,
                    recurringRate,
                    criticalBugs,
                    trend
                );

                // Only include significant hotspots
                if (riskScore > 15 || criticalBugs > 0) {
                    hotspots.push({
                        id: feature.id,
                        name: feature.name,
                        type: 'feature',
                        bugCount: bugs.length,
                        bugDensity: Math.round(bugDensity * 100) / 100,
                        recurringRate: Math.round(recurringRate * 100) / 100,
                        criticalCount: criticalBugs,
                        riskScore,
                        trend,
                        recommendation,
                    });
                }
            }

            // Sort by risk score (highest first)
            return hotspots.sort((a, b) => b.riskScore - a.riskScore);
        } catch (error) {
            console.error('Hotspot detection error:', error);
            return [];
        }
    }

    /**
     * Calculate trend direction (last 30 days vs previous 30)
     */
    private static async calculateTrend(
        featureId: string
    ): Promise<'increasing' | 'stable' | 'decreasing'> {
        const prisma = getPrisma();

        try {
            const now = new Date();
            const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

            const recentBugs = await prisma.issue.count({
                where: {
                    featureId,
                    createdAt: { gte: thirtyDaysAgo },
                },
            });

            const previousBugs = await prisma.issue.count({
                where: {
                    featureId,
                    createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
                },
            });

            // Increasing if 20% more bugs
            if (recentBugs > previousBugs * 1.2) return 'increasing';

            // Decreasing if 20% fewer bugs
            if (recentBugs < previousBugs * 0.8) return 'decreasing';

            return 'stable';
        } catch (error) {
            return 'stable';
        }
    }

    /**
     * Generate actionable recommendation
     */
    private static generateRecommendation(
        riskScore: number,
        recurringRate: number,
        criticalCount: number,
        trend: string
    ): string {
        if (criticalCount >= 3) {
            return '🚨 URGENT: Multiple critical bugs detected. Immediate code review required.';
        }

        if (criticalCount > 0) {
            return '🔴 Critical bugs present. Priority attention needed.';
        }

        if (riskScore > 70 && trend === 'increasing') {
            return '⚠️ High risk and increasing. Consider refactoring and comprehensive testing.';
        }

        if (riskScore > 60) {
            return '⚠️ High risk area. Schedule code review and address technical debt.';
        }

        if (recurringRate > 0.4) {
            return '🔄 High recurrence rate. Root cause analysis recommended.';
        }

        if (riskScore > 40) {
            return '⚡ Moderate risk. Monitor closely and plan improvements.';
        }

        if (trend === 'increasing') {
            return '📈 Bug rate increasing. Review recent changes.';
        }

        return '✅ Acceptable risk level. Continue regular monitoring.';
    }
}
