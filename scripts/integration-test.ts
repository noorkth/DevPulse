/**
 * DevPulse Integration Test Suite
 * 
 * Comprehensive testing script that validates all application functionality:
 * - User Management (Developers & Project Managers)
 * - Product/Client/Project workflows
 * - Issue tracking and resolution
 * - Analytics calculations
 * - Data export/import
 * 
 * Run with: npx tsx scripts/integration-test.ts
 */

import { PrismaClient } from '@prisma/client';
import path from 'path';
import os from 'os';
import fs from 'fs';

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

interface TestResult {
    name: string;
    passed: boolean;
    error?: string;
    duration?: number;
}

const testResults: TestResult[] = [];
let testsPassed = 0;
let testsFailed = 0;

function log(message: string, type: 'success' | 'error' | 'info' = 'info') {
    const icons = { success: '✅', error: '❌', info: '📝' };
    console.log(`${icons[type]} ${message}`);
}

async function test(name: string, fn: () => Promise<void>): Promise<boolean> {
    const start = Date.now();
    try {
        await fn();
        const duration = Date.now() - start;
        log(`${name} (${duration}ms)`, 'success');
        testResults.push({ name, passed: true, duration });
        testsPassed++;
        return true;
    } catch (error: any) {
        const duration = Date.now() - start;
        log(`${name} - ${error.message}`, 'error');
        testResults.push({ name, passed: false, error: error.message, duration });
        testsFailed++;
        return false;
    }
}

