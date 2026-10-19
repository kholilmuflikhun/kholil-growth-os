CREATE TABLE IF NOT EXISTS "CustomerCarePlan" (
  "id" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "serviceName" TEXT NOT NULL,
  "amount" DECIMAL(14,2) NOT NULL,
  "cadence" TEXT NOT NULL DEFAULT 'MONTHLY',
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "startAt" TIMESTAMP(3) NOT NULL,
  "nextRenewalAt" TIMESTAMP(3),
  "lastContactAt" TIMESTAMP(3),
  "nextContactAt" TIMESTAMP(3),
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CustomerCarePlan_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CustomerCarePlan_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "CustomerCarePlan_customerId_status_idx" ON "CustomerCarePlan"("customerId", "status");
CREATE INDEX IF NOT EXISTS "CustomerCarePlan_status_nextRenewalAt_idx" ON "CustomerCarePlan"("status", "nextRenewalAt");
CREATE INDEX IF NOT EXISTS "CustomerCarePlan_status_nextContactAt_idx" ON "CustomerCarePlan"("status", "nextContactAt");
