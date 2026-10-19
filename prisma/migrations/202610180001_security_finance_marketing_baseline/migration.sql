-- Security/session tracking and explicit finance classifications.
ALTER TABLE "Service" ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;
CREATE INDEX "Service_status_sortOrder_idx" ON "Service"("status", "sortOrder");

ALTER TABLE "Lead" ADD COLUMN "consentedAt" TIMESTAMP(3);
ALTER TABLE "Lead" ADD COLUMN "sourceUrl" TEXT;
ALTER TABLE "Lead" ADD COLUMN "utmSource" TEXT;
ALTER TABLE "Lead" ADD COLUMN "utmMedium" TEXT;
ALTER TABLE "Lead" ADD COLUMN "utmCampaign" TEXT;
ALTER TABLE "Lead" ADD COLUMN "campaignId" TEXT;
CREATE INDEX "Lead_campaignId_createdAt_idx" ON "Lead"("campaignId", "createdAt");
CREATE INDEX "Lead_utmCampaign_createdAt_idx" ON "Lead"("utmCampaign", "createdAt");
ALTER TABLE "Lead" ADD COLUMN "consentVersion" TEXT;

ALTER TABLE "FinancialTransaction"
  ADD COLUMN "classification" TEXT NOT NULL DEFAULT 'UNCLASSIFIED';

ALTER TABLE "Order" ADD COLUMN "deliveredAt" TIMESTAMP(3);
CREATE INDEX "Order_deliveredAt_idx" ON "Order"("deliveredAt");

ALTER TABLE "Payment" ADD COLUMN "idempotencyKey" TEXT;
CREATE UNIQUE INDEX "Payment_idempotencyKey_key" ON "Payment"("idempotencyKey");

CREATE TABLE "AuthSession" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "revokedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuthSession_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "AuthSession_userId_expiresAt_idx" ON "AuthSession"("userId", "expiresAt");
CREATE INDEX "AuthSession_expiresAt_revokedAt_idx" ON "AuthSession"("expiresAt", "revokedAt");
ALTER TABLE "AuthSession" ADD CONSTRAINT "AuthSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "RateLimitBucket" (
  "id" TEXT NOT NULL,
  "keyHash" TEXT NOT NULL,
  "windowStart" TIMESTAMP(3) NOT NULL,
  "count" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RateLimitBucket_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "RateLimitBucket_keyHash_windowStart_key" ON "RateLimitBucket"("keyHash", "windowStart");
CREATE INDEX "RateLimitBucket_windowStart_idx" ON "RateLimitBucket"("windowStart");


CREATE TABLE "Campaign" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "objective" TEXT NOT NULL,
  "channel" TEXT NOT NULL,
  "budget" DECIMAL(14,2),
  "currency" TEXT NOT NULL DEFAULT 'IDR',
  "startDate" TIMESTAMP(3),
  "endDate" TIMESTAMP(3),
  "targetLeads" INTEGER,
  "targetConversions" INTEGER,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Campaign_slug_key" ON "Campaign"("slug");
CREATE INDEX "Campaign_status_startDate_endDate_idx" ON "Campaign"("status", "startDate", "endDate");
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ContentItem" ADD COLUMN "campaignId" TEXT;
ALTER TABLE "ContentItem" ADD COLUMN "reach" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "ContentItem" ADD COLUMN "impressions" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "ContentItem" ADD COLUMN "engagement" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "ContentItem" ADD COLUMN "clicks" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "ContentItem" ADD COLUMN "attributedLeads" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "ContentItem" ADD COLUMN "attributedRevenue" DECIMAL(14,2);
CREATE INDEX "ContentItem_campaignId_plannedAt_idx" ON "ContentItem"("campaignId", "plannedAt");
ALTER TABLE "ContentItem" ADD CONSTRAINT "ContentItem_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "Product" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "kind" TEXT NOT NULL DEFAULT 'DIGITAL',
  "price" DECIMAL(14,2),
  "currency" TEXT NOT NULL DEFAULT 'IDR',
  "licenseTerms" TEXT,
  "previewUrl" TEXT,
  "status" "RecordStatus" NOT NULL DEFAULT 'DRAFT',
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");
CREATE INDEX "Product_status_updatedAt_idx" ON "Product"("status", "updatedAt");
CREATE INDEX "Product_status_sortOrder_idx" ON "Product"("status", "sortOrder");
