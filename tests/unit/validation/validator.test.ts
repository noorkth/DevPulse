import { validate, safeValidate, ValidationError } from '../../../electron/validation/validator';
import { z } from 'zod';

describe('Validator', () => {
    describe('validate()', () => {
        const TestSchema = z.object({
            name: z.string().min(1),
            age: z.number().min(0).max(150),
            email: z.string().email(),
        });

        it('should validate correct data', () => {
            const validData = {
                name: 'John Doe',
                age: 30,
                email: 'john@example.com',
            };

            const result = validate(TestSchema, validData);
            expect(result).toEqual(validData);
        });

        it('should throw ValidationError on invalid data', () => {
            const invalidData = {
                name: '',
                age: -5,
                email: 'not-an-email',
            };

            expect(() => validate(TestSchema, invalidData)).toThrow(ValidationError);
        });

        it('should throw on missing required fields', () => {
            const incompleteData = {
                name: 'John',
                // Missing age and email
            };

            expect(() => validate(TestSchema, incompleteData)).toThrow(ValidationError);
        });
    });

    describe('safeValidate()', () => {
        const TestSchema = z.object({
            value: z.number().positive(),
        });

        it('should return success for valid data', () => {
            const result = safeValidate(TestSchema, { value: 42 });

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.value).toBe(42);
            }
        });

        it('should return error for invalid data', () => {
            const result = safeValidate(TestSchema, { value: -10 });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBeInstanceOf(ValidationError);
            }
        });
    });

    describe('ValidationError', () => {
        it('should format errors correctly', () => {
            const schema = z.object({
                username: z.string().min(3),
                password: z.string().min(8),
            });

            const invalidData = {
                username: 'ab',
                password: '123',
            };

            try {
                validate(schema, invalidData);
                fail('Should have thrown ValidationError');
            } catch (error) {
                if (error instanceof ValidationError) {
                    const formatted = error.getFormattedErrors();
                    expect(formatted).toHaveProperty('username');
                    expect(formatted).toHaveProperty('password');
                }
            }
        });

        it('should get first error message', () => {
            const schema = z.object({
                field1: z.string(),
                field2: z.number(),
            });

            try {
                validate(schema, { field1: 123, field2: 'invalid' });
                fail('Should have thrown');
            } catch (error) {
                if (error instanceof ValidationError) {
                    const firstError = error.getFirstError();
                    expect(typeof firstError).toBe('string');
                    expect(firstError.length).toBeGreaterThan(0);
                }
            }
        });
    });
});
