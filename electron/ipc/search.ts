import { ipcMain } from 'electron';
import { getPrisma } from '../prisma';

export interface SearchResult {
    type: 'product' | 'client' | 'project' | 'issue' | 'developer';
    id: string;
    title: string;
    subtitle?: string;
    metadata?: any;
    score: number;
}

export interface SearchFilters {
    types?: ('product' | 'client' | 'project' | 'issue' | 'developer')[];
    limit?: number;
}

/**
 * Global search across all entities
 */
async function globalSearch(query: string, filters?: SearchFilters): Promise<SearchResult[]> {
    const prisma = getPrisma();
    const searchTerm = query.toLowerCase().trim();

    if (!searchTerm) return [];

    const limit = filters?.limit || 50;
    const types = filters?.types || ['product', 'client', 'project', 'issue', 'developer'];
    const results: SearchResult[] = [];

    try {
        // Search Products
        if (types.includes('product')) {
            const products = await prisma.product.findMany({
                take: limit,
            });

            const filtered = products.filter(p =>
                p.name.toLowerCase().includes(searchTerm) ||
                (p.description && p.description.toLowerCase().includes(searchTerm))
            );

            results.push(...filtered.map(p => ({
                type: 'product' as const,
                id: p.id,
                title: p.name,
                subtitle: p.description || undefined,
                metadata: { createdAt: p.createdAt },
                score: calculateScore(searchTerm, p.name, p.description),
            })));
        }

        // Search Clients
        if (types.includes('client')) {
            const clients = await prisma.client.findMany({
                include: {
                    product: { select: { name: true } },
                },
                take: limit * 2, // Get more to filter
            });

            const filtered = clients.filter(c =>
                c.name.toLowerCase().includes(searchTerm) ||
                (c.contactInfo && c.contactInfo.toLowerCase().includes(searchTerm))
            );

            results.push(...filtered.slice(0, limit).map(c => ({
                type: 'client' as const,
                id: c.id,
                title: c.name,
                subtitle: `${c.product.name}${c.contactInfo ? ` • ${c.contactInfo}` : ''}`,
                metadata: { productName: c.product.name },
                score: calculateScore(searchTerm, c.name, c.contactInfo),
            })));
        }

        // Search Projects
        if (types.includes('project')) {
            const projects = await prisma.project.findMany({
                include: {
                    client: {
                        include: {
                            product: { select: { name: true } },
                        },
                    },
                },
                take: limit * 2,
            });

            const filtered = projects.filter(p =>
                p.name.toLowerCase().includes(searchTerm) ||
                (p.description && p.description.toLowerCase().includes(searchTerm))
            );

            results.push(...filtered.slice(0, limit).map(p => ({
                type: 'project' as const,
                id: p.id,
                title: p.name,
                subtitle: `${p.client.product.name} → ${p.client.name}`,
                metadata: {
                    status: p.status,
                    projectType: p.projectType,
                },
                score: calculateScore(searchTerm, p.name, p.description),
            })));
        }

        // Search Issues
        if (types.includes('issue')) {
            const issues = await prisma.issue.findMany({
                include: {
                    project: {
                        select: { name: true },
                    },
                    assignedTo: {
                        select: { fullName: true },
                    },
                },
                take: limit * 2,
            });

            const filtered = issues.filter(i =>
                i.title.toLowerCase().includes(searchTerm) ||
                i.description.toLowerCase().includes(searchTerm)
            );

            results.push(...filtered.slice(0, limit).map(i => ({
                type: 'issue' as const,
                id: i.id,
                title: i.title,
                subtitle: `${i.project.name} • Assigned to ${i.assignedTo.fullName}`,
                metadata: {
                    severity: i.severity,
                    status: i.status,
                    projectName: i.project.name,
                },
                score: calculateScore(searchTerm, i.title, i.description),
            })));
        }

        // Search Developers
        if (types.includes('developer')) {
            const developers = await prisma.developer.findMany({
                take: limit * 2,
            });

            const filtered = developers.filter(d =>
                d.fullName.toLowerCase().includes(searchTerm) ||
                d.email.toLowerCase().includes(searchTerm) ||
                d.skills.toLowerCase().includes(searchTerm)
            );

            results.push(...filtered.slice(0, limit).map(d => ({
                type: 'developer' as const,
                id: d.id,
                title: d.fullName,
                subtitle: `${d.email} • ${d.seniorityLevel}`,
                metadata: {
                    role: d.role,
                    seniorityLevel: d.seniorityLevel,
                    skills: d.skills,
                },
                score: calculateScore(searchTerm, d.fullName, d.email),
            })));
        }

        // Sort by score (highest first) and limit results
        return results
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);

    } catch (error) {
        console.error('Global search error:', error);
        throw error;
    }
}

/**
 * Calculate relevance score based on search term position and frequency
 */
function calculateScore(searchTerm: string, ...fields: (string | null | undefined)[]): number {
    let score = 0;
    const term = searchTerm.toLowerCase();

    for (const field of fields) {
        if (!field) continue;

        const fieldLower = field.toLowerCase();

        // Exact match gets highest score
        if (fieldLower === term) {
            score += 100;
        }
        // Starts with gets high score
        else if (fieldLower.startsWith(term)) {
            score += 50;
        }
        // Contains gets medium score
        else if (fieldLower.includes(term)) {
            score += 25;
        }

        // Bonus for shorter fields (more relevant)
        if (fieldLower.includes(term)) {
            score += Math.max(0, 10 - field.length / 10);
        }
    }

    return score;
}

/**
 * Setup search IPC handlers
 */
export function setupSearchHandlers() {
    // Global search
    ipcMain.handle('search:global', async (_event, query: string, filters?: SearchFilters) => {
        try {
            return await globalSearch(query, filters);
        } catch (error) {
            console.error('Search handler error:', error);
            throw error;
        }
    });

    console.log('✅ Search handlers registered');
}
