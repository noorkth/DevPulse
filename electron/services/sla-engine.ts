/**
 * SLA Engine Service
 * Calculates deadlines, detects breaches, and manages SLA status for SharedIssues.
 */

import { getPrisma } from '../prisma';

export interface SlaDeadlines {
    responseDeadline: Date;
    resolutionDeadline: Date;
}

export type SlaStatus = 'on-track' | 'at-risk' | 'breached';

// SLA rules per contract (all times in calendar hours)
// 'moderate' and 'low' are stored as 'medium'/'low' in DB
const DEFAULT_RULES: Record<string, { responseTimeHours: number; resolutionTimeHours: number; atRiskThreshold: number }> = {
    critical: { responseTimeHours: 1, resolutionTimeHours: 6, atRiskThreshold: 0.8 }, // L-3: 1h / 6h
    high: { responseTimeHours: 6, resolutionTimeHours: 36, atRiskThreshold: 0.8 }, // L-3: 6h / 36h
    medium: { responseTimeHours: 18, resolutionTimeHours: 48, atRiskThreshold: 0.8 }, // L-2 Moderate: 18h / ~2 business days
    low: { responseTimeHours: 48, resolutionTimeHours: 168, atRiskThreshold: 0.8 }, // L-1 Low: ~2 biz days / 1 week
};

export class SlaEngine {
    /**
     * Calculate SLA deadlines for a new SharedIssue based on severity.
     */
    static async calculateDeadlines(severity: string, raisedAt: Date = new Date()): Promise<SlaDeadlines> {
        const prisma = getPrisma();
        let rule;

        try {
            rule = await prisma.slaRule.findUnique({ where: { severity } });
        } catch {
            // Fallback if table not ready
        }

        const config = rule ?? DEFAULT_RULES[severity] ?? DEFAULT_RULES.medium;

        const responseDeadline = new Date(raisedAt.getTime() + config.responseTimeHours * 60 * 60 * 1000);
        const resolutionDeadline = new Date(raisedAt.getTime() + config.resolutionTimeHours * 60 * 60 * 1000);

        return { responseDeadline, resolutionDeadline };
    }

    /**
     * Check the current SLA status of an issue.
     */
    static checkStatus(
        resolutionDeadline: Date,
        atRiskThreshold: number = 0.8,
        slaStartedAt: Date,
        resolvedAt?: Date | null
    ): SlaStatus {
        const now = resolvedAt ?? new Date();

        if (now >= resolutionDeadline) return 'breached';

        const totalWindowMs = resolutionDeadline.getTime() - slaStartedAt.getTime();
        const elapsedMs = now.getTime() - slaStartedAt.getTime();
        const pctConsumed = elapsedMs / totalWindowMs;

        if (pctConsumed >= atRiskThreshold) return 'at-risk';

        return 'on-track';
    }

    /**
     * Scan all open SharedIssues and update their SLA status.
     * Called by the background scheduler every 15 minutes.
     */
    static async runSlaMonitor(): Promise<{ updated: number; breached: number; atRisk: number }> {
        const prisma = getPrisma();

        const openIssues = await prisma.sharedIssue.findMany({
            where: {
                status: { in: ['open', 'in-progress'] },
                slaStartedAt: { not: null },   // Only monitor acknowledged issues
                resolutionDeadline: { not: null },
            },
        });

        let updated = 0, breached = 0, atRisk = 0;

        for (const issue of openIssues) {
            if (!issue.resolutionDeadline || !issue.slaStartedAt) continue;

            // Get atRiskThreshold from SLA rule
            let threshold = 0.8;
            try {
                const rule = await prisma.slaRule.findUnique({ where: { severity: issue.severity } });
                if (rule) threshold = rule.atRiskThreshold;
            } catch { /* use default */ }

            const newStatus = SlaEngine.checkStatus(
                issue.resolutionDeadline,
                threshold,
                issue.slaStartedAt  // Use SLA start time, not issue creation time
            );

            if (newStatus !== issue.slaStatus) {
                await prisma.sharedIssue.update({
                    where: { id: issue.id },
                    data: { slaStatus: newStatus },
                });

                // Log activity for SLA breach
                if (newStatus === 'breached' || newStatus === 'at-risk') {
                    await prisma.sharedIssueActivity.create({
                        data: {
                            sharedIssueId: issue.id,
                            userId: issue.assignedOwnerId,
                            activityType: newStatus === 'breached' ? 'sla_breached' : 'sla_at_risk',
                            details: JSON.stringify({ previous: issue.slaStatus, current: newStatus }),
                        },
                    });
                }

                updated++;
                if (newStatus === 'breached') breached++;
                if (newStatus === 'at-risk') atRisk++;
            }
        }

        console.log(`[SlaEngine] Monitor run complete — updated: ${updated}, breached: ${breached}, at-risk: ${atRisk}`);
        return { updated, breached, atRisk };
    }

    /**
     * Get SLA metrics for a client over a given period.
     */
    static async getMetrics(clientId: string, startDate: Date, endDate: Date) {
        const prisma = getPrisma();

        const issues = await prisma.sharedIssue.findMany({
            where: {
                clientId,
                raisedAt: { gte: startDate, lte: endDate },
            },
        });

        const total = issues.length;
        const breached = issues.filter(i => i.slaStatus === 'breached').length;
        const atRisk = issues.filter(i => i.slaStatus === 'at-risk').length;
        const onTrack = issues.filter(i => i.slaStatus === 'on-track').length;
        const resolved = issues.filter(i => i.status === 'resolved' || i.status === 'closed').length;

        const compliancePct = total > 0 ? ((total - breached) / total) * 100 : 100;

        return {
            total,
            breached,
            atRisk,
            onTrack,
            resolved,
            compliancePct: Math.round(compliancePct * 10) / 10,
        };
    }

    /**
     * Seed default SLA rules into the database.
     */
    static async seedDefaultRules(): Promise<void> {
        const prisma = getPrisma();

        const defaults = [
            { severity: 'critical', responseTimeHours: 1, resolutionTimeHours: 6, atRiskThreshold: 0.8 },
            { severity: 'high', responseTimeHours: 6, resolutionTimeHours: 36, atRiskThreshold: 0.8 },
            { severity: 'medium', responseTimeHours: 18, resolutionTimeHours: 48, atRiskThreshold: 0.8 },
            { severity: 'low', responseTimeHours: 48, resolutionTimeHours: 168, atRiskThreshold: 0.8 },
        ];

        for (const rule of defaults) {
            await prisma.slaRule.upsert({
                where: { severity: rule.severity },
                update: {
                    responseTimeHours: rule.responseTimeHours,
                    resolutionTimeHours: rule.resolutionTimeHours,
                    atRiskThreshold: rule.atRiskThreshold,
                },
                create: rule,
            });
        }

        console.log('[SlaEngine] SLA rules seeded from contract.');
    }
}
