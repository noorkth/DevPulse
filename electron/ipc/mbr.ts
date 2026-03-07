import { ipcMain, dialog } from 'electron';
import fs from 'fs';
import { getPrisma } from '../prisma';
import { startOfMonth } from 'date-fns';
import { getActor, assertCanMutate } from '../utils/roleGuard';

export function setupMbrHandlers() {
    const prisma = getPrisma();

    ipcMain.handle('mbr:getAll', async (_, clientId?: string) => {
        return prisma.monthlyBusinessReview.findMany({
            where: clientId ? { clientId } : {},
            include: {
                client: { select: { id: true, name: true } },
                createdBy: { select: { id: true, fullName: true } },
            },
            orderBy: { reviewMonth: 'desc' },
        });
    });

    ipcMain.handle('mbr:getById', async (_, id: string) => {
        return prisma.monthlyBusinessReview.findUnique({
            where: { id },
            include: {
                client: true,
                createdBy: { select: { fullName: true, email: true } },
            },
        });
    });

    ipcMain.handle('mbr:create', async (_, data: {
        clientId: string;
        createdById: string;
        reviewMonth: string;
        uptimePct?: number;
        downtimeMinutes?: number;
        performanceSummary?: string;
        revenueImpact?: string;
        subscriberImpact?: number;
        improvementRoadmap?: string;
        featureRequests?: string[];
        totalIssues?: number;
        resolvedIssues?: number;
        slaCompliancePct?: number;
        escalationCount?: number;
    }) => {
        const actor = await getActor(data.createdById);
        assertCanMutate(actor, data.clientId);

        const reviewMonth = startOfMonth(new Date(data.reviewMonth));

        return prisma.monthlyBusinessReview.upsert({
            where: { clientId_reviewMonth: { clientId: data.clientId, reviewMonth } },
            update: {
                uptimePct: data.uptimePct,
                downtimeMinutes: data.downtimeMinutes,
                performanceSummary: data.performanceSummary,
                revenueImpact: data.revenueImpact,
                subscriberImpact: data.subscriberImpact,
                improvementRoadmap: data.improvementRoadmap,
                featureRequests: data.featureRequests ? JSON.stringify(data.featureRequests) : undefined,
                totalIssues: data.totalIssues,
                resolvedIssues: data.resolvedIssues,
                slaCompliancePct: data.slaCompliancePct,
                escalationCount: data.escalationCount,
            },
            create: {
                clientId: data.clientId,
                createdById: data.createdById,
                reviewMonth,
                uptimePct: data.uptimePct ?? null,
                downtimeMinutes: data.downtimeMinutes ?? null,
                performanceSummary: data.performanceSummary ?? null,
                revenueImpact: data.revenueImpact ?? null,
                subscriberImpact: data.subscriberImpact ?? null,
                improvementRoadmap: data.improvementRoadmap ?? null,
                featureRequests: data.featureRequests ? JSON.stringify(data.featureRequests) : null,
                totalIssues: data.totalIssues ?? null,
                resolvedIssues: data.resolvedIssues ?? null,
                slaCompliancePct: data.slaCompliancePct ?? null,
                escalationCount: data.escalationCount ?? null,
                status: 'draft',
            },
            include: {
                client: { select: { name: true } },
                createdBy: { select: { fullName: true } },
            },
        });
    });

    ipcMain.handle('mbr:update', async (_, id: string, data: any, updatedById: string) => {
        const existing = await prisma.monthlyBusinessReview.findUnique({ where: { id } });
        if (!existing) throw new Error('MBR not found');

        const actor = await getActor(updatedById);
        assertCanMutate(actor, existing.clientId);
        return prisma.monthlyBusinessReview.update({
            where: { id },
            data: {
                uptimePct: data.uptimePct,
                downtimeMinutes: data.downtimeMinutes,
                performanceSummary: data.performanceSummary,
                revenueImpact: data.revenueImpact,
                subscriberImpact: data.subscriberImpact,
                improvementRoadmap: data.improvementRoadmap,
                featureRequests: data.featureRequests ? JSON.stringify(data.featureRequests) : undefined,
                totalIssues: data.totalIssues,
                resolvedIssues: data.resolvedIssues,
                slaCompliancePct: data.slaCompliancePct,
                escalationCount: data.escalationCount,
            },
        });
    });

    ipcMain.handle('mbr:publish', async (_, id: string, publishedById: string) => {
        const existing = await prisma.monthlyBusinessReview.findUnique({ where: { id } });
        if (!existing) throw new Error('MBR not found');

        const actor = await getActor(publishedById);
        if (actor.role !== 'admin' && actor.role !== 'manager') {
            throw new Error(`Permission denied: role "${actor.role}" cannot publish MBRs.`);
        }
        return prisma.monthlyBusinessReview.update({
            where: { id },
            data: { status: 'published' },
        });
    });

    ipcMain.handle('mbr:delete', async (_, id: string, deletedById: string) => {
        const actor = await getActor(deletedById);
        if (actor.role !== 'admin' && actor.role !== 'manager') {
            throw new Error(`Permission denied: role "${actor.role}" cannot delete MBRs.`);
        }
        return prisma.monthlyBusinessReview.delete({ where: { id } });
    });

    // Auto-populate MBR metrics from SharedIssue data for a given client/month
    ipcMain.handle('mbr:autoPopulate', async (_, clientId: string, reviewMonthStr: string) => {
        const reviewMonth = startOfMonth(new Date(reviewMonthStr));
        const monthEnd = new Date(reviewMonth.getFullYear(), reviewMonth.getMonth() + 1, 0, 23, 59, 59);

        const issues = await prisma.sharedIssue.findMany({
            where: {
                clientId,
                raisedAt: { gte: reviewMonth, lte: monthEnd },
            },
        });

        const total = issues.length;
        const resolved = issues.filter(i => i.status === 'resolved' || i.status === 'closed').length;
        const breached = issues.filter(i => i.slaStatus === 'breached').length;
        const escalations = issues.filter(i => i.escalationLevel > 0).length;
        const compliancePct = total > 0 ? ((total - breached) / total) * 100 : 100;

        return {
            totalIssues: total,
            resolvedIssues: resolved,
            slaCompliancePct: Math.round(compliancePct * 10) / 10,
            escalationCount: escalations,
        };
    });

    // Native save dialog for PDF export
    ipcMain.handle('mbr:exportPdf', async (_, base64Data: string, suggestedFilename: string) => {
        try {
            const { filePath } = await dialog.showSaveDialog({
                title: 'Save MBR Report',
                defaultPath: suggestedFilename,
                filters: [{ name: 'PDF Documents', extensions: ['pdf'] }]
            });

            if (filePath) {
                // Determine if it includes the data URI prefix or is just base64
                const base64Content = base64Data.includes('base64,')
                    ? base64Data.split('base64,')[1]
                    : base64Data;

                fs.writeFileSync(filePath, Buffer.from(base64Content, 'base64'));
                return { success: true, filePath };
            }
            return { success: false, reason: 'cancelled' };
        } catch (error: any) {
            console.error('Failed to save MBR PDF:', error);
            return { success: false, reason: error.message };
        }
    });

    console.log('✅ MBR handlers registered');
}
