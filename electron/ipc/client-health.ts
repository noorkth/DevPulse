import { ipcMain } from 'electron';
import { getPrisma } from '../prisma';
import { SlaEngine } from '../services/sla-engine';
import { startOfWeek, endOfWeek, subWeeks } from 'date-fns';

export function setupClientHealthHandlers() {
    const prisma = getPrisma();

    // Get health dashboard summary for all clients (or a specific one)
    ipcMain.handle('clientHealth:getDashboard', async (_, clientId?: string) => {
        const clientFilter = clientId ? { id: clientId } : {};

        const clients = await prisma.client.findMany({
            where: clientFilter,
            include: {
                sharedIssues: {
                    where: { status: { in: ['open', 'in-progress'] } },
                },
            },
        });

        const dashboards = await Promise.all(clients.map(async (client) => {
            const allIssues = await prisma.sharedIssue.findMany({
                where: { clientId: client.id },
            });

            const open = allIssues.filter(i => i.status === 'open' || i.status === 'in-progress').length;
            const resolved = allIssues.filter(i => i.status === 'resolved' || i.status === 'closed').length;
            const slaBreaches = allIssues.filter(i => i.slaStatus === 'breached').length;
            const escalations = allIssues.filter(i => i.escalationLevel > 0).length;
            const total = allIssues.length;

            const compliance = total > 0 ? ((total - slaBreaches) / total) * 100 : 100;

            // Latest health score
            const latestScore = await prisma.clientHealthScore.findFirst({
                where: { clientId: client.id },
                orderBy: { weekStart: 'desc' },
            });

            // Monitoring checklists done this week
            const weekStart = startOfWeek(new Date());
            const preventiveActions = await prisma.monitoringChecklist.count({
                where: {
                    clientId: client.id,
                    completedAt: { gte: weekStart },
                },
            });

            return {
                clientId: client.id,
                clientName: client.name,
                openIssues: open,
                resolvedIssues: resolved,
                slaBreaches,
                escalations,
                slaCompliancePct: Math.round(compliance * 10) / 10,
                stabilityScore: latestScore?.stabilityScore ?? 100,
                preventiveActions,
            };
        }));

        return dashboards;
    });

    // Get week-by-week health history for a client
    ipcMain.handle('clientHealth:getHistory', async (_, clientId: string, weeks: number = 8) => {
        return prisma.clientHealthScore.findMany({
            where: { clientId },
            orderBy: { weekStart: 'desc' },
            take: weeks,
        });
    });

    // Get incident frequency trend (issues raised per week)
    ipcMain.handle('clientHealth:getIncidentTrend', async (_, clientId: string, weeks: number = 8) => {
        const results = [];
        const now = new Date();

        for (let i = weeks - 1; i >= 0; i--) {
            const weekEnd = endOfWeek(subWeeks(now, i));
            const weekStart = startOfWeek(subWeeks(now, i));

            const count = await prisma.sharedIssue.count({
                where: {
                    clientId,
                    raisedAt: { gte: weekStart, lte: weekEnd },
                },
            });

            const breachCount = await prisma.sharedIssue.count({
                where: {
                    clientId,
                    raisedAt: { gte: weekStart, lte: weekEnd },
                    slaStatus: 'breached',
                },
            });

            results.push({
                week: weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                incidents: count,
                breaches: breachCount,
            });
        }

        return results;
    });

    // Generate (or update) weekly health snapshot for a client
    ipcMain.handle('clientHealth:generateSnapshot', async (_, clientId: string) => {
        const weekStart = startOfWeek(new Date());
        const weekEnd = endOfWeek(new Date());

        const slaMetrics = await SlaEngine.getMetrics(clientId, weekStart, weekEnd);

        const escalations = await prisma.sharedIssue.count({
            where: {
                clientId,
                raisedAt: { gte: weekStart },
                escalationLevel: { gt: 0 },
            },
        });

        const preventiveActions = await prisma.monitoringChecklist.count({
            where: { clientId, completedAt: { gte: weekStart } },
        });

        // Stability score: starts at 100, deducted by SLA breaches and escalations
        const stabilityScore = Math.max(0,
            100 - (slaMetrics.breached * 10) - (escalations * 5)
        );

        return prisma.clientHealthScore.upsert({
            where: { clientId_weekStart: { clientId, weekStart } },
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
                clientId,
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
    });

    console.log('✅ ClientHealth handlers registered');
}
