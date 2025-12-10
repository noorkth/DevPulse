import { ipcMain } from 'electron';
import { getPrisma } from "../prisma";
import { validate } from '../validation/validator';
import {
    ProjectCreateSchema,
    ProjectUpdateSchema,
    ProjectFilterSchema,
    UUIDSchema
} from '../validation/schemas';
import { RateLimiter, RateLimitError, RateLimiterPresets } from '../security/rate-limiter';
import { CacheManager } from '../cache/cache-manager';
import { normalizePaginationParams, buildPaginationQuery, createPaginationResponse, PaginationParams } from '../utils/pagination';

// Rate limiters for different operation types
const readLimiter = new RateLimiter(RateLimiterPresets.READ.maxRequests, RateLimiterPresets.READ.windowMs);
const writeLimiter = new RateLimiter(RateLimiterPresets.WRITE.maxRequests, RateLimiterPresets.WRITE.windowMs);

// Using shared getPrisma()

export function setupProjectHandlers() {
    // Get all projects with optional filters and pagination
    ipcMain.handle('projects:getAll', async (event, filters?: any, paginationParams?: PaginationParams) => {
        const senderId = event.sender.id.toString();

        // Rate limit check
        if (!readLimiter.isAllowed(senderId)) {
            throw new RateLimitError('Too many requests. Please slow down.');
        }

        const prisma = getPrisma();
        try {
            // Generate cache key
            const cacheKey = CacheManager.generateKey('projects:getAll', { filters, paginationParams });

            // Check cache
            const cached = CacheManager.get<any>('list', cacheKey);
            if (cached) {
                return cached;
            }

            const params = normalizePaginationParams(paginationParams);
            const where = filters || {};

            // If no pagination requested, return all (backwards compatibility)
            if (!params) {
                const projects = await prisma.project.findMany({
                    where,
                    include: {
                        client: {
                            include: {
                                product: true,
                            },
                        },
                        _count: {
                            select: {
                                issues: true,
                                developers: true,
                            },
                        },
                    },
                    orderBy: { createdAt: 'desc' },
                });

                CacheManager.set('list', cacheKey, projects);
                return projects;
            }

            // Build pagination query
            const paginationQuery = buildPaginationQuery(params);

            // Fetch paginated results
            const [projects, total] = await Promise.all([
                prisma.project.findMany({
                    ...paginationQuery,
                    where,
                    include: {
                        client: {
                            include: {
                                product: true,
                            },
                        },
                        _count: {
                            select: {
                                issues: true,
                                developers: true,
                            },
                        },
                    },
                    orderBy: { createdAt: 'desc' },
                }),
                prisma.project.count({ where }),
            ]);

            const result = createPaginationResponse(projects, total, params);
            CacheManager.set('list', cacheKey, result);
            return result;
        } catch (error) {
            console.error('Error fetching projects:', error);
            throw error;
        }
    });

    // Get project by ID
    ipcMain.handle('projects:getById', async (event, id: string) => {
        const senderId = event.sender.id.toString();

        // Rate limit check
        if (!readLimiter.isAllowed(senderId)) {
            throw new RateLimitError('Too many requests. Please slow down.');
        }

        const prisma = getPrisma();
        try {
            // Validate ID
            const validatedId = validate(UUIDSchema, id);

            const project = await prisma.project.findUnique({
                where: { id: validatedId },
                include: {
                    issues: {
                        include: {
                            assignedTo: true,
                            feature: true,
                        },
                    },
                    features: true,
                    developers: {
                        include: {
                            developer: true,
                        },
                    },
                },
            });

            return project;
        } catch (error) {
            console.error('Error fetching project:', error);
            throw error;
        }
    });

    // Create new project
    ipcMain.handle('projects:create', async (event, data: any) => {
        const senderId = event.sender.id.toString();

        // Rate limit check
        if (!writeLimiter.isAllowed(senderId)) {
            throw new RateLimitError('Too many requests. Please slow down.');
        }

        const prisma = getPrisma();
        try {
            // Validate input data
            const validatedData = validate(ProjectCreateSchema, data);

            const project = await prisma.project.create({
                data: {
                    name: validatedData.name,
                    clientId: validatedData.clientId,
                    projectType: validatedData.projectType,
                    description: validatedData.description,
                    startDate: new Date(validatedData.startDate),
                    endDate: validatedData.endDate ? new Date(validatedData.endDate) : null,
                    status: validatedData.status,
                },
            });

            return project;
        } catch (error) {
            console.error('Error creating project:', error);
            throw error;
        }
    });

    // Update project
    ipcMain.handle('projects:update', async (event, id: string, data: any) => {
        const senderId = event.sender.id.toString();

        // Rate limit check
        if (!writeLimiter.isAllowed(senderId)) {
            throw new RateLimitError('Too many requests. Please slow down.');
        }

        const prisma = getPrisma();
        try {
            // Validate ID and data
            const validatedId = validate(UUIDSchema, id);
            const validatedData = validate(ProjectUpdateSchema, data);

            const project = await prisma.project.update({
                where: { id: validatedId },
                data: {
                    name: validatedData.name,
                    clientId: validatedData.clientId,
                    projectType: validatedData.projectType,
                    description: validatedData.description,
                    startDate: validatedData.startDate ? new Date(validatedData.startDate) : undefined,
                    endDate: validatedData.endDate ? new Date(validatedData.endDate) : null,
                    status: validatedData.status,
                },
            });

            return project;
        } catch (error) {
            console.error('Error updating project:', error);
            throw error;
        }
    });

    // Delete/Archive project
    ipcMain.handle('projects:delete', async (event, id: string) => {
        const senderId = event.sender.id.toString();

        // Rate limit check
        if (!writeLimiter.isAllowed(senderId)) {
            throw new RateLimitError('Too many requests. Please slow down.');
        }

        const prisma = getPrisma();
        try {
            // Validate ID
            const validatedId = validate(UUIDSchema, id);

            // Soft delete by archiving
            const project = await prisma.project.update({
                where: { id: validatedId },
                data: { status: 'archived' },
            });

            return project;
        } catch (error) {
            console.error('Error deleting project:', error);
            throw error;
        }
    });

    // Get project statistics
    ipcMain.handle('projects:getStats', async (event, id: string) => {
        const senderId = event.sender.id.toString();

        // Rate limit check
        if (!readLimiter.isAllowed(senderId)) {
            throw new RateLimitError('Too many requests. Please slow down.');
        }

        const prisma = getPrisma();
        try {
            // Validate ID
            const validatedId = validate(UUIDSchema, id);

            const project = await prisma.project.findUnique({
                where: { id: validatedId },
                include: {
                    issues: true,
                    developers: true,
                },
            });

            if (!project) {
                throw new Error('Project not found');
            }

            const totalIssues = project.issues.length;
            const openIssues = project.issues.filter(i => i.status === 'open').length;
            const resolvedIssues = project.issues.filter(i => i.status === 'resolved' || i.status === 'closed').length;
            const criticalIssues = project.issues.filter(i => i.severity === 'critical').length;
            const recurringIssues = project.issues.filter(i => i.isRecurring).length;

            const avgResolutionTime = project.issues
                .filter(i => i.resolutionTime)
                .reduce((acc, i) => acc + (i.resolutionTime || 0), 0) /
                (project.issues.filter(i => i.resolutionTime).length || 1);

            return {
                totalIssues,
                openIssues,
                resolvedIssues,
                criticalIssues,
                recurringIssues,
                avgResolutionTime: Math.round(avgResolutionTime),
                developerCount: project.developers.length,
            };
        } catch (error) {
            console.error('Error fetching project stats:', error);
            throw error;
        }
    });
}
