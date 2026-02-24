import { PrismaClient } from '@prisma/client';
import path from 'path';
import os from 'os';

// Initialize Prisma with production database
const dbPath = path.join(
    os.homedir(),
    'Library',
    'Application Support',
    'devpulse',
    'devpulse.db'
);

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: `file:${dbPath}`
        }
    }
});

async function resetAndSeedData() {
    console.log('🔄 Resetting and seeding comprehensive test data...\n');

    try {
        // Step 1: Clear all existing issues
        console.log('🗑️  Clearing existing issues...');
        const deleteResult = await prisma.issue.deleteMany({});
        console.log(`✅ Deleted ${deleteResult.count} existing issues\n`);

        // Step 2: Get all projects
        const projects = await prisma.project.findMany({
            include: {
                client: {
                    include: { product: true }
                },
                features: true,
                developers: {
                    include: { developer: true }
                }
            }
        });

        if (projects.length === 0) {
            console.error('❌ No projects found. Please create projects first.');
            return;
        }

        console.log(`📊 Found ${projects.length} projects\n`);

        // Step 3: Get all developers
        const allDevelopers = await prisma.developer.findMany();
        console.log(`👨‍💻 Found ${allDevelopers.length} developers\n`);

        if (allDevelopers.length === 0) {
            console.error('❌ No developers found. Please create developers first.');
            return;
        }

        // Step 4: Create features for each project (if missing)
        console.log('📦 Ensuring features exist for all projects...');

        for (const project of projects) {
            if (project.features.length === 0) {
                // Create default features
                await prisma.feature.createMany({
                    data: [
                        {
                            name: 'Authentication',
                            description: 'User login and security',
                            projectId: project.id,
                        },
                        {
                            name: 'Core Functionality',
                            description: 'Main business logic',
                            projectId: project.id,
                        },
                        {
                            name: 'User Interface',
                            description: 'Frontend and UX',
                            projectId: project.id,
                        },
                    ]
                });
                console.log(`  ✅ Created features for ${project.name}`);
            }
        }

        // Reload projects with features
        const projectsWithFeatures = await prisma.project.findMany({
            include: {
                features: true,
                developers: {
                    include: { developer: true }
                }
            }
        });

        console.log('✅ All projects have features\n');

        // Step 5: Create realistic issues for EACH project
        console.log('🐛 Creating comprehensive test issues...\n');

        let totalIssues = 0;

        for (const project of projectsWithFeatures) {
            console.log(`📝 Creating issues for: ${project.name}`);

            const projectDevelopers = project.developers.map(d => d.developer);
            const devs = projectDevelopers.length > 0 ? projectDevelopers : allDevelopers.slice(0, 2);

            const projectFeatures = project.features;

            // Create 15-20 issues per project with varied patterns
            const issueTemplates = [
                // Critical bugs (some resolved, some open)
                {
                    title: 'Critical: Database connection timeout',
                    description: 'Database connections timing out under load',
                    severity: 'critical',
                    status: 'resolved',
                    resolutionTime: 18,
                    fixQuality: 4,
                    isRecurring: true,
                },
                {
                    title: 'System crash on startup',
                    description: 'Application crashes when launched',
                    severity: 'critical',
                    status: 'open',
                },
                {
                    title: 'Data loss on save operation',
                    description: 'User data lost when saving',
                    severity: 'critical',
                    status: 'in_progress',
                },

                // High priority bugs
                {
                    title: 'Performance degradation',
                    description: 'System becoming slow over time',
                    severity: 'high',
                    status: 'resolved',
                    resolutionTime: 24,
                    fixQuality: 3,
                },
                {
                    title: 'Memory leak detected',
                    description: 'Memory usage continuously increasing',
                    severity: 'high',
                    status: 'resolved',
                    resolutionTime: 16,
                    fixQuality: 5,
                    isRecurring: false,
                },
                {
                    title: 'API rate limit exceeded',
                    description: 'Hitting API rate limits',
                    severity: 'high',
                    status: 'in_progress',
                },
                {
                    title: 'Session management issues',
                    description: 'Users logged out unexpectedly',
                    severity: 'high',
                    status: 'open',
                },

                // Medium priority
                {
                    title: 'UI alignment issues',
                    description: 'Layout broken on certain screens',
                    severity: 'medium',
                    status: 'resolved',
                    resolutionTime: 6,
                    fixQuality: 4,
                },
                {
                    title: 'Validation error messages unclear',
                    description: 'Form validation messages confusing',
                    severity: 'medium',
                    status: 'resolved',
                    resolutionTime: 4,
                    fixQuality: 5,
                },
                {
                    title: 'Search functionality slow',
                    description: 'Search takes too long to complete',
                    severity: 'medium',
                    status: 'open',
                },
                {
                    title: 'Export feature not working',
                    description: 'CSV export generates empty files',
                    severity: 'medium',
                    status: 'in_progress',
                },

                // Low priority
                {
                    title: 'Minor CSS glitch',
                    description: 'Small visual inconsistency',
                    severity: 'low',
                    status: 'resolved',
                    resolutionTime: 2,
                    fixQuality: 5,
                },
                {
                    title: 'Tooltip text typo',
                    description: 'Spelling mistake in tooltip',
                    severity: 'low',
                    status: 'resolved',
                    resolutionTime: 1,
                    fixQuality: 5,
                },
                {
                    title: 'Documentation outdated',
                    description: 'Help docs need updating',
                    severity: 'low',
                    status: 'open',
                },

                // Recurring issues (hotspot indicators)
                {
                    title: 'Authentication token refresh fails',
                    description: 'Token refresh mechanism broken',
                    severity: 'high',
                    status: 'resolved',
                    resolutionTime: 12,
                    fixQuality: 3,
                    isRecurring: true,
                },
                {
                    title: 'Cache invalidation problem',
                    description: 'Stale data displayed after updates',
                    severity: 'medium',
                    status: 'resolved',
                    resolutionTime: 8,
                    fixQuality: 3,
                    isRecurring: true,
                },
            ];

            // Create issues with features rotation
            for (let i = 0; i < issueTemplates.length; i++) {
                const template = issueTemplates[i];
                const assignedDev = devs[i % devs.length];
                const feature = projectFeatures[i % projectFeatures.length];

                await prisma.issue.create({
                    data: {
                        title: `[${project.name}] ${template.title}`,
                        description: template.description,
                        severity: template.severity,
                        status: template.status,
                        projectId: project.id,
                        featureId: feature.id,
                        assignedToId: assignedDev.id,
                        resolutionTime: template.resolutionTime,
                        fixQuality: template.fixQuality,
                        isRecurring: template.isRecurring || false,
                        resolvedAt: template.status === 'resolved' ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) : null,
                        createdAt: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000), // Last 60 days
                    }
                });
                totalIssues++;
            }

            console.log(`  ✅ Created ${issueTemplates.length} issues for ${project.name}`);
        }

        console.log(`\n📊 Data Seeding Complete!\n`);
        console.log('='.repeat(60));
        console.log(`✅ Total projects: ${projects.length}`);
        console.log(`✅ Total developers: ${allDevelopers.length}`);
        console.log(`✅ Total issues created: ${totalIssues}`);
        console.log(`✅ Features per project: ${projectsWithFeatures[0].features.length}`);
        console.log('='.repeat(60));

        // Summary by severity
        const criticalCount = await prisma.issue.count({ where: { severity: 'critical' } });
        const highCount = await prisma.issue.count({ where: { severity: 'high' } });
        const mediumCount = await prisma.issue.count({ where: { severity: 'medium' } });
        const lowCount = await prisma.issue.count({ where: { severity: 'low' } });

        console.log('\n📈 Issue Distribution:');
        console.log(`  🔴 Critical: ${criticalCount}`);
        console.log(`  🟠 High: ${highCount}`);
        console.log(`  🟡 Medium: ${mediumCount}`);
        console.log(`  🟢 Low: ${lowCount}`);

        const resolvedCount = await prisma.issue.count({ where: { status: 'resolved' } });
        const inProgressCount = await prisma.issue.count({ where: { status: 'in_progress' } });
        const openCount = await prisma.issue.count({ where: { status: 'open' } });

        console.log('\n📊 Issue Status:');
        console.log(`  ✅ Resolved: ${resolvedCount}`);
        console.log(`  🔄 In Progress: ${inProgressCount}`);
        console.log(`  📋 Open: ${openCount}`);

        const recurringCount = await prisma.issue.count({ where: { isRecurring: true } });
        console.log(`\n🔄 Recurring Issues: ${recurringCount}`);

        console.log('\n\n🎉 All test data created successfully!');
        console.log('\n💡 Now check:');
        console.log('  - 📊 Performance Dashboard');
        console.log('  - 🤖 ML Insights (should show multiple hotspots!)');
        console.log('  - 📈 Analytics');
        console.log('  - 👨‍💻 Developer stats');
        console.log('\n');

    } catch (error) {
        console.error('❌ Error seeding data:', error);
    } finally {
        await prisma.$disconnect();
    }
}

resetAndSeedData();
