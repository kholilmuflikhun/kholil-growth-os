CREATE TABLE IF NOT EXISTS "DailyExecution" (
  "id" TEXT NOT NULL,
  "activityDate" TIMESTAMP(3) NOT NULL,
  "activity" TEXT NOT NULL,
  "category" TEXT NOT NULL DEFAULT 'SALES',
  "outcome" TEXT,
  "revenueAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "expenseAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "minutesSpent" INTEGER NOT NULL DEFAULT 0,
  "actionId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DailyExecution_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "DailyExecution_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "ActionItem"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "DailyExecution_activityDate_idx" ON "DailyExecution"("activityDate");
CREATE INDEX IF NOT EXISTS "DailyExecution_category_activityDate_idx" ON "DailyExecution"("category", "activityDate");
CREATE INDEX IF NOT EXISTS "DailyExecution_actionId_idx" ON "DailyExecution"("actionId");
