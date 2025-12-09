import { ipcMain } from 'electron';
import { getPrisma } from "../prisma";
import { differenceInHours } from 'date-fns';
import { validate } from '../validation/validator';
import {
    IssueCreateSchema,
    IssueUpdateSchema,
    IssueFilterSchema,
    UUIDSchema
} from '../validation/schemas';
import { RateLimiter, RateLimitError, RateLimiterPresets } from '../security/rate-limiter';

// Rate limiters for different operation types
const readLimiter = new RateLimiter(RateLimiterPresets.READ.maxRequests, RateLimiterPresets.READ.windowMs);
const writeLimiter = new RateLimiter(RateLimiterPresets.WRITE.maxRequests, RateLimiterPresets.WRITE.windowMs);

export function setupIssueHandlers() {
    // Get all issues with filters
    ipcMain.handle('issues:getAll', async (event, filters?: any) => {
        const senderId = event.sender.id.toString();

        if (!readLimiter.isAllowed(senderId)) {
            throw new RateLimitError('Too many requests. Please slow down.');
        }

        const prisma = getPrisma();
        try {
            const validatedFilters = validate(IssueFilterSchema, filters);
            const where: any = {};

            if (validatedFilters?.projectId) where.projectId = validatedFilters.projectId;
            if (validatedFilters?.assignedToId) where.assignedToId = validatedFilters.assignedToId;
            if (validatedFilters?.status) where.status = validatedFilters.status;
            if (validatedFilters?.severity) where.severity = validatedFilters.severity;
            if (validatedFilters?.isRecurring !== undefined) where.isRecurring = validatedFilters.isRecurring;

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
    ipcMain.handle('issues:getById', async (event, id: string) => {
        const senderId = event.sender.id.toString();

        if (!readLimiter.isAllowed(senderId)) {
            throw new RateLimitError('Too many requests. Please slow down.');
        }

        const prisma = getPrisma();
        try {
            const validatedId = validate(UUIDSchema, id);
            const issue = await prisma.issue.findUnique({
                where: { id: validatedId },
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
    ipcMain.handle('issues:create', async (event, data: any) => {
        const senderId = event.sender.id.toString();

        if (!writeLimiter.isAllowed(senderId)) {
            throw new RateLimitError('Too many requests. Please slow down.');
        }

        const prisma = getPrisma();
        try {
            const validatedData = validate(IssueCreateSchema, data);

            // Build data object conditionally
            const createData: any = {
                title: validatedData.title,
                description: validatedData.description,
                severity: validatedData.severity,
                status: validatedData.status || 'open',
                project: { connect: { id: validatedData.projectId } },
                assignedTo: { connect: { id: validatedData.assignedToId } },
                notes: validatedData.notes || null,
                attachments: validatedData.attachments ? JSON.stringify(validatedData.attachments) : null,
            };

            // Only add feature if featureId exists
            if (validatedData.featureId) {
                createData.feature = { connect: { id: validatedData.featureId } };
            }

            const issue = await prisma.issue.create({
                data: createData,
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
    ipcMain.handle('issues:update', async (event, id: string, data: any) => {
        const senderId = event.sender.id.toString();

        if (!writeLimiter.isAllowed(senderId)) {
            throw new RateLimitError('Too many requests. Please slow down.');
        }

        const prisma = getPrisma();
        try {
            const validatedId = validate(UUIDSchema, id);
            const validatedData = validate(IssueUpdateSchema, data);
            const issue = await prisma.issue.update({
                where: { id: validatedId },
                data: {
                    title: validatedData.title,
                    description: validatedData.description,
                    severity: validatedData.severity,
                    status: validatedData.status,
                    featureId: validatedData.featureId,
                    assignedToId: validatedData.assignedToId,
                    notes: validatedData.notes,
                    attachments: validatedData.attachments ? JSON.stringify(validatedData.attachments) : undefined,
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
    ipcMain.handle('issues:resolve', async (event, id: string, fixQuality: number) => {
        const senderId = event.sender.id.toString();

        if (!writeLimiter.isAllowed(senderId)) {
            throw new RateLimitError('Too many requests. Please slow down.');
        }

        const prisma = getPrisma();
        try {
            const validatedId = validate(UUIDSchema, id);
            const issue = await prisma.issue.findUnique({
                where: { id: validatedId },
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
    ipcMain.handle('issues:detectRecurrence', async (event, issueId: string) => {
        const senderId = event.sender.id.toString();

        if (!readLimiter.isAllowed(senderId)) {
            throw new RateLimitError('Too many requests. Please slow down.');
        }

        const prisma = getPrisma();
        try {
            const validatedId = validate(UUIDSchema, issueId);
            const issue = await prisma.issue.findUnique({
                where: { id: validatedId },
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

    // Bulk import issues from CSV
    ipcMain.handle('issues:bulkImport', async (event, issues: any[]) => {
        const senderId = event.sender.id.toString();

        if (!writeLimiter.isAllowed(senderId)) {
            throw new RateLimitError('Too many requests. Please slow down.');
        }

        const prisma = getPrisma();
        try {
            const results = {
                success: 0,
                failed: 0,
                errors: [] as string[],
            };

            for (const [index, issueData] of issues.entries()) {
                try {
                    // Find referenced entities by name
                    let projectId = undefined;
                    let assignedToId = undefined;
                    let featureId = undefined;

                    if (issueData.project) {
                        const project = await prisma.project.findFirst({
                            where: { name: issueData.project },
                        });
                        projectId = project?.id;
                    }

                    if (issueData.assignedTo) {
                        const developer = await prisma.developer.findFirst({
                            where: { email: issueData.assignedTo },
                        });
                        assignedToId = developer?.id;
                    }

                    if (issueData.feature && projectId) {
                        // Only lookup feature if project exists
                        const feature = await prisma.feature.findFirst({
                            where: {
                                name: issueData.feature,
                                projectId: projectId  // Feature should belong to the project
                            },
                        });
                        featureId = feature?.id;
                    }

                    // Prepare tags - convert to JSON string array
                    let tagsArray: string[] = [];
                    if (issueData.tags) {
                        tagsArray = issueData.tags.split(',').map((t: string) => t.trim());
                    }

                    // Create the issue
                    await prisma.issue.create({
                        data: {
                            title: issueData.title,
                            description: issueData.description || '',
                            severity: issueData.severity || 'medium',
                            status: issueData.status || 'open',
                            projectId,
                            assignedToId,
                            featureId,
                            estimatedTime: issueData.estimatedTime,
                            tags: JSON.stringify(tagsArray), // Store as JSON string
                        },
                    });

                    results.success++;
                } catch (error: any) {
                    results.failed++;
                    results.errors.push(`Row ${index + 1}: ${error.message}`);
                }
            }

            return results;
        } catch (error: any) {
            console.error('Error bulk importing issues:', error);
            throw new Error(`Failed to bulk import issues: ${error.message}`);
        }
    });
}
