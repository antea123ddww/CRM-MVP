-- Move lead source data fully into Lead.source and remove the lookup table.
-- This keeps existing source values and backfills from LeadSource where needed.

UPDATE "Lead"
SET "source" = "LeadSource"."name"
FROM "LeadSource"
WHERE "Lead"."leadSourceId" = "LeadSource"."id"
  AND (
    "Lead"."source" IS NULL
    OR btrim("Lead"."source") = ''
  );

ALTER TABLE "Lead" DROP CONSTRAINT "Lead_leadSourceId_fkey";

DROP INDEX "Lead_leadSourceId_idx";

ALTER TABLE "Lead" DROP COLUMN "leadSourceId";

DROP TABLE "LeadSource";

DROP SEQUENCE IF EXISTS "LeadSource_id_seq";
