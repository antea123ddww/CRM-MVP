-- Seed the default CRM pipeline stages before Deal starts referencing them.
INSERT INTO "PipelineStage" ("id", "name", "order", "createdAt")
VALUES
  ('stage_new', 'New', 1, CURRENT_TIMESTAMP),
  ('stage_qualified', 'Qualified', 2, CURRENT_TIMESTAMP),
  ('stage_proposal', 'Proposal', 3, CURRENT_TIMESTAMP),
  ('stage_negotiation', 'Negotiation', 4, CURRENT_TIMESTAMP),
  ('stage_won', 'Won', 5, CURRENT_TIMESTAMP),
  ('stage_lost', 'Lost', 6, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

-- Pipeline stages are configuration data, so keep names and ordering unique.
CREATE UNIQUE INDEX IF NOT EXISTS "PipelineStage_name_key" ON "PipelineStage"("name");
CREATE UNIQUE INDEX IF NOT EXISTS "PipelineStage_order_key" ON "PipelineStage"("order");

ALTER TABLE "Deal" ADD COLUMN "stageId" TEXT;

UPDATE "Deal"
SET "stageId" = CASE "stage"::text
  WHEN 'NEW' THEN 'stage_new'
  WHEN 'QUALIFIED' THEN 'stage_qualified'
  WHEN 'PROPOSAL' THEN 'stage_proposal'
  WHEN 'NEGOTIATION' THEN 'stage_negotiation'
  WHEN 'WON' THEN 'stage_won'
  WHEN 'LOST' THEN 'stage_lost'
  ELSE 'stage_new'
END;

UPDATE "Deal"
SET "stageId" = 'stage_new'
WHERE "stageId" IS NULL;

ALTER TABLE "Deal" ALTER COLUMN "stageId" SET NOT NULL;

CREATE INDEX "Deal_stageId_idx" ON "Deal"("stageId");

ALTER TABLE "Deal"
ADD CONSTRAINT "Deal_stageId_fkey"
FOREIGN KEY ("stageId") REFERENCES "PipelineStage"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Deal" DROP COLUMN "stage";

DROP TYPE "DealStage";
