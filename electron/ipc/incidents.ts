import { ipcMain } from 'electron';
import { getPrisma } from '../prisma';

export function setupIncidentHandlers() {
    const prisma = getPrisma();

    // Get all incident updates for a shared issue
    ipcMain.handle('incidents:getUpdates', async (_, sharedIssueId: string) => {
        return prisma.incidentUpdate.findMany({
            where: { sharedIssueId },
            include: { author: { select: { id: true, fullName: true } } },
            orderBy: { createdAt: 'asc' },
        });
    });

    // Add an incident update (regular update, acknowledgement, or RCA)
    ipcMain.handle('incidents:addUpdate', async (_, data: {
        sharedIssueId: string;
        authorId: string;
        updateText: string;
        isAcknowledgement?: boolean;
        isRca?: boolean;
        rcaFilePath?: string;
        notifiedClient?: boolean;
    }) => {
        const update = await prisma.incidentUpdate.create({
            data: {
                sharedIssueId: data.sharedIssueId,
                authorId: data.authorId,
                updateText: data.updateText,
                isAcknowledgement: data.isAcknowledgement ?? false,
                isRca: data.isRca ?? false,
                rcaFilePath: data.rcaFilePath ?? null,
                notifiedClient: data.notifiedClient ?? false,
            },
            include: { author: { select: { fullName: true } } },
        });

        // Audit log
        await prisma.sharedIssueActivity.create({
            data: {
                sharedIssueId: data.sharedIssueId,
                userId: data.authorId,
                activityType: data.isAcknowledgement
                    ? 'acknowledged'
                    : data.isRca ? 'rca_uploaded' : 'incident_update',
                details: JSON.stringify({ updateId: update.id }),
            },
        });

        // Mark first response on the parent issue if not already set
        if (data.isAcknowledgement) {
            const issue = await prisma.sharedIssue.findUnique({ where: { id: data.sharedIssueId } });
            if (issue && !issue.firstResponseAt) {
                await prisma.sharedIssue.update({
                    where: { id: data.sharedIssueId },
                    data: { firstResponseAt: new Date() },
                });
            }
        }

        return update;
    });

    // Upload / mark RCA as complete
    ipcMain.handle('incidents:uploadRca', async (_, sharedIssueId: string, authorId: string, updateText: string, rcaFilePath?: string) => {
        const update = await prisma.incidentUpdate.create({
            data: {
                sharedIssueId,
                authorId,
                updateText,
                isRca: true,
                rcaFilePath: rcaFilePath ?? null,
                notifiedClient: false,
            },
        });

        await prisma.sharedIssueActivity.create({
            data: {
                sharedIssueId,
                userId: authorId,
                activityType: 'rca_uploaded',
                details: JSON.stringify({ rcaFilePath }),
            },
        });

        return update;
    });

    // Mark that client was notified for a specific update
    ipcMain.handle('incidents:markClientNotified', async (_, updateId: string) => {
        return prisma.incidentUpdate.update({
            where: { id: updateId },
            data: { notifiedClient: true },
        });
    });

    // Get summary: was issue acknowledged? Has RCA? Last update time?
    ipcMain.handle('incidents:getSummary', async (_, sharedIssueId: string) => {
        const updates = await prisma.incidentUpdate.findMany({
            where: { sharedIssueId },
            orderBy: { createdAt: 'asc' },
        });

        const acknowledgement = updates.find(u => u.isAcknowledgement);
        const rca = updates.find(u => u.isRca);
        const lastUpdate = updates[updates.length - 1];

        return {
            totalUpdates: updates.length,
            isAcknowledged: !!acknowledgement,
            acknowledgedAt: acknowledgement?.createdAt ?? null,
            hasRca: !!rca,
            rcaUploadedAt: rca?.createdAt ?? null,
            lastUpdateAt: lastUpdate?.createdAt ?? null,
            clientNotified: updates.some(u => u.notifiedClient),
        };
    });

    console.log('✅ Incident handlers registered');
}
