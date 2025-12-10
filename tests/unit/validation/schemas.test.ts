import {
    EmailScheduleCreateSchema,
    EmailScheduleUpdateSchema,
    EmailScheduleFilterSchema,
    IssueCreateSchema,
    ProjectCreateSchema,
    UUIDSchema,
} from '../../../electron/validation/schemas';

describe('Validation Schemas', () => {
    describe('EmailScheduleCreateSchema', () => {
        it('should validate a valid email schedule', () => {
            const validData = {
                name: 'Weekly Performance Report',
                reportType: 'performance' as const,
                frequency: 'weekly' as const,
                dayOfWeek: 1, // Monday
                time: '09:00',
                recipients: 'dev1@example.com,dev2@example.com',
                enabled: true,
            };

            const result = EmailScheduleCreateSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('should reject invalid time format', () => {
            const invalidData = {
                name: 'Test Schedule',
                reportType: 'performance',
                frequency: 'weekly',
                dayOfWeek: 1,
                time: '25:00', // Invalid hour
                recipients: 'test@example.com',
            };

            const result = EmailScheduleCreateSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('should reject invalid email addresses', () => {
            const invalidData = {
                name: 'Test Schedule',
                reportType: 'performance',
                frequency: 'weekly',
                dayOfWeek: 1,
                time: '09:00',
                recipients: 'not-an-email,another-invalid',
            };

            const result = EmailScheduleCreateSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('should enforce weekly schedules require dayOfWeek', () => {
            const invalidData = {
                name: 'Weekly Report',
                reportType: 'performance',
                frequency: 'weekly',
                // Missing dayOfWeek
                time: '09:00',
                recipients: 'test@example.com',
            };

            const result = EmailScheduleCreateSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('should enforce monthly schedules require dayOfMonth', () => {
            const invalidData = {
                name: 'Monthly Report',
                reportType: 'analytics',
                frequency: 'monthly',
                // Missing dayOfMonth
                time: '09:00',
                recipients: 'test@example.com',
            };

            const result = EmailScheduleCreateSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });
    });

    describe('IssueCreateSchema', () => {
        it('should validate a valid issue', () => {
            const validData = {
                title: 'Bug in login',
                description: 'Users cannot log in',
                severity: 'high',
                status: 'open',
                projectId: '123e4567-e89b-12d3-a456-426614174000',
            };

            const result = IssueCreateSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('should reject invalid severity', () => {
            const invalidData = {
                title: 'Bug',
                description: 'Test',
                severity: 'invalid',
                projectId: '123e4567-e89b-12d3-a456-426614174000',
            };

            const result = IssueCreateSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });
    });

    describe('UUIDSchema', () => {
        it('should validate valid UUIDs', () => {
            const validUUIDs = [
                '123e4567-e89b-12d3-a456-426614174000',
                'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
            ];

            validUUIDs.forEach(uuid => {
                const result = UUIDSchema.safeParse(uuid);
                expect(result.success).toBe(true);
            });
        });

        it('should reject invalid UUIDs', () => {
            const invalidUUIDs = [
                'not-a-uuid',
                '123-456',
                '',
            ];

            invalidUUIDs.forEach(uuid => {
                const result = UUIDSchema.safeParse(uuid);
                expect(result.success).toBe(false);
            });
        });
    });
});