async function runTests() {
    console.log('\n' + '='.repeat(70));
    console.log('🧪 DevPulse Comprehensive Integration Test Suite');
    console.log('='.repeat(70) + '\n');

    const testData: Record<string, string> = {};

    // ═══════════════════════════════════════════════════════════════════
    // 1. USER MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════
    console.log('\n👥 USER MANAGEMENT\n');

    await test('✓ Create Developer', async () => {
        const dev = await prisma.developer.create({
            data: {
                fullName: 'Test Developer',
                email: `test-dev-${Date.now()}@test.com`,
                skills: 'React, TypeScript, Node.js',
                role: 'developer',
                seniorityLevel: 'senior',
            }
        });
        testData.devId = dev.id;
        if (!dev.id) throw new Error('No ID returned');
    });

    await test('✓ Create Project Manager', async () => {
        const pm = await prisma.developer.create({
            data: {
                fullName: 'Test Manager',
                email: `test-pm-${Date.now()}@test.com`,
                skills: 'Leadership, Agile',
                role: 'manager',
                seniorityLevel: 'lead',
            }
        });
        testData.pmId = pm.id;
        if (!pm.id) throw new Error('No ID returned');
    });

    await test('✓ Read User', async () => {
        const user = await prisma.developer.findUnique({
            where: { id: testData.devId }
        });
        if (!user) throw new Error('User not found');
    });

    await test('✓ Update User', async () => {
        const updated = await prisma.developer.update({
            where: { id: testData.devId },
            data: { skills: 'React, TypeScript, Node.js, Jest' }
        });
        if (!updated.skills.includes('Jest')) throw new Error('Update failed');
    });

    await test('✓ Filter by Role', async () => {
        const devs = await prisma.developer.findMany({ where: { role: 'developer' } });
        const mgrs = await prisma.developer.findMany({ where: { role: 'manager' } });
        if (devs.length === 0 || mgrs.length === 0) throw new Error('Filtering failed');
    });

    // ═══════════════════════════════════════════════════════════════════
    // 2. PRODUCT MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════
    console.log('\n📦 PRODUCTS\n');

    await test('✓ Create Product', async () => {
        const product = await prisma.product.create({
            data: { name: 'Test Product', description: 'Test' }
        });
        testData.productId = product.id;
        if (!product.id) throw new Error('No ID');
    });

    await test('✓ Update Product', async () => {
        await prisma.product.update({
            where: { id: testData.productId },
            data: { description: 'Updated' }
        });
    });

    //  ═══════════════════════════════════════════════════════════════════
    // 3. CLIENT MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════
    console.log('\n🏢 CLIENTS\n');

    await test('✓ Create Client', async () => {
        const client = await prisma.client.create({
            data: {
                name: 'Test Client',
                productId: testData.productId,
                contactInfo: 'test@client.com',
            }
        });
        testData.clientId = client.id;
        if (!client.id) throw new Error('No ID');
    });

    await test('✓ Read Client with Product', async () => {
        const client = await prisma.client.findUnique({
            where: { id: testData.clientId },
            include: { product: true }
        });
        if (!client?.product) throw new Error('Product not loaded');
    });

    // ═══════════════════════════════════════════════════════════════════
    // 4. PROJECT MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════
    console.log('\n📁 PROJECTS\n');

    await test('✓ Create Project', async () => {
        const project = await prisma.project.create({
            data: {
                name: 'Test Project',
                clientId: testData.clientId,
                projectType: 'web',
                startDate: new Date(),
                status: 'active',
            }
        });
        testData.projectId = project.id;
        if (!project.id) throw new Error('No ID');
    });

    await test('✓ Assign Developer to Project', async () => {
        await prisma.developerProject.create({
            data: {
                developerId: testData.devId,
                projectId: testData.projectId,
            }
        });
    });

    await test('✓ Read Project with Relations', async () => {
        const project = await prisma.project.findUnique({
            where: { id: testData.projectId },
            include: { client: { include: { product: true } } }
        });
        if (!project?.client?.product) throw new Error('Relations not loaded');
    });

    // ═══════════════════════════════════════════════════════════════════
    // 5. FEATURES
    // ═══════════════════════════════════════════════════════════════════
    console.log('\n🎯 FEATURES\n');

    await test('✓ Create Feature', async () => {
        const feature = await prisma.feature.create({
            data: {
                name: 'Login Feature',
                projectId: testData.projectId,
            }
        });
        testData.featureId = feature.id;
        if (!feature.id) throw new Error('No ID');
    });

    // ═══════════════════════════════════════════════════════════════════
    // 6. ISSUE MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════
    console.log('\n🐛 ISSUES\n');

    await test('✓ Create Issue', async () => {
        const issue = await prisma.issue.create({
            data: {
                title: 'Test Bug',
                description: 'Login not working',
                severity: 'high',
                status: 'open',
                projectId: testData.projectId,
                featureId: testData.featureId,
                assignedToId: testData.devId,
            }
        });
        testData.issueId = issue.id;
        if (!issue.id) throw new Error('No ID');
    });

    await test('✓ Update Issue Status', async () => {
        await prisma.issue.update({
            where: { id: testData.issueId },
            data: { status: 'in_progress' }
        });
    });

    await test('✓ Resolve Issue', async () => {
        await prisma.issue.update({
            where: { id: testData.issueId },
            data: {
                status: 'resolved',
                resolutionTime: 8,
                fixQuality: 5,
                resolvedAt: new Date(),
            }
        });
    });

    await test('✓ Filter by Status', async () => {
        const resolved = await prisma.issue.findMany({
            where: { status: 'resolved' }
        });
        if (resolved.length === 0) throw new Error('No resolved issues');
    });

    await test('✓ Filter by Severity', async () => {
        const critical = await prisma.issue.findMany({
            where: { severity: 'critical' }
        });
        // Should at least execute without error
    });

    // ═══════════════════════════════════════════════════════════════════
    // 7. ANALYTICS
    // ═══════════════════════════════════════════════════════════════════
    console.log('\n📊 ANALYTICS\n');

    await test('✓ Count Issues by Project', async () => {
        const count = await prisma.issue.count({
            where: { projectId: testData.projectId }
        });
        if (count === 0) throw new Error('Count failed');
    });

    await test('✓ Group by Severity', async () => {
        const grouped = await prisma.issue.groupBy({
            by: ['severity'],
            _count: { severity: true }
        });
        // Should execute
    });

    await test('✓ Calculate Productivity', async () => {
        const issues = await prisma.issue.findMany({
            where: { assignedToId: testData.devId, status: 'resolved' }
        });
        const score = issues.reduce((sum, i) => sum + (i.fixQuality || 0), 0);
        if (score === 0) throw new Error('No score calculated');
    });

    // ═══════════════════════════════════════════════════════════════════
    // 8. EXPORT/IMPORT
    // ═══════════════════════════════════════════════════════════════════
    console.log('\n💾 EXPORT/IMPORT\n');

    const exportPath = path.join(os.tmpdir(), `devpulse-test-${Date.now()}.json`);

    await test('✓ Export Data', async () => {
        const data = {
            products: await prisma.product.findMany(),
            clients: await prisma.client.findMany(),
            projects: await prisma.project.findMany(),
            users: await prisma.developer.findMany(),
            exportDate: new Date().toISOString(),
        };
        fs.writeFileSync(exportPath, JSON.stringify(data, null, 2));
        if (!fs.existsSync(exportPath)) throw new Error('Export failed');
    });

    await test('✓ Verify Export Integrity', async () => {
        const data = JSON.parse(fs.readFileSync(exportPath, 'utf-8'));
        if (!data.products || !data.clients) throw new Error('Invalid export');
    });

    // Cleanup export
    if (fs.existsSync(exportPath)) fs.unlinkSync(exportPath);

    // ═══════════════════════════════════════════════════════════════════
    // 9. CLEANUP
    // ═══════════════════════════════════════════════════════════════════
    console.log('\n🗑️  CLEANUP\n');

    await test('✓ Delete Issue', async () => {
        await prisma.issue.delete({ where: { id: testData.issueId } });
    });

    await test('✓ Delete Feature', async () => {
        await prisma.feature.delete({ where: { id: testData.featureId } });
    });

    await test('✓ Delete Project', async () => {
        await prisma.project.delete({ where: { id: testData.projectId } });
    });

    await test('✓ Delete Client', async () => {
        await prisma.client.delete({ where: { id: testData.clientId } });
    });

    await test('✓ Delete Product', async () => {
        await prisma.product.delete({ where: { id: testData.productId } });
    });

    await test('✓ Delete Test Users', async () => {
        await prisma.developer.deleteMany({
            where: { email: { contains: '@test.com' } }
        });
    });

    // ═══════════════════════════════════════════════════════════════════
    // SUMMARY
    // ═══════════════════════════════════════════════════════════════════
    console.log('\n' + '='.repeat(70));
    console.log('📋 TEST SUMMARY');
    console.log('='.repeat(70));

    const total = testsPassed + testsFailed;
    const passRate = total > 0 ? ((testsPassed / total) * 100).toFixed(1) : '0.0';
    const totalTime = testResults.reduce((sum, t) => sum + (t.duration || 0), 0);

    console.log(`\nTotal Tests:  ${total}`);
    console.log(`✅ Passed:     ${testsPassed}`);
    console.log(`❌ Failed:     ${testsFailed}`);
    console.log(`📊 Pass Rate:  ${passRate}%`);
    console.log(`⏱️  Duration:   ${totalTime}ms`);

    if (testsFailed > 0) {
        console.log('\n❌ Failed Tests:');
        testResults.filter(t => !t.passed).forEach(t => {
            console.log(`   • ${t.name}: ${t.error}`);
        });
        console.log('\n⚠️  Some tests failed. Please review.\n');
        process.exit(1);
    } else {
        console.log('\n🎉 ALL TESTS PASSED!\n');
    }
}

runTests()
    .catch(err => {
        console.error('\n❌ Test suite crashed:', err);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
