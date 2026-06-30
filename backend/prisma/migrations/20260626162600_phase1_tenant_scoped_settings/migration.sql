-- Phase 1 tenant hardening for settings.
-- Safe order: add nullable column, backfill existing data, then enforce constraints.

INSERT INTO "Tenant" ("id", "name", "slug", "createdAt", "updatedAt")
VALUES ('tenant_default', 'Default Tenant', 'default', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("slug") DO NOTHING;

ALTER TABLE "Setting" ADD COLUMN "tenantId" TEXT;

UPDATE "Setting"
SET "tenantId" = 'tenant_default'
WHERE "tenantId" IS NULL;

ALTER TABLE "Setting" ALTER COLUMN "tenantId" SET NOT NULL;

ALTER TABLE "Setting" DROP CONSTRAINT IF EXISTS "Setting_key_key";

CREATE INDEX "Setting_tenantId_idx" ON "Setting"("tenantId");

CREATE UNIQUE INDEX "Setting_tenantId_key_key" ON "Setting"("tenantId", "key");

ALTER TABLE "Setting"
ADD CONSTRAINT "Setting_tenantId_fkey"
FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
