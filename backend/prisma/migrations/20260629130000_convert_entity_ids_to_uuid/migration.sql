-- Align core entity identifiers with UUID-based CRM documentation.
-- Safe order: drop dependent foreign keys, convert primary/foreign key columns,
-- then restore relational constraints.

ALTER TABLE "Company" DROP CONSTRAINT "Company_ownerId_fkey";
ALTER TABLE "Contact" DROP CONSTRAINT "Contact_companyId_fkey";
ALTER TABLE "Lead" DROP CONSTRAINT "Lead_assignedToId_fkey";
ALTER TABLE "Lead" DROP CONSTRAINT "Lead_companyId_fkey";
ALTER TABLE "Deal" DROP CONSTRAINT "Deal_companyId_fkey";
ALTER TABLE "Task" DROP CONSTRAINT "Task_assignedToId_fkey";
ALTER TABLE "Task" DROP CONSTRAINT "Task_companyId_fkey";
ALTER TABLE "Task" DROP CONSTRAINT "Task_leadId_fkey";
ALTER TABLE "Activity" DROP CONSTRAINT "Activity_companyId_fkey";
ALTER TABLE "Activity" DROP CONSTRAINT "Activity_contactId_fkey";
ALTER TABLE "Activity" DROP CONSTRAINT "Activity_dealId_fkey";
ALTER TABLE "Activity" DROP CONSTRAINT "Activity_leadId_fkey";
ALTER TABLE "Note" DROP CONSTRAINT "Note_companyId_fkey";
ALTER TABLE "Note" DROP CONSTRAINT "Note_contactId_fkey";
ALTER TABLE "Note" DROP CONSTRAINT "Note_dealId_fkey";
ALTER TABLE "Note" DROP CONSTRAINT "Note_leadId_fkey";
ALTER TABLE "AuditLog" DROP CONSTRAINT "AuditLog_userId_fkey";
ALTER TABLE "RefreshToken" DROP CONSTRAINT "RefreshToken_userId_fkey";

ALTER TABLE "User"
  ALTER COLUMN "id" TYPE UUID USING "id"::uuid;

ALTER TABLE "Company"
  ALTER COLUMN "id" TYPE UUID USING "id"::uuid,
  ALTER COLUMN "ownerId" TYPE UUID USING "ownerId"::uuid;

ALTER TABLE "Contact"
  ALTER COLUMN "id" TYPE UUID USING "id"::uuid,
  ALTER COLUMN "companyId" TYPE UUID USING "companyId"::uuid;

ALTER TABLE "Lead"
  ALTER COLUMN "id" TYPE UUID USING "id"::uuid,
  ALTER COLUMN "companyId" TYPE UUID USING "companyId"::uuid,
  ALTER COLUMN "assignedToId" TYPE UUID USING "assignedToId"::uuid;

ALTER TABLE "Deal"
  ALTER COLUMN "id" TYPE UUID USING "id"::uuid,
  ALTER COLUMN "companyId" TYPE UUID USING "companyId"::uuid;

ALTER TABLE "Task"
  ALTER COLUMN "id" TYPE UUID USING "id"::uuid,
  ALTER COLUMN "companyId" TYPE UUID USING "companyId"::uuid,
  ALTER COLUMN "assignedToId" TYPE UUID USING "assignedToId"::uuid,
  ALTER COLUMN "leadId" TYPE UUID USING "leadId"::uuid;

ALTER TABLE "Activity"
  ALTER COLUMN "id" TYPE UUID USING "id"::uuid,
  ALTER COLUMN "companyId" TYPE UUID USING "companyId"::uuid,
  ALTER COLUMN "contactId" TYPE UUID USING "contactId"::uuid,
  ALTER COLUMN "dealId" TYPE UUID USING "dealId"::uuid,
  ALTER COLUMN "leadId" TYPE UUID USING "leadId"::uuid;

ALTER TABLE "Note"
  ALTER COLUMN "id" TYPE UUID USING "id"::uuid,
  ALTER COLUMN "companyId" TYPE UUID USING "companyId"::uuid,
  ALTER COLUMN "contactId" TYPE UUID USING "contactId"::uuid,
  ALTER COLUMN "dealId" TYPE UUID USING "dealId"::uuid,
  ALTER COLUMN "leadId" TYPE UUID USING "leadId"::uuid;

ALTER TABLE "Setting"
  ALTER COLUMN "id" TYPE UUID USING "id"::uuid;

ALTER TABLE "AuditLog"
  ALTER COLUMN "id" TYPE UUID USING "id"::uuid,
  ALTER COLUMN "userId" TYPE UUID USING "userId"::uuid;

ALTER TABLE "PasswordResetToken"
  ALTER COLUMN "id" TYPE UUID USING "id"::uuid;

ALTER TABLE "RefreshToken"
  ALTER COLUMN "id" TYPE UUID USING "id"::uuid,
  ALTER COLUMN "userId" TYPE UUID USING "userId"::uuid;

ALTER TABLE "Company"
  ADD CONSTRAINT "Company_ownerId_fkey"
  FOREIGN KEY ("ownerId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Contact"
  ADD CONSTRAINT "Contact_companyId_fkey"
  FOREIGN KEY ("companyId") REFERENCES "Company"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Lead"
  ADD CONSTRAINT "Lead_assignedToId_fkey"
  FOREIGN KEY ("assignedToId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Lead"
  ADD CONSTRAINT "Lead_companyId_fkey"
  FOREIGN KEY ("companyId") REFERENCES "Company"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Deal"
  ADD CONSTRAINT "Deal_companyId_fkey"
  FOREIGN KEY ("companyId") REFERENCES "Company"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Task"
  ADD CONSTRAINT "Task_assignedToId_fkey"
  FOREIGN KEY ("assignedToId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Task"
  ADD CONSTRAINT "Task_companyId_fkey"
  FOREIGN KEY ("companyId") REFERENCES "Company"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Task"
  ADD CONSTRAINT "Task_leadId_fkey"
  FOREIGN KEY ("leadId") REFERENCES "Lead"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Activity"
  ADD CONSTRAINT "Activity_companyId_fkey"
  FOREIGN KEY ("companyId") REFERENCES "Company"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Activity"
  ADD CONSTRAINT "Activity_contactId_fkey"
  FOREIGN KEY ("contactId") REFERENCES "Contact"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Activity"
  ADD CONSTRAINT "Activity_dealId_fkey"
  FOREIGN KEY ("dealId") REFERENCES "Deal"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Activity"
  ADD CONSTRAINT "Activity_leadId_fkey"
  FOREIGN KEY ("leadId") REFERENCES "Lead"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Note"
  ADD CONSTRAINT "Note_companyId_fkey"
  FOREIGN KEY ("companyId") REFERENCES "Company"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Note"
  ADD CONSTRAINT "Note_contactId_fkey"
  FOREIGN KEY ("contactId") REFERENCES "Contact"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Note"
  ADD CONSTRAINT "Note_dealId_fkey"
  FOREIGN KEY ("dealId") REFERENCES "Deal"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Note"
  ADD CONSTRAINT "Note_leadId_fkey"
  FOREIGN KEY ("leadId") REFERENCES "Lead"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AuditLog"
  ADD CONSTRAINT "AuditLog_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "RefreshToken"
  ADD CONSTRAINT "RefreshToken_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
