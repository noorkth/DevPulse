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

async function seedTestData() {
    console.log('🌱 Starting test data seeding...\n');

    try {
        // Get existing product/client/project
        const existingProject = await prisma.project.findFirst({
            include: { client: { include: { product: true } } }
        });

        if (!existingProject) {
            console.error('❌ No existing project found. Please create a project first.');
            return;
        }

        console.log(`✅ Using project: ${existingProject.name}`);

        // Create 3 developers (or reuse existing)
        console.log('\n👨‍💻 Creating developers...');

        const backendDev = await prisma.developer.upsert({
            where: { email: 'rajesh.kumar@devpulse.local' },
            update: {},
            create: {
                fullName: 'Rajesh Kumar',
                email: 'rajesh.kumar@devpulse.local',
                skills: 'Node.js, Express, PostgreSQL, MongoDB, REST APIs, GraphQL',
                seniorityLevel: 'senior',
            }
        });
        console.log(`✅ Backend Developer: ${backendDev.fullName}`);

        const frontendDev = await prisma.developer.upsert({
            where: { email: 'priya.sharma@devpulse.local' },
            update: {},
            create: {
                fullName: 'Priya Sharma',
                email: 'priya.sharma@devpulse.local',
                skills: 'React, TypeScript, CSS, Redux, Webpack, Next.js',
                seniorityLevel: 'mid',
            }
        });
        console.log(`✅ Frontend Developer: ${frontendDev.fullName}`);

        const appDev = await prisma.developer.upsert({
            where: { email: 'amit.thapa@devpulse.local' },
            update: {},
            create: {
                fullName: 'Amit Thapa',
                email: 'amit.thapa@devpulse.local',
                skills: 'React Native, Flutter, iOS, Android, Mobile UI/UX',
                seniorityLevel: 'senior',
            }
        });
        console.log(`✅ App Developer: ${appDev.fullName}`);

        // Assign developers to project using junction table
        await prisma.developerProject.createMany({
            data: [
                { developerId: backendDev.id, projectId: existingProject.id },
                { developerId: frontendDev.id, projectId: existingProject.id },
                { developerId: appDev.id, projectId: existingProject.id },
            ]
        });
        console.log('✅ Developers assigned to project');

        // Create features
        console.log('\n📦 Creating features...');

        const authFeature = await prisma.feature.create({
            data: {
                name: 'Authentication Module',
                description: 'User login, registration, password reset',
                projectId: existingProject.id,
            }
        });

        const paymentFeature = await prisma.feature.create({
            data: {
                name: 'Payment Processing',
                description: 'Payment gateway integration, transactions',
                projectId: existingProject.id,
            }
        });

        const dashboardFeature = await prisma.feature.create({
            data: {
                name: 'Dashboard & Analytics',
                description: 'User dashboard with charts and reports',
                projectId: existingProject.id,
            }
        });

        console.log(`✅ Created ${3} features`);

        // Create realistic issues with patterns (for hotspot detection)
        console.log('\n🐛 Creating test issues...');

        const developers = [backendDev, frontendDev, appDev];
        let issueCount = 0;

        // Authentication Module - HIGH BUG DENSITY (Hotspot!)
        const authIssues = [
            {
                title: 'Login fails with special characters in password',
                description: 'Users cannot login when password contains special characters like @#$',
                severity: 'critical',
                status: 'resolved',
                featureId: authFeature.id,
                assignedToId: backendDev.id,
                resolutionTime: 8,
                fixQuality: 3,
                isRecurring: true,
            },
            {
                title: 'Session timeout not working correctly',
                description: 'User sessions expire too quickly or not at all',
                severity: 'high',
                status: 'resolved',
                featureId: authFeature.id,
                assignedToId: backendDev.id,
                resolutionTime: 12,
                fixQuality: 4,
                isRecurring: false,
            },
            {
                title: 'Password reset email not sent',
                description: 'Password reset emails are not being delivered',
                severity: 'critical',
                status: 'in_progress',
                featureId: authFeature.id,
                assignedToId: backendDev.id,
            },
            {
                title: 'JWT token validation fails',
                description: 'Token validation throws errors intermittently',
                severity: 'high',
                status: 'open',
                featureId: authFeature.id,
                assignedToId: backendDev.id,
            },
            {
                title: 'Login button not responsive',
                description: 'Login button requires multiple clicks',
                severity: 'medium',
                status: 'resolved',
                featureId: authFeature.id,
                assignedToId: frontendDev.id,
                resolutionTime: 4,
                fixQuality: 5,
            },
            {
                title: 'OAuth integration broken',
                description: 'Google OAuth redirect fails',
                severity: 'critical',
                status: 'open',
                featureId: authFeature.id,
                assignedToId: backendDev.id,
            },
        ];

        for (const issue of authIssues) {
            await prisma.issue.create({
                data: {
                    ...issue,
                    projectId: existingProject.id,
                    resolvedAt: issue.status === 'resolved' ? new Date() : null,
                }
            });
            issueCount++;
        }

        // Payment Processing - VERY HIGH RISK (Critical Hotspot!)
        const paymentIssues = [
            {
                title: 'Payment gateway timeout',
                description: 'Payments fail due to gateway timeout',
                severity: 'critical',
                status: 'resolved',
                featureId: paymentFeature.id,
                assignedToId: backendDev.id,
                resolutionTime: 24,
                fixQuality: 4,
                isRecurring: true,
            },
            {
                title: 'Double charging users',
                description: 'Users are being charged twice for single transaction',
                severity: 'critical',
                status: 'resolved',
                featureId: paymentFeature.id,
                assignedToId: backendDev.id,
                resolutionTime: 16,
                fixQuality: 3,
                isRecurring: true,
            },
            {
                title: 'Payment confirmation email missing',
                description: 'Users not receiving payment confirmation',
                severity: 'high',
                status: 'in_progress',
                featureId: paymentFeature.id,
                assignedToId: backendDev.id,
            },
            {
                title: 'Refund processing fails',
                description: 'Refund requests are not being processed',
                severity: 'critical',
                status: 'open',
                featureId: paymentFeature.id,
                assignedToId: backendDev.id,
            },
            {
                title: 'Currency conversion error',
                description: 'Wrong exchange rates applied',
                severity: 'high',
                status: 'resolved',
                featureId: paymentFeature.id,
                assignedToId: backendDev.id,
                resolutionTime: 10,
                fixQuality: 4,
            },
            {
                title: 'Payment UI freezes',
                description: 'Payment form becomes unresponsive',
                severity: 'high',
                status: 'open',
                featureId: paymentFeature.id,
                assignedToId: frontendDev.id,
            },
        ];

        for (const issue of paymentIssues) {
            await prisma.issue.create({
                data: {
                    ...issue,
                    projectId: existingProject.id,
                    resolvedAt: issue.status === 'resolved' ? new Date() : null,
                }
            });
            issueCount++;
        }

        // Dashboard - Moderate issues
        const dashboardIssues = [
            {
                title: 'Chart rendering slow',
                description: 'Charts take too long to load',
                severity: 'medium',
                status: 'resolved',
                featureId: dashboardFeature.id,
                assignedToId: frontendDev.id,
                resolutionTime: 6,
                fixQuality: 5,
            },
            {
                title: 'Export PDF broken',
                description: 'PDF export generates corrupt files',
                severity: 'high',
                status: 'resolved',
                featureId: dashboardFeature.id,
                assignedToId: frontendDev.id,
                resolutionTime: 8,
                fixQuality: 4,
            },
            {
                title: 'Mobile dashboard layout broken',
                description: 'Dashboard not responsive on mobile',
                severity: 'medium',
                status: 'open',
                featureId: dashboardFeature.id,
                assignedToId: appDev.id,
            },
        ];

        for (const issue of dashboardIssues) {
            await prisma.issue.create({
                data: {
                    ...issue,
                    projectId: existingProject.id,
                    resolvedAt: issue.status === 'resolved' ? new Date() : null,
                }
            });
            issueCount++;
        }

        console.log(`✅ Created ${issueCount} test issues`);

        // Summary
        console.log('\n📊 Seed Summary:');
        console.log(`✅ 3 Developers created`);
        console.log(`✅ 3 Features created`);
        console.log(`✅ ${issueCount} Issues created`);
        console.log(`✅ Multiple hotspots configured:`);
        console.log(`   - 🔥 Authentication (6 bugs, 2 critical)`);
        console.log(`   - 🔥🔥 Payment Processing (6 bugs, 4 critical, recurring)`);
        console.log(`   - ⚡ Dashboard (3 bugs, moderate)`);

        console.log('\n🎉 Test data seeded successfully!');
        console.log('\n💡 Now navigate to ML Insights page to see hotspots!');

    } catch (error) {
        console.error('❌ Error seeding data:', error);
    } finally {
        await prisma.$disconnect();
    }
}

seedTestData();
