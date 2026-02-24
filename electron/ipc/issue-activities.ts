import { ipcMain } from 'electron';
import { getPrisma } from '../prisma';

export function setupIssueActivityHandlers() {
    // Get activity timeline for an issue
    ipcMain.handle('issue-activities:getAll', async (event, issueId: string) => {
        const prisma = getPrisma();

        try {
            return await prisma.issueActivity.findMany({
                where: { issueId },
                include: {
                    user: {
                        select: {
                            id: true,
                            fullName: true,
                            email: true,
                            role: true,
                        }
                    }
                },
                orderBy: { createdAt: 'desc' }
            });
        } catch (error: any) {
            console.error('Error fetching activities:', error);
            throw error;
        }
    });

    // Create activity entry (can be called internally or externally)
    ipcMain.handle('issue-activities:create', async (event, data: {
        issueId: string;
        userId: string;
        activityType: string;
        details?: any;
    }) => {
        const prisma = getPrisma();

        try {
            return await prisma.issueActivity.create({
                data: {
                    issueId: data.issueId,
                    userId: data.userId,
                    activityType: data.activityType,
                    details: data.details ? JSON.stringify(data.details) : null,
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            fullName: true,
                            email: true,
                            role: true,
                        }
                    }
                }
            });
        } catch (error: any) {
            console.error('Error creating activity:', error);
            throw error;
        }
    });

    console.log('📊 Issue activity handlers registered');
}
