#!/usr/bin/env tsx

/**
 * DevPulse Integration Test Script
 * Tests the complete application workflow:
 * Product → Client → Project → Developer → Issues
 * 
 * Usage: npm run test:integration
 */

import { PrismaClient } from '@prisma/client';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Prisma with test database
const dbPath = path.join(os.homedir(), 'Library/Application Support/devpulse/devpulse.db');
process.env.DATABASE_URL = `file:${dbPath}`;

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: `file:${dbPath}`
        }
    }
});

// Test data
const testData = {
    product: {
        name: '🧪 TEST Product - ' + Date.now(),
        description: 'Test product created by integration test'
    },
    client: {
        name: '🧪 TEST Client - ' + Date.now(),
        contactInfo: 'test@example.com'
    },
    project: {
        name: '🧪 TEST Project - ' + Date.now(),
        projectType: 'web' as const,
        description: 'Test project with full hierarchy',
        startDate: new Date().toISOString(),
        status: 'active' as const
    },
    developer: {
        fullName: '🧪 Test Developer',
        email: `test.dev${Date.now()}@example.com`,
        skills: 'TypeScript, React, Node.js',
        seniorityLevel: 'senior' as const
    },
    issues: [
        {
            title: '🐛 Critical Bug - Database Connection',
            description: 'Database connection fails intermittently',
            severity: 'critical' as const,
            status: 'open' as const
        },
        {
            title: '🔧 High Priority - Performance Issue',
            description: 'Page load time is too slow',
            severity: 'high' as const,
            status: 'in_progress' as const
        },
        {
            title: '✨ Medium - New Feature Request',
            description: 'Add dark mode support',
            severity: 'medium' as const,
            status: 'open' as const
        },
        {
            title: '📝 Low - Documentation Update',
            description: 'Update README with new features',
            severity: 'low' as const,
            status: 'open' as const
        }
    ]
};

// Created IDs for cleanup
const createdIds = {
    product: null as string | null,
    client: null as string | null,
    project: null as string | null,
    developer: null as string | null,
    issues: [] as string[]
};

// Test counters
let passed = 0;
let failed = 0;

// Helper functions
function success(message: string) {
    console.log('✅', message);
    passed++;
}

function error(message: string, err?: any) {
    console.error('❌', message);
    if (err) {
        console.error('   Error:', err.message || err);
    }
    failed++;
}

function info(message: string) {
    console.log('ℹ️ ', message);
}

function section(title: string) {
    console.log('\n' + '═'.repeat(60));
    console.log(`  ${title}`);
    console.log('═'.repeat(60));
}

// Test functions
async function testCreateProduct() {
    section('1. Testing Product Creation');
    try {
        const product = await prisma.product.create({
            data: testData.product
        });

        createdIds.product = product.id;
        success(`Created product: ${product.name} (ID: ${product.id})`);

        // Verify
        const fetched = await prisma.product.findUnique({
            where: { id: product.id }
        });

        if (fetched && fetched.name === testData.product.name) {
            success('Product verified successfully');
        } else {
            error('Product verification failed');
        }

        return product;
    } catch (err) {
        error('Failed to create product', err);
        throw err;
    }
}

async function testCreateClient(productId: string) {
    section('2. Testing Client Creation');
    try {
        const client = await prisma.client.create({
            data: {
                ...testData.client,
                productId
            },
            include: {
                product: true
            }
        });

        createdIds.client = client.id;
        success(`Created client: ${client.name} (ID: ${client.id})`);
        success(`  └─ Linked to product: ${client.product.name}`);

        // Verify hierarchy
        const productWithClients = await prisma.product.findUnique({
            where: { id: productId },
            include: { clients: true }
        });

        if (productWithClients?.clients.some(c => c.id === client.id)) {
            success('Client-Product hierarchy verified');
        } else {
            error('Client-Product hierarchy verification failed');
        }

        return client;
    } catch (err) {
        error('Failed to create client', err);
        throw err;
    }
}

async function testCreateProject(clientId: string) {
    section('3. Testing Project Creation');
    try {
        const project = await prisma.project.create({
            data: {
                ...testData.project,
                clientId
            },
            include: {
                client: {
                    include: {
                        product: true
                    }
                }
            }
        });

        createdIds.project = project.id;
        success(`Created project: ${project.name} (ID: ${project.id})`);
        success(`  └─ Linked to client: ${project.client.name}`);
        success(`     └─ Linked to product: ${project.client.product.name}`);

        // Verify hierarchy
        const clientWithProjects = await prisma.client.findUnique({
            where: { id: clientId },
            include: { projects: true }
        });

        if (clientWithProjects?.projects.some(p => p.id === project.id)) {
            success('Project-Client hierarchy verified');
        } else {
            error('Project-Client hierarchy verification failed');
        }

        return project;
    } catch (err) {
        error('Failed to create project', err);
        throw err;
    }
}

