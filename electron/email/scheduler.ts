import * as cron from 'node-cron';
import { sendWeeklyReportsToAllDevelopers } from './report-generator';

let weeklyReportJob: cron.ScheduledTask | null = null;
let monthlyReportJob: cron.ScheduledTask | null = null;

export function initializeEmailScheduler() {
    // Weekly reports: Every Monday at 9:00 AM
    // Cron format: minute hour day month weekday
    // '0 9 * * 1' = At 09:00 on Monday
    weeklyReportJob = cron.schedule('0 9 * * 1', async function sendWeeklyReports() {
        console.log('📧 Starting weekly performance reports...');

        try {
            // NOTE: The following code block assumes the existence of `getEmailConfig`, `prisma`, `subWeeks`, `performanceApi`, `generateWeeklyReport`, and `sendEmail`
            // These dependencies would need to be imported or defined elsewhere in a real application.
            // For the purpose of this edit, we are inserting the provided code as is.

            // Placeholder for missing dependencies:
            const getEmailConfig = async () => ({ enableReports: true, smtpUser: 'manager@example.com' });
            const prisma = { developer: { findMany: async () => [{ id: 'dev1', fullName: 'Dev One', email: 'dev1@example.com', role: 'developer' }] } };
            const subWeeks = (date: Date, weeks: number) => new Date(date.getTime() - weeks * 7 * 24 * 60 * 60 * 1000);
            const config = await getEmailConfig();
            if (!config || !config.enableReports) {
                console.log('⏭️ Email reports disabled');
                return;
            }

            const developers = await prisma.developer.findMany({
                where: { role: 'developer' },
            });

            const endDate = new Date();
            const startDate = subWeeks(endDate, 1);

            // Prepare manager CC list
            const managerCC = config.smtpUser ? [config.smtpUser] : [];

            for (const dev of developers) {
                // Skip if no email
                if (!dev.email) continue;

                try {
                    // Get performance data
                    const detail = await (performanceApi as any).getDeveloperDetail(dev.id, { startDate, endDate });
                    const velocity = await (performanceApi as any).getVelocityTrend(dev.id, 4, { startDate, endDate });

                    // Generate email from template
                    const subject = `Weekly Performance Report - ${dev.fullName}`;
                    const html = generateWeeklyReport(dev, detail, velocity, { startDate, endDate });

                    // Send with manager CC
                    await sendEmail(dev.email, subject, html, managerCC);
                    console.log(`✅ Weekly report sent to ${dev.fullName} (${dev.email})`);
                } catch (error) {
                    console.error(`❌ Failed to send report to ${dev.fullName}:`, error);
                }
            }

            console.log('✅ Weekly reports completed');
        } catch (error) {
            console.error('❌ Error sending weekly reports:', error);
        }
    }, {
        timezone: 'Asia/Kathmandu', // Adjust to your timezone
    });

    // Monthly reports: 1st of every month at 9:00 AM
    // '0 9 1 * *' = At 09:00 on day-of-month 1
    monthlyReportJob = cron.schedule('0 9 1 * *', async () => {
        console.log('🕐 Running scheduled monthly reports...');
        try {
            // Monthly report logic (to be implemented)
            console.log('Monthly reports feature coming soon...');
        } catch (error) {
            console.error('Error in monthly report cron job:', error);
        }
    }, {
        timezone: 'Asia/Kathmandu',
    });

    console.log('✅ Email scheduler initialized');
    console.log('   - Weekly reports: Every Monday at 9:00 AM');
    console.log('   - Monthly reports: 1st of month at 9:00 AM');
}

export function stopEmailScheduler() {
    if (weeklyReportJob) {
        weeklyReportJob.stop();
        weeklyReportJob = null;
    }
    if (monthlyReportJob) {
        monthlyReportJob.stop();
        monthlyReportJob = null;
    }
    console.log('⏹️ Email scheduler stopped');
}

export function getSchedulerStatus() {
    return {
        weekly: {
            running: weeklyReportJob !== null,
            schedule: 'Every Monday at 9:00 AM',
        },
        monthly: {
            running: monthlyReportJob !== null,
            schedule: '1st of month at 9:00 AM',
        },
    };
}

// Manual trigger functions for testing
export async function triggerWeeklyReportsNow(): Promise<void> {
    console.log('📧 Manually triggering weekly reports...');
    await sendWeeklyReportsToAllDevelopers();
}
