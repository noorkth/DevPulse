-- DropIndex
DROP INDEX "Issue_severity_idx";

-- DropIndex
DROP INDEX "Issue_status_idx";

-- CreateTable
CREATE TABLE "SlaRule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "severity" TEXT NOT NULL,
    "responseTimeHours" REAL NOT NULL,
    "resolutionTimeHours" REAL NOT NULL,
    "atRiskThreshold" REAL NOT NULL DEFAULT 0.8,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SharedIssue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "assignedOwnerId" TEXT NOT NULL,
    "raisedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expectedResolution" DATETIME,
    "resolvedAt" DATETIME,
    "rootCause" TEXT,
    "resolutionSummary" TEXT,
    "escalationLevel" INTEGER NOT NULL DEFAULT 0,
    "visibility" TEXT NOT NULL DEFAULT 'internal',
    "tags" TEXT,
    "notes" TEXT,
    "slaStatus" TEXT NOT NULL DEFAULT 'on-track',
    "responseDeadline" DATETIME,
    "resolutionDeadline" DATETIME,
    "firstResponseAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SharedIssue_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SharedIssue_assignedOwnerId_fkey" FOREIGN KEY ("assignedOwnerId") REFERENCES "Developer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SharedIssueActivity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sharedIssueId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "activityType" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SharedIssueActivity_sharedIssueId_fkey" FOREIGN KEY ("sharedIssueId") REFERENCES "SharedIssue" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SharedIssueActivity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Developer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "IncidentUpdate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sharedIssueId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "updateText" TEXT NOT NULL,
    "isAcknowledgement" BOOLEAN NOT NULL DEFAULT false,
    "isRca" BOOLEAN NOT NULL DEFAULT false,
    "rcaFilePath" TEXT,
    "notifiedClient" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "IncidentUpdate_sharedIssueId_fkey" FOREIGN KEY ("sharedIssueId") REFERENCES "SharedIssue" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "IncidentUpdate_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Developer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ClientHealthScore" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientId" TEXT NOT NULL,
    "weekStart" DATETIME NOT NULL,
    "weekEnd" DATETIME NOT NULL,
    "openIssues" INTEGER NOT NULL DEFAULT 0,
    "resolvedIssues" INTEGER NOT NULL DEFAULT 0,
    "slaBreaches" INTEGER NOT NULL DEFAULT 0,
    "escalations" INTEGER NOT NULL DEFAULT 0,
    "preventiveActions" INTEGER NOT NULL DEFAULT 0,
    "incidentCount" INTEGER NOT NULL DEFAULT 0,
    "slaCompliancePct" REAL NOT NULL DEFAULT 100,
    "stabilityScore" REAL NOT NULL DEFAULT 100,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ClientHealthScore_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OfficeVisit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientId" TEXT NOT NULL,
    "visitedById" TEXT NOT NULL,
    "visitDate" DATETIME NOT NULL,
    "agenda" TEXT,
    "attendees" TEXT,
    "summary" TEXT,
    "actionItems" TEXT,
    "nextVisitDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "OfficeVisit_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "OfficeVisit_visitedById_fkey" FOREIGN KEY ("visitedById") REFERENCES "Developer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RelationshipReset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientId" TEXT NOT NULL,
    "initiatedById" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "resetDate" DATETIME NOT NULL,
    "commitments" TEXT,
    "reviewDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RelationshipReset_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "RelationshipReset_initiatedById_fkey" FOREIGN KEY ("initiatedById") REFERENCES "Developer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MonthlyBusinessReview" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientId" TEXT NOT NULL,
    "reviewMonth" DATETIME NOT NULL,
    "createdById" TEXT NOT NULL,
    "uptimePct" REAL,
    "downtimeMinutes" INTEGER,
    "performanceSummary" TEXT,
    "revenueImpact" TEXT,
    "subscriberImpact" INTEGER,
    "improvementRoadmap" TEXT,
    "featureRequests" TEXT,
    "totalIssues" INTEGER,
    "resolvedIssues" INTEGER,
    "slaCompliancePct" REAL,
    "escalationCount" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MonthlyBusinessReview_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MonthlyBusinessReview_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Developer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MonitoringChecklist" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientId" TEXT NOT NULL,
    "checkDate" DATETIME NOT NULL,
    "ownerId" TEXT NOT NULL,
    "channelUptime" BOOLEAN NOT NULL DEFAULT false,
    "channelObservation" TEXT,
    "geoIpValidation" BOOLEAN NOT NULL DEFAULT false,
    "geoIpObservation" TEXT,
    "stbAudit" BOOLEAN NOT NULL DEFAULT false,
    "stbObservation" TEXT,
    "techHealthCheck" BOOLEAN NOT NULL DEFAULT false,
    "techObservation" TEXT,
    "streamingQuality" BOOLEAN NOT NULL DEFAULT false,
    "streamingObservation" TEXT,
    "recommendations" TEXT,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MonitoringChecklist_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MonitoringChecklist_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Developer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PreventiveRecommendation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "sourceIssueIds" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PreventiveRecommendation_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FeatureRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'requested',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "internalProjectId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FeatureRequest_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "FeatureRequest_internalProjectId_fkey" FOREIGN KEY ("internalProjectId") REFERENCES "Project" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Developer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "skills" TEXT NOT NULL,
    "seniorityLevel" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'developer',
    "clientId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Developer_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Developer" ("createdAt", "email", "fullName", "id", "role", "seniorityLevel", "skills", "updatedAt") SELECT "createdAt", "email", "fullName", "id", "role", "seniorityLevel", "skills", "updatedAt" FROM "Developer";
