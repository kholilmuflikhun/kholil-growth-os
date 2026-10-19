ALTER TABLE "FinancialTransaction" ADD COLUMN IF NOT EXISTS "projectId" TEXT;
CREATE INDEX IF NOT EXISTS "FinancialTransaction_projectId_occurredAt_idx"
  ON "FinancialTransaction"("projectId", "occurredAt");
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'FinancialTransaction_projectId_fkey'
  ) THEN
    ALTER TABLE "FinancialTransaction"
      ADD CONSTRAINT "FinancialTransaction_projectId_fkey"
      FOREIGN KEY ("projectId") REFERENCES "Project"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
