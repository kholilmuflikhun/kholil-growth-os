CREATE TABLE IF NOT EXISTS "Proposal" (
  "id" TEXT NOT NULL,
  "leadId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "amount" DECIMAL(14,2) NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "sentAt" TIMESTAMP(3),
  "validUntil" TIMESTAMP(3),
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Proposal_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "Proposal_status_createdAt_idx" ON "Proposal"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "Proposal_leadId_createdAt_idx" ON "Proposal"("leadId", "createdAt");
DO $$ BEGIN
  ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
