ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "customerId" TEXT;
CREATE INDEX IF NOT EXISTS "Order_customerId_createdAt_idx" ON "Order"("customerId", "createdAt");

CREATE TABLE IF NOT EXISTS "Payment" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "transactionId" TEXT,
  "amount" DECIMAL(14,2) NOT NULL,
  "paidAt" TIMESTAMP(3) NOT NULL,
  "method" TEXT NOT NULL DEFAULT 'TRANSFER',
  "reference" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Payment_transactionId_key" ON "Payment"("transactionId");
CREATE INDEX IF NOT EXISTS "Payment_orderId_paidAt_idx" ON "Payment"("orderId", "paidAt");
CREATE INDEX IF NOT EXISTS "Payment_customerId_paidAt_idx" ON "Payment"("customerId", "paidAt");
CREATE INDEX IF NOT EXISTS "Customer_name_idx" ON "Customer"("name");
CREATE INDEX IF NOT EXISTS "Customer_phone_idx" ON "Customer"("phone");
CREATE INDEX IF NOT EXISTS "Customer_email_idx" ON "Customer"("email");

DO $$ BEGIN
  ALTER TABLE "Order" ADD CONSTRAINT "Order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "Payment" ADD CONSTRAINT "Payment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "Payment" ADD CONSTRAINT "Payment_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "Payment" ADD CONSTRAINT "Payment_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "FinancialTransaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
