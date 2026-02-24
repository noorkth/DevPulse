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

async function generateSkillBasedIssues() {
    console.log('🔄 Generating skill-based test issues...\n');

    try {
        // Step 1: Clear all existing issues
        console.log('🗑️  Clearing existing issues...');
        const deleteResult = await prisma.issue.deleteMany({});
        console.log(`✅ Deleted ${deleteResult.count} existing issues\n`);

        // Step 2: Get developers with their skills
        const developers = await prisma.developer.findMany({
            where: { role: 'developer' }
        });

        console.log('👨‍💻 Developer Roster:\n');

        // Map developers by expertise
        const devMap: Record<string, any> = {};
        for (const dev of developers) {
            console.log(`  ${dev.fullName} - ${dev.email}`);
            console.log(`    Skills: ${dev.skills}\n`);

            if (dev.email.includes('kabina')) devMap.backend = dev;
            else if (dev.email.includes('rojil')) devMap.frontend = dev;
            else if (dev.email.includes('ananda')) devMap.ios = dev;
            else if (dev.email.includes('niroj')) devMap.mobile = dev;
            else if (dev.email.includes('dipesh')) devMap.devops = dev;
        }

        // Step 3: Get all projects
        const projects = await prisma.project.findMany({
            include: { features: true }
        });

        console.log(`📂 Found ${projects.length} projects\n`);

        // Ensure all projects have features
        for (const project of projects) {
            if (project.features.length === 0) {
                await prisma.feature.createMany({
                    data: [
                        { name: 'Backend Services', projectId: project.id },
                        { name: 'User Interface', projectId: project.id },
                        { name: 'Infrastructure', projectId: project.id },
                    ]
                });
            }
        }

        // Reload projects with features
        const projectsWithFeatures = await prisma.project.findMany({
            include: { features: true }
        });

        // Step 4: Define skill-specific issue templates

        // BACKEND ISSUES (Kabina)
        const backendIssues = [
            {
                title: 'Database connection pool exhausted',
                description: `**Problem:** Connection pool running out during peak traffic.
                
**Current Config:**
- Max connections: 20
- Pool timeout: 10s

**Error Log:**
\`\`\`
Error: Pool timeout - unable to acquire connection
at ConnectionPool.acquire (pool.js:127)
\`\`\`

**Solution Needed:**
1. Increase pool size to 50
2. Implement connection monitoring
3. Add retry logic with backoff`,
                severity: 'critical',
                status: 'open',
            },
            {
                title: 'API response time degradation',
                description: `**Issue:** API endpoints responding slowly (>2s).

**Affected Endpoints:**
- POST /api/auth/login: 2.5s avg
- GET /api/users/:id: 1.8s avg
- PUT /api/projects/:id: 3.2s avg

**Analysis:** N+1 query problem in ORM. Missing database indexes.

**Action Items:**
- Add indexes on foreign keys
- Implement query batching
- Add Redis caching layer`,
                severity: 'high',
                status: 'in_progress',
            },
            {
                title: 'JWT token validation failing intermittently',
                description: `**Problem:** Token validation randomly fails for valid tokens.

**Frequency:** ~5% of requests

**Root Cause:** Clock drift between services causing token expiry mismatch.

**Fix:** Implement clock sync and add 30s grace period to token validation.`,
                severity: 'high',
                status: 'resolved',
                resolutionTime: 12,
                fixQuality: 5,
            },
        ];

        // FRONTEND ISSUES (Rojil)
        const frontendIssues = [
            {
                title: 'React state update causing infinite loop',
                description: `**Component:** UserDashboard

**Problem:**
\`\`\`typescript
useEffect(() => {
    setData(fetchData()); // Missing deps!
}, [data]); // Creates loop
\`\`\`

**Impact:** Browser freeze, 100% CPU usage

**Fix:** Proper dependency management with useCallback`,
                severity: 'critical',
                status: 'in_progress',
            },
            {
                title: 'CSS Grid layout breaking on mobile',
                description: `**Issue:** Dashboard grid not responsive below 768px.

**Current:**
\`\`\`css
.grid { grid-template-columns: repeat(4, 1fr); }
\`\`\`

**Needed:** Media queries for 1/2/4 column layouts based on screen size.`,
                severity: 'high',
                status: 'open',
            },
            {
                title: 'Form validation errors not clearing',
                description: `**Problem:** Error messages persist after user fixes input.

**Expected:** Errors should clear onChange with debounce (300ms).

**Fix:** Implement field-level validation with proper state management.`,
                severity: 'medium',
                status: 'resolved',
                resolutionTime: 6,
                fixQuality: 4,
            },
        ];

        // iOS ISSUES (Ananda)
        const iosIssues = [
            {
                title: 'App crashes on background transition (iOS 17)',
                description: `**Crash Report:**
\`\`\`
Exception: EXC_BAD_ACCESS (SIGSEGV)
Thread 0: AVPlayer deallocation
\`\`\`

**Reproduction:**
1. Start video playback
2. Background app (10+ seconds)
3. Foreground → Crash

**Fix:** Implement proper lifecycle management in SceneDelegate`,
                severity: 'critical',
                status: 'open',
            },
            {
                title: 'Memory leak in UITableView cells',
                description: `**Instruments Profile:**
- Leaked: CustomCell (500+ instances)
- Growth: 150MB over 10 minutes

**Root Cause:**
\`\`\`swift
class Cell: UITableViewCell {
    var onTap: (() -> Void)? // Retain cycle
}
\`\`\`

**Fix:** Use [weak self] in closures, remove observers in deinit`,
                severity: 'high',
                status: 'in_progress',
            },
            {
                title: 'SwiftUI view not updating with @Published property',
                description: `**Problem:** View doesn't refresh when ViewModel @Published property changes.

**Cause:** ViewModel not marked as @ObservableObject.

**Fixed:** Added proper property wrappers and published notifications.`,
                severity: 'medium',
                status: 'resolved',
                resolutionTime: 4,
                fixQuality: 5,
            },
        ];

        // MOBILE/ANDROID ISSUES (Niroj)
        const mobileIssues = [
            {
                title: 'Flutter app frame drops during animations',
                description: `**Performance:**
- Target: 60 FPS
- Actual: 25-30 FPS on mid-range devices

**DevTools:** Raster thread at 85% (bottleneck)

**Optimizations Needed:**
- RepaintBoundary widgets
- CachedNetworkImage
- Lazy loading PageView`,
                severity: 'high',
                status: 'open',
            },
            {
                title: 'Android 13+ push notifications not working',
                description: `**Issue:** Silent failure on Android 13 (API 33+).

**Root Cause:** Missing runtime permission request for POST_NOTIFICATIONS.

**Implementation:**
1. Request permission at runtime
2. Show rationale dialog
3. Handle denial gracefully
4. Provide settings deep-link`,
                severity: 'critical',
                status: 'resolved',
                resolutionTime: 8,
                fixQuality: 5,
            },
            {
                title: 'React Native bridge performance bottleneck',
                description: `**Problem:** Slow communication between JS and native modules.

**Metrics:** 200ms latency for native calls.

**Solution:** Implement JSI (JavaScript Interface) for synchronous calls.`,
                severity: 'high',
                status: 'in_progress',
            },
        ];

        // DEVOPS/INFRASTRUCTURE ISSUES (Dipesh)
        const devopsIssues = [
            {
                title: 'Production server disk usage at 95%',
                description: `**Critical Alert:**
\`\`\`
/dev/sda1: 95G/100G (95% used)
\`\`\`

**Breakdown:**
- Logs: 45GB (no rotation!)
- Docker images: 28GB
- Old backups: 15GB

**Immediate Actions:**
1. Archive logs to S3
2. Clean Docker images (docker system prune)
3. Implement log rotation
4. Setup disk monitoring alerts`,
                severity: 'critical',
                status: 'in_progress',
            },
            {
                title: 'CI/CD pipeline failing intermittently (40% rate)',
                description: `**Errors:**
\`\`\`
ECONNREFUSED - npm registry
Docker daemon timeout
Dependency resolution failure
\`\`\`

**Causes:**
- Jenkins RAM insufficient (8GB → 16GB needed)
- Network DNS issues
- Docker disk space (80% used)

**Fixes:**
1. Increase server resources
2. Local npm cache/proxy
3. Retry logic with backoff
4. Monitoring & alerting`,
                severity: 'high',
                status: 'open',
            },
            {
                title: 'SSL certificate auto-renewal failing',
                description: `**Problem:** Certbot cron job not executing.

**Impact:** Certificate expires in 7 days!

**Domains:** app.devpulse.com, api.devpulse.com

**Fix:** 
1. Manual renewal via certbot
2. Fix cron permissions
3. Add expiry monitoring (30/14/7 day alerts)`,
                severity: 'critical',
                status: 'resolved',
                resolutionTime: 2,
                fixQuality: 5,
            },
        ];

        // Step 5: Create issues for each project with skill-based assignment
        let totalIssues = 0;

        console.log('🐛 Creating skill-specific issues...\n');

        for (const project of projectsWithFeatures) {
            const features = project.features;
            const projectType = project.projectType?.toLowerCase() || '';

            console.log(`📝 Processing: ${project.name} (${projectType})`);

            // Determine which issue sets to use based on project type
            let issueSet: any[] = [];

            if (projectType.includes('ios')) {
                issueSet = [...iosIssues, ...backendIssues.slice(0, 2), ...devopsIssues.slice(0, 1)];
            } else if (projectType.includes('mobile') || projectType.includes('android')) {
                issueSet = [...mobileIssues, ...backendIssues.slice(0, 2), ...devopsIssues.slice(0, 1)];
            } else if (projectType.includes('web') || projectType.includes('ott')) {
                issueSet = [...frontendIssues, ...backendIssues, ...devopsIssues.slice(0, 2)];
            } else {
                // Mix for other project types
                issueSet = [
                    ...backendIssues,
                    ...frontendIssues.slice(0, 2),
                    ...devopsIssues.slice(0, 2),
                ];
            }

            // Create issues
            for (let i = 0; i < issueSet.length; i++) {
                const template = issueSet[i];
                const feature = features[i % features.length];

                // Smart developer assignment based on issue type
                let assignedDev;
                if (template.title.toLowerCase().includes('database') ||
                    template.title.toLowerCase().includes('api') ||
                    template.title.toLowerCase().includes('backend') ||
                    template.title.toLowerCase().includes('jwt')) {
                    assignedDev = devMap.backend;
                } else if (template.title.toLowerCase().includes('react') ||
                    template.title.toLowerCase().includes('css') ||
                    template.title.toLowerCase().includes('form') ||
                    template.title.toLowerCase().includes('grid')) {
                    assignedDev = devMap.frontend;
                } else if (template.title.toLowerCase().includes('ios') ||
                    template.title.toLowerCase().includes('swift') ||
                    template.title.toLowerCase().includes('uitableview')) {
                    assignedDev = devMap.ios;
                } else if (template.title.toLowerCase().includes('flutter') ||
                    template.title.toLowerCase().includes('android') ||
                    template.title.toLowerCase().includes('react native')) {
                    assignedDev = devMap.mobile;
                } else if (template.title.toLowerCase().includes('server') ||
                    template.title.toLowerCase().includes('ci/cd') ||
                    template.title.toLowerCase().includes('ssl') ||
                    template.title.toLowerCase().includes('disk') ||
                    template.title.toLowerCase().includes('pipeline')) {
                    assignedDev = devMap.devops;
                } else {
                    // Default to backend dev
                    assignedDev = devMap.backend;
                }

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
                                ? new Date(Date.now() - Math.random() * 20 * 24 * 60 * 60 * 1000)
                                : null,
                            createdAt: new Date(Date.now() - Math.random() * 45 * 24 * 60 * 60 * 1000),
                        }
                    });
                    totalIssues++;
                }
            }

            console.log(`  ✅ Created ${issueSet.length} issues\n`);
        }

        // Summary
        console.log('='.repeat(70));
        console.log('✅ SKILL-BASED ISSUE GENERATION COMPLETE');
        console.log('='.repeat(70));

        console.log(`\n📊 Statistics:`);
        console.log(`  Total Issues: ${totalIssues}`);
        console.log(`  Projects: ${projects.length}`);
        console.log(`  Developers: ${developers.length}`);

        // Count by developer
        console.log(`\n👨‍💻 Issues by Developer:\n`);
        for (const dev of developers) {
            const count = await prisma.issue.count({
                where: { assignedToId: dev.id }
            });
            console.log(`  ${dev.fullName}: ${count} issues`);
        }

        // Count by severity
        const criticalCount = await prisma.issue.count({ where: { severity: 'critical' } });
        const highCount = await prisma.issue.count({ where: { severity: 'high' } });
        const mediumCount = await prisma.issue.count({ where: { severity: 'medium' } });

        console.log(`\n🎯 Severity Distribution:`);
        console.log(`  🔴 Critical: ${criticalCount}`);
        console.log(`  🟠 High: ${highCount}`);
        console.log(`  🟡 Medium: ${mediumCount}`);

        // Count by status
        const resolvedCount = await prisma.issue.count({ where: { status: 'resolved' } });
        const inProgressCount = await prisma.issue.count({ where: { status: 'in_progress' } });
        const openCount = await prisma.issue.count({ where: { status: 'open' } });

        console.log(`\n📊 Status Distribution:`);
        console.log(`  ✅ Resolved: ${resolvedCount}`);
        console.log(`  🔄 In Progress: ${inProgressCount}`);
        console.log(`  📋 Open: ${openCount}`);

        console.log('\n💡 Assignment Strategy:');
        console.log('  ✅ Backend issues → Kabina Suwal');
        console.log('  ✅ Frontend issues → Rojil Shrestha');
        console.log('  ✅ iOS issues → Ananda Rai');
        console.log('  ✅ Mobile issues → Niroj Maharjan');
        console.log('  ✅ DevOps issues → Dipesh Chaudhary');

        console.log('\n🎉 Skill-based test data ready!');
        console.log('🚀 Refresh app to see expertly assigned issues!\n');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

generateSkillBasedIssues();
