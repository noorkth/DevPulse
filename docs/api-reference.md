# DevPulse API Reference

Complete documentation for all IPC handlers in the DevPulse application.

---

## Table of Contents

- [Issues API](#issues-api)
- [Projects API](#projects-api)
- [Developers API](#developers-api)
- [Products & Clients API](#products--clients-api)
- [Analytics API](#analytics-api)
- [ML/AI API](#mlai-api)
- [Email API](#email-api)
- [Search API](#search-api)

---

## Issues API

### `issues:getAll`

Get all issues with optional filtering and pagination.

**Parameters:**
- `filters?: IssueFilters` - Optional filtering criteria
  - `status?: string` - Filter by status (open, in_progress, resolved, closed)
  - `severity?: string` - Filter by severity (critical, high, medium, low)
  - `projectId?: string` - Filter by project ID
  - `assignedToId?: string` - Filter by developer ID
- `paginationParams?: PaginationParams` - Optional pagination
  - `limit?: number` - Items per page (default: 20)
  - `cursor?: string` - Cursor for next page
  - `offset?: number` - Offset for page

**Returns:** `Issue[] | PaginationResult<Issue>`

**Example:**
```typescript
// Get all issues
const issues = await window.api.issues.getAll();

// Get with filters
const criticalIssues = await window.api.issues.getAll({
  severity: 'critical',
  status: 'open'
});

// Get with pagination
const page1 = await window.api.issues.getAll({}, { limit: 20 });
```

**Caching:** Results cached for 1 minute

---

### `issues:getById`

Get a single issue by ID with full details.

**Parameters:**
- `id: string` - Issue UUID

**Returns:** `Issue`

**Example:**
```typescript
const issue = await window.api.issues.getstatusById('issue-uuid-here');
```

---

### `issues:create`

Create a new issue.

**Parameters:**
- `data: IssueCreateData`
  - `title: string` - Issue title (required)
  - `description: string` - Issue description (required)
  - `severity: string` - Severity level (required)
  - `projectId: string` - Project ID (required)
  - `assignedToId: string` - Developer ID (required)
  - `featureId?: string` - Feature ID (optional)

**Returns:** `Issue`

**Example:**
```typescript
const newIssue = await window.api.issues.create({
  title: 'Login button not working',
  description: 'Users cannot click the login button',
  severity: 'critical',
  projectId: 'project-id',
  assignedToId: 'developer-id',
});
```

**Cache Invalidation:** Clears all issues list caches

---

### `issues:update`

Update an existing issue.

**Parameters:**
- `id: string` - Issue UUID
- `data: Partial<IssueUpdateData>` - Fields to update

**Returns:** `Issue`

**Example:**
```typescript
const updated = await window.api.issues.update('issue-id', {
  status: 'resolved',
  resolutionTime: 24,
});
```

**Cache Invalidation:** Clears related caches

---

### `issues:resolve`

Mark an issue as resolved.

**Parameters:**
- `id: string` - Issue UUID
- `data: ResolveData`
  - `fixQuality?: number` - Quality rating 1-5
  - `notes?: string` - Resolution notes

**Returns:** `Issue`

---

## Projects API

### `projects:getAll`

Get all projects with optional filtering and pagination.

**Parameters:**
- `filters?: ProjectFilters`
  - `status?: string` - Filter by status
  - `clientId?: string` - Filter by client
- `paginationParams?: PaginationParams`

**Returns:** `Project[] | PaginationResult<Project>`

**Example:**
```typescript
// Get all projects
const projects = await window.api.projects.getAll();

// Get active projects only
const active = await window.api.projects.getAll({ status: 'active' });

// With pagination
const page1 = await window.api.projects.getAll({}, { limit: 20 });
```

**Caching:** Results cached for 1 minute

---

### `projects:create`

Create a new project.

**Parameters:**
- `data: ProjectCreateData`
  - `name: string`
  - `clientId: string`
  - `projectType: string`
  - `description?: string`
  - `startDate: DateTime`
  - `endDate?: DateTime`
  - `status?: string`

**Returns:** `Project`

---

### `projects:update`

Update a project.

**Parameters:**
- `id: string`
- `data: Partial<ProjectUpdateData>`

**Returns:** `Project`

---

### `projects:delete`

Archive/delete a project.

**Parameters:**
- `id: string`

**Returns:** `{ success: boolean }`

---

## Developers API

### `developers:getAll`

Get all developers with stats.

**Parameters:**
- `paginationParams?: PaginationParams`

**Returns:** `Developer[] | PaginationResult<Developer>`

**Example:**
```typescript
const developers = await window.api.developers.getAll();

// With pagination
const page1 = await window.api.developers.getAll({ limit: 20 });
```

**Caching:** Results cached for 1 minute

---

### `developers:getById`

Get developer with detailed stats.

**Parameters:**
- `id: string`

**Returns:** `DeveloperWithStats`

---

### `developers:getProductivityScore`

Get productivity metrics for a developer.

**Parameters:**
- `id: string`

**Returns:** `ProductivityScore`

**Example:**
```typescript
const score = await window.api.developers.getProductivityScore('dev-id');
// Returns: { score, velocity, quality, efficiency, ... }
```

---

### `developers:create`

Create a new developer.

**Parameters:**
- `data: DeveloperCreateData`
  - `fullName: string`
  - `email: string`
  - `skills: string[]`
  - `seniorityLevel: string`
  - `role?: string`

**Returns:** `Developer`

---

## Products & Clients API

### `products:getAll`

Get all products.

**Returns:** `Product[]`

---

### `clients:getAll`

Get all clients.

**Parameters:**
- `productId?: string` - Filter by product

**Returns:** `Client[]`

---

## Analytics API

### `analytics:getDashboardStats`

Get main dashboard statistics.

**Returns:** `DashboardStats`
```typescript
{
  totalIssues: number,
  openIssues: number,
  resolvedIssues: number,
  criticalIssues: number,
  avgResolutionTime: number,
  activeProjects: number,
  activeDevelopers: number,
  ...
}
```

**Caching:** Results cached for 5 minutes

---

### `analytics:getIssuesByProject`

Get issue statistics per project.

**Returns:** `ProjectIssueStats[]`

---

### `analytics:getDeveloperPerformance`

Get performance metrics for all developers.

**Returns:** `DeveloperPerformance[]`

---

## ML/AI API

### `ml:predictResolutionTime`

Predict resolution time using ML.

**Parameters:**
- `issueData: PredictionInput`
  - `severity: string`
  - `projectId: string`
  - `assignedToId?: string`
  - `featureId?: string`

**Returns:** `Prediction`
```typescript
{
  value: number,        // Estimated hours
  confidence: number,   // 0-1
  factors: string[]     // Contributing factors
}
```

**Example:**
```typescript
const prediction = await window.api.ml.predictResolutionTime({
  severity: 'critical',
  projectId: 'proj-id',
  assignedToId: 'dev-id',
});
```

**Caching:** Results cached for 1 hour

---

### `ml:recommendDeveloper`

Get developer recommendations for an issue.

**Parameters:**
- `issueData`
  - `severity: string`
  - `projectId: string`
  - `featureId?: string`

**Returns:** `DeveloperRecommendation[]`
```typescript
[{
  developerId: string,
  developerName: string,
  score: number,
  reasons: string[],
  currentWorkload: number,
  availability: 'high' | 'medium' | 'low',
  estimatedTime?: number
}]
```

---

### `ml:detectHotspots`

Detect bug hotspots in features.

**Returns:** `Hotspot[]`
```typescript
[{
  id: string,
  name: string,
  bugCount: number,
  recurringRate: number,
  riskScore: number,
  trend: 'increasing' | 'stable' | 'decreasing',
  recommendation: string
}]
```

---

## Email API

### `email:sendReport`

Send a performance report via email.

**Parameters:**
- `data: EmailData`
  - `to: string[]`
  - `subject: string`
  - `body: string`
  - `cc?: string[]`

**Returns:** `{ success: boolean }`

---

### `emailSchedule:getAll`

Get all scheduled email reports.

**Returns:** `EmailSchedule[]`

---

### `emailSchedule:create`

Create a scheduled email report.

**Parameters:**
- `data: ScheduleData`
  - `frequency: 'weekly' | 'monthly'`
  - `time: string` - Format: "HH:MM"
  - `dayOfWeek?: number` - 0-6
  - `dayOfMonth?: number` - 1-31
  - `recipients: string[]`

**Returns:** `EmailSchedule`

---

## Search API

### `search:global`

Global search across all entities.

**Parameters:**
- `query: string` - Search term

**Returns:** `SearchResults`
```typescript
{
  issues: Issue[],
  projects: Project[],
  developers: Developer[],
  features: Feature[]
}
```

**Example:**
```typescript
const results = await window.api.search.global('login bug');
```

---

## Error Handling

All API calls may throw errors. Always wrap in try-catch:

```typescript
try {
  const data = await window.api.issues.getAll();
} catch (error) {
  if (error instanceofRateLimitError) {
    // Handle rate limit
  } else if (error instanceof ValidationError) {
    // Handle validation error
  } else {
    // Handle generic error
  }
}
```

---

## Common Types

### PaginationParams
```typescript
{
  limit?: number,      // Default: 20
  cursor?: string,     // For cursor-based
  offset?: number      // For offset-based
}
```

### PaginationResult<T>
```typescript
{
  data: T[],
  pagination: {
    total: number,
    hasMore: boolean,
    nextCursor?: string,
    nextOffset?: number
  }
}
```

---

**Last Updated:** 2024-12-11
