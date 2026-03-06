import { ipcMain } from 'electron';
import { getPrisma } from '../prisma';
import { getActor, assertCanMutate } from '../utils/roleGuard';

export function setupOfficeVisitHandlers() {
    const prisma = getPrisma();

    ipcMain.handle('officeVisits:getAll', async (_, clientId?: string) => {
        return prisma.officeVisit.findMany({
            where: clientId ? { clientId } : {},
            include: {
                client: { select: { id: true, name: true } },
                visitedBy: { select: { id: true, fullName: true } },
            },
            orderBy: { visitDate: 'desc' },
        });
    });

    ipcMain.handle('officeVisits:getById', async (_, id: string) => {
        return prisma.officeVisit.findUnique({
            where: { id },
            include: {
                client: true,
                visitedBy: { select: { id: true, fullName: true, email: true } },
            },
        });
    });

    ipcMain.handle('officeVisits:create', async (_, data: {
        clientId: string;
        visitedById: string;
        visitDate: string;
        agenda?: string;
        attendees?: string[];
        summary?: string;
        actionItems?: string[];
        nextVisitDate?: string;
    }) => {
        const actor = await getActor(data.visitedById);
        assertCanMutate(actor, data.clientId);
        return prisma.officeVisit.create({
            data: {
                clientId: data.clientId,
                visitedById: data.visitedById,
                visitDate: new Date(data.visitDate),
                agenda: data.agenda ?? null,
                attendees: data.attendees ? JSON.stringify(data.attendees) : null,
                summary: data.summary ?? null,
                actionItems: data.actionItems ? JSON.stringify(data.actionItems) : null,
                nextVisitDate: data.nextVisitDate ? new Date(data.nextVisitDate) : null,
            },
            include: {
                client: { select: { name: true } },
                visitedBy: { select: { fullName: true } },
            },
        });
    });

    ipcMain.handle('officeVisits:update', async (_, id: string, data: any) => {
        const existing = await prisma.officeVisit.findUnique({ where: { id } });
        if (!existing) throw new Error('Office visit not found');

        return prisma.officeVisit.update({
            where: { id },
            data: {
                clientId: data.clientId ?? existing.clientId,
                visitedById: data.visitedById ?? existing.visitedById,
                visitDate: data.visitDate ? new Date(data.visitDate) : undefined,
                agenda: data.agenda,
                attendees: data.attendees ? JSON.stringify(data.attendees) : undefined,
                summary: data.summary,
                actionItems: data.actionItems ? JSON.stringify(data.actionItems) : undefined,
                nextVisitDate: data.nextVisitDate ? new Date(data.nextVisitDate) : null,
            },
        });
    });

    ipcMain.handle('officeVisits:delete', async (_, id: string) => {
        return prisma.officeVisit.delete({ where: { id } });
    });

    console.log('✅ OfficeVisit handlers registered');
}

export function setupRelationshipResetHandlers() {
    const prisma = getPrisma();

    ipcMain.handle('resets:getAll', async (_, clientId?: string) => {
        return prisma.relationshipReset.findMany({
            where: clientId ? { clientId } : {},
            include: {
                client: { select: { id: true, name: true } },
                initiatedBy: { select: { id: true, fullName: true } },
            },
            orderBy: { resetDate: 'desc' },
        });
    });

    ipcMain.handle('resets:create', async (_, data: {
        clientId: string;
        initiatedById: string;
        reason: string;
        resetDate: string;
        commitments?: string[];
        reviewDate?: string;
    }) => {
        const actor = await getActor(data.initiatedById);
        assertCanMutate(actor, data.clientId);
        return prisma.relationshipReset.create({
            data: {
                clientId: data.clientId,
                initiatedById: data.initiatedById,
                reason: data.reason,
                resetDate: new Date(data.resetDate),
                commitments: data.commitments ? JSON.stringify(data.commitments) : null,
                reviewDate: data.reviewDate ? new Date(data.reviewDate) : null,
                status: 'active',
            },
            include: {
                client: { select: { name: true } },
                initiatedBy: { select: { fullName: true } },
            },
        });
    });

    ipcMain.handle('resets:update', async (_, id: string, data: any, updatedById: string) => {
        const existing = await prisma.relationshipReset.findUnique({ where: { id } });
        if (!existing) throw new Error('Reset not found');

        const actor = await getActor(updatedById);
        assertCanMutate(actor, existing.clientId);
        return prisma.relationshipReset.update({
            where: { id },
            data: {
                reason: data.reason,
                commitments: data.commitments ? JSON.stringify(data.commitments) : undefined,
                reviewDate: data.reviewDate ? new Date(data.reviewDate) : undefined,
                status: data.status,
            },
        });
    });

    ipcMain.handle('resets:close', async (_, id: string, closedById: string) => {
        const existing = await prisma.relationshipReset.findUnique({ where: { id } });
        if (!existing) throw new Error('Reset not found');

        const actor = await getActor(closedById);
        assertCanMutate(actor, existing.clientId);

        return prisma.relationshipReset.update({
            where: { id },
            data: { status: 'closed' },
        });
    });

    ipcMain.handle('resets:delete', async (_, id: string, deletedById: string) => {
        const actor = await getActor(deletedById);
        if (actor.role !== 'admin' && actor.role !== 'manager') {
            throw new Error(`Permission denied: role "${actor.role}" cannot delete relationship resets.`);
        }
        return prisma.relationshipReset.delete({ where: { id } });
    });

    console.log('✅ RelationshipReset handlers registered');
}
