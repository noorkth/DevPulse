import { ipcMain } from 'electron';
import { PrismaClient } from '@prisma/client';
import { differenceInHours } from 'date-fns';

const prisma = new PrismaClient();

export function setupIssueHandlers() {
    // Get all issues with filters
    ipcMain.handle('issues:getAll', async (_, filters?: any) => {
        try {
            const where: any = {};

            if (filters?.projectId) where.projectId = filters.projectId;
            if (filters?.assignedToId) where.assignedToId = filters.assignedToId;
            if (filters?.status) where.status = filters.status;
            if (filters?.severity) where.severity = filters.severity;
            if (filters?.isRecurring !== undefined) where.isRecurring = filters.isRecurring;

            const issues = await prisma.issue.findMany({
                where,
                include: {
                    project: true,
                    assignedTo: true,
                    feature: true,
                    parentIssue: true,
                },
                orderBy: { createdAt: 'desc' },
            });

            return issues;
        } catch (error) {
            console.error('Error fetching issues:', error);
            throw error;
        }
    });

    // Get issue by ID
    ipcMain.handle('issues:getById', async (_, id: string) => {
        try {
            const issue = await prisma.issue.findUnique({
                where: { id },
                include: {
                    project: true,
                    assignedTo: true,
                    feature: true,
                    parentIssue: true,
                    childIssues: true,
                },
            });

            return issue;
        } catch (error) {
            console.error('Error fetching issue:', error);
            throw error;
        }
    });

    // Create new issue
    ipcMain.handle('issues:create', async (_, data: any) => {
        try {
            const issue = await prisma.issue.create({
                data: {
                    title: data.title,
                    description: data.description,
                    severity: data.severity,
                    status: data.status || 'open',
                    projectId: data.projectId,
                    featureId: data.featureId || null,
                    assignedToId: data.assignedToId || null,
                    notes: data.notes || null,
                    attachments: data.attachments ? JSON.stringify(data.attachments) : null,
                },
                include: {
                    project: true,
                    assignedTo: true,
                    feature: true,
                },
            });

            return issue;
        } catch (error) {
            console.error('Error creating issue:', error);
            throw error;
        }
    });

    // Update issue
    ipcMain.handle('issues:update', async (_, id: string, data: any) => {
        try {
            const issue = await prisma.issue.update({
                where: { id },
                data: {
                    title: data.title,
                    description: data.description,
                    severity: data.severity,
                    status: data.status,
                    featureId: data.featureId,
                    assignedToId: data.assignedToId,
                    notes: data.notes,
                    attachments: data.attachments ? JSON.stringify(data.attachments) : undefined,
                },
                include: {
                    project: true,
                    assignedTo: true,
                    feature: true,
                },
            });

            return issue;
        } catch (error) {
            console.error('Error updating issue:', error);
            throw error;
        }
    });

    // Resolve issue
    ipcMain.handle('issues:resolve', async (_, id: string, fixQuality: number) => {
        try {
            const issue = await prisma.issue.findUnique({
                where: { id },
            });

            if (!issue) {
                throw new Error('Issue not found');
            }

            const resolvedAt = new Date();
            const resolutionTime = differenceInHours(resolvedAt, issue.createdAt);

            const updatedIssue = await prisma.issue.update({
                where: { id },
                data: {
                    status: 'resolved',
                    resolvedAt,
                    resolutionTime,
                    fixQuality: fixQuality,
                },
                include: {
                    project: true,
                    assignedTo: true,
                    feature: true,
                },
            });

            return updatedIssue;
        } catch (error) {
            console.error('Error resolving issue:', error);
            throw error;
        }
    });

    // Detect recurrence
    ipcMain.handle('issues:detectRecurrence', async (_, issueId: string) => {
        try {
            const issue = await prisma.issue.findUnique({
                where: { id: issueId },
            });

            if (!issue) {
                throw new Error('Issue not found');
            }

            // Check for similar issues in the same feature
            const similarIssues = await prisma.issue.findMany({
                where: {
                    featureId: issue.featureId,
                    id: { not: issueId },
                    OR: [
                        { title: { contains: issue.title.substring(0, 20) } },
                        { parentIssueId: { not: null } },
                    ],
                },
            });

            // Check if this looks like a recurring issue
            const isRecurring = similarIssues.length > 0 &&
                similarIssues.some(si => si.status === 'resolved' || si.status === 'closed');

            if (isRecurring && !issue.isRecurring) {
                // Find the original issue
                const originalIssue = similarIssues.find(
                    si => (si.status === 'resolved' || si.status === 'closed') && !si.isRecurring
                );

                await prisma.issue.update({
                    where: { id: issueId },
                    data: {
                        isRecurring: true,
                        recurrenceCount: 1,
                        parentIssueId: originalIssue?.id || null,
                    },
                });

                return { isRecurring: true, parentIssue: originalIssue };
            }

            return { isRecurring: false };
        } catch (error) {
            console.error('Error detecting recurrence:', error);
            throw error;
        }
    });
}
