import { ipcMain } from 'electron';
import { getPrisma } from '../prisma';
import { getActor, assertCanMutate, scopeClientId } from '../utils/roleGuard';

export function setupMonitoringChecklistHandlers() {
    const prisma = getPrisma();

    ipcMain.handle('monitoring:getAll', async (_, clientId?: string, requesterId?: string) => {
        const effectiveClientId = requesterId
            ? scopeClientId(await getActor(requesterId), clientId)
            : clientId;
        return prisma.monitoringChecklist.findMany({
            where: effectiveClientId ? { clientId: effectiveClientId } : {},
            include: {
                client: { select: { id: true, name: true } },
                owner: { select: { id: true, fullName: true } },
            },
            orderBy: { checkDate: 'desc' },
        });
    });

    ipcMain.handle('monitoring:getById', async (_, id: string) => {
        return prisma.monitoringChecklist.findUnique({
            where: { id },
            include: {
                client: true,
                owner: { select: { fullName: true, email: true } },
            },
        });
    });

    ipcMain.handle('monitoring:create', async (_, data: {
        clientId: string;
        ownerId: string;
        checkDate: string;
        channelUptime?: boolean;
        channelObservation?: string;
        geoIpValidation?: boolean;
        geoIpObservation?: string;
        stbAudit?: boolean;
        stbObservation?: string;
        techHealthCheck?: boolean;
        techObservation?: string;
        streamingQuality?: boolean;
        streamingObservation?: string;
        recommendations?: string;
    }) => {
        const actor = await getActor(data.ownerId);
        assertCanMutate(actor, data.clientId);
        return prisma.monitoringChecklist.create({
            data: {
                clientId: data.clientId,
                ownerId: data.ownerId,
                checkDate: new Date(data.checkDate),
                channelUptime: data.channelUptime ?? false,
                channelObservation: data.channelObservation ?? null,
                geoIpValidation: data.geoIpValidation ?? false,
                geoIpObservation: data.geoIpObservation ?? null,
                stbAudit: data.stbAudit ?? false,
                stbObservation: data.stbObservation ?? null,
                techHealthCheck: data.techHealthCheck ?? false,
                techObservation: data.techObservation ?? null,
                streamingQuality: data.streamingQuality ?? false,
                streamingObservation: data.streamingObservation ?? null,
                recommendations: data.recommendations ?? null,
            },
            include: {
                client: { select: { name: true } },
                owner: { select: { fullName: true } },
            },
        });
    });

    ipcMain.handle('monitoring:update', async (_, id: string, data: any, updatedById: string) => {
        const existing = await prisma.monitoringChecklist.findUnique({ where: { id } });
        if (!existing) throw new Error('Checklist not found');

        const actor = await getActor(updatedById);
        assertCanMutate(actor, existing.clientId);
        return prisma.monitoringChecklist.update({
            where: { id },
            data: {
                channelUptime: data.channelUptime,
                channelObservation: data.channelObservation,
                geoIpValidation: data.geoIpValidation,
                geoIpObservation: data.geoIpObservation,
                stbAudit: data.stbAudit,
                stbObservation: data.stbObservation,
                techHealthCheck: data.techHealthCheck,
                techObservation: data.techObservation,
                streamingQuality: data.streamingQuality,
                streamingObservation: data.streamingObservation,
                recommendations: data.recommendations,
            },
        });
    });

    // Mark checklist as fully completed
    ipcMain.handle('monitoring:complete', async (_, id: string, completedById: string) => {
        const checklist = await prisma.monitoringChecklist.findUnique({ where: { id } });
        if (!checklist) throw new Error('Checklist not found');

        const actor = await getActor(completedById);
        assertCanMutate(actor, checklist.clientId);

        // All 5 items must be checked
        const allChecked = checklist.channelUptime && checklist.geoIpValidation
            && checklist.stbAudit && checklist.techHealthCheck && checklist.streamingQuality;

        if (!allChecked) {
            throw new Error('All checklist items must be completed before marking as done');
        }

        return prisma.monitoringChecklist.update({
            where: { id },
            data: { completedAt: new Date() },
        });
    });

    ipcMain.handle('monitoring:delete', async (_, id: string, deletedById: string) => {
        const actor = await getActor(deletedById);
        if (actor.role !== 'admin' && actor.role !== 'manager') {
            throw new Error(`Permission denied: role "${actor.role}" cannot delete monitoring checklists.`);
        }
        return prisma.monitoringChecklist.delete({ where: { id } });
    });

    // Get checklist completion stats for a client
    ipcMain.handle('monitoring:getStats', async (_, clientId: string) => {
        const total = await prisma.monitoringChecklist.count({ where: { clientId } });
        const completed = await prisma.monitoringChecklist.count({
            where: { clientId, completedAt: { not: null } },
        });

        return {
            total,
            completed,
            pending: total - completed,
            completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
        };
    });

    console.log('✅ Monitoring checklist handlers registered');
}
