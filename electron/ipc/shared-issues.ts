import { ipcMain } from 'electron';
import { getPrisma } from '../prisma';
import { SlaEngine } from '../services/sla-engine';
import { getActor, assertCanMutate, scopeClientId } from '../utils/roleGuard';

export function setupSharedIssueHandlers() {
    const prisma = getPrisma();

    // Get all shared issues with optional filters
    ipcMain.handle('sharedIssues:getAll', async (_, filters?: {
        clientId?: string;
        status?: string;
        severity?: string;
        slaStatus?: string;
        visibility?: string;
        escalationLevel?: number;
        requesterId?: string;
    }) => {
        const where: any = {};
        // Scope to client if requester is a client_admin
        const effectiveClientId = filters?.requesterId
            ? scopeClientId(await getActor(filters.requesterId), filters?.clientId)
            : filters?.clientId;
        if (effectiveClientId) where.clientId = effectiveClientId;
        if (filters?.status) where.status = filters.status;
        if (filters?.severity) where.severity = filters.severity;
        if (filters?.slaStatus) where.slaStatus = filters.slaStatus;
        if (filters?.visibility) where.visibility = filters.visibility;
        if (filters?.escalationLevel !== undefined) where.escalationLevel = filters.escalationLevel;

        return prisma.sharedIssue.findMany({
            where,
            include: {
                client: { select: { id: true, name: true } },
                assignedOwner: { select: { id: true, fullName: true, email: true } },
                activities: { orderBy: { createdAt: 'desc' }, take: 5 },
                incidentUpdates: { orderBy: { createdAt: 'desc' }, take: 3 },
            },
            orderBy: [{ escalationLevel: 'desc' }, { raisedAt: 'desc' }],
        });
    });

    // Get single issue by ID with full timeline
    ipcMain.handle('sharedIssues:getById', async (_, id: string) => {
        return prisma.sharedIssue.findUnique({
            where: { id },
            include: {
                client: true,
                assignedOwner: { select: { id: true, fullName: true, email: true, role: true } },
                activities: {
                    include: { user: { select: { fullName: true } } },
                    orderBy: { createdAt: 'desc' },
                },
                incidentUpdates: {
                    include: { author: { select: { fullName: true } } },
                    orderBy: { createdAt: 'asc' },
                },
            },
        });
    });

    // Create new shared issue — SLA does NOT start until acknowledged
    ipcMain.handle('sharedIssues:create', async (_, data: {
        clientId: string;
        title: string;
        description: string;
        severity: string;
        assignedOwnerId: string;
        expectedResolution?: string;
        tags?: string[];
        notes?: string;
        visibility?: string;
        createdById: string;
    }) => {
        // Role enforcement
        const actor = await getActor(data.createdById);
        assertCanMutate(actor, data.clientId);

        const raisedAt = new Date();

        const issue = await prisma.sharedIssue.create({
            data: {
                clientId: data.clientId,
                title: data.title,
                description: data.description,
                severity: data.severity,
                assignedOwnerId: data.assignedOwnerId,
                raisedAt,
                expectedResolution: data.expectedResolution ? new Date(data.expectedResolution) : null,
                tags: data.tags ? JSON.stringify(data.tags) : null,
                notes: data.notes ?? null,
                visibility: data.visibility ?? 'internal',
                // SLA deadlines are null until acknowledged
                responseDeadline: null,
                resolutionDeadline: null,
                slaStatus: 'pending',
            },
            include: {
                client: { select: { id: true, name: true } },
                assignedOwner: { select: { id: true, fullName: true } },
            },
        });

        // Audit log
        await prisma.sharedIssueActivity.create({
            data: {
                sharedIssueId: issue.id,
                userId: data.createdById,
                activityType: 'created',
                details: JSON.stringify({ severity: data.severity, clientId: data.clientId }),
            },
        });

        return issue;
    });

    // Acknowledge issue — starts the SLA clock and sets escalation to L1
    ipcMain.handle('sharedIssues:acknowledge', async (_, id: string, acknowledgedById: string) => {
        const existing = await prisma.sharedIssue.findUnique({ where: { id } });
        if (!existing) throw new Error('Issue not found');
        if (existing.acknowledgedAt) throw new Error('Issue is already acknowledged');

        const actor = await getActor(acknowledgedById);
        assertCanMutate(actor, existing.clientId);

        const now = new Date();
        const { responseDeadline, resolutionDeadline } = await SlaEngine.calculateDeadlines(existing.severity, now);

        const updated = await prisma.sharedIssue.update({
            where: { id },
            data: {
                acknowledgedAt: now,
                acknowledgedById,
                slaStartedAt: now,
                responseDeadline,
                resolutionDeadline,
                slaStatus: 'on-track',
                escalationLevel: 1, // Auto-assign L1 on acknowledgement
            },
            include: {
                client: { select: { id: true, name: true } },
                assignedOwner: { select: { id: true, fullName: true } },
            },
        });

        // Audit log
        await prisma.sharedIssueActivity.create({
            data: {
                sharedIssueId: id,
                userId: acknowledgedById,
                activityType: 'acknowledged',
                details: JSON.stringify({ slaStartedAt: now, escalationLevel: 1 }),
            },
        });

        return updated;
    });

    // Update issue fields
    ipcMain.handle('sharedIssues:update', async (_, id: string, data: any, updatedById: string) => {
        const existing = await prisma.sharedIssue.findUnique({ where: { id } });
        if (!existing) throw new Error('Issue not found');

        const actor = await getActor(updatedById);
        assertCanMutate(actor, existing.clientId);

        const updated = await prisma.sharedIssue.update({
            where: { id },
            data: {
                title: data.title ?? existing.title,
                description: data.description ?? existing.description,
                severity: data.severity ?? existing.severity,
                assignedOwnerId: data.assignedOwnerId ?? existing.assignedOwnerId,
                expectedResolution: data.expectedResolution ? new Date(data.expectedResolution) : existing.expectedResolution,
                rootCause: data.rootCause ?? existing.rootCause,
                resolutionSummary: data.resolutionSummary ?? existing.resolutionSummary,
                tags: data.tags ? JSON.stringify(data.tags) : existing.tags,
                notes: data.notes ?? existing.notes,
            },
        });

        await prisma.sharedIssueActivity.create({
            data: {
                sharedIssueId: id,
                userId: updatedById,
                activityType: 'updated',
                details: JSON.stringify({ changes: data }),
            },
        });

        return updated;
    });

    // Change status with audit log
    ipcMain.handle('sharedIssues:updateStatus', async (_, id: string, newStatus: string, updatedById: string) => {
        const existing = await prisma.sharedIssue.findUnique({ where: { id } });
        if (!existing) throw new Error('Issue not found');

        const actor = await getActor(updatedById);
        assertCanMutate(actor, existing.clientId);

        const resolvedAt = (newStatus === 'resolved' || newStatus === 'closed') ? new Date() : existing.resolvedAt;
        const slaStatus = resolvedAt
            ? SlaEngine.checkStatus(existing.resolutionDeadline!, existing.slaStatus === 'on-track' ? 0.8 : 0.8, existing.raisedAt, resolvedAt)
            : existing.slaStatus;

        const updated = await prisma.sharedIssue.update({
            where: { id },
            data: { status: newStatus, resolvedAt, slaStatus },
        });

        await prisma.sharedIssueActivity.create({
            data: {
                sharedIssueId: id,
                userId: updatedById,
                activityType: 'status_changed',
                details: JSON.stringify({ from: existing.status, to: newStatus }),
            },
        });

        return updated;
    });

    // Set Escalation directly
    ipcMain.handle('sharedIssues:setEscalation', async (_, id: string, newLevel: number, updatedById: string) => {
        const existing = await prisma.sharedIssue.findUnique({ where: { id } });
        if (!existing) throw new Error('Issue not found');

        const actor = await getActor(updatedById);
        assertCanMutate(actor, existing.clientId);

        const updated = await prisma.sharedIssue.update({
            where: { id },
            data: { escalationLevel: newLevel },
        });

        await prisma.sharedIssueActivity.create({
            data: {
                sharedIssueId: id,
                userId: updatedById,
                activityType: 'escalated',
                details: JSON.stringify({ from: existing.escalationLevel, to: newLevel }),
            },
        });

        return updated;
    });

    // Escalate
    ipcMain.handle('sharedIssues:escalate', async (_, id: string, escalatedById: string) => {
        const existing = await prisma.sharedIssue.findUnique({ where: { id } });
        if (!existing) throw new Error('Issue not found');

        const actor = await getActor(escalatedById);
        assertCanMutate(actor, existing.clientId);

        const newLevel = Math.min(existing.escalationLevel + 1, 3);

        const updated = await prisma.sharedIssue.update({
            where: { id },
            data: { escalationLevel: newLevel },
        });

        await prisma.sharedIssueActivity.create({
            data: {
                sharedIssueId: id,
                userId: escalatedById,
                activityType: 'escalated',
                details: JSON.stringify({ from: existing.escalationLevel, to: newLevel }),
            },
        });

        return updated;
    });

    // Toggle visibility
    ipcMain.handle('sharedIssues:toggleVisibility', async (_, id: string, updatedById: string) => {
        const existing = await prisma.sharedIssue.findUnique({ where: { id } });
        if (!existing) throw new Error('Issue not found');

        // Only managers/admins may toggle visibility (client_admin cannot expose internal issues)
        const actor = await getActor(updatedById);
        if (actor.role !== 'admin' && actor.role !== 'manager') {
            throw new Error(`Permission denied: role "${actor.role}" cannot change issue visibility.`);
        }

        const newVisibility = existing.visibility === 'internal' ? 'client' : 'internal';

        const updated = await prisma.sharedIssue.update({
            where: { id },
            data: { visibility: newVisibility },
        });

        await prisma.sharedIssueActivity.create({
            data: {
                sharedIssueId: id,
                userId: updatedById,
                activityType: 'visibility_changed',
                details: JSON.stringify({ from: existing.visibility, to: newVisibility }),
            },
        });

        return updated;
    });

    // Mark first response
    ipcMain.handle('sharedIssues:markFirstResponse', async (_, id: string, respondedById: string) => {
        const existing = await prisma.sharedIssue.findUnique({ where: { id } });
        if (!existing || existing.firstResponseAt) return existing;

        const actor = await getActor(respondedById);
        assertCanMutate(actor, existing.clientId);

        const updated = await prisma.sharedIssue.update({
            where: { id },
            data: { firstResponseAt: new Date() },
        });

        await prisma.sharedIssueActivity.create({
            data: {
                sharedIssueId: id,
                userId: respondedById,
                activityType: 'first_response',
                details: JSON.stringify({ respondedAt: new Date() }),
            },
        });

        return updated;
    });

    // Delete — admin/manager only
    ipcMain.handle('sharedIssues:delete', async (_, id: string, deletedById: string) => {
        const actor = await getActor(deletedById);
        if (actor.role !== 'admin' && actor.role !== 'manager') {
            throw new Error(`Permission denied: role "${actor.role}" cannot delete shared issues.`);
        }
        return prisma.sharedIssue.delete({ where: { id } });
    });

    console.log('✅ SharedIssue handlers registered');
}
