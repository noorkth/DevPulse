import { ipcMain } from 'electron';
import { getPrisma } from "../prisma";

// Using shared getPrisma()

export function setupProjectHandlers() {
    // Get all projects with optional filters
    ipcMain.handle('projects:getAll', async (_, filters?: any) => {
        const prisma = getPrisma();
        try {
            const where: any = {};

            if (filters?.status) {
                where.status = filters.status;
            }

            if (filters?.clientId) {
                where.clientId = filters.clientId;
            }

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

            return projects;
        } catch (error) {
            console.error('Error fetching projects:', error);
            throw error;
        }
    });

    // Get project by ID
    ipcMain.handle('projects:getById', async (_, id: string) => {
        const prisma = getPrisma();
        try {
            const project = await prisma.project.findUnique({
                where: { id },
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
    ipcMain.handle('projects:create', async (_, data: any) => {
        const prisma = getPrisma();
        try {
            const project = await prisma.project.create({
                data: {
                    name: data.name,
                    clientId: data.clientId,
                    projectType: data.projectType,
                    description: data.description,
                    startDate: new Date(data.startDate),
                    endDate: data.endDate ? new Date(data.endDate) : null,
                    status: data.status || 'active',
                },
            });

            return project;
        } catch (error) {
            console.error('Error creating project:', error);
            throw error;
        }
    });

    // Update project
    ipcMain.handle('projects:update', async (_, id: string, data: any) => {
        const prisma = getPrisma();
        try {
            const project = await prisma.project.update({
                where: { id },
                data: {
                    name: data.name,
                    clientId: data.clientId,
                    projectType: data.projectType,
                    description: data.description,
                    startDate: data.startDate ? new Date(data.startDate) : undefined,
                    endDate: data.endDate ? new Date(data.endDate) : null,
                    status: data.status,
                },
            });

            return project;
        } catch (error) {
            console.error('Error updating project:', error);
            throw error;
        }
    });

    // Delete/Archive project
    ipcMain.handle('projects:delete', async (_, id: string) => {
        const prisma = getPrisma();
        try {
            // Soft delete by archiving
            const project = await prisma.project.update({
                where: { id },
                data: { status: 'archived' },
            });

            return project;
        } catch (error) {
            console.error('Error deleting project:', error);
            throw error;
        }
    });

    // Get project statistics
    ipcMain.handle('projects:getStats', async (_, id: string) => {
        const prisma = getPrisma();
        try {
            const project = await prisma.project.findUnique({
                where: { id },
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
