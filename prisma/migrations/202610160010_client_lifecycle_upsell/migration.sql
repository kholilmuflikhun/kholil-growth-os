CREATE TYPE "OpportunityStage" AS ENUM ('IDEA', 'CONTACTED', 'PROPOSED', 'WON', 'LOST');
CREATE TYPE "OpportunityPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');
CREATE TABLE "ClientOpportunity" (
  "id" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "serviceSuggested" TEXT NOT NULL,
  "estimatedValue" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "stage" "OpportunityStage" NOT NULL DEFAULT 'IDEA',
  "priority" "OpportunityPriority" NOT NULL DEFAULT 'MEDIUM',
  "nextFollowUpAt" TIMESTAMP(3),
  "source" TEXT NOT NULL DEFAULT 'MANUAL',
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ClientOpportunity_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ClientOpportunity_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "ClientOpportunity_customerId_stage_idx" ON "ClientOpportunity"("customerId", "stage");
CREATE INDEX "ClientOpportunity_stage_nextFollowUpAt_idx" ON "ClientOpportunity"("stage", "nextFollowUpAt");
CREATE INDEX "ClientOpportunity_priority_createdAt_idx" ON "ClientOpportunity"("priority", "createdAt");