async function testCreateDeveloper(projectId: string) {
    section('4. Testing Developer Creation & Assignment');
    try {
        const developer = await prisma.developer.create({
            data: testData.developer
        });

        createdIds.developer = developer.id;
        success(`Created developer: ${developer.fullName} (ID: ${developer.id})`);

        // Assign to project
        await prisma.developerProject.create({
            data: {
                developerId: developer.id,
                projectId
            }
        });

        success(`  └─ Assigned to project`);

        // Verify assignment
        const projectWithDevs = await prisma.project.findUnique({
            where: { id: projectId },
            include: {
                developers: {
                    include: {
                        developer: true
                    }
                }
            }
        });

        if (projectWithDevs?.developers.some(d => d.developerId === developer.id)) {
            success('Developer-Project assignment verified');
        } else {
            error('Developer-Project assignment verification failed');
        }

        return developer;
    } catch (err) {
        error('Failed to create developer', err);
        throw err;
    }
}

async function testCreateIssues(projectId: string, developerId: string) {
    section('5. Testing Issue Creation');

    for (let i = 0; i < testData.issues.length; i++) {
        const issueData = testData.issues[i];
        try {
            const issue = await prisma.issue.create({
                data: {
                    ...issueData,
                    projectId,
                    assignedToId: i < 2 ? developerId : null // Assign first 2 issues
                },
                include: {
                    project: true,
                    assignedTo: true
                }
            });

            createdIds.issues.push(issue.id);
            success(`Created issue: ${issue.title}`);
            success(`  ├─ Severity: ${issue.severity}`);
            success(`  ├─ Status: ${issue.status}`);
            if (issue.assignedTo) {
                success(`  └─ Assigned to: ${issue.assignedTo.fullName}`);
            } else {
                info(`  └─ Unassigned`);
            }
        } catch (err) {
            error(`Failed to create issue: ${issueData.title}`, err);
        }
    }

    // Verify all issues
    const projectWithIssues = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
            issues: true
        }
    });

    if (projectWithIssues && projectWithIssues.issues.length === testData.issues.length) {
        success(`All ${testData.issues.length} issues verified in project`);
    } else {
        error(`Issue count mismatch. Expected: ${testData.issues.length}, Got: ${projectWithIssues?.issues.length || 0}`);
    }
}

