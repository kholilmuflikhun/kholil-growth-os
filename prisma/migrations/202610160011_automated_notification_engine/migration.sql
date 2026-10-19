-- Phase 24: allow separate upcoming and overdue notifications for one reminder.
DROP INDEX IF EXISTS "Notification_reminderId_key";
ALTER TABLE "Notification" ADD COLUMN "dedupeKey" TEXT;
CREATE UNIQUE INDEX "Notification_dedupeKey_key" ON "Notification"("dedupeKey");
