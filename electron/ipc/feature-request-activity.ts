import { ipcMain } from 'electron';
import { getPrisma } from '../prisma';
import { getActor } from '../utils/roleGuard';

export function setupFeatureRequestActivityHandlers() {
    const prisma = getPrisma();

    ipcMain.handle('featureRequests:getActivities', async (_, featureRequestId: string) => {
        return prisma.featureRequestActivity.findMany({
            where: { featureRequestId },
            include: { user: true },
            orderBy: { createdAt: 'desc' },
        });
    });

    ipcMain.handle('featureRequests:getComments', async (_, featureRequestId: string) => {
        return prisma.featureRequestComment.findMany({
            where: { featureRequestId },
            include: { author: true },
            orderBy: { createdAt: 'asc' },
        });
    });

    ipcMain.handle('featureRequests:addComment', async (_, featureRequestId: string, authorId: string, text: string) => {
        const actor = await getActor(authorId);

        const comment = await prisma.featureRequestComment.create({
            data: {
                featureRequestId,
                authorId: actor.id,
                text,
            },
        });

        // Also log an activity for adding a comment
        await prisma.featureRequestActivity.create({
            data: {
                featureRequestId,
                userId: actor.id,
                activityType: 'commented',
            }
        });

        return comment;
    });

    console.log('✅ Feature Request Activity handlers registered');
}
