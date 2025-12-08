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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Developer" ("createdAt", "email", "fullName", "id", "seniorityLevel", "skills", "updatedAt") SELECT "createdAt", "email", "fullName", "id", "seniorityLevel", "skills", "updatedAt" FROM "Developer";
DROP TABLE "Developer";
ALTER TABLE "new_Developer" RENAME TO "Developer";
CREATE UNIQUE INDEX "Developer_email_key" ON "Developer"("email");
CREATE INDEX "Developer_email_idx" ON "Developer"("email");
CREATE INDEX "Developer_seniorityLevel_idx" ON "Developer"("seniorityLevel");
CREATE INDEX "Developer_role_idx" ON "Developer"("role");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
