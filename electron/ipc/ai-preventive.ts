import { ipcMain } from 'electron';
import { getPrisma } from '../prisma';
import { getActor, assertCanMutate, scopeClientId } from '../utils/roleGuard';

export function setupAiPreventiveHandlers() {
    const prisma = getPrisma();

    // The heuristic engine to find common patterns across clients and suggest them to others
    ipcMain.handle('aiPreventive:generate', async (_) => {
        // 1. Fetch resolved/closed issues from the last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentIssues = await prisma.sharedIssue.findMany({
            where: {
                status: { in: ['resolved', 'closed'] },
                resolvedAt: { gte: thirtyDaysAgo }
            },
            include: { client: true }
        });

        // 2. Simplistic Heuristic: Group rootCauses and count how many DISTINCT clients had it
        // and return generating recommendations for clients who did not have it.
        const issuesByRootCause: Record<string, any[]> = {};
        for (const issue of recentIssues) {
            const rc = (issue.rootCause || '').trim().toLowerCase();
            // Need a meaningful root cause to analyze
            if (rc.length > 5 && rc !== 'unknown') {
                if (!issuesByRootCause[rc]) {
                    issuesByRootCause[rc] = [];
                }
                issuesByRootCause[rc].push(issue);
            }
        }

        let generatedCount = 0;
        const allClients = await prisma.client.findMany();

        for (const [rc, issues] of Object.entries(issuesByRootCause)) {
            // Find unique client IDs for this root cause
            const affectedClientIds = new Set(issues.map(i => i.clientId));
            // If the pattern affected more than 1 client, it's a trend
            if (affectedClientIds.size > 1) {
                // Find clients NOT affected by this issue to prevent it for them
                const targetClientIds = allClients
                    .map(c => c.id)
                    .filter(id => !affectedClientIds.has(id));

                const sourceIssueIds = JSON.stringify(issues.map(i => i.id));
                const title = `Proactive Monitoring: Check for '${rc}'`;
                const description = `The issue cause '${rc}' has recently affected ${affectedClientIds.size} other clients. We recommend adding this to your proactive monitoring checklist.`;

                for (const targetClientId of targetClientIds) {
                    // Make sure we haven't already generated this duplicate recommendation
                    const existing = await prisma.preventiveRecommendation.findFirst({
                        where: {
                            clientId: targetClientId,
                            title: title,
                            status: { not: 'dismissed' }
                        }
                    });

                    if (!existing) {
                        await prisma.preventiveRecommendation.create({
                            data: {
                                clientId: targetClientId,
                                title,
                                description,
                                sourceIssueIds,
                                status: 'pending'
                            }
                        });
                        generatedCount++;
                    }
                }
            }
        }

        return { success: true, generatedCount };
    });

    ipcMain.handle('aiPreventive:getAll', async (_, clientId?: string, requestedById?: string) => {
        let filter: any = {};
        if (requestedById) {
            const actor = await getActor(requestedById);
            filter.clientId = scopeClientId(actor, clientId);
        } else if (clientId) {
            filter.clientId = clientId;
        }

        return prisma.preventiveRecommendation.findMany({
            where: filter,
            include: { client: true },
            orderBy: { createdAt: 'desc' }
        });
    });

    ipcMain.handle('aiPreventive:updateStatus', async (_, id: string, status: string, updatedById: string) => {
        const existing = await prisma.preventiveRecommendation.findUnique({ where: { id } });
        if (!existing) throw new Error('Recommendation not found');
        const actor = await getActor(updatedById);
        assertCanMutate(actor, existing.clientId);

        return prisma.preventiveRecommendation.update({
            where: { id },
            data: { status }
        });
    });

    console.log('✅ AI Preventive handlers registered');
}
