-- Convert lookup-table primary keys from stable string IDs to numeric IDs.
-- Existing Deal and Lead rows are remapped before old foreign keys are removed.

ALTER TABLE "PipelineStage" ADD COLUMN "nextId" INTEGER;
ALTER TABLE "LeadStatus" ADD COLUMN "nextId" INTEGER;
ALTER TABLE "LeadSource" ADD COLUMN "nextId" INTEGER;

UPDATE "PipelineStage"
SET "nextId" = CASE "name"
  WHEN 'New' THEN 1
  WHEN 'Qualified' THEN 2
  WHEN 'Proposal' THEN 3
  WHEN 'Negotiation' THEN 4
  WHEN 'Won' THEN 5
  WHEN 'Lost' THEN 6
  ELSE "order"
END;

UPDATE "LeadStatus"
SET "nextId" = CASE "name"
  WHEN 'New' THEN 1
  WHEN 'Contacted' THEN 2
  WHEN 'Qualified' THEN 3
  WHEN 'Proposal Sent' THEN 4
  WHEN 'Negotiation' THEN 5
  WHEN 'Converted' THEN 6
  WHEN 'Lost' THEN 7
  ELSE "order"
END;

WITH numbered_sources AS (
  SELECT "id", row_number() OVER (ORDER BY "name")::integer AS next_id
  FROM "LeadSource"
)
UPDATE "LeadSource"
SET "nextId" = numbered_sources.next_id
FROM numbered_sources
WHERE "LeadSource"."id" = numbered_sources."id";

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "PipelineStage" GROUP BY "nextId" HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Duplicate PipelineStage nextId values detected';
  END IF;

  IF EXISTS (
    SELECT 1 FROM "LeadStatus" GROUP BY "nextId" HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Duplicate LeadStatus nextId values detected';
  END IF;

  IF EXISTS (
    SELECT 1 FROM "LeadSource" GROUP BY "nextId" HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Duplicate LeadSource nextId values detected';
  END IF;
END $$;

ALTER TABLE "Deal" ADD COLUMN "nextStageId" INTEGER;
ALTER TABLE "Lead" ADD COLUMN "nextStatusId" INTEGER;
ALTER TABLE "Lead" ADD COLUMN "nextLeadSourceId" INTEGER;

UPDATE "Deal"
SET "nextStageId" = "PipelineStage"."nextId"
FROM "PipelineStage"
WHERE "Deal"."stageId" = "PipelineStage"."id";

UPDATE "Lead"
SET "nextStatusId" = "LeadStatus"."nextId"
FROM "LeadStatus"
WHERE "Lead"."statusId" = "LeadStatus"."id";

UPDATE "Lead"
SET "nextLeadSourceId" = "LeadSource"."nextId"
FROM "LeadSource"
WHERE "Lead"."leadSourceId" = "LeadSource"."id";

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "Deal" WHERE "nextStageId" IS NULL) THEN
    RAISE EXCEPTION 'A Deal row could not be mapped to numeric stageId';
  END IF;

  IF EXISTS (SELECT 1 FROM "Lead" WHERE "nextStatusId" IS NULL) THEN
    RAISE EXCEPTION 'A Lead row could not be mapped to numeric statusId';
  END IF;

  IF EXISTS (
    SELECT 1 FROM "Lead"
    WHERE "leadSourceId" IS NOT NULL AND "nextLeadSourceId" IS NULL
  ) THEN
    RAISE EXCEPTION 'A Lead row could not be mapped to numeric leadSourceId';
  END IF;
END $$;

ALTER TABLE "Deal" DROP CONSTRAINT "Deal_stageId_fkey";
ALTER TABLE "Lead" DROP CONSTRAINT "Lead_statusId_fkey";
ALTER TABLE "Lead" DROP CONSTRAINT "Lead_leadSourceId_fkey";

DROP INDEX "Deal_stageId_idx";
DROP INDEX "Lead_statusId_idx";
DROP INDEX "Lead_leadSourceId_idx";

ALTER TABLE "PipelineStage" DROP CONSTRAINT "PipelineStage_pkey";
ALTER TABLE "LeadStatus" DROP CONSTRAINT "LeadStatus_pkey";
ALTER TABLE "LeadSource" DROP CONSTRAINT "LeadSource_pkey";

ALTER TABLE "Deal" DROP COLUMN "stageId";
ALTER TABLE "Lead" DROP COLUMN "statusId";
ALTER TABLE "Lead" DROP COLUMN "leadSourceId";

ALTER TABLE "PipelineStage" DROP COLUMN "id";
ALTER TABLE "LeadStatus" DROP COLUMN "id";
ALTER TABLE "LeadSource" DROP COLUMN "id";

ALTER TABLE "PipelineStage" RENAME COLUMN "nextId" TO "id";
ALTER TABLE "LeadStatus" RENAME COLUMN "nextId" TO "id";
ALTER TABLE "LeadSource" RENAME COLUMN "nextId" TO "id";

ALTER TABLE "Deal" RENAME COLUMN "nextStageId" TO "stageId";
ALTER TABLE "Lead" RENAME COLUMN "nextStatusId" TO "statusId";
ALTER TABLE "Lead" RENAME COLUMN "nextLeadSourceId" TO "leadSourceId";

ALTER TABLE "PipelineStage" ALTER COLUMN "id" SET NOT NULL;
ALTER TABLE "LeadStatus" ALTER COLUMN "id" SET NOT NULL;
ALTER TABLE "LeadSource" ALTER COLUMN "id" SET NOT NULL;
ALTER TABLE "Deal" ALTER COLUMN "stageId" SET NOT NULL;
ALTER TABLE "Lead" ALTER COLUMN "statusId" SET NOT NULL;

CREATE SEQUENCE "PipelineStage_id_seq";
ALTER SEQUENCE "PipelineStage_id_seq" OWNED BY "PipelineStage"."id";
ALTER TABLE "PipelineStage" ALTER COLUMN "id" SET DEFAULT nextval('"PipelineStage_id_seq"');
SELECT setval('"PipelineStage_id_seq"', COALESCE((SELECT MAX("id") FROM "PipelineStage"), 0) + 1, false);

CREATE SEQUENCE "LeadStatus_id_seq";
ALTER SEQUENCE "LeadStatus_id_seq" OWNED BY "LeadStatus"."id";
ALTER TABLE "LeadStatus" ALTER COLUMN "id" SET DEFAULT nextval('"LeadStatus_id_seq"');
SELECT setval('"LeadStatus_id_seq"', COALESCE((SELECT MAX("id") FROM "LeadStatus"), 0) + 1, false);

CREATE SEQUENCE "LeadSource_id_seq";
ALTER SEQUENCE "LeadSource_id_seq" OWNED BY "LeadSource"."id";
ALTER TABLE "LeadSource" ALTER COLUMN "id" SET DEFAULT nextval('"LeadSource_id_seq"');
SELECT setval('"LeadSource_id_seq"', COALESCE((SELECT MAX("id") FROM "LeadSource"), 0) + 1, false);

ALTER TABLE "PipelineStage" ADD CONSTRAINT "PipelineStage_pkey" PRIMARY KEY ("id");
ALTER TABLE "LeadStatus" ADD CONSTRAINT "LeadStatus_pkey" PRIMARY KEY ("id");
ALTER TABLE "LeadSource" ADD CONSTRAINT "LeadSource_pkey" PRIMARY KEY ("id");

CREATE INDEX "Deal_stageId_idx" ON "Deal"("stageId");
CREATE INDEX "Lead_statusId_idx" ON "Lead"("statusId");
CREATE INDEX "Lead_leadSourceId_idx" ON "Lead"("leadSourceId");

ALTER TABLE "Deal"
ADD CONSTRAINT "Deal_stageId_fkey"
FOREIGN KEY ("stageId") REFERENCES "PipelineStage"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Lead"
ADD CONSTRAINT "Lead_statusId_fkey"
FOREIGN KEY ("statusId") REFERENCES "LeadStatus"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Lead"
ADD CONSTRAINT "Lead_leadSourceId_fkey"
FOREIGN KEY ("leadSourceId") REFERENCES "LeadSource"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
