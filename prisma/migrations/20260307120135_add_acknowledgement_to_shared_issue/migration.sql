-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SharedIssue" (
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
    "slaStatus" TEXT NOT NULL DEFAULT 'pending',
    "responseDeadline" DATETIME,
    "resolutionDeadline" DATETIME,
    "firstResponseAt" DATETIME,
    "acknowledgedAt" DATETIME,
    "acknowledgedById" TEXT,
    "slaStartedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SharedIssue_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SharedIssue_assignedOwnerId_fkey" FOREIGN KEY ("assignedOwnerId") REFERENCES "Developer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_SharedIssue" ("assignedOwnerId", "clientId", "createdAt", "description", "escalationLevel", "expectedResolution", "firstResponseAt", "id", "notes", "raisedAt", "resolutionDeadline", "resolutionSummary", "resolvedAt", "responseDeadline", "rootCause", "severity", "slaStatus", "status", "tags", "title", "updatedAt", "visibility") SELECT "assignedOwnerId", "clientId", "createdAt", "description", "escalationLevel", "expectedResolution", "firstResponseAt", "id", "notes", "raisedAt", "resolutionDeadline", "resolutionSummary", "resolvedAt", "responseDeadline", "rootCause", "severity", "slaStatus", "status", "tags", "title", "updatedAt", "visibility" FROM "SharedIssue";
DROP TABLE "SharedIssue";
ALTER TABLE "new_SharedIssue" RENAME TO "SharedIssue";
CREATE INDEX "SharedIssue_clientId_idx" ON "SharedIssue"("clientId");
CREATE INDEX "SharedIssue_status_severity_idx" ON "SharedIssue"("status", "severity");
CREATE INDEX "SharedIssue_slaStatus_idx" ON "SharedIssue"("slaStatus");
CREATE INDEX "SharedIssue_raisedAt_idx" ON "SharedIssue"("raisedAt");
CREATE INDEX "SharedIssue_escalationLevel_idx" ON "SharedIssue"("escalationLevel");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