DROP TABLE "Developer";
ALTER TABLE "new_Developer" RENAME TO "Developer";
CREATE UNIQUE INDEX "Developer_email_key" ON "Developer"("email");
CREATE INDEX "Developer_email_idx" ON "Developer"("email");
CREATE INDEX "Developer_seniorityLevel_idx" ON "Developer"("seniorityLevel");
CREATE INDEX "Developer_role_idx" ON "Developer"("role");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "SlaRule_severity_key" ON "SlaRule"("severity");

-- CreateIndex
CREATE INDEX "SlaRule_severity_idx" ON "SlaRule"("severity");

-- CreateIndex
CREATE INDEX "SharedIssue_clientId_idx" ON "SharedIssue"("clientId");

-- CreateIndex
CREATE INDEX "SharedIssue_status_severity_idx" ON "SharedIssue"("status", "severity");

-- CreateIndex
CREATE INDEX "SharedIssue_slaStatus_idx" ON "SharedIssue"("slaStatus");

-- CreateIndex
CREATE INDEX "SharedIssue_raisedAt_idx" ON "SharedIssue"("raisedAt");

-- CreateIndex
CREATE INDEX "SharedIssue_escalationLevel_idx" ON "SharedIssue"("escalationLevel");

-- CreateIndex
CREATE INDEX "SharedIssueActivity_sharedIssueId_idx" ON "SharedIssueActivity"("sharedIssueId");

-- CreateIndex
CREATE INDEX "SharedIssueActivity_activityType_idx" ON "SharedIssueActivity"("activityType");

-- CreateIndex
CREATE INDEX "SharedIssueActivity_createdAt_idx" ON "SharedIssueActivity"("createdAt");

-- CreateIndex
CREATE INDEX "IncidentUpdate_sharedIssueId_idx" ON "IncidentUpdate"("sharedIssueId");

-- CreateIndex
CREATE INDEX "IncidentUpdate_createdAt_idx" ON "IncidentUpdate"("createdAt");

-- CreateIndex
CREATE INDEX "ClientHealthScore_clientId_idx" ON "ClientHealthScore"("clientId");

-- CreateIndex
CREATE INDEX "ClientHealthScore_weekStart_idx" ON "ClientHealthScore"("weekStart");

-- CreateIndex
CREATE UNIQUE INDEX "ClientHealthScore_clientId_weekStart_key" ON "ClientHealthScore"("clientId", "weekStart");

-- CreateIndex
CREATE INDEX "OfficeVisit_clientId_idx" ON "OfficeVisit"("clientId");

-- CreateIndex
CREATE INDEX "OfficeVisit_visitDate_idx" ON "OfficeVisit"("visitDate");

-- CreateIndex
CREATE INDEX "RelationshipReset_clientId_idx" ON "RelationshipReset"("clientId");

-- CreateIndex
CREATE INDEX "RelationshipReset_status_idx" ON "RelationshipReset"("status");

-- CreateIndex
CREATE INDEX "MonthlyBusinessReview_clientId_idx" ON "MonthlyBusinessReview"("clientId");

-- CreateIndex
CREATE INDEX "MonthlyBusinessReview_reviewMonth_idx" ON "MonthlyBusinessReview"("reviewMonth");

-- CreateIndex
CREATE UNIQUE INDEX "MonthlyBusinessReview_clientId_reviewMonth_key" ON "MonthlyBusinessReview"("clientId", "reviewMonth");

-- CreateIndex
CREATE INDEX "MonitoringChecklist_clientId_idx" ON "MonitoringChecklist"("clientId");

-- CreateIndex
CREATE INDEX "MonitoringChecklist_checkDate_idx" ON "MonitoringChecklist"("checkDate");

-- CreateIndex
CREATE INDEX "PreventiveRecommendation_clientId_idx" ON "PreventiveRecommendation"("clientId");

-- CreateIndex
CREATE INDEX "FeatureRequest_clientId_idx" ON "FeatureRequest"("clientId");

-- CreateIndex
CREATE INDEX "FeatureRequest_status_idx" ON "FeatureRequest"("status");

-- CreateIndex
CREATE INDEX "Issue_status_severity_idx" ON "Issue"("status", "severity");

-- CreateIndex
CREATE INDEX "Issue_assignedToId_status_idx" ON "Issue"("assignedToId", "status");

-- CreateIndex
CREATE INDEX "Issue_projectId_status_idx" ON "Issue"("projectId", "status");

-- CreateIndex
CREATE INDEX "Issue_createdAt_idx" ON "Issue"("createdAt");

-- CreateIndex
CREATE INDEX "Issue_resolvedAt_idx" ON "Issue"("resolvedAt");
