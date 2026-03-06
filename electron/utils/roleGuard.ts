/**
 * Role enforcement helpers for IPC handlers.
 *
 * Supported roles (from Developer.role):
 *   - admin        → full access
 *   - manager      → can do everything except admin functions
 *   - developer    → can create/update governance records for any client (internal staff)
 *   - client_admin → scoped to their own clientId only
 */
import { getPrisma } from '../prisma';

export type GovernanceRole = 'admin' | 'manager' | 'client_admin' | 'developer';

interface ActorInfo {
    id: string;
    role: string;
    clientId: string | null;
}

/** Fetch actor role info from DB. Throws if not found. */
export async function getActor(userId: string): Promise<ActorInfo> {
    const prisma = getPrisma();
    const user = await prisma.developer.findUnique({
        where: { id: userId },
        select: { id: true, role: true, clientId: true },
    });
    if (!user) throw new Error(`User ${userId} not found`);
    return user as ActorInfo;
}

/** True if actor can mutate governance records for the given clientId. */
export function canMutateForClient(actor: ActorInfo, targetClientId: string): boolean {
    if (actor.role === 'admin' || actor.role === 'manager') return true;
    if (actor.role === 'developer') return true; // internal staff can create/edit for any client
    if (actor.role === 'client_admin') return actor.clientId === targetClientId;
    return false;
}

/** Throw if actor cannot mutate for this client. */
export function assertCanMutate(actor: ActorInfo, targetClientId: string): void {
    if (!canMutateForClient(actor, targetClientId)) {
        throw new Error(
            `Permission denied: role "${actor.role}" cannot modify records for client ${targetClientId}.`
        );
    }
}

/** True if actor can escalate (client_admin can only escalate their own client's issues). */
export function canEscalate(actor: ActorInfo, targetClientId: string): boolean {
    return canMutateForClient(actor, targetClientId);
}

/** Filter a query's clientId to scope client_admins to their own client. */
export function scopeClientId(actor: ActorInfo, requestedClientId?: string): string | undefined {
    if (actor.role === 'client_admin') {
        // client_admin can ONLY see their own client
        return actor.clientId ?? undefined;
    }
    return requestedClientId; // other roles: use what was requested
}
