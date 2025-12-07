import { z } from 'zod';

/**
 * Validation schemas for all IPC data types
 * These schemas enforce type safety and input validation at runtime
 */

// ========== Product Schemas ==========

export const ProductCreateSchema = z.object({
    name: z.string().min(1, 'Product name is required').max(255, 'Product name too long'),
    description: z.string().max(5000, 'Description too long').optional()
});

export const ProductUpdateSchema = ProductCreateSchema.partial();

// ========== Client Schemas ==========

export const ClientCreateSchema = z.object({
    name: z.string().min(1, 'Client name is required').max(255, 'Client name too long'),
    productId: z.string().uuid('Invalid product ID'),
    contactInfo: z.string().max(1000, 'Contact info too long').optional()
});

export const ClientUpdateSchema = ClientCreateSchema.partial().refine(
    data => data.productId !== undefined,
    { message: 'Product ID is required for updates' }
);

export const ClientFilterSchema = z.object({
    productId: z.string().uuid('Invalid product ID').optional()
}).optional();

// ========== Project Schemas ==========

export const ProjectCreateSchema = z.object({
    name: z.string().min(1, 'Project name is required').max(255, 'Project name too long'),
    clientId: z.string().uuid('Invalid client ID'),
    projectType: z.enum(['web', 'mobile', 'desktop', 'api', 'other']),
    description: z.string().max(5000, 'Description too long').optional(),
    startDate: z.string().datetime('Invalid start date format'),
    endDate: z.string().datetime('Invalid end date format').optional().nullable(),
    status: z.enum(['active', 'archived']).default('active')
});

export const ProjectUpdateSchema = ProjectCreateSchema.partial();

export const ProjectFilterSchema = z.object({
    status: z.enum(['active', 'archived']).optional(),
    clientId: z.string().uuid('Invalid client ID').optional()
}).optional();

// ========== Developer Schemas ==========

export const DeveloperCreateSchema = z.object({
    fullName: z.string().min(1, 'Full name is required').max(255, 'Full name too long'),
    email: z.string().email('Invalid email format').max(255, 'Email too long'),
    skills: z.string().min(1, 'Skills are required').max(1000, 'Skills description too long'),
    seniorityLevel: z.enum(['junior', 'mid', 'senior', 'lead', 'principal'])
});

export const DeveloperUpdateSchema = DeveloperCreateSchema.partial();

// ========== Feature Schemas ==========

export const FeatureCreateSchema = z.object({
    name: z.string().min(1, 'Feature name is required').max(255, 'Feature name too long'),
    projectId: z.string().uuid('Invalid project ID'),
    description: z.string().max(5000, 'Description too long').optional()
});

export const FeatureUpdateSchema = FeatureCreateSchema.partial();

// ========== Issue Schemas ==========

export const IssueCreateSchema = z.object({
    title: z.string().min(1, 'Issue title is required').max(500, 'Issue title too long'),
    description: z.string().min(1, 'Issue description is required').max(10000, 'Description too long'),
    severity: z.enum(['low', 'medium', 'high', 'critical']),
    status: z.enum(['open', 'in_progress', 'resolved', 'closed']).default('open'),
    projectId: z.string().uuid('Invalid project ID'),
    featureId: z.string().uuid('Invalid feature ID').optional().nullable(),
    assignedToId: z.string().uuid('Invalid developer ID').optional().nullable(),
    notes: z.string().max(5000, 'Notes too long').optional().nullable(),
    attachments: z.array(z.string().max(500)).max(10, 'Too many attachments').optional()
});

export const IssueUpdateSchema = IssueCreateSchema.partial();

export const IssueFilterSchema = z.object({
    projectId: z.string().uuid('Invalid project ID').optional(),
    assignedToId: z.string().uuid('Invalid developer ID').optional(),
    status: z.enum(['open', 'in_progress', 'resolved', 'closed']).optional(),
    severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
    isRecurring: z.boolean().optional()
}).optional();

// ========== Analytics Schemas ==========

export const TimeframeSchema = z.object({
    start: z.string().datetime('Invalid start date').optional(),
    end: z.string().datetime('Invalid end date').optional(),
    period: z.enum(['day', 'week', 'month', 'quarter', 'year']).optional()
}).optional();

export const AnalyticsFilterSchema = z.object({
    projectId: z.string().uuid('Invalid project ID').optional(),
    developerId: z.string().uuid('Invalid developer ID').optional(),
    timeframe: TimeframeSchema
}).optional();

// ========== Common Validators ==========

export const UUIDSchema = z.string().uuid('Invalid ID format');

export const PaginationSchema = z.object({
    page: z.number().int().min(1).default(1),
    limit: z.number().int().min(1).max(100).default(20)
}).optional();

// ========== Helper Types ==========

export type ProductCreate = z.infer<typeof ProductCreateSchema>;
export type ProductUpdate = z.infer<typeof ProductUpdateSchema>;

export type ClientCreate = z.infer<typeof ClientCreateSchema>;
export type ClientUpdate = z.infer<typeof ClientUpdateSchema>;
export type ClientFilter = z.infer<typeof ClientFilterSchema>;

export type ProjectCreate = z.infer<typeof ProjectCreateSchema>;
export type ProjectUpdate = z.infer<typeof ProjectUpdateSchema>;
export type ProjectFilter = z.infer<typeof ProjectFilterSchema>;

export type DeveloperCreate = z.infer<typeof DeveloperCreateSchema>;
export type DeveloperUpdate = z.infer<typeof DeveloperUpdateSchema>;

export type IssueCreate = z.infer<typeof IssueCreateSchema>;
export type IssueUpdate = z.infer<typeof IssueUpdateSchema>;
export type IssueFilter = z.infer<typeof IssueFilterSchema>;

export type Timeframe = z.infer<typeof TimeframeSchema>;
export type AnalyticsFilter = z.infer<typeof AnalyticsFilterSchema>;
