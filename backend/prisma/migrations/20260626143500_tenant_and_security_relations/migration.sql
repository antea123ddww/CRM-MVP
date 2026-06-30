-- Make the multi-tenant tables useful by assigning existing CRM data to a default tenant.
-- Add missing relational integrity for security/audit tables without deleting data.

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

ALTER TABLE "AuditLog" ADD COLUMN "tenantId" TEXT;

UPDATE "AuditLog"
SET "tenantId" = "User"."tenantId"
FROM "User"
WHERE "AuditLog"."userId" = "User"."id";

UPDATE "AuditLog"
SET "tenantId" = 'tenant_default'
WHERE "tenantId" IS NULL;

CREATE INDEX "AuditLog_tenantId_idx" ON "AuditLog"("tenantId");
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");
CREATE INDEX "PasswordResetToken_email_idx" ON "PasswordResetToken"("email");
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

ALTER TABLE "AuditLog"
ADD CONSTRAINT "AuditLog_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AuditLog"
ADD CONSTRAINT "AuditLog_tenantId_fkey"
FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PasswordResetToken"
ADD CONSTRAINT "PasswordResetToken_email_fkey"
FOREIGN KEY ("email") REFERENCES "User"("email")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RefreshToken"
ADD CONSTRAINT "RefreshToken_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
