
import { PrismaClient } from '@prisma/client';
import { sub, add } from 'date-fns';

if (process.env.BENCHMARK_CONFIRM !== 'true') {
    console.error('⚠️  SAFETY GUARD: This script will WIPE the database.');
    console.error('To run this script, you must set the environment variable BENCHMARK_CONFIRM=true');
    console.error('Example: BENCHMARK_CONFIRM=true npx tsx scripts/benchmark-seed.ts');
    process.exit(1);
}

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting benchmark seed...');

    // Clear existing data
    await prisma.issue.deleteMany();
    await prisma.developer.deleteMany();

    console.log('🧹 Database cleared');

    // Create many developers
    const developersToCreate = 100;
    const developers = [];
    console.log(`Creating ${developersToCreate} developers...`);

    for (let i = 0; i < developersToCreate; i++) {
        const created = await prisma.developer.create({
            data: {
                fullName: `Dev ${i}`,
                email: `dev${i}@devpulse.com`,
                role: 'developer',
                seniorityLevel: 'mid',
                skills: '["JavaScript"]'
            }
        });
        developers.push(created);
    }

    // Create many issues per developer
    const issuesPerDeveloper = 100;
    console.log(`Creating ${issuesPerDeveloper} issues for each developer...`);

    const issuesData = [];
    for (const dev of developers) {
        for (let i = 0; i < issuesPerDeveloper; i++) {
             const createdAt = sub(new Date(), { days: Math.floor(Math.random() * 90) });
             const resolvedAt = add(createdAt, { hours: Math.floor(Math.random() * 48) + 1 });
             const resolutionTime = (resolvedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

             issuesData.push({
                title: `Issue ${i} for ${dev.id}`,
                description: 'Description',
                status: 'closed',
                severity: 'medium',
                projectId: "placeholder-project-id", // Will need to create a project first
                assignedToId: dev.id,
                createdAt: createdAt,
                resolvedAt: resolvedAt,
                resolutionTime: resolutionTime,
                isRecurring: false
            });
        }
    }

    // Need a dummy project
    const project = await prisma.project.create({
        data: {
            name: 'Benchmark Project',
            clientId: (await prisma.client.create({
                data: {
                    name: 'Benchmark Client',
                    productId: (await prisma.product.create({ data: { name: 'Benchmark Product' } })).id
                }
            })).id,
            projectType: 'web',
            startDate: new Date(),
            status: 'active'
        }
    });

    // Fix project Id in issues
    issuesData.forEach(i => i.projectId = project.id);

    // Batch insert issues to speed up seeding
    const chunkSize = 500;
    for (let i = 0; i < issuesData.length; i += chunkSize) {
        const chunk = issuesData.slice(i, i + chunkSize);
        await prisma.issue.createMany({
            data: chunk
        });
        if (i % 5000 === 0) console.log(`Inserted ${i} issues...`);
    }

    console.log(`Total issues: ${await prisma.issue.count()}`);
    console.log('🎉 Benchmark seed completed!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
