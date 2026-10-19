CREATE TABLE IF NOT EXISTS "MonthlyPlan" (
  "id" TEXT NOT NULL,
  "monthKey" TEXT NOT NULL,
  "monthStart" TIMESTAMP(3) NOT NULL,
  "summary" TEXT,
  "wins" TEXT,
  "challenges" TEXT,
  "focusOne" TEXT,
  "focusTwo" TEXT,
  "focusThree" TEXT,
  "revenueTarget" DECIMAL(14,2) NOT NULL DEFAULT 5200000,
  "leadTarget" INTEGER NOT NULL DEFAULT 20,
  "contentTarget" INTEGER NOT NULL DEFAULT 12,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MonthlyPlan_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "MonthlyPlan_monthKey_key" ON "MonthlyPlan"("monthKey");
CREATE INDEX IF NOT EXISTS "MonthlyPlan_monthStart_idx" ON "MonthlyPlan"("monthStart");
