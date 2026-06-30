-- Move Deal stage values back into Deal while preserving existing data.
-- This aligns Prisma Studio with the MVP documentation by removing PipelineStage as a separate table.

ALTER TABLE "Deal" ADD COLUMN "stageText" TEXT;

UPDATE "Deal"
SET "stageText" = CASE "PipelineStage"."name"
  WHEN 'New' THEN 'NEW'
  WHEN 'Qualified' THEN 'QUALIFIED'
  WHEN 'Proposal' THEN 'PROPOSAL'
  WHEN 'Negotiation' THEN 'NEGOTIATION'
  WHEN 'Won' THEN 'WON'
  WHEN 'Lost' THEN 'LOST'
  ELSE 'NEW'
END
FROM "PipelineStage"
WHERE "Deal"."stageId" = "PipelineStage"."id";

UPDATE "Deal"
SET "stageText" = 'NEW'
WHERE "stageText" IS NULL;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "Deal" WHERE "stageText" IS NULL) THEN
    RAISE EXCEPTION 'A Deal row could not be mapped to embedded stage';
  END IF;
END $$;

ALTER TABLE "Deal" DROP CONSTRAINT "Deal_stageId_fkey";
DROP INDEX "Deal_stageId_idx";

ALTER TABLE "Deal" DROP COLUMN "stageId";
DROP TABLE "PipelineStage";

CREATE TYPE "DealStage" AS ENUM (
  'NEW',
  'QUALIFIED',
  'PROPOSAL',
  'NEGOTIATION',
  'WON',
  'LOST'
);

ALTER TABLE "Deal" ADD COLUMN "stage" "DealStage";

UPDATE "Deal"
SET "stage" = "stageText"::"DealStage";

ALTER TABLE "Deal" ALTER COLUMN "stage" SET NOT NULL;
ALTER TABLE "Deal" ALTER COLUMN "stage" SET DEFAULT 'NEW';
ALTER TABLE "Deal" DROP COLUMN "stageText";
