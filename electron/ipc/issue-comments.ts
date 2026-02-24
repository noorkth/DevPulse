import { ipcMain } from 'electron';
import Store from 'electron-store';
import { getPrisma } from '../prisma';

// Session store to get current user
const sessionStore = new Store({
    name: 'session',
    encryptionKey: 'devpulse-secure-session-key-2024'
});

export function setupIssueCommentHandlers() {
    // Get all comments for an issue
    ipcMain.handle('issue-comments:getAll', async (event, issueId: string) => {
        const prisma = getPrisma();

        try {
            return await prisma.issueComment.findMany({
                where: { issueId },
                include: {
                    author: {
                        select: {
                            id: true,
                            fullName: true,
                            email: true,
                            role: true,
                        }
                    }
                },
                orderBy: { createdAt: 'asc' }
            });
        } catch (error: any) {
            console.error('Error fetching comments:', error);
            throw error;
        }
    });

    // Create a comment
    ipcMain.handle('issue-comments:create', async (event, data: { issueId: string; content: string; authorId: string }) => {
        const prisma = getPrisma();

        try {
            const comment = await prisma.issueComment.create({
                data: {
                    issueId: data.issueId,
                    authorId: data.authorId,
                    content: data.content,
                },
                include: {
                    author: {
                        select: {
                            id: true,
                            fullName: true,
                            email: true,
                            role: true,
                        }
                    }
                }
            });

            // Create activity entry for the comment
            await prisma.issueActivity.create({
                data: {
                    issueId: data.issueId,
                    userId: data.authorId,
                    activityType: 'commented',
                    details: JSON.stringify({ commentId: comment.id })
                }
            });

            return comment;
        } catch (error: any) {
            console.error('Error creating comment:', error);
            throw error;
        }
    });

    // Update a comment
    ipcMain.handle('issue-comments:update', async (event, id: string, content: string) => {
        const prisma = getPrisma();

        try {
            return await prisma.issueComment.update({
                where: { id },
                data: { content },
                include: {
                    author: {
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
            console.error('Error updating comment:', error);
            throw error;
        }
    });

    // Delete a comment
    ipcMain.handle('issue-comments:delete', async (event, id: string) => {
        const prisma = getPrisma();

        try {
            await prisma.issueComment.delete({
                where: { id }
            });

            return { success: true };
        } catch (error: any) {
            console.error('Error deleting comment:', error);
            throw error;
        }
    });

    console.log('💬 Issue comment handlers registered');
}
