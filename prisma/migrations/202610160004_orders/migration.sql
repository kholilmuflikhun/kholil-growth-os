CREATE TABLE IF NOT EXISTS "Order" (
  "id" TEXT NOT NULL,
  "proposalId" TEXT,
  "projectId" TEXT,
  "customerName" TEXT NOT NULL,
  "contact" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "amount" DECIMAL(14,2) NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'CONFIRMED',
  "startDate" TIMESTAMP(3),
  "dueDate" TIMESTAMP(3),
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Order_proposalId_key" ON "Order"("proposalId");
CREATE INDEX IF NOT EXISTS "Order_status_dueDate_idx" ON "Order"("status", "dueDate");
CREATE INDEX IF NOT EXISTS "Order_customerName_createdAt_idx" ON "Order"("customerName", "createdAt");
DO $$ BEGIN
  ALTER TABLE "Order" ADD CONSTRAINT "Order_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "Order" ADD CONSTRAINT "Order_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
