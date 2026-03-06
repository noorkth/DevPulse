import { SlaEngine } from '../services/sla-engine';
import { Notification } from 'electron';

let slaMonitorInterval: NodeJS.Timeout | null = null;
let weeklySnapshotJob: NodeJS.Timeout | null = null;

/** Track which issue IDs we've already sent alerts for (reset on app restart) */
const alertedIssueIds = new Set<string>();

async function dispatchSlaAlerts(): Promise<void> {
    try {
        const { getPrisma } = await import('../prisma');
        const prisma = getPrisma();

        const atRiskOrBreached = await prisma.sharedIssue.findMany({
            where: {
                status: { notIn: ['resolved', 'closed'] },
                slaStatus: { in: ['at-risk', 'breached'] },
            },
            include: {
                client: { select: { name: true } },
            },
        });

        for (const issue of atRiskOrBreached) {
            const alertKey = `${issue.id}-${issue.slaStatus}`;
            if (alertedIssueIds.has(alertKey)) continue;
            alertedIssueIds.add(alertKey);

            const isBreached = issue.slaStatus === 'breached';
            const notification = new Notification({
                title: isBreached ? '🔴 SLA Breached' : '🟡 SLA At Risk',
                body: `[${issue.client.name}] ${issue.title.slice(0, 80)}`,
                urgency: isBreached ? 'critical' : 'normal',
            });
            notification.show();
            console.log(`[GovernanceScheduler] SLA alert sent for issue: ${issue.title} (${issue.slaStatus})`);
        }
    } catch (e) {
        console.warn('[GovernanceScheduler] Alert dispatch error:', e);
    }
}

export async function startGovernanceScheduler(): Promise<void> {
    console.log('🏛️  Starting governance scheduler...');

    // Seed SLA rules on startup (safe to re-run, uses upsert)
    try {
        await SlaEngine.seedDefaultRules();
    } catch (e) {
        console.warn('[GovernanceScheduler] Could not seed SLA rules:', e);
    }

    // SLA Monitor — run every 15 minutes
    slaMonitorInterval = setInterval(async () => {
        try {
            const result = await SlaEngine.runSlaMonitor();
            if (result.updated > 0) {
                console.log(`[GovernanceScheduler] SLA monitor: ${result.breached} breached, ${result.atRisk} at-risk`);
            }
            // Dispatch desktop notifications for breaches / at-risk
            await dispatchSlaAlerts();
        } catch (e) {
            console.error('[GovernanceScheduler] SLA monitor error:', e);
        }
    }, 15 * 60 * 1000); // 15 minutes

    // Also run alerts once on startup
    await dispatchSlaAlerts();

    // Weekly health snapshots — run once on startup, then every 7 days
    await runWeeklySnapshots();
    weeklySnapshotJob = setInterval(runWeeklySnapshots, 7 * 24 * 60 * 60 * 1000);

    console.log('✅ Governance scheduler started');
}

async function runWeeklySnapshots(): Promise<void> {
    try {
        const { getPrisma } = await import('../prisma');
        const prisma = getPrisma();
        const { startOfWeek } = await import('date-fns');

        // Only run if it's Monday (day = 1)
        const today = new Date();
        if (today.getDay() !== 1) return;

        const clients = await prisma.client.findMany({ select: { id: true, name: true } });

        for (const client of clients) {
            try {
                const weekStart = startOfWeek(today);
                const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);

                const { SlaEngine: engine } = await import('../services/sla-engine');
                const slaMetrics = await engine.getMetrics(client.id, weekStart, weekEnd);

                const escalations = await prisma.sharedIssue.count({
                    where: { clientId: client.id, raisedAt: { gte: weekStart }, escalationLevel: { gt: 0 } },
                });

                const preventiveActions = await prisma.monitoringChecklist.count({
                    where: { clientId: client.id, completedAt: { gte: weekStart } },
                });

                const stabilityScore = Math.max(0,
                    100 - (slaMetrics.breached * 10) - (escalations * 5)
                );

                await prisma.clientHealthScore.upsert({
                    where: { clientId_weekStart: { clientId: client.id, weekStart } },
                    update: {
                        weekEnd,
                        openIssues: slaMetrics.total - slaMetrics.resolved,
                        resolvedIssues: slaMetrics.resolved,
                        slaBreaches: slaMetrics.breached,
                        escalations,
                        preventiveActions,
                        slaCompliancePct: slaMetrics.compliancePct,
                        stabilityScore,
                    },
                    create: {
                        clientId: client.id,
                        weekStart,
                        weekEnd,
                        openIssues: slaMetrics.total - slaMetrics.resolved,
                        resolvedIssues: slaMetrics.resolved,
                        slaBreaches: slaMetrics.breached,
                        escalations,
                        preventiveActions,
                        slaCompliancePct: slaMetrics.compliancePct,
                        stabilityScore,
                    },
                });

                console.log(`[GovernanceScheduler] Snapshot generated for ${client.name}`);
            } catch (e) {
                console.error(`[GovernanceScheduler] Snapshot failed for ${client.name}:`, e);
            }
        }
    } catch (e) {
        console.error('[GovernanceScheduler] Weekly snapshot error:', e);
    }
}

export function stopGovernanceScheduler(): void {
    if (slaMonitorInterval) {
        clearInterval(slaMonitorInterval);
        slaMonitorInterval = null;
    }
    if (weeklySnapshotJob) {
        clearInterval(weeklySnapshotJob);
        weeklySnapshotJob = null;
    }
    console.log('🛑 Governance scheduler stopped');
}
