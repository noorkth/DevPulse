import { ipcMain } from 'electron';
import { sendEmail, verifyEmailConnection, initializeEmailTransporter } from './config';
import { sendWeeklyReportEmail } from './report-generator';
import { triggerWeeklyReportsNow, getSchedulerStatus } from './scheduler';

export function setupEmailHandlers() {
    // Test email connection with custom config
    ipcMain.handle('email:testConnection', async (_, config?: any) => {
        try {
            // If config provided, initialize transporter with it
            if (config && config.user && config.pass) {
                initializeEmailTransporter({
                    smtp: {
                        host: config.host || 'smtp.gmail.com',
                        port: parseInt(config.port) || 587,
                        secure: false,
                        auth: {
                            user: config.user,
                            pass: config.pass,
                        },
                    },
                    from: {
                        name: 'DevPulse',
                        address: config.from || config.user,
                    },
                });
            }

            const isConnected = await verifyEmailConnection();
            return { success: isConnected };
        } catch (error) {
            console.error('Email connection test failed:', error);
            return { success: false, error: String(error) };
        }
    });

    // Send test email
    ipcMain.handle('email:sendTest', async (_, emailAddress: string, config?: any, managerEmail?: string) => {
        try {
            // Initialize with config if provided
            if (config && config.user && config.pass) {
                initializeEmailTransporter({
                    smtp: {
                        host: config.host || 'smtp.gmail.com',
                        port: parseInt(config.port) || 587,
                        secure: false,
                        auth: {
                            user: config.user,
                            pass: config.pass,
                        },
                    },
                    from: {
                        name: 'DevPulse',
                        address: config.from || config.user,
                    },
                });
            }

            const success = await sendEmail({
                to: emailAddress,
                subject: 'Test Email from DevPulse',
                html: `
                    <h1>Test Email</h1>
                    <p>This is a test email from DevPulse.</p>
                    <p>If you received this, your email configuration is working correctly! ✅</p>
                `,
                text: 'This is a test email from DevPulse. If you received this, your email configuration is working correctly!',
            });

            return { success };
        } catch (error) {
            console.error('Failed to send test email:', error);
            return { success: false, error: String(error) };
        }
    });

    // Send weekly report to specific developer
    ipcMain.handle('email:sendWeeklyReport', async (_, developerId: string) => {
        try {
            const success = await sendWeeklyReportEmail(developerId);
            return { success };
        } catch (error) {
            console.error('Failed to send weekly report:', error);
            return { success: false, error: String(error) };
        }
    });

    // Manually trigger weekly reports for all developers
    ipcMain.handle('email:triggerWeeklyReports', async () => {
        try {
            await triggerWeeklyReportsNow();
            return { success: true };
        } catch (error) {
            console.error('Failed to trigger weekly reports:', error);
            return { success: false, error: String(error) };
        }
    });

    // Get scheduler status
    ipcMain.handle('email:getSchedulerStatus', async () => {
        try {
            const status = getSchedulerStatus();
            return { success: true, status };
        } catch (error) {
            console.error('Failed to get scheduler status:', error);
            return { success: false, error: String(error) };
        }
    });

    console.log('📧 Email IPC handlers registered');
}
