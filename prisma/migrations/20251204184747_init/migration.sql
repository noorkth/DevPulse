-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "projectType" TEXT NOT NULL,
    "description" TEXT,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Developer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "skills" TEXT NOT NULL,
    "seniorityLevel" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "DeveloperProject" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "developerId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "assignedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DeveloperProject_developerId_fkey" FOREIGN KEY ("developerId") REFERENCES "Developer" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DeveloperProject_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Feature" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "projectId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Feature_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Issue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "featureId" TEXT,
    "projectId" TEXT NOT NULL,
    "assignedToId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" DATETIME,
    "resolutionTime" INTEGER,
    "fixQuality" INTEGER,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "recurrenceCount" INTEGER NOT NULL DEFAULT 0,
    "parentIssueId" TEXT,
    "notes" TEXT,
    "attachments" TEXT,
    CONSTRAINT "Issue_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Issue_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "Developer" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Issue_featureId_fkey" FOREIGN KEY ("featureId") REFERENCES "Feature" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Issue_parentIssueId_fkey" FOREIGN KEY ("parentIssueId") REFERENCES "Issue" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AnalyticsCache" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "developerId" TEXT,
    "projectId" TEXT,
    "productivityScore" REAL,
    "avgResolutionTime" REAL,
    "recurringBugCount" INTEGER,
    "totalIssuesResolved" INTEGER,
    "featureStabilityScore" REAL,
    "calculatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AnalyticsCache_developerId_fkey" FOREIGN KEY ("developerId") REFERENCES "Developer" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AnalyticsCache_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Project_status_idx" ON "Project"("status");

-- CreateIndex
CREATE INDEX "Project_clientName_idx" ON "Project"("clientName");

-- CreateIndex
CREATE UNIQUE INDEX "Developer_email_key" ON "Developer"("email");

-- CreateIndex
CREATE INDEX "Developer_email_idx" ON "Developer"("email");

-- CreateIndex
CREATE INDEX "Developer_seniorityLevel_idx" ON "Developer"("seniorityLevel");

-- CreateIndex
CREATE INDEX "DeveloperProject_developerId_idx" ON "DeveloperProject"("developerId");

-- CreateIndex
CREATE INDEX "DeveloperProject_projectId_idx" ON "DeveloperProject"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "DeveloperProject_developerId_projectId_key" ON "DeveloperProject"("developerId", "projectId");

-- CreateIndex
CREATE INDEX "Feature_projectId_idx" ON "Feature"("projectId");

-- CreateIndex
CREATE INDEX "Issue_projectId_idx" ON "Issue"("projectId");

-- CreateIndex
CREATE INDEX "Issue_assignedToId_idx" ON "Issue"("assignedToId");

-- CreateIndex
CREATE INDEX "Issue_featureId_idx" ON "Issue"("featureId");

-- CreateIndex
CREATE INDEX "Issue_status_idx" ON "Issue"("status");

-- CreateIndex
CREATE INDEX "Issue_severity_idx" ON "Issue"("severity");

-- CreateIndex
CREATE INDEX "Issue_isRecurring_idx" ON "Issue"("isRecurring");

-- CreateIndex
CREATE INDEX "AnalyticsCache_developerId_idx" ON "AnalyticsCache"("developerId");

-- CreateIndex
CREATE INDEX "AnalyticsCache_projectId_idx" ON "AnalyticsCache"("projectId");

-- CreateIndex
CREATE INDEX "AnalyticsCache_calculatedAt_idx" ON "AnalyticsCache"("calculatedAt");
