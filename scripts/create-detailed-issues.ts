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

async function createDetailedTestData() {
    console.log('🔄 Creating detailed test data...\n');

    try {
        // Step 1: Clear all existing issues
        console.log('🗑️  Clearing existing issues...');
        const deleteResult = await prisma.issue.deleteMany({});
        console.log(`✅ Deleted ${deleteResult.count} existing issues\n`);

        // Step 2: Get all required data
        const [projects, developers, clients] = await Promise.all([
            prisma.project.findMany({
                include: {
                    features: true,
                    client: true
                }
            }),
            prisma.developer.findMany({
                where: { role: 'developer' } // Only developers, not managers
            }),
            prisma.client.findMany()
        ]);

        console.log(`📊 Found ${projects.length} projects, ${developers.length} developers\n`);

        // Map developers by skills for smart assignment
        const kabina = developers.find(d => d.email.includes('kabina'));
        const rojil = developers.find(d => d.email.includes('rojil'));
        const ananda = developers.find(d => d.email.includes('ananda'));
        const niroj = developers.find(d => d.email.includes('niroj'));
        const dipesh = developers.find(d => d.email.includes('dipesh'));

        // Detailed issue templates with comprehensive descriptions
        const issueTemplates = [
            // Backend/API Issues
            {
                title: 'API Gateway timeout on high traffic',
                description: `**Problem:**
The API gateway is experiencing timeout issues during peak traffic hours (8-10 AM and 6-8 PM). Response times exceed 30 seconds, causing client-side timeout errors.

**Impact:**
- Affects approximately 15% of API calls during peak hours
- Users experiencing failed login attempts
- Payment processing delays

**Technical Details:**
- Current timeout setting: 30 seconds
- Average response time during peak: 35-45 seconds
- Database query performance is acceptable
- Issue appears to be in middleware layer

**Steps to Reproduce:**
1. Send 100+ concurrent requests to /api/v1/auth/login
2. Monitor response times
3. Observe timeouts after ~80 requests

**Expected Behavior:**
API should handle at least 200 concurrent requests with <5s response time.`,
                severity: 'critical',
                status: 'open',
                developer: kabina,
                type: 'backend'
            },
            {
                title: 'Database connection pool exhaustion',
                description: `**Issue Summary:**
Application is running out of database connections during normal operation, causing "Too many connections" errors.

**Current Configuration:**
- Max connections: 20
- Connection timeout: 10s
- Pool size: 15

**Error Logs:**
\`\`\`
Error: Too many connections to database
at Connection.handlePacket (connection.js:127)
Timestamp: 2025-01-08 14:23:45
\`\`\`

**Analysis:**
Connections are not being properly released after query execution. Likely cause is missing .finally() blocks in async operations.

**Recommended Solution:**
1. Increase pool size to 50
2. Implement connection release in finally blocks
3. Add connection monitoring/alerting
4. Review slow queries causing connection holding

**Priority:** High - Affecting production stability`,
                severity: 'critical',
                status: 'in_progress',
                developer: kabina,
                type: 'backend'
            },
            {
                title: 'Redis cache invalidation not working',
                description: `**Description:**
Cache invalidation logic is not triggering properly after data updates. Users are seeing stale data even after making changes.

**Affected Endpoints:**
- GET /api/users/:id
- GET /api/projects/:id/details
- GET /api/dashboard/stats

**Current Behavior:**
1. User updates profile
2. API returns success (200)
3. Database is updated correctly
4. Cache is NOT invalidated
5. Subsequent GET requests return old data

**Cache Configuration:**
- Cache TTL: 1 hour
- Cache key pattern: \`user:{id}:profile\`
- Redis version: 6.2.5

**Root Cause:**
Cache invalidation event is fired before database transaction commits, causing race condition.

**Proposed Fix:**
Move cache invalidation to after-commit hook in transaction middleware.`,
                severity: 'high',
                status: 'resolved',
                developer: kabina,
                resolutionTime: 16,
                fixQuality: 5,
                type: 'backend'
            },

            // Frontend Issues
            {
                title: 'React component infinite re-render loop',
                description: `**Problem Statement:**
UserProfile component enters infinite re-render loop when user data is updated, causing browser to freeze.

**Affected Component:**
\`src/components/UserProfile.tsx\`

**Code Analysis:**
\`\`\`typescript
useEffect(() => {
  setUserData(fetchUser()); // Missing dependency array
}, [userData]); // Causes loop
\`\`\`

**Impact:**
- CPU usage spikes to 100%
- Browser becomes unresponsive
- Requires page reload to recover

**Steps to Reproduce:**
1. Navigate to Profile page
2. Click "Edit Profile"
3. Change any field
4. Click "Save"
5. Observe browser freeze

**Browser Console:**
Warning: Maximum update depth exceeded. This can happen when a component calls setState inside useEffect, but useEffect either doesn't have a dependency array, or one of the dependencies changes on every render.

**Solution:**
Implement proper dependency management and memoization with useMemo/useCallback.`,
                severity: 'critical',
                status: 'in_progress',
                developer: rojil,
                type: 'frontend'
            },
            {
                title: 'CSS Grid layout breaking on mobile devices',
                description: `**Issue:**
Dashboard grid layout breaks on mobile devices (< 768px width), causing content overlap and horizontal scrolling.

**Affected Pages:**
- /dashboard
- /analytics
- /reports

**Current CSS:**
\`\`\`css
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}
\`\`\`

**Problem:**
Fixed 4-column layout doesn't adapt to smaller screens.

**Visual Issues:**
1. Cards overlap each other
2. Text gets cut off
3. Horizontal scroll appears
4. Touch targets become too small

**Tested Devices:**
- iPhone 12: ❌ Broken
- iPhone SE: ❌ Broken  
- iPad: ✅ Works
- Desktop: ✅ Works

**Required Fix:**
Implement responsive grid with media queries:
- Mobile: 1 column
- Tablet: 2 columns
- Desktop: 4 columns`,
                severity: 'high',
                status: 'open',
                developer: rojil,
                type: 'frontend'
            },
            {
                title: 'Form validation messages not clearing',
                description: `**Description:**
Error messages in forms persist even after user corrects the input, leading to confusion.

**Affected Forms:**
- Login form
- Registration form
- Profile update form
- Issue creation form

**Expected Behavior:**
Error message should clear when:
1. User starts typing in the field
2. Input becomes valid

**Actual Behavior:**
Error messages remain visible until form submission.

**User Experience Impact:**
Users report confusion - "I fixed the error but message still shows"

**Technical Implementation:**
Currently using form-level validation on submit. Need to implement field-level validation with onChange handlers.

**Acceptance Criteria:**
- Error clears on valid input
- Error shows immediately on invalid input (debounced)
- Smooth animation for error show/hide`,
                severity: 'medium',
                status: 'resolved',
                developer: rojil,
                resolutionTime: 6,
                fixQuality: 4,
                type: 'frontend'
            },

            // iOS Issues
            {
                title: 'App crashes on background-to-foreground transition',
                description: `**Crash Report:**
App crashes when returning from background on iOS 16.4+

**Stack Trace:**
\`\`\`
Exception Type: EXC_BAD_ACCESS (SIGSEGV)
Exception Codes: KERN_INVALID_ADDRESS at 0x0000000000000000
Crashed Thread: 0 Main Thread

Thread 0 Crashed:
0   AppName         0x0000000102a3c234 -[VideoPlayer prepareToPlay] + 84
1   AppName         0x0000000102a3c124 -[ViewController viewWillAppear:] + 156
\`\`\`

**Reproduction Steps:**
1. Open app
2. Start video playback
3. Press home button (app goes to background)
4. Wait 10+ seconds
5. Tap app icon to return
6. Crash occurs

**Frequency:**
Occurring in ~30% of background transitions

**iOS Versions Affected:**
- iOS 16.4: Confirmed
- iOS 16.5: Confirmed
- iOS 17.0: Confirmed

**Investigation Notes:**
Appears to be related to AVPlayer cleanup/recreation. Player instance is deallocated while app is in background, causing nil pointer when app returns.

**Proposed Solution:**
Implement proper state preservation and restoration in UIApplicationDelegate lifecycle methods.`,
                severity: 'critical',
                status: 'open',
                developer: ananda,
                type: 'ios'
            },
            {
                title: 'Memory leak in UITableView with custom cells',
                description: `**Issue:**
Memory usage continuously increases when scrolling through large lists, eventually causing app to slow down or crash.

**Instruments Profile:**
- Leaked Object: CustomTableViewCell
- Leak Count: ~500 objects after 5 minutes of scrolling
- Memory Growth: 150MB over 10 minutes

**Affected Screens:**
- User list (500+ users)
- Transaction history (1000+ items)
- Message list (unlimited scroll)

**Code Review Findings:**
\`\`\`swift
class CustomCell: UITableViewCell {
    var viewModel: CellViewModel? // Strong reference
    var onTap: (() -> Void)? // Closure creating retain cycle
}
\`\`\`

**Root Cause:**
1. Strong reference to view model not released
2. Closure captures self strongly
3. NotificationCenter observers not removed

**Testing:**
- Run with Instruments (Leaks template)
- Scroll list for 2 minutes
- Observe memory growth

**Fix Checklist:**
- [ ] Use weak references where appropriate
- [ ] Use [weak self] in closures
- [ ] Remove observers in deinit
- [ ] Implement prepareForReuse properly`,
                severity: 'high',
                status: 'in_progress',
                developer: ananda,
                type: 'ios'
            },

            // Mobile/Android Issues
            {
                title: 'Flutter app lagging during animations',
                description: `**Performance Issue:**
App experiences significant frame drops during page transitions and animations on mid-range Android devices.

**Metrics:**
- Target: 60 FPS
- Actual: 20-30 FPS during animations
- Jank count: 145 frames in 10-second test

**Affected Devices:**
- Samsung Galaxy A52: Severe lag
- Xiaomi Redmi Note 10: Moderate lag
- OnePlus Nord: Minor lag
- High-end devices: No issues

**Flutter DevTools Profile:**
- UI thread: 45% usage
- Raster thread: 85% usage (bottleneck!)
- Heavy image decoding during transitions

**Problem Widgets:**
\`\`\`dart
PageView(
  children: _buildHeavyWidgets(), // Building all at once
)
\`\`\`

**Performance Anti-patterns Found:**
1. Building entire widget tree on every animation frame
2. Large images not cached
3. No RepaintBoundary usage
4. setState called in build()

**Optimization Needed:**
- Implement proper widget caching
- Use CachedNetworkImage
- Add RepaintBoundary strategically
- Lazy load page views`,
                severity: 'high',
                status: 'open',
                developer: niroj,
                type: 'mobile'
            },
            {
                title: 'Android notification not working on Android 13+',
                description: `**Issue Summary:**
Push notifications fail silently on Android 13 (API 33) and above due to new runtime permissions.

**Manifest Status:**
\`\`\`xml
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
\`\`\`
✅ Permission declared BUT not requested at runtime

**Error in Logcat:**
\`\`\`
W/NotificationManager: Notification permission not granted for package com.app.name
\`\`\`

**Impact:**
- Users don't receive any notifications
- No error message shown to users
- Silent failure - users think notifications are working

**Android Versions:**
- Android 12 and below: ✅ Working
- Android 13 (API 33): ❌ Not working
- Android 14 (API 34): ❌ Not working

**Required Implementation:**
1. Request POST_NOTIFICATIONS permission at runtime
2. Show rationale dialog explaining why we need permission
3. Handle permission denial gracefully
4. Provide in-app settings to re-request permission

**Testing Checklist:**
- [ ] Test on Android 13 device
- [ ] Test permission request flow
- [ ] Test notification after granting permission
- [ ] Test graceful handling of denial`,
                severity: 'critical',
                status: 'resolved',
                developer: niroj,
                resolutionTime: 8,
                fixQuality: 5,
                type: 'mobile'
            },

            // DevOps Issues
            {
                title: 'CI/CD pipeline failing intermittently',
                description: `**Problem:**
Build pipeline fails randomly with no code changes, requiring manual restarts.

**Failure Rate:**
- Week 1: 15% of builds
- Week 2: 25% of builds
- Week 3: 40% of builds (increasing!)

**Error Messages:**
\`\`\`
Error: ECONNREFUSED - connection to npm registry failed
Error: Timeout waiting for Docker daemon
Error: Unable to resolve dependency tree
\`\`\`

**Pipeline Steps:**
1. Checkout code ✅
2. Install dependencies ❌ (fails here)
3. Run tests
4. Build Docker image
5. Deploy

**Environmental Factors:**
- Jenkins server: 8GB RAM (seems insufficient)
- Docker: Running out of disk space (80% used)
- Network: Occasional DNS resolution failures

**Impact on Team:**
- Developers waiting 20+ minutes for builds
- Multiple manual retries needed
- Blocks urgent deployments

**Action Items:**
1. Increase Jenkins server resources
2. Implement Docker image cleanup
3. Add retry logic with exponential backoff
4. Set up local npm cache/proxy
5. Add monitoring and alerting`,
                severity: 'high',
                status: 'in_progress',
                developer: dipesh,
                type: 'devops'
            },
            {
                title: 'Production server running out of disk space',
                description: `**Critical Alert:**
Production server disk usage at 95%, affecting application performance and logging.

**Current Status:**
\`\`\`
Filesystem      Size   Used  Avail Use%
/dev/sda1       100G    95G    5G  95%
\`\`\`

**Disk Usage Breakdown:**
- Application logs: 45GB (!)
- Docker images: 28GB
- Old backups: 15GB
- Application: 7GB

**Immediate Issues:**
1. Log rotation not working
2. Old Docker images not being cleaned
3. Manual backups accumulating
4. No disk usage monitoring

**Impact:**
- Application logs being truncated
- New deployments might fail
- Database writes could fail
- Potential data loss risk

**Immediate Actions (within 24h):**
1. Archive and compress old logs
2. Remove unused Docker images
3. Move old backups to S3
4. Enable log rotation

**Long-term Solutions:**
1. Implement centralized logging (ELK stack)
2. Automated backup cleanup (retention: 7 days)
3. Docker image cleanup cron job
4. Disk usage monitoring with alerts at 80%`,
                severity: 'critical',
                status: 'open',
                developer: dipesh,
                type: 'devops'
            },
            {
                title: 'SSL certificate expiring in 7 days',
                description: `**Urgent Notice:**
SSL certificate for production domain expires on January 15, 2025 (7 days from now).

**Affected Domains:**
- app.devpulse.com
- api.devpulse.com
- admin.devpulse.com

**Current Certificate:**
- Issuer: Let's Encrypt
- Valid Until: 2025-01-15 23:59:59 UTC
- Type: Domain Validation (DV)

**Auto-renewal Status:**
❌ Failed - Certbot cron job not running

**Impact if Expired:**
- Browser security warnings
- API calls will fail
- Complete service outage
- Loss of user trust

**Renewal Process:**
1. Run certbot renewal manually
2. Verify certificate installation
3. Test HTTPS on all domains
4. Fix cron job for auto-renewal

**Prevention:**
- Set up monitoring for certificate expiry
- Create alerts at 30, 14, and 7 days
- Document manual renewal process
- Test auto-renewal monthly`,
                severity: 'critical',
                status: 'resolved',
                developer: dipesh,
                resolutionTime: 2,
                fixQuality: 5,
                type: 'devops'
            },

            // General/Integration Issues
            {
                title: 'Third-party payment gateway integration broken',
                description: `**Issue:**
Payment processing fails with "Invalid merchant ID" error after payment gateway's API upgrade.

**Timeline:**
- Jan 1: Gateway upgraded to API v3
- Jan 2: Our integration stopped working
- Affecting: All payment transactions

**Error Response:**
\`\`\`json
{
  "error": "INVALID_MERCHANT_ID",
  "message": "Merchant credentials invalid for API v3",
  "code": "AUTH_001"
}
\`\`\`

**Investigation:**
- API v2 (old): No longer supported
- API v3 (new): Requires different authentication
- Our code: Still using v2 endpoints

**Breaking Changes in v3:**
1. Authentication: API key → OAuth 2.0
2. Endpoint URLs: /v2/charge → /v3/payments
3. Request format: Different field names
4. Webhook signatures: New algorithm

**Customer Impact:**
- All payments failing
- Orders stuck in pending
- Revenue loss: Estimated $5,000/day

**Implementation Requirements:**
1. Update to OAuth 2.0 authentication
2. Migrate all API calls to v3
3. Update webhook handling
4. Test in sandbox thoroughly
5. Coordinate deployment window with minimal traffic`,
                severity: 'critical',
                status: 'in_progress',
                developer: kabina,
                type: 'integration'
            }
        ];

        // Create issues for each project
        let totalIssues = 0;

        console.log('🐛 Creating detailed issues...\n');

        for (const project of projects) {
            const features = project.features;
            if (features.length === 0) continue;

            // Select appropriate issues based on project type
            let projectIssues = issueTemplates;
            const projectType = project.projectType?.toLowerCase() || '';

            if (projectType.includes('ios')) {
                projectIssues = issueTemplates.filter(t => ['ios', 'backend', 'integration'].includes(t.type));
            } else if (projectType.includes('mobile') || projectType.includes('android')) {
                projectIssues = issueTemplates.filter(t => ['mobile', 'backend', 'integration'].includes(t.type));
            } else if (projectType.includes('web') || projectType.includes('ott')) {
                projectIssues = issueTemplates.filter(t => ['frontend', 'backend', 'devops', 'integration'].includes(t.type));
            }

            // Create 6-8 issues per project
            const issuesToCreate = projectIssues.slice(0, Math.min(8, projectIssues.length));

            for (let i = 0; i < issuesToCreate.length; i++) {
                const template = issuesToCreate[i];
                const feature = features[i % features.length];
                const assignedDev = template.developer || developers[i % developers.length];

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
                                ? new Date(Date.now() - Math.random() * 15 * 24 * 60 * 60 * 1000)
                                : null,
                            createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
                        }
                    });
                    totalIssues++;
                }
            }

            console.log(`  ✅ Created ${issuesToCreate.length} detailed issues for ${project.name}`);
        }

        // Summary
        console.log('\n' + '='.repeat(70));
        console.log('✅ DETAILED TEST DATA CREATED');
        console.log('='.repeat(70));

        console.log(`\n📊 Statistics:`);
        console.log(`  Total Issues: ${totalIssues}`);
        console.log(`  Projects Covered: ${projects.length}`);
        console.log(`  Developers: ${developers.length}`);

        const criticalCount = await prisma.issue.count({ where: { severity: 'critical' } });
        const highCount = await prisma.issue.count({ where: { severity: 'high' } });
        const mediumCount = await prisma.issue.count({ where: { severity: 'medium' } });
        const lowCount = await prisma.issue.count({ where: { severity: 'low' } });

        console.log(`\n🎯 Severity Distribution:`);
        console.log(`  🔴 Critical: ${criticalCount}`);
        console.log(`  🟠 High: ${highCount}`);
        console.log(`  🟡 Medium: ${mediumCount}`);
        console.log(`  🟢 Low: ${lowCount}`);

        const resolvedCount = await prisma.issue.count({ where: { status: 'resolved' } });
        const inProgressCount = await prisma.issue.count({ where: { status: 'in_progress' } });
        const openCount = await prisma.issue.count({ where: { status: 'open' } });

        console.log(`\n📊 Status Distribution:`);
        console.log(`  ✅ Resolved: ${resolvedCount}`);
        console.log(`  🔄 In Progress: ${inProgressCount}`);
        console.log(`  📋 Open: ${openCount}`);

        console.log('\n💡 Issue Features:');
        console.log('  ✅ Comprehensive descriptions');
        console.log('  ✅ Technical details and stack traces');
        console.log('  ✅ Reproduction steps');
        console.log('  ✅ Impact analysis');
        console.log('  ✅ Proposed solutions');
        console.log('  ✅ Smart developer assignment');

        console.log('\n🎉 Detailed test data ready!');
        console.log('🚀 Refresh app to see realistic, production-like issues!\n');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createDetailedTestData();
