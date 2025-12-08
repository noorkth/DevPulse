import { PrismaClient } from '@prisma/client';
import path from 'path';
import os from 'os';

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

async function updateTeamAndSeedData() {
    console.log('🔄 Updating team details and creating realistic test data...\n');

    try {
        // Step 1: Update all developers with correct details
        console.log('👨‍💻 Updating developer details...\n');

        const developers = await prisma.developer.findMany();

        // Developer profiles with correct details
        const developerProfiles = [
            {
                fullName: 'Kabina Suwal',
                email: 'kabina.suwal@devpulse.local',
                skills: 'Node.js, Express, NestJS, PostgreSQL, MongoDB, Redis, Docker, Kubernetes, Microservices, GraphQL, REST APIs',
                seniorityLevel: 'lead',
                specialty: 'backend'
            },
            {
                fullName: 'Rojil Shrestha',
                email: 'rojil.shrestha@devpulse.local',
                skills: 'React, Next.js, TypeScript, Redux, Zustand, Tailwind CSS, Webpack, Vite, HTML5, CSS3, Responsive Design',
                seniorityLevel: 'lead',
                specialty: 'frontend'
            },
            {
                fullName: 'Ananda Rai',
                email: 'ananda.rai@devpulse.local',
                skills: 'Swift, SwiftUI, UIKit, Objective-C, Core Data, Combine, Xcode, iOS SDK, App Store, TestFlight',
                seniorityLevel: 'principal',
                specialty: 'ios'
            },
            {
                fullName: 'Niroj Maharjan',
                email: 'niroj.maharjan@devpulse.local',
                skills: 'React Native, Flutter, Dart, Android Studio, Mobile UI/UX, Firebase, Push Notifications, App Distribution',
                seniorityLevel: 'principal',
                specialty: 'mobile'
            },
            {
                fullName: 'Noor Khatri',
                email: 'noor.khatri@devpulse.local',
                skills: 'Full Stack, React, Node.js, TypeScript, PostgreSQL, MongoDB, AWS, Docker, CI/CD, System Design, Architecture',
                seniorityLevel: 'senior',
                specialty: 'fullstack'
            },
        ];

        // Update each developer (without specialty field)
        for (let i = 0; i < Math.min(developers.length, developerProfiles.length); i++) {
            const { specialty, ...dbFields } = developerProfiles[i];
            await prisma.developer.update({
                where: { id: developers[i].id },
                data: dbFields
            });
            console.log(`  ✅ Updated: ${developerProfiles[i].fullName} - ${developerProfiles[i].seniorityLevel} ${specialty}`);
        }

        // Get updated developers
        const updatedDevelopers = await prisma.developer.findMany();

        // Map developers by specialty (using local mapping, not DB field)
        const devsBySpecialty: Record<string, any> = {};
        for (const dev of updatedDevelopers) {
            const profile = developerProfiles.find(p => p.email === dev.email);
            if (profile) {
                devsBySpecialty[profile.specialty] = dev;
            }
        }

        console.log('\n📊 Team updated successfully!\n');

        // Step 2: Clear existing issues
        console.log('🗑️  Clearing existing issues...');
        await prisma.issue.deleteMany({});
        console.log('✅ Issues cleared\n');

        // Step 3: Get all projects
        const projects = await prisma.project.findMany({
            include: {
                features: true,
                client: {
                    include: { product: true }
                }
            }
        });

        console.log(`📂 Found ${projects.length} projects\n`);

        // Ensure all projects have features
        for (const project of projects) {
            if (project.features.length === 0) {
                await prisma.feature.createMany({
                    data: [
                        { name: 'Core Functionality', projectId: project.id },
                        { name: 'User Interface', projectId: project.id },
                        { name: 'Backend Services', projectId: project.id },
                    ]
                });
            }
        }

        // Reload projects with features
        const projectsWithFeatures = await prisma.project.findMany({
            include: { features: true }
        });

        // Step 4: Assign developers to all projects
        console.log('🔗 Assigning developers to projects...');

        for (const project of projectsWithFeatures) {
            // Clear existing assignments for this project
            await prisma.developerProject.deleteMany({
                where: { projectId: project.id }
            });

            // Assign all 5 developers to each project
            for (const dev of updatedDevelopers) {
                await prisma.developerProject.create({
                    data: {
                        developerId: dev.id,
                        projectId: project.id,
                    }
                });
            }
            console.log(`  ✅ Assigned 5 developers to ${project.name}`);
        }

        console.log('✅ All developers assigned to all projects\n');

        // Step 5: Create realistic issues with smart developer assignment
        console.log('🐛 Creating realistic test issues...\n');

        let totalIssues = 0;

        for (const project of projectsWithFeatures) {
            console.log(`📝 Creating issues for: ${project.name}`);

            const projectType = project.projectType.toLowerCase();
            const features = project.features;

            // Determine which developers should work on this project
            let primaryDevs: any[] = [];

            if (projectType.includes('ios')) {
                primaryDevs = [devsBySpecialty.ios, devsBySpecialty.fullstack, devsBySpecialty.backend];
            } else if (projectType.includes('mobile') || projectType.includes('app')) {
                primaryDevs = [devsBySpecialty.mobile, devsBySpecialty.fullstack, devsBySpecialty.backend];
            } else if (projectType.includes('web') || projectType.includes('ott')) {
                primaryDevs = [devsBySpecialty.frontend, devsBySpecialty.backend, devsBySpecialty.fullstack];
            } else if (projectType.includes('api') || projectType.includes('backend')) {
                primaryDevs = [devsBySpecialty.backend, devsBySpecialty.fullstack];
            } else {
                // Default: use all devs
                primaryDevs = updatedDevelopers;
            }

            // Issue templates with realistic scenarios
            const issueTemplates = [
                // Backend issues
                {
                    title: 'Database query optimization needed',
                    description: 'Slow queries causing performance issues',
                    severity: 'high',
                    status: 'resolved',
                    developer: devsBySpecialty.backend,
                    resolutionTime: 16,
                    fixQuality: 5,
                },
                {
                    title: 'API response time degradation',
                    description: 'API endpoints taking longer than expected',
                    severity: 'critical',
                    status: 'resolved',
                    developer: devsBySpecialty.backend,
                    resolutionTime: 24,
                    fixQuality: 4,
                    isRecurring: true,
                },
                {
                    title: 'Redis cache invalidation issue',
                    description: 'Stale cache data being served',
                    severity: 'high',
                    status: 'in_progress',
                    developer: devsBySpecialty.backend,
                },

                // Frontend issues
                {
                    title: 'UI rendering performance',
                    description: 'Components re-rendering unnecessarily',
                    severity: 'medium',
                    status: 'resolved',
                    developer: devsBySpecialty.frontend,
                    resolutionTime: 8,
                    fixQuality: 5,
                },
                {
                    title: 'CSS layout broken on mobile',
                    description: 'Responsive design issues',
                    severity: 'high',
                    status: 'resolved',
                    developer: devsBySpecialty.frontend,
                    resolutionTime: 6,
                    fixQuality: 4,
                },
                {
                    title: 'State management bug',
                    description: 'Redux store not updating correctly',
                    severity: 'critical',
                    status: 'open',
                    developer: devsBySpecialty.frontend,
                },

                // iOS specific
                {
                    title: 'Memory leak in iOS app',
                    description: 'App memory usage increasing over time',
                    severity: 'critical',
                    status: 'resolved',
                    developer: devsBySpecialty.ios,
                    resolutionTime: 20,
                    fixQuality: 5,
                },
                {
                    title: 'SwiftUI view not updating',
                    description: 'State changes not reflected in UI',
                    severity: 'high',
                    status: 'in_progress',
                    developer: devsBySpecialty.ios,
                },

                // Mobile app issues
                {
                    title: 'React Native crash on Android',
                    description: 'App crashes on certain Android versions',
                    severity: 'critical',
                    status: 'resolved',
                    developer: devsBySpecialty.mobile,
                    resolutionTime: 18,
                    fixQuality: 4,
                    isRecurring: true,
                },
                {
                    title: 'Push notification not working',
                    description: 'Users not receiving notifications',
                    severity: 'high',
                    status: 'open',
                    developer: devsBySpecialty.mobile,
                },

                // Full stack issues
                {
                    title: 'End-to-end authentication flow broken',
                    description: 'Login/logout cycle has issues',
                    severity: 'critical',
                    status: 'resolved',
                    developer: devsBySpecialty.fullstack,
                    resolutionTime: 22,
                    fixQuality: 5,
                },
                {
                    title: 'Integration test failures',
                    description: 'Multiple integration tests failing',
                    severity: 'high',
                    status: 'in_progress',
                    developer: devsBySpecialty.fullstack,
                },
                {
                    title: 'Docker deployment issue',
                    description: 'Container failing to start in production',
                    severity: 'critical',
                    status: 'open',
                    developer: devsBySpecialty.fullstack,
                },

                // General issues distributed among team
                {
                    title: 'Performance monitoring setup',
                    description: 'Need to add performance tracking',
                    severity: 'medium',
                    status: 'resolved',
                    developer: devsBySpecialty.fullstack,
                    resolutionTime: 10,
                    fixQuality: 4,
                },
                {
                    title: 'Security vulnerability patching',
                    description: 'Dependencies need security updates',
                    severity: 'high',
                    status: 'resolved',
                    developer: devsBySpecialty.backend,
                    resolutionTime: 12,
                    fixQuality: 5,
                },
                {
                    title: 'Code review findings',
                    description: 'Several code quality issues found',
                    severity: 'medium',
                    status: 'open',
                    developer: primaryDevs[0],
                },
                {
                    title: 'Documentation update required',
                    description: 'API docs out of sync with implementation',
                    severity: 'low',
                    status: 'resolved',
                    developer: devsBySpecialty.backend,
                    resolutionTime: 4,
                    fixQuality: 5,
                },
                {
                    title: 'Unit test coverage low',
                    description: 'Need to increase test coverage',
                    severity: 'medium',
                    status: 'in_progress',
                    developer: primaryDevs[1] || devsBySpecialty.fullstack,
                },
            ];

            // Create issues
            for (let i = 0; i < issueTemplates.length; i++) {
                const template = issueTemplates[i];
                const feature = features[i % features.length];
                const assignedDev = template.developer || primaryDevs[i % primaryDevs.length];

                if (assignedDev) {
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
                            resolvedAt: template.status === 'resolved'
                                ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
                                : null,
                            createdAt: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000),
                        }
                    });
                    totalIssues++;
                }
            }

            console.log(`  ✅ Created ${issueTemplates.length} issues for ${project.name}`);
        }

        // Final statistics
        console.log(`\n${'='.repeat(70)}`);
        console.log('📊 COMPREHENSIVE DATA UPDATE COMPLETE!');
        console.log('='.repeat(70));

        console.log('\n👥 Team Roster:');
        console.log('  1. Kabina Suwal - Lead Backend Developer');
        console.log('  2. Rojil Shrestha - Lead Frontend Developer');
        console.log('  3. Ananda Rai - Principal iOS Developer');
        console.log('  4. Niroj Maharjan - Principal Mobile App Developer');
        console.log('  5. Noor Khatri - Senior Full Stack Developer');

        console.log(`\n📈 Statistics:`);
        console.log(`  ✅ Total Projects: ${projects.length}`);
        console.log(`  ✅ Total Issues Created: ${totalIssues}`);
        console.log(`  ✅ All developers assigned to all projects`);

        const criticalCount = await prisma.issue.count({ where: { severity: 'critical' } });
        const highCount = await prisma.issue.count({ where: { severity: 'high' } });
        const mediumCount = await prisma.issue.count({ where: { severity: 'medium' } });
        const lowCount = await prisma.issue.count({ where: { severity: 'low' } });

        console.log('\n🎯 Severity Distribution:');
        console.log(`  🔴 Critical: ${criticalCount}`);
        console.log(`  🟠 High: ${highCount}`);
        console.log(`  🟡 Medium: ${mediumCount}`);
        console.log(`  🟢 Low: ${lowCount}`);

        const resolvedCount = await prisma.issue.count({ where: { status: 'resolved' } });
        const inProgressCount = await prisma.issue.count({ where: { status: 'in_progress' } });
        const openCount = await prisma.issue.count({ where: { status: 'open' } });

        console.log('\n📊 Status Distribution:');
        console.log(`  ✅ Resolved: ${resolvedCount}`);
        console.log(`  🔄 In Progress: ${inProgressCount}`);
        console.log(`  📋 Open: ${openCount}`);

        console.log('\n💡 Issues assigned by developer expertise:');
        console.log('  - Backend issues → Kabina');
        console.log('  - Frontend issues → Rojil');
        console.log('  - iOS issues → Ananda');
        console.log('  - Mobile issues → Niroj');
        console.log('  - Full Stack issues → Noor');

        console.log('\n\n🎉 Your real team is ready with realistic data!');
        console.log('\n🚀 Check out:');
        console.log('  📊 Performance Dashboard - See team metrics');
        console.log('  🤖 ML Insights - Hotspot detection');
        console.log('  👨‍💻 Developers - Your actual team!');
        console.log('  📈 Analytics - Project insights\n');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

updateTeamAndSeedData();
