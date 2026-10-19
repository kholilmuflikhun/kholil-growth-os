CREATE TABLE IF NOT EXISTS "ActionItem" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "category" TEXT NOT NULL DEFAULT 'GENERAL',
  "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "dueAt" TIMESTAMP(3),
  "sourceKey" TEXT,
  "sourceUrl" TEXT,
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ActionItem_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "ActionItem_sourceKey_key" ON "ActionItem"("sourceKey");
CREATE INDEX IF NOT EXISTS "ActionItem_status_priority_idx" ON "ActionItem"("status", "priority");
CREATE INDEX IF NOT EXISTS "ActionItem_dueAt_status_idx" ON "ActionItem"("dueAt", "status");
CREATE INDEX IF NOT EXISTS "ActionItem_category_createdAt_idx" ON "ActionItem"("category", "createdAt");
