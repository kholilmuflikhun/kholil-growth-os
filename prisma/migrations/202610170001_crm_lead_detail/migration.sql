ALTER TABLE "Lead"
  ADD COLUMN "probability" INTEGER NOT NULL DEFAULT 10,
  ADD COLUMN "owner" TEXT,
  ADD COLUMN "lostReason" TEXT;

CREATE INDEX "Lead_nextFollowUp_idx" ON "Lead"("nextFollowUp");

CREATE TABLE "LeadActivity" (
  "id" TEXT NOT NULL,
  "leadId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "note" TEXT NOT NULL,
  "dueAt" TIMESTAMP(3),
  "createdBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LeadActivity_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "LeadActivity_leadId_createdAt_idx" ON "LeadActivity"("leadId", "createdAt");
CREATE INDEX "LeadActivity_dueAt_idx" ON "LeadActivity"("dueAt");
ALTER TABLE "LeadActivity" ADD CONSTRAINT "LeadActivity_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

UPDATE "Lead" SET "probability" = CASE "status"::text
  WHEN 'NEW' THEN 10
  WHEN 'CONTACTED' THEN 25
  WHEN 'QUALIFIED' THEN 50
  WHEN 'DISCOVERY' THEN 50
  WHEN 'PROPOSAL' THEN 70
  WHEN 'NEGOTIATION' THEN 85
  WHEN 'WON' THEN 100
  WHEN 'LOST' THEN 0
  ELSE 10
END;
