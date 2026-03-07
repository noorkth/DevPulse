import { ipcMain } from 'electron';
import { getPrisma } from '../prisma';
import { getActor, assertCanMutate, scopeClientId } from '../utils/roleGuard';

export function setupFeatureRequestHandlers() {
    const prisma = getPrisma();

    ipcMain.handle('featureRequests:getAll', async (_, clientId?: string, requestedById?: string) => {
        let filter: any = {};
        if (requestedById) {
            const actor = await getActor(requestedById);
            filter.clientId = scopeClientId(actor, clientId);
        } else if (clientId) {
            filter.clientId = clientId;
        }

        return prisma.featureRequest.findMany({
            where: filter,
            include: {
                client: true,
                project: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    });

    ipcMain.handle('featureRequests:create', async (_, data: any, createdById: string) => {
        const actor = await getActor(createdById);
        assertCanMutate(actor, data.clientId);
        return prisma.featureRequest.create({
            data: {
                title: data.title,
                description: data.description,
                status: data.status || 'requested',
                priority: data.priority || 'medium',
                clientId: data.clientId,
                internalProjectId: data.internalProjectId,
            },
        });
    });

    ipcMain.handle('featureRequests:update', async (_, id: string, data: any, updatedById: string) => {
        const existing = await prisma.featureRequest.findUnique({ where: { id } });
        if (!existing) throw new Error('Feature Request not found');

        const actor = await getActor(updatedById);
        assertCanMutate(actor, existing.clientId);

        return prisma.featureRequest.update({
            where: { id },
            data: {
                title: data.title,
                description: data.description,
                status: data.status,
                priority: data.priority,
                internalProjectId: data.internalProjectId,
            },
        });
    });

    ipcMain.handle('featureRequests:delete', async (_, id: string, deletedById: string) => {
        const actor = await getActor(deletedById);
        if (actor.role !== 'admin' && actor.role !== 'manager') {
            throw new Error(`Permission denied: role "${actor.role}" cannot delete Feature Requests.`);
        }
        return prisma.featureRequest.delete({ where: { id } });
    });

    console.log('✅ Feature Request handlers registered');
}
