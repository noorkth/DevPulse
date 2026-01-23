
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function originalImplementation() {
    const start = performance.now();
    // By developer
    const developers = await prisma.developer.findMany({
        include: {
            issues: {
                where: { resolutionTime: { not: null } },
            },
        },
    });

    const developerAvg = developers.map(dev => ({
        developerId: dev.id,
        developerName: dev.fullName,
        avgTime: dev.issues.reduce((acc, i) => acc + (i.resolutionTime || 0), 0) /
            (dev.issues.length || 1),
        totalResolved: dev.issues.length,
    }));
    const end = performance.now();
    console.log(`Original Implementation: ${(end - start).toFixed(2)}ms`);
    return developerAvg;
}

async function optimizedImplementation() {
    const start = performance.now();

    // 1. Get average resolution time grouped by developer directly from DB
    const aggregations = await prisma.issue.groupBy({
        by: ['assignedToId'],
        where: { resolutionTime: { not: null } },
        _avg: {
            resolutionTime: true
        },
        _count: {
            resolutionTime: true
        }
    });

    // 2. Fetch developer details (names)
    const developers = await prisma.developer.findMany({
        select: { id: true, fullName: true }
    });

    const aggregationMap = new Map(aggregations.map(agg => [agg.assignedToId, agg]));

    const developerAvg = developers.map(dev => {
        const stats = aggregationMap.get(dev.id);
        return {
            developerId: dev.id,
            developerName: dev.fullName,
            avgTime: stats?._avg?.resolutionTime || 0,
            totalResolved: stats?._count?.resolutionTime || 0
        };
    });

    const end = performance.now();
    console.log(`Optimized Implementation: ${(end - start).toFixed(2)}ms`);
    return developerAvg;
}

async function main() {
    console.log('🏎️ Running benchmark...');

    // Warmup
    // Note: We run the optimized version first as warmup since it's lighter
    await optimizedImplementation();

    console.log('--- Measurement ---');
    console.log('Running Optimized (Proposed Change)...');
    const res2 = await optimizedImplementation();

    console.log('Running Original (Baseline)...');
    const res1 = await originalImplementation();

    // Verification
    console.log('Checking consistency...');
    // Simple verification of length and a sample
    if (res1.length !== res2.length) {
        console.error(`Length mismatch: ${res1.length} vs ${res2.length}`);
    } else {
        console.log(`Count matches: ${res1.length} developers`);
    }

    // Verify first developer stats
    if (res1.length > 0) {
        const dev1 = res1[0];
        const dev2 = res2.find(d => d.developerId === dev1.developerId);
        if (dev2) {
             const diff = Math.abs(dev1.avgTime - dev2.avgTime);
             if (diff > 0.0001) {
                 console.error('Avg Time mismatch for first developer:', dev1.avgTime, dev2.avgTime);
             } else {
                 console.log('Sample data check passed ✅');
             }
        }
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
