import { ipcMain } from 'electron';
import { getPrisma } from '../prisma';
import { validate } from '../validation/validator';
import {
    EmailScheduleCreateSchema,
    EmailScheduleUpdateSchema,
    EmailScheduleFilterSchema,
    UUIDSchema
} from '../validation/schemas';
import { AppError, ErrorCode } from '../errors';

export interface EmailSchedule {
    id: string;
    name: string;
    reportType: string; // 'performance' | 'issues' | 'analytics' | 'summary' 
    frequency: string; // 'daily' | 'weekly' | 'monthly' | 'quarterly'
    dayOfWeek?: number;
    dayOfMonth?: number;
    time: string;
    recipients: string;
    ccList?: string;
    enabled: boolean;
    lastRun?: Date;
    nextRun?: Date;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Get all email schedules
 */
async function getAllSchedules(filters?: any): Promise<EmailSchedule[]> {
    const prisma = getPrisma();
    const validatedFilters = validate(EmailScheduleFilterSchema, filters);

    const where: any = {};
    if (validatedFilters?.enabled !== undefined) {
        where.enabled = validatedFilters.enabled;
    }
    if (validatedFilters?.reportType) {
        where.reportType = validatedFilters.reportType;
    }
    if (validatedFilters?.frequency) {
        where.frequency = validatedFilters.frequency;
    }

    return await prisma.emailSchedule.findMany({
        where,
        orderBy: { createdAt: 'desc' },
    });
}

/**
 * Get a single email schedule by ID
 */
async function getScheduleById(id: string): Promise<EmailSchedule | null> {
    const validatedId = validate(UUIDSchema, id);
    const prisma = getPrisma();
    return await prisma.emailSchedule.findUnique({
        where: { id: validatedId },
    });
}

/**
 * Create a new email schedule
 */
async function createSchedule(data: any): Promise<EmailSchedule> {
    const validatedData = validate(EmailScheduleCreateSchema, data);
    const prisma = getPrisma();

    // Calculate next run time
    const nextRun = calculateNextRun(
        validatedData.frequency,
        validatedData.time,
        validatedData.dayOfWeek,
        validatedData.dayOfMonth
    );

    return await prisma.emailSchedule.create({
        data: {
            name: validatedData.name,
            reportType: validatedData.reportType,
            frequency: validatedData.frequency,
            dayOfWeek: validatedData.dayOfWeek,
            dayOfMonth: validatedData.dayOfMonth,
            time: validatedData.time,
            recipients: validatedData.recipients,
            ccList: validatedData.ccList,
            enabled: validatedData.enabled,
            nextRun,
        },
    });
}

/**
 * Update an existing email schedule
 */
async function updateSchedule(id: string, data: any): Promise<EmailSchedule> {
    const validatedId = validate(UUIDSchema, id);
    const validatedData = validate(EmailScheduleUpdateSchema, data);
    const prisma = getPrisma();

    // Recalculate next run if frequency or time changed
    let nextRun: Date | undefined;
    const existing = await getScheduleById(validatedId);
    if (existing && (validatedData.frequency || validatedData.time ||
        validatedData.dayOfWeek !== undefined || validatedData.dayOfMonth !== undefined)) {
        nextRun = calculateNextRun(
            validatedData.frequency || existing.frequency,
            validatedData.time || existing.time,
            validatedData.dayOfWeek !== undefined ? validatedData.dayOfWeek : existing.dayOfWeek,
            validatedData.dayOfMonth !== undefined ? validatedData.dayOfMonth : existing.dayOfMonth
        );
    }

    return await prisma.emailSchedule.update({
        where: { id: validatedId },
        data: {
            ...validatedData,
            ...(nextRun && { nextRun }),
        },
    });
}

/**
 * Delete an email schedule
 */
async function deleteSchedule(id: string): Promise<void> {
    const validatedId = validate(UUIDSchema, id);
    const prisma = getPrisma();
    await prisma.emailSchedule.delete({
        where: { id: validatedId },
    });
}

/**
 * Toggle schedule enabled status
 */
async function toggleSchedule(id: string, enabled: boolean): Promise<EmailSchedule> {
    const validatedId = validate(UUIDSchema, id);
    const prisma = getPrisma();
    return await prisma.emailSchedule.update({
        where: { id: validatedId },
        data: { enabled },
    });
}

/**
 * Calculate the next run time for a schedule
 */
function calculateNextRun(
    frequency: string,
    time: string,
    dayOfWeek?: number,
    dayOfMonth?: number
): Date {
    const now = new Date();
    const [hours, minutes] = time.split(':').map(Number);

    let nextRun = new Date();
    nextRun.setHours(hours, minutes, 0, 0);

    // If the time has already passed today, move to next occurrence
    if (nextRun <= now) {
        switch (frequency) {
            case 'daily':
                nextRun.setDate(nextRun.getDate() + 1);
                break;
            case 'weekly':
                // Move to next week's specified day
                const currentDay = nextRun.getDay();
                const targetDay = dayOfWeek ?? 1; // Default to Monday
                let daysUntilNext = targetDay - currentDay;
                if (daysUntilNext <= 0) daysUntilNext += 7;
                nextRun.setDate(nextRun.getDate() + daysUntilNext);
                break;
            case 'monthly':
                // Move to next month's specified day
                const targetDate = dayOfMonth ?? 1;
                nextRun.setMonth(nextRun.getMonth() + 1);
                nextRun.setDate(Math.min(targetDate, new Date(nextRun.getFullYear(), nextRun.getMonth() + 1, 0).getDate()));
                break;
            case 'quarterly':
                // Move to next quarter (3 months)
                nextRun.setMonth(nextRun.getMonth() + 3);
                nextRun.setDate(dayOfMonth ?? 1);
                break;
        }
    } else {
        // Time hasn't passed today, but check if we need to adjust for day constraints
        if (frequency === 'weekly' && dayOfWeek !== undefined) {
            const currentDay = nextRun.getDay();
            if (currentDay !== dayOfWeek) {
                let daysUntilNext = dayOfWeek - currentDay;
                if (daysUntilNext < 0) daysUntilNext += 7;
                nextRun.setDate(nextRun.getDate() + daysUntilNext);
            }
        } else if ((frequency === 'monthly' || frequency === 'quarterly') && dayOfMonth !== undefined) {
            if (nextRun.getDate() !== dayOfMonth) {
                nextRun.setDate(Math.min(dayOfMonth, new Date(nextRun.getFullYear(), nextRun.getMonth() + 1, 0).getDate()));
            }
        }
    }

    return nextRun;
}

/**
 * Setup email schedule IPC handlers
 */
export function setupEmailScheduleHandlers() {
    // Get all schedules
    ipcMain.handle('email-schedules:getAll', async (_event, filters?: any) => {
        try {
            return await getAllSchedules(filters);
        } catch (error) {
            console.error('Error getting schedules:', error);
            throw AppError.from(error, ErrorCode.DB_QUERY_FAILED);
        }
    });

    // Get schedule by ID
    ipcMain.handle('email-schedules:getById', async (_event, id: string) => {
        try {
            const schedule = await getScheduleById(id);
            if (!schedule) {
                throw new AppError(
                    ErrorCode.DB_NOT_FOUND,
                    `Email schedule with ID ${id} not found`
                );
            }
            return schedule;
        } catch (error) {
            if (error instanceof AppError) throw error;
            console.error('Error getting schedule:', error);
            throw AppError.from(error, ErrorCode.DB_QUERY_FAILED);
        }
    });

    // Create schedule
    ipcMain.handle('email-schedules:create', async (_event, data: any) => {
        try {
            return await createSchedule(data);
        } catch (error) {
            if (error instanceof AppError) throw error;
            console.error('Error creating schedule:', error);
            throw AppError.from(error, ErrorCode.DB_QUERY_FAILED);
        }
    });

    // Update schedule
    ipcMain.handle('email-schedules:update', async (_event, id: string, data: any) => {
        try {
            return await updateSchedule(id, data);
        } catch (error) {
            if (error instanceof AppError) throw error;
            console.error('Error updating schedule:', error);
            throw AppError.from(error, ErrorCode.DB_QUERY_FAILED);
        }
    });

    // Delete schedule
    ipcMain.handle('email-schedules:delete', async (_event, id: string) => {
        try {
            await deleteSchedule(id);
        } catch (error) {
            if (error instanceof AppError) throw error;
            console.error('Error deleting schedule:', error);
            throw AppError.from(error, ErrorCode.DB_QUERY_FAILED);
        }
    });

    // Toggle schedule
    ipcMain.handle('email-schedules:toggle', async (_event, id: string, enabled: boolean) => {
        try {
            return await toggleSchedule(id, enabled);
        } catch (error) {
            if (error instanceof AppError) throw error;
            console.error('Error toggling schedule:', error);
            throw AppError.from(error, ErrorCode.DB_QUERY_FAILED);
        }
    });

    console.log('✅ Email schedule handlers registered');
}