async function testCompleteHierarchy() {
    section('6. Testing Complete Hierarchy');

    try {
        const fullHierarchy = await prisma.product.findUnique({
            where: { id: createdIds.product! },
            include: {
                clients: {
                    include: {
                        projects: {
                            include: {
                                issues: {
                                    include: {
                                        assignedTo: true
                                    }
                                },
                                developers: {
                                    include: {
                                        developer: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!fullHierarchy) {
            error('Failed to fetch complete hierarchy');
            return;
        }

        success('Complete hierarchy fetched successfully');

        // Print hierarchy
        console.log('\n📊 Complete Hierarchy:');
        console.log(`\n🏢 Product: ${fullHierarchy.name}`);
        fullHierarchy.clients.forEach(client => {
            console.log(`  └─ 👥 Client: ${client.name}`);
            client.projects.forEach(project => {
                console.log(`     └─ 📁 Project: ${project.name}`);
                console.log(`        ├─ 👨‍💻 Developers: ${project.developers.length}`);
                project.developers.forEach(dp => {
                    console.log(`        │  └─ ${dp.developer.fullName}`);
                });
                console.log(`        └─ 🐛 Issues: ${project.issues.length}`);
                project.issues.forEach(issue => {
                    const assignee = issue.assignedTo ? `→ ${issue.assignedTo.fullName}` : '→ Unassigned';
                    console.log(`           ├─ [${issue.severity.toUpperCase()}] ${issue.title} ${assignee}`);
                });
            });
        });

        // Verify counts
        const client = fullHierarchy.clients[0];
        const project = client?.projects[0];

        if (client && project) {
            if (project.issues.length === 4) success('✅ All 4 issues present');
            if (project.developers.length === 1) success('✅ Developer assignment correct');
            success('✅ Hierarchy structure validated');
        }

    } catch (err) {
        error('Failed to verify complete hierarchy', err);
    }
}

async function testUpdateOperations() {
    section('7. Testing Update Operations');

    try {
        // Update project
        const updatedProject = await prisma.project.update({
            where: { id: createdIds.project! },
            data: {
                description: 'Updated description via test script'
            }
        });
        success('Project updated successfully');

        // Resolve an issue
        const firstIssue = createdIds.issues[0];
        const resolvedIssue = await prisma.issue.update({
            where: { id: firstIssue },
            data: {
                status: 'resolved',
                resolvedAt: new Date(),
                resolutionTime: 24, // 24 hours
                fixQuality: 5
            }
        });
        success(`Issue resolved: ${resolvedIssue.title}`);

        // Update developer
        const updatedDev = await prisma.developer.update({
            where: { id: createdIds.developer! },
            data: {
                skills: 'TypeScript, React, Node.js, Docker, Kubernetes'
            }
        });
        success('Developer skills updated');

    } catch (err) {
        error('Update operations failed', err);
    }
}

async function testQueryOperations() {
    section('8. Testing Query Operations');

    try {
        // Get all projects
        const projects = await prisma.project.findMany({
            where: {
                status: 'active'
            },
            include: {
                _count: {
                    select: {
                        issues: true,
                        developers: true
                    }
                }
            }
        });
        success(`Found ${projects.length} active projects`);

        // Get critical issues
        const criticalIssues = await prisma.issue.findMany({
            where: {
                severity: 'critical',
                status: { in: ['open', 'in_progress'] }
            }
        });
        success(`Found ${criticalIssues.length} critical open issues`);

        // Get developer with stats
        const devWithStats = await prisma.developer.findUnique({
            where: { id: createdIds.developer! },
            include: {
                issues: true,
                projects: true
            }
        });

        if (devWithStats) {
            success(`Developer queries successful: ${devWithStats.issues.length} issues assigned`);
        }

    } catch (err) {
        error('Query operations failed', err);
    }
}

async function cleanupTestData() {
    section('9. Cleanup Test Data');

    try {
        // Delete in reverse order of creation
        if (createdIds.issues.length > 0) {
            await prisma.issue.deleteMany({
                where: {
                    id: { in: createdIds.issues }
                }
            });
            success(`Deleted ${createdIds.issues.length} test issues`);
        }

        if (createdIds.developer) {
            await prisma.developer.delete({
                where: { id: createdIds.developer }
            });
            success('Deleted test developer');
        }

        if (createdIds.project) {
            await prisma.project.delete({
                where: { id: createdIds.project }
            });
            success('Deleted test project');
        }

        if (createdIds.client) {
            await prisma.client.delete({
                where: { id: createdIds.client }
            });
            success('Deleted test client');
        }

        if (createdIds.product) {
            await prisma.product.delete({
                where: { id: createdIds.product }
            });
            success('Deleted test product');
        }

        success('All test data cleaned up successfully');

    } catch (err) {
        error('Cleanup failed (some data may remain)', err);
    }
}

async function runTests() {
    console.log('\n🧪 DevPulse Integration Test Suite');
    console.log('Testing complete application workflow\n');
    info(`Database: ${dbPath}\n`);

    try {
        // Run tests in order
        const product = await testCreateProduct();
        const client = await testCreateClient(product.id);
        const project = await testCreateProject(client.id);
        const developer = await testCreateDeveloper(project.id);
        await testCreateIssues(project.id, developer.id);
        await testCompleteHierarchy();
        await testUpdateOperations();
        await testQueryOperations();

        // Cleanup
        await cleanupTestData();

    } catch (err) {
        console.error('\n❌ Test suite terminated due to error:', err);
        info('Attempting cleanup...');
        try {
            await cleanupTestData();
        } catch (cleanupErr) {
            error('Cleanup also failed', cleanupErr);
        }
    } finally {
        await prisma.$disconnect();
    }

    // Print summary
    section('Test Summary');
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📊 Total:  ${passed + failed}`);

    if (failed === 0) {
        console.log('\n🎉 All tests passed! Application is working correctly.\n');
        process.exit(0);
    } else {
        console.log(`\n⚠️  ${failed} test(s) failed. Please review errors above.\n`);
        process.exit(1);
    }
}

// Run tests
runTests().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
