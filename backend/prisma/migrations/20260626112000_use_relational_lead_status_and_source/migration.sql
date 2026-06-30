-- Keep the old enum temporarily so existing Lead.status values can be mapped safely.
ALTER TYPE "LeadStatus" RENAME TO "LeadStatusEnum";

CREATE TABLE "LeadStatus" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "isFinal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadStatus_pkey" PRIMARY KEY ("id")
);

INSERT INTO "LeadStatus" ("id", "name", "order", "isFinal", "createdAt")
VALUES
  ('lead_status_new', 'New', 1, false, CURRENT_TIMESTAMP),
  ('lead_status_contacted', 'Contacted', 2, false, CURRENT_TIMESTAMP),
  ('lead_status_qualified', 'Qualified', 3, false, CURRENT_TIMESTAMP),
  ('lead_status_proposal_sent', 'Proposal Sent', 4, false, CURRENT_TIMESTAMP),
  ('lead_status_negotiation', 'Negotiation', 5, false, CURRENT_TIMESTAMP),
  ('lead_status_converted', 'Converted', 6, true, CURRENT_TIMESTAMP),
  ('lead_status_lost', 'Lost', 7, true, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

CREATE UNIQUE INDEX "LeadStatus_name_key" ON "LeadStatus"("name");
CREATE UNIQUE INDEX "LeadStatus_order_key" ON "LeadStatus"("order");

ALTER TABLE "Lead"
ADD COLUMN "statusId" TEXT,
ADD COLUMN "leadSourceId" TEXT;

UPDATE "Lead"
SET "statusId" = CASE "status"::text
  WHEN 'NEW' THEN 'lead_status_new'
  WHEN 'CONTACTED' THEN 'lead_status_contacted'
  WHEN 'QUALIFIED' THEN 'lead_status_qualified'
  WHEN 'PROPOSAL_SENT' THEN 'lead_status_proposal_sent'
  WHEN 'NEGOTIATION' THEN 'lead_status_negotiation'
  WHEN 'CONVERTED' THEN 'lead_status_converted'
  WHEN 'LOST' THEN 'lead_status_lost'
  ELSE 'lead_status_new'
END;

INSERT INTO "LeadSource" ("id", "name", "createdAt")
SELECT
  'lead_source_' || md5(lower(trimmed_source)),
  trimmed_source,
  CURRENT_TIMESTAMP
FROM (
  SELECT DISTINCT trim("source") AS trimmed_source
  FROM "Lead"
  WHERE "source" IS NOT NULL AND trim("source") <> ''
) AS sources
WHERE NOT EXISTS (
  SELECT 1 FROM "LeadSource" WHERE "LeadSource"."name" = sources.trimmed_source
);

UPDATE "Lead"
SET "leadSourceId" = "LeadSource"."id"
FROM "LeadSource"
WHERE trim("Lead"."source") = "LeadSource"."name";

UPDATE "Lead"
SET "statusId" = 'lead_status_new'
WHERE "statusId" IS NULL;

ALTER TABLE "Lead" ALTER COLUMN "statusId" SET NOT NULL;

CREATE INDEX "Lead_statusId_idx" ON "Lead"("statusId");
CREATE INDEX "Lead_leadSourceId_idx" ON "Lead"("leadSourceId");

ALTER TABLE "Lead"
ADD CONSTRAINT "Lead_statusId_fkey"
FOREIGN KEY ("statusId") REFERENCES "LeadStatus"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Lead"
ADD CONSTRAINT "Lead_leadSourceId_fkey"
FOREIGN KEY ("leadSourceId") REFERENCES "LeadSource"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Lead" DROP COLUMN "status";
ALTER TABLE "Lead" DROP COLUMN "source";

DROP TYPE "LeadStatusEnum";
