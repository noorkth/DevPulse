/*
  Warnings:

  - You are about to alter the column `resolutionTime` on the `Issue` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Float`.
  - Added the required column `updatedAt` to the `Issue` table without a default value. This is not possible if the table is not empty.
  - Made the column `assignedToId` on table `Issue` required. This step will fail if there are existing NULL values in that column.
  - Made the column `featureId` on table `Issue` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateTable
CREATE TABLE "DeveloperGoal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "developerId" TEXT NOT NULL,
    "goalType" TEXT NOT NULL,
    "targetValue" REAL NOT NULL,
    "currentValue" REAL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DeveloperGoal_developerId_fkey" FOREIGN KEY ("developerId") REFERENCES "Developer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
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
    "featureId" TEXT NOT NULL,
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
INSERT INTO "new_Issue" ("assignedToId", "attachments", "createdAt", "description", "featureId", "fixQuality", "id", "isRecurring", "notes", "parentIssueId", "projectId", "recurrenceCount", "resolutionTime", "resolvedAt", "severity", "status", "title") SELECT "assignedToId", "attachments", "createdAt", "description", "featureId", "fixQuality", "id", "isRecurring", "notes", "parentIssueId", "projectId", "recurrenceCount", "resolutionTime", "resolvedAt", "severity", "status", "title" FROM "Issue";
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
CREATE INDEX "DeveloperGoal_developerId_idx" ON "DeveloperGoal"("developerId");

-- CreateIndex
CREATE INDEX "DeveloperGoal_status_idx" ON "DeveloperGoal"("status");

-- CreateIndex
CREATE INDEX "DeveloperGoal_goalType_idx" ON "DeveloperGoal"("goalType");
