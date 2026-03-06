import { ipcMain } from 'electron';
import { getPrisma } from '../prisma';
import { SlaEngine } from '../services/sla-engine';

export function setupSlaHandlers() {
    const prisma = getPrisma();

    // Get all SLA rules
    ipcMain.handle('sla:getRules', async () => {
        return prisma.slaRule.findMany({ orderBy: { severity: 'asc' } });
    });

    // Update a SLA rule
    ipcMain.handle('sla:updateRule', async (_, severity: string, data: {
        responseTimeHours: number;
        resolutionTimeHours: number;
        atRiskThreshold?: number;
    }) => {
        return prisma.slaRule.update({
            where: { severity },
            data: {
                responseTimeHours: data.responseTimeHours,
                resolutionTimeHours: data.resolutionTimeHours,
                atRiskThreshold: data.atRiskThreshold ?? 0.8,
            },
        });
    });

    // Get all currently breached issues
    ipcMain.handle('sla:getBreaches', async (_, clientId?: string) => {
        const where: any = { slaStatus: 'breached', status: { in: ['open', 'in-progress'] } };
        if (clientId) where.clientId = clientId;

        return prisma.sharedIssue.findMany({
            where,
            include: {
                client: { select: { id: true, name: true } },
                assignedOwner: { select: { id: true, fullName: true } },
            },
            orderBy: { raisedAt: 'asc' },
        });
    });

    // Get SLA metrics for a client over a period
    ipcMain.handle('sla:getMetrics', async (_, clientId: string, startDate: string, endDate: string) => {
        return SlaEngine.getMetrics(clientId, new Date(startDate), new Date(endDate));
    });

    // Get real-time SLA status for a specific issue
    ipcMain.handle('sla:getStatus', async (_, issueId: string) => {
        const issue = await prisma.sharedIssue.findUnique({ where: { id: issueId } });
        if (!issue || !issue.resolutionDeadline) return null;

        const rule = await prisma.slaRule.findUnique({ where: { severity: issue.severity } });
        const threshold = rule?.atRiskThreshold ?? 0.8;

        const status = SlaEngine.checkStatus(issue.resolutionDeadline, threshold, issue.raisedAt);

        const totalWindowMs = issue.resolutionDeadline.getTime() - issue.raisedAt.getTime();
        const elapsedMs = Date.now() - issue.raisedAt.getTime();
        const pctConsumed = Math.min(100, Math.round((elapsedMs / totalWindowMs) * 100));

        return {
            issueId,
            slaStatus: status,
            pctConsumed,
            responseDeadline: issue.responseDeadline,
            resolutionDeadline: issue.resolutionDeadline,
            firstResponseAt: issue.firstResponseAt,
        };
    });

    // Manually trigger SLA monitor (for testing/admin use)
    ipcMain.handle('sla:runMonitor', async () => {
        return SlaEngine.runSlaMonitor();
    });

    // Get SLA compliance trend (weekly) for a client
    ipcMain.handle('sla:getComplianceTrend', async (_, clientId: string, weeks: number = 8) => {
        const results = [];
        const now = new Date();

        for (let i = weeks - 1; i >= 0; i--) {
            const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
            const weekStart = new Date(weekEnd.getTime() - 7 * 24 * 60 * 60 * 1000);

            const metrics = await SlaEngine.getMetrics(clientId, weekStart, weekEnd);
            const weekLabel = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            results.push({ week: weekLabel, ...metrics });
        }

        return results;
    });

    console.log('✅ SLA handlers registered');
}
