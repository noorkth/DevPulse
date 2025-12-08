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

async function generateFreshTestData() {
    console.log('🔄 Generating fresh test data with even distribution...\n');

    try {
        // Step 1: Clear ALL existing issues
        console.log('🗑️  Clearing all existing issues...');
        const deleted = await prisma.issue.deleteMany({});
        console.log(`✅ Deleted ${deleted.count} existing issues\n`);

        // Step 2: Get developers (only actual developers, not managers)
        const developers = await prisma.developer.findMany({
            where: { role: 'developer' },
            orderBy: { fullName: 'asc' }
        });

        console.log('👨‍💻 Developer Roster:\n');
        const devMap: Record<string, any> = {};

        for (const dev of developers) {
            console.log(`  ${dev.fullName} - ${dev.seniorityLevel}`);

            // Map by email for easy assignment
            if (dev.email.includes('ananda')) devMap.ios = dev;
            else if (dev.email.includes('kabina')) devMap.backend = dev;
            else if (dev.email.includes('rojil')) devMap.frontend = dev;
            else if (dev.email.includes('niroj')) devMap.mobile = dev;
            else if (dev.email.includes('dipesh')) devMap.devops = dev;
        }
        console.log('');

        // Step 3: Get all projects
        const projects = await prisma.project.findMany({
            include: {
                features: true,
                client: { include: { product: true } }
            }
        });

        console.log(`📂 Found ${projects.length} projects\n`);

        // Step 4: Define comprehensive issue templates

        // PAYMENT & SUBSCRIPTION RECURRING ISSUES
        const recurringPaymentIssues = [
            {
                title: 'Payment gateway timeout intermittently',
                description: `**Recurring Issue** - Happens 2-3 times per week

**Problem:** Payment processing randomly times out after 30s

**Frequency:** 15% of transactions
**Gateway:** Stripe API
**Error:** Gateway timeout - no response

**Pattern:**
- More frequent during peak hours (6-9 PM)
- Affects credit card payments only
- Retry usually succeeds

**Impact:** Customer frustration, abandoned carts

**Root Cause:** Need connection pooling + retry logic with exponential backoff`,
                severity: 'high',
                status: 'open',
                isRecurring: true,
                recurrenceCount: 12,
            },
            {
                title: 'Subscription renewal emails not sending',
                description: `**Recurring Issue** - Reported monthly

**Problem:** Auto-renewal emails fail to send to ~10% of users

**Symptoms:**
- Email job completes "successfully"
- No emails in user inbox or spam
- SendGrid shows 200 OK but no delivery

**Affected:** ~500 users per month
**Last occurred:** 3 days ago

**Workaround:** Manual email trigger via admin panel

**Need:** Email delivery monitoring + webhook verification`,
                severity: 'critical',
                status: 'in_progress',
                isRecurring: true,
                recurrenceCount: 8,
            },
            {
                title: 'Subscription downgrade losing user data',
                description: `**Recurring Issue** - Critical data loss bug

**Problem:** When users downgrade plan, custom settings are wiped

**Steps:**
1. User downgrades Premium → Basic
2. Subscription update processes
3. User settings table cleared incorrectly

**Data Lost:**
- Custom preferences
- Saved filters
- Dashboard layouts

**Occurrences:** 4 times this month
**Status:** In progress - adding data migration logic`,
                severity: 'critical',
                status: 'in_progress',
                isRecurring: true,
                recurrenceCount: 4,
                resolutionTime: 18,
                fixQuality: 3,
            },
        ];

        // iOS ISSUES (for Ananda)
        const iosIssues = [
            {
                title: 'iOS app crashes on iPad portrait mode',
                description: `**Problem:** App crashes immediately on iPad in portrait orientation

**Device:** iPad Pro 11" (iOS 17.2)
**Crash Log:**
\`\`\`
Fatal Exception: NSInvalidArgumentException
UICollectionView dataSource inconsistency
\`\`\`

**Reproduction:**
1. Launch app on iPad
2. Rotate to portrait
3. Navigate to Dashboard → Crash

**Fix:** Update collection view layout constraints for iPad`,
                severity: 'high',
                status: 'open',
            },
            {
                title: 'Push notifications not appearing on locked screen',
                description: `**Issue:** Notifications work in-app but not on lock screen

**Environment:** iOS 16+
**Symptom:** Banner shown only when app is open

**Root Cause:** Missing UNAuthorizationOptions
- Need: .alert, .sound, .badge

**Impact:** Users miss important updates`,
                severity: 'medium',
                status: 'resolved',
                resolutionTime: 6,
                fixQuality: 5,
            },
            {
                title: 'In-app subscription restore failing',
                description: `**Problem:** "Restore Purchase" button does nothing

**StoreKit Error:** Transaction not found
**Affected:** Users who reinstalled app

**Need:** 
1. Verify receipt with Apple servers
2. Sync with backend subscription DB
3. Update UI state`,
                severity: 'critical',
                status: 'open',
            },
        ];

        // BACKEND ISSUES (Kabina)
        const backendIssues = [
            {
                title: 'Database deadlock during concurrent updates',
                description: `**Problem:** Deadlock when multiple users update same resource

**Error Log:**
\`\`\`
ERROR: deadlock detected
DETAIL: Process 1234 waits for ShareLock on transaction 5678
\`\`\`

**Scenario:** 
- User A updates project status
- User B updates same project simultaneously
- Database locks conflict

**Fix:** Implement optimistic locking with version field`,
                severity: 'high',
                status: 'in_progress',
            },
            {
                title: 'Redis cache not invalidating on update',
                description: `**Problem:** Stale data served after database updates

**Example:**
1. Update user profile → DB updated
2. GET /api/user → returns old data (from cache)
3. Cache TTL: 1 hour

**Solution:** Implement cache invalidation on write operations`,
                severity: 'medium',
                status: 'open',
            },
            {
                title: 'API rate limiter blocking legitimate traffic',
                description: `**Issue:** Rate limiter too aggressive

**Current:** 100 req/min per IP
**Problem:** Corporate networks share single IP

**Impact:** Enterprise clients getting 429 errors

**Solution:** Token bucket algorithm with user-based limits`,
                severity: 'high',
                status: 'resolved',
                resolutionTime: 10,
                fixQuality: 4,
            },
        ];

        // FRONTEND ISSUES (Rojil)
        const frontendIssues = [
            {
                title: 'Table pagination breaking with filters',
                description: `**Bug:** When filters applied, pagination shows wrong page count

**Steps:**
1. Apply filter (reduces results to 15 items)
2. Pagination still shows 50 pages (total pre-filter)
3. Clicking page 2+ shows empty results

**Fix:** Recalculate pagination after filtering`,
                severity: 'medium',
                status: 'open',
            },
            {
                title: 'Memory leak in dashboard real-time updates',
                description: `**Problem:** Browser memory grows 100MB+ after 30min

**Cause:** WebSocket listeners not cleaned up
**Component:** Dashboard.tsx useEffect

**Memory Profile:**
- Initial: 50MB
- After 30min: 180MB
- After 1hr: 350MB (tab crashes)

**Fix:** Add cleanup in useEffect return`,
                severity: 'critical',
                status: 'in_progress',
            },
            {
                title: 'Date picker showing wrong timezone',
                description: `**Issue:** Selected dates off by 1 day

**Example:**
- User selects: Dec 8, 2025
- Backend receives: Dec 7, 2025 16:00:00 UTC

**Cause:** Missing timezone conversion
**Fix:** Use date-fns with timezone support`,
                severity: 'medium',
                status: 'resolved',
                resolutionTime: 4,
                fixQuality: 5,
            },
        ];

        // MOBILE ISSUES (Niroj)
        const mobileIssues = [
            {
                title: 'Android app slow on devices with <4GB RAM',
                description: `**Performance:** App laggy on mid-range Android devices

**Devices Tested:**
- Samsung A32 (3GB RAM) - 15 FPS
- Xiaomi Redmi 9 (4GB RAM) - 25 FPS
- Target: 60 FPS

**Optimizations Needed:**
- Image lazy loading
- RecyclerView view recycling
- Reduce overdraw`,
                severity: 'high',
                status: 'open',
            },
            {
                title: 'React Native bridge causing ANR warnings',
                description: `**ANR:** Application Not Responding on native calls

**Scenario:** Calling native camera module blocks UI thread
**Duration:** 2-3 seconds

**Google Play Vitals:** 5% ANR rate

**Fix:** Move native calls to background thread`,
                severity: 'critical',
                status: 'in_progress',
            },
            {
                title: 'Deep linking not working from email',
                description: `**Problem:** Tapping email links opens browser, not app

**Platform:** Android 12+
**Expected:** App opens directly
**Actual:** Browser disambiguation screen shown

**Fix:** Configure App Links with assetlinks.json`,
                severity: 'medium',
                status: 'resolved',
                resolutionTime: 8,
                fixQuality: 5,
            },
        ];

        // DEVOPS ISSUES (Dipesh)
        const devopsIssues = [
            {
                title: 'Kubernetes pod evictions during deploy',
                description: `**Problem:** Pods evicted randomly during deployment

**Error:** OOMKilled - Memory limit exceeded

**Current Limits:**
- Request: 256Mi
- Limit: 512Mi
- Actual usage: 480-550Mi (spikes during GC)

**Fix:** Increase limits to 1Gi, tune JVM heap`,
                severity: 'high',
                status: 'open',
            },
            {
                title: 'Backup restoration taking 6+ hours',
                description: `**Issue:** Database restore unacceptably slow

**Database:** PostgreSQL 500GB
**Current:** 6-8 hours restore time
**Target:** <2 hours

**Bottleneck:** Single-threaded pg_restore

**Solution:** Parallel restore with custom format dump`,
                severity: 'medium',
                status: 'in_progress',
            },
            {
                title: 'CDN cache purge not propagating',
                description: `**Problem:** Cache purge takes 30+ minutes to propagate

**Expected:** <5 minutes globally
**Impact:** Users see stale assets after deployment

**CDN:** CloudFlare
**Fix:** Use cache tags for instant purge`,
                severity: 'medium',
                status: 'resolved',
                resolutionTime: 3,
                fixQuality: 4,
            },
        ];

        // Step 5: Create issues evenly distributed
        let totalIssues = 0;
        const issuesByDev: Record<string, number> = {};

        console.log('🐛 Creating issues with even distribution...\n');

        for (const project of projects) {
            const features = project.features;
            if (features.length === 0) {
                // Create default feature if none exist
                await prisma.feature.create({
                    data: {
                        name: 'Core Features',
                        projectId: project.id,
                    }
                });
            }
        }

        // Reload projects with features
        const projectsWithFeatures = await prisma.project.findMany({
            include: { features: true }
        });

        // Assign issues round-robin to ensure everyone gets some
        const allIssueTemplates = [
            ...recurringPaymentIssues,
            ...iosIssues,
            ...backendIssues,
            ...frontendIssues,
            ...mobileIssues,
            ...devopsIssues,
        ];

        const devList = [devMap.ios, devMap.backend, devMap.frontend, devMap.mobile, devMap.devops].filter(Boolean);

        for (const dev of devList) {
            issuesByDev[dev.fullName] = 0;
        }

        let devIndex = 0;

        for (const project of projectsWithFeatures) {
            const isPaymentProject = project.name.toLowerCase().includes('payment') ||
                project.name.toLowerCase().includes('subscription');

            // For payment projects, add recurring issues
            if (isPaymentProject) {
                for (const template of recurringPaymentIssues) {
                    const assignedDev = devMap.backend; // Payment issues go to backend
                    const feature = project.features[0];

                    await prisma.issue.create({
                        data: {
                            title: `[${project.name}] ${template.title}`,
                            description: template.description,
                            severity: template.severity,
                            status: template.status,
                            projectId: project.id,
                            featureId: feature.id,
                            assignedToId: assignedDev.id,
                            isRecurring: template.isRecurring || false,
                            recurrenceCount: template.recurrenceCount || 0,
                            resolutionTime: template.resolutionTime,
                            fixQuality: template.fixQuality,
                            resolvedAt: template.status === 'resolved'
                                ? new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000)
                                : null,
                            createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
                        }
                    });
                    issuesByDev[assignedDev.fullName]++;
                    totalIssues++;
                }
            }

            // Distribute other issues round-robin
            const numIssues = 3;
            for (let i = 0; i < numIssues; i++) {
                const assignedDev = devList[devIndex % devList.length];
                devIndex++;

                let template;
                // Smart assignment based on developer specialty
                if (assignedDev.id === devMap.ios?.id) {
                    template = iosIssues[i % iosIssues.length];
                } else if (assignedDev.id === devMap.backend?.id) {
                    template = backendIssues[i % backendIssues.length];
                } else if (assignedDev.id === devMap.frontend?.id) {
                    template = frontendIssues[i % frontendIssues.length];
                } else if (assignedDev.id === devMap.mobile?.id) {
                    template = mobileIssues[i % mobileIssues.length];
                } else if (assignedDev.id === devMap.devops?.id) {
                    template = devopsIssues[i % devopsIssues.length];
                } else {
                    template = allIssueTemplates[Math.floor(Math.random() * allIssueTemplates.length)];
                }

                const feature = project.features[i % project.features.length];

                await prisma.issue.create({
                    data: {
                        title: `[${project.name}] ${template.title}`,
                        description: template.description,
                        severity: template.severity,
                        status: template.status,
                        projectId: project.id,
                        featureId: feature.id,
                        assignedToId: assignedDev.id,
                        isRecurring: template.isRecurring || false,
                        recurrenceCount: template.recurrenceCount || 0,
                        resolutionTime: template.resolutionTime,
                        fixQuality: template.fixQuality,
                        resolvedAt: template.status === 'resolved'
                            ? new Date(Date.now() - Math.random() * 20 * 24 * 60 * 60 * 1000)
                            : null,
                        createdAt: new Date(Date.now() - Math.random() * 45 * 24 * 60 * 60 * 1000),
                    }
                });
                issuesByDev[assignedDev.fullName]++;
                totalIssues++;
            }

            console.log(`  ✅ ${project.name}: ${numIssues + (isPaymentProject ? recurringPaymentIssues.length : 0)} issues`);
        }

        // Summary
        console.log('\n' + '='.repeat(70));
        console.log('✅ FRESH TEST DATA GENERATION COMPLETE');
        console.log('='.repeat(70));

        console.log(`\n📊 Statistics:`);
        console.log(`  Total Issues: ${totalIssues}`);
        console.log(`  Recurring Issues: ${recurringPaymentIssues.length}`);
        console.log(`  Projects: ${projects.length}`);

        console.log(`\n👨‍💻 Issues by Developer:\n`);
        for (const dev of devList) {
            console.log(`  ${dev.fullName}: ${issuesByDev[dev.fullName]} issues`);
        }

        // Count by severity
        const critical = await prisma.issue.count({ where: { severity: 'critical' } });
        const high = await prisma.issue.count({ where: { severity: 'high' } });
        const medium = await prisma.issue.count({ where: { severity: 'medium' } });

        console.log(`\n🎯 Severity Distribution:`);
        console.log(`  🔴 Critical: ${critical}`);
        console.log(`  🟠 High: ${high}`);
        console.log(`  🟡 Medium: ${medium}`);

        // Recurring count
        const recurring = await prisma.issue.count({ where: { isRecurring: true } });
        console.log(`\n🔄 Recurring Issues: ${recurring}`);

        console.log('\n💡 Special Features:');
        console.log('  ✅ Payment & Subscription recurring bugs added');
        console.log('  ✅ Ananda Rai assigned iOS issues');
        console.log('  ✅ Even distribution across all developers');
        console.log('  ✅ Realistic issue descriptions');

        console.log('\n🎉 Fresh test data ready!');
        console.log('🚀 Refresh app to see balanced assignments!\n');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

generateFreshTestData();
