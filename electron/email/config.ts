import nodemailer from 'nodemailer';

export interface EmailConfig {
    smtp: {
        host: string;
        port: number;
        secure: boolean;
        auth: {
            user: string;
            pass: string;
        };
    };
    from: {
        name: string;
        address: string;
    };
}

// Default configuration (can be overridden by environment variables or user settings)
const defaultConfig: EmailConfig = {
    smtp: {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER || '',
            pass: process.env.SMTP_PASS || '',
        },
    },
    from: {
        name: 'DevPulse',
        address: process.env.SMTP_FROM || 'devpulse@example.com',
    },
};

let transporter: nodemailer.Transporter | null = null;

export function initializeEmailTransporter(config?: EmailConfig): nodemailer.Transporter {
    const emailConfig = config || defaultConfig;

    transporter = nodemailer.createTransport({
        host: emailConfig.smtp.host,
        port: emailConfig.smtp.port,
        secure: emailConfig.smtp.secure,
        auth: {
            user: emailConfig.smtp.auth.user,
            pass: emailConfig.smtp.auth.pass,
        },
    });

    return transporter;
}

export function getEmailTransporter(): nodemailer.Transporter {
    if (!transporter) {
        transporter = initializeEmailTransporter();
    }
    return transporter;
}

export async function verifyEmailConnection(): Promise<boolean> {
    try {
        const emailTransporter = getEmailTransporter();
        await emailTransporter.verify();
        console.log('✅ Email server connection verified');
        return true;
    } catch (error) {
        console.error('❌ Email server connection failed:', error);
        return false;
    }
}

export async function sendEmail(options: {
    to: string;
    subject: string;
    html: string;
    text?: string;
    cc?: string[];  // Add CC support
}): Promise<boolean> {
    if (!transporter) {
        console.error('❌ Email transporter not initialized. Call initializeEmailTransporter() first.');
        return false;
    }

    try {
        const mailOptions: any = {
            from: `"${defaultConfig.from.name}" <${defaultConfig.from.address}>`,
            to: options.to,
            subject: options.subject,
            html: options.html,
            text: options.text || '',
        };

        // Add CC if provided
        if (options.cc && options.cc.length > 0) {
            mailOptions.cc = options.cc.join(',');
        }

        await transporter.sendMail(mailOptions);
        console.log(`✅ Email sent successfully to ${options.to}${options.cc ? ` (CC: ${options.cc.join(', ')})` : ''}`);
        return true;
    } catch (error) {
        console.error('❌ Failed to send email:', error);
        return false;
    }
}
