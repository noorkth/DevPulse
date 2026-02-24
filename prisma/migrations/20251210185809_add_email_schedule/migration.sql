-- CreateTable
CREATE TABLE "EmailSchedule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "reportType" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "dayOfWeek" INTEGER,
    "dayOfMonth" INTEGER,
    "time" TEXT NOT NULL,
    "recipients" TEXT NOT NULL,
    "ccList" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "lastRun" DATETIME,
    "nextRun" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Issue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "featureId" TEXT,
    "projectId" TEXT NOT NULL,
    "assignedToId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" DATETIME,
    "resolutionTime" REAL,
    "fixQuality" INTEGER,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "recurrenceCount" INTEGER NOT NULL DEFAULT 0,
    "parentIssueId" TEXT,
    "notes" TEXT,
    "attachments" TEXT,
    "estimatedTime" REAL,
    "tags" TEXT,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Issue_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Issue_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "Developer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Issue_featureId_fkey" FOREIGN KEY ("featureId") REFERENCES "Feature" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Issue_parentIssueId_fkey" FOREIGN KEY ("parentIssueId") REFERENCES "Issue" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Issue" ("assignedToId", "attachments", "createdAt", "description", "estimatedTime", "featureId", "fixQuality", "id", "isRecurring", "notes", "parentIssueId", "projectId", "recurrenceCount", "resolutionTime", "resolvedAt", "severity", "status", "tags", "title", "updatedAt") SELECT "assignedToId", "attachments", "createdAt", "description", "estimatedTime", "featureId", "fixQuality", "id", "isRecurring", "notes", "parentIssueId", "projectId", "recurrenceCount", "resolutionTime", "resolvedAt", "severity", "status", "tags", "title", "updatedAt" FROM "Issue";
DROP TABLE "Issue";
ALTER TABLE "new_Issue" RENAME TO "Issue";
CREATE INDEX "Issue_projectId_idx" ON "Issue"("projectId");
CREATE INDEX "Issue_assignedToId_idx" ON "Issue"("assignedToId");
CREATE INDEX "Issue_featureId_idx" ON "Issue"("featureId");
CREATE INDEX "Issue_status_idx" ON "Issue"("status");
CREATE INDEX "Issue_severity_idx" ON "Issue"("severity");
CREATE INDEX "Issue_isRecurring_idx" ON "Issue"("isRecurring");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "EmailSchedule_enabled_idx" ON "EmailSchedule"("enabled");

-- CreateIndex
CREATE INDEX "EmailSchedule_nextRun_idx" ON "EmailSchedule"("nextRun");
