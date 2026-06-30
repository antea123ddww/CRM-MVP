-- Restore relational CRM lookup tables without deleting existing CRM data.
-- Safe order: create lookup tables, add nullable FK columns, backfill, then enforce constraints.

INSERT INTO "Tenant" ("id", "name", "slug", "createdAt", "updatedAt")
VALUES ('tenant_default', 'Default Tenant', 'default', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("slug") DO NOTHING;

UPDATE "User" SET "tenantId" = 'tenant_default' WHERE "tenantId" IS NULL;
UPDATE "Company" SET "tenantId" = 'tenant_default' WHERE "tenantId" IS NULL;
UPDATE "Contact" SET "tenantId" = 'tenant_default' WHERE "tenantId" IS NULL;
UPDATE "Lead" SET "tenantId" = 'tenant_default' WHERE "tenantId" IS NULL;
UPDATE "Deal" SET "tenantId" = 'tenant_default' WHERE "tenantId" IS NULL;
UPDATE "Task" SET "tenantId" = 'tenant_default' WHERE "tenantId" IS NULL;
UPDATE "Activity" SET "tenantId" = 'tenant_default' WHERE "tenantId" IS NULL;
UPDATE "Note" SET "tenantId" = 'tenant_default' WHERE "tenantId" IS NULL;
UPDATE "AuditLog" SET "tenantId" = 'tenant_default' WHERE "tenantId" IS NULL;

-- The old Lead.status enum type is named "LeadStatus"; rename it so the lookup
-- table can use the required "LeadStatus" table name.
ALTER TYPE "LeadStatus" RENAME TO "LeadStatusEnum";

CREATE TABLE "PipelineStage" (
  "id" SERIAL NOT NULL,
  "name" TEXT NOT NULL,
  "order" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PipelineStage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LeadStatus" (
  "id" SERIAL NOT NULL,
  "name" TEXT NOT NULL,
  "code" "LeadStatusEnum" NOT NULL,
  "order" INTEGER NOT NULL,
  "isFinal" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LeadStatus_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LeadSource" (
  "id" SERIAL NOT NULL,
  "name" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LeadSource_pkey" PRIMARY KEY ("id")
);

INSERT INTO "PipelineStage" ("id", "name", "order", "createdAt")
VALUES
  (1, 'New', 1, CURRENT_TIMESTAMP),
  (2, 'Qualified', 2, CURRENT_TIMESTAMP),
  (3, 'Proposal', 3, CURRENT_TIMESTAMP),
  (4, 'Negotiation', 4, CURRENT_TIMESTAMP),
  (5, 'Won', 5, CURRENT_TIMESTAMP),
  (6, 'Lost', 6, CURRENT_TIMESTAMP);

INSERT INTO "LeadStatus" ("id", "name", "code", "order", "isFinal", "createdAt")
VALUES
  (1, 'New', 'NEW', 1, false, CURRENT_TIMESTAMP),
  (2, 'Contacted', 'CONTACTED', 2, false, CURRENT_TIMESTAMP),
  (3, 'Qualified', 'QUALIFIED', 3, false, CURRENT_TIMESTAMP),
  (4, 'Proposal Sent', 'PROPOSAL_SENT', 4, false, CURRENT_TIMESTAMP),
  (5, 'Negotiation', 'NEGOTIATION', 5, false, CURRENT_TIMESTAMP),
  (6, 'Converted', 'CONVERTED', 6, true, CURRENT_TIMESTAMP),
  (7, 'Lost', 'LOST', 7, true, CURRENT_TIMESTAMP);

INSERT INTO "LeadSource" ("id", "name", "createdAt")
VALUES
  (1, 'Website', CURRENT_TIMESTAMP),
  (2, 'Referral', CURRENT_TIMESTAMP),
  (3, 'Social Media', CURRENT_TIMESTAMP),
  (4, 'Email Campaign', CURRENT_TIMESTAMP),
  (5, 'Cold Call', CURRENT_TIMESTAMP);

CREATE UNIQUE INDEX "PipelineStage_name_key" ON "PipelineStage"("name");
CREATE UNIQUE INDEX "PipelineStage_order_key" ON "PipelineStage"("order");
CREATE UNIQUE INDEX "LeadStatus_name_key" ON "LeadStatus"("name");
CREATE UNIQUE INDEX "LeadStatus_code_key" ON "LeadStatus"("code");
CREATE UNIQUE INDEX "LeadStatus_order_key" ON "LeadStatus"("order");
CREATE UNIQUE INDEX "LeadSource_name_key" ON "LeadSource"("name");

SELECT setval('"LeadSource_id_seq"', COALESCE((SELECT MAX("id") FROM "LeadSource"), 1), true);

INSERT INTO "LeadSource" ("name", "createdAt")
SELECT DISTINCT trim("source"), CURRENT_TIMESTAMP
FROM "Lead"
WHERE "source" IS NOT NULL
  AND trim("source") <> ''
ON CONFLICT ("name") DO NOTHING;

ALTER TABLE "Deal" ADD COLUMN "stageId" INTEGER;
ALTER TABLE "Lead" ADD COLUMN "statusId" INTEGER;
ALTER TABLE "Lead" ADD COLUMN "leadSourceId" INTEGER;

UPDATE "Deal"
SET "stageId" = CASE "stage"::text
  WHEN 'NEW' THEN 1
  WHEN 'QUALIFIED' THEN 2
  WHEN 'PROPOSAL' THEN 3
  WHEN 'NEGOTIATION' THEN 4
  WHEN 'WON' THEN 5
  WHEN 'LOST' THEN 6
  ELSE 1
END;

UPDATE "Lead"
SET "statusId" = CASE "status"::text
  WHEN 'NEW' THEN 1
  WHEN 'CONTACTED' THEN 2
  WHEN 'QUALIFIED' THEN 3
  WHEN 'PROPOSAL_SENT' THEN 4
  WHEN 'NEGOTIATION' THEN 5
  WHEN 'CONVERTED' THEN 6
  WHEN 'LOST' THEN 7
  ELSE 1
END;

UPDATE "Lead"
SET "leadSourceId" = "LeadSource"."id"
FROM "LeadSource"
WHERE trim("Lead"."source") = "LeadSource"."name";

UPDATE "Deal" SET "stageId" = 1 WHERE "stageId" IS NULL;
UPDATE "Lead" SET "statusId" = 1 WHERE "statusId" IS NULL;

ALTER TABLE "Deal" ALTER COLUMN "stageId" SET NOT NULL;
ALTER TABLE "Deal" ALTER COLUMN "stageId" SET DEFAULT 1;
ALTER TABLE "Lead" ALTER COLUMN "statusId" SET NOT NULL;
ALTER TABLE "Lead" ALTER COLUMN "statusId" SET DEFAULT 1;

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

SELECT setval('"PipelineStage_id_seq"', COALESCE((SELECT MAX("id") FROM "PipelineStage"), 1), true);
SELECT setval('"LeadStatus_id_seq"', COALESCE((SELECT MAX("id") FROM "LeadStatus"), 1), true);
SELECT setval('"LeadSource_id_seq"', COALESCE((SELECT MAX("id") FROM "LeadSource"), 1), true);
