-- Move Lead status/source values back into Lead while preserving existing data.
-- This keeps the user-facing model aligned with the original MVP documentation.

ALTER TABLE "Lead"
ADD COLUMN "source" TEXT,
ADD COLUMN "statusText" TEXT;

UPDATE "Lead"
SET "source" = "LeadSource"."name"
FROM "LeadSource"
WHERE "Lead"."leadSourceId" = "LeadSource"."id";

UPDATE "Lead"
SET "statusText" = CASE "LeadStatus"."name"
  WHEN 'New' THEN 'NEW'
  WHEN 'Contacted' THEN 'CONTACTED'
  WHEN 'Qualified' THEN 'QUALIFIED'
  WHEN 'Proposal Sent' THEN 'PROPOSAL_SENT'
  WHEN 'Negotiation' THEN 'NEGOTIATION'
  WHEN 'Converted' THEN 'CONVERTED'
  WHEN 'Lost' THEN 'LOST'
  ELSE 'NEW'
END
FROM "LeadStatus"
WHERE "Lead"."statusId" = "LeadStatus"."id";

UPDATE "Lead"
SET "statusText" = 'NEW'
WHERE "statusText" IS NULL;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "Lead" WHERE "statusText" IS NULL) THEN
    RAISE EXCEPTION 'A Lead row could not be mapped to embedded status';
  END IF;
END $$;

ALTER TABLE "Lead" DROP CONSTRAINT "Lead_statusId_fkey";
ALTER TABLE "Lead" DROP CONSTRAINT "Lead_leadSourceId_fkey";

DROP INDEX "Lead_statusId_idx";
DROP INDEX "Lead_leadSourceId_idx";

ALTER TABLE "Lead" DROP COLUMN "statusId";
ALTER TABLE "Lead" DROP COLUMN "leadSourceId";

DROP TABLE "LeadStatus";
DROP TABLE "LeadSource";

CREATE TYPE "LeadStatus" AS ENUM (
  'NEW',
  'CONTACTED',
  'QUALIFIED',
  'PROPOSAL_SENT',
  'NEGOTIATION',
  'CONVERTED',
  'LOST'
);

ALTER TABLE "Lead" ADD COLUMN "status" "LeadStatus";

UPDATE "Lead"
SET "status" = "statusText"::"LeadStatus";

ALTER TABLE "Lead" ALTER COLUMN "status" SET NOT NULL;
ALTER TABLE "Lead" ALTER COLUMN "status" SET DEFAULT 'NEW';
ALTER TABLE "Lead" DROP COLUMN "statusText";
