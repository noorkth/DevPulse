import { getPrisma } from '../prisma';
import { startOfWeek, endOfWeek, subWeeks, differenceInHours } from 'date-fns';
import { generateWeeklyReportHTML, generateWeeklyReportText } from './templates';
import { sendEmail } from './config';

export async function generateWeeklyReportForDeveloper(developerId: string, date: Date = new Date()) {
    const prisma = getPrisma();

    try {
        // Get developer info
        const developer = await prisma.developer.findUnique({
            where: { id: developerId },
            select: {
                id: true,
                fullName: true,
                email: true,
            },
        });

        if (!developer) {
            throw new Error('Developer not found');
        }

        // Define current week period
        const weekStart = startOfWeek(date, { weekStartsOn: 1 }); // Monday
        const weekEnd = endOfWeek(date, { weekStartsOn: 1 }); // Sunday

        // Define previous week period
        const prevWeekStart = startOfWeek(subWeeks(date, 1), { weekStartsOn: 1 });
        const prevWeekEnd = endOfWeek(subWeeks(date, 1), { weekStartsOn: 1 });

        // Get current week issues
        const currentWeekIssues = await prisma.issue.findMany({
            where: {
                assignedToId: developerId,
                status: 'resolved',
                resolvedAt: {
                    gte: weekStart,
                    lte: weekEnd,
                },
            },
            select: {
                resolutionTime: true,
                fixQuality: true,
            },
        });

        // Get previous week issues for comparison
        const prevWeekIssues = await prisma.issue.findMany({
            where: {
                assignedToId: developerId,
                status: 'resolved',
                resolvedAt: {
                    gte: prevWeekStart,
                    lte: prevWeekEnd,
                },
            },
        });

        // Calculate metrics
        const issuesResolved = currentWeekIssues.length;
        const prevIssuesResolved = prevWeekIssues.length;

        const avgResolutionTime = currentWeekIssues.length > 0
            ? currentWeekIssues.reduce((sum, issue) => sum + (issue.resolutionTime || 0), 0) / currentWeekIssues.length
            : 0;

        const qualityScore = currentWeekIssues.length > 0
            ? currentWeekIssues
                .filter(i => i.fixQuality)
                .reduce((sum, issue) => sum + (issue.fixQuality || 0), 0) / currentWeekIssues.filter(i => i.fixQuality).length
            : 0;

        // Calculate productivity score (simple formula)
        const productivityScore = issuesResolved * 10 - avgResolutionTime * 0.5 + qualityScore * 5;

        // Calculate previous productivity for comparison
        const prevProductivity = prevIssuesResolved * 10;

        // Get active goals
        const goals = await prisma.developerGoal.findMany({
            where: {
                developerId,
                status: 'active',
            },
        });

        const goalsData = goals.map(goal => ({
            type: goal.goalType.replace('_', ' ').toUpperCase(),
            target: goal.targetValue,
            current: goal.currentValue || 0,
            progress: goal.currentValue && goal.targetValue
                ? Math.min(Math.round((goal.currentValue / goal.targetValue) * 100), 100)
                : 0,
        }));

        // Prepare report data
        const reportData = {
            developer: {
                fullName: developer.fullName,
                email: developer.email,
            },
            period: {
                start: weekStart,
                end: weekEnd,
            },
            metrics: {
                issuesResolved,
                productivityScore,
                avgResolutionTime,
                qualityScore,
            },
            goals: goalsData,
            comparison: {
                issuesChange: issuesResolved - prevIssuesResolved,
                productivityChange: productivityScore - prevProductivity,
            },
        };

        return reportData;
    } catch (error) {
        console.error('Error generating weekly report:', error);
        throw error;
    }
}

export async function sendWeeklyReportEmail(developerId: string): Promise<boolean> {
    const prisma = getPrisma();
    try {
        const reportData = await generateWeeklyReportForDeveloper(developerId);

        const htmlContent = generateWeeklyReportHTML(reportData);
        const textContent = generateWeeklyReportText(reportData);

        // Get SMTP user for manager CC from environment/config
        // The SMTP user is the manager's email who should receive CC
        const managerEmail = process.env.SMTP_USER || '';
        const managerCC = managerEmail ? [managerEmail] : [];

        console.log(`📧 Sending report to: ${reportData.developer.email}${managerCC.length > 0 ? `, CC: ${managerCC.join(', ')}` : ''}`);

        const success = await sendEmail({
            to: reportData.developer.email,
            subject: `📊 Your Weekly Performance Report - DevPulse`,
            html: htmlContent,
            text: textContent,
            cc: managerCC,  // Add manager as CC
        });

        if (success) {
            console.log(`✅ Weekly report sent to ${reportData.developer.fullName}`);
        }

        return success;
    } catch (error) {
        console.error(`❌ Error sending weekly report to ${developerId}:`, error);
        return false;
    }
}

export async function sendWeeklyReportsToAllDevelopers(): Promise<void> {
    const prisma = getPrisma();

    try {
        // Get all developers (not managers)
        const developers = await prisma.developer.findMany({
            where: {
                role: 'developer',
            },
            select: {
                id: true,
                fullName: true,
            },
        });

        console.log(`📧 Sending weekly reports to ${developers.length} developers...`);

        for (const developer of developers) {
            try {
                await sendWeeklyReportEmail(developer.id);
                // Add small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (error) {
                console.error(`Failed to send report to ${developer.fullName}:`, error);
            }
        }

        console.log('✅ Weekly reports sending complete');
    } catch (error) {
        console.error('Error in bulk weekly report sending:', error);
    }
}
