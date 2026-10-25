-- AlterTable
ALTER TABLE "contractors" ALTER COLUMN "company_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "property_managers" ALTER COLUMN "administration_id" DROP NOT NULL,
ALTER COLUMN "administration_role" DROP NOT NULL;

-- A property manager has both an administration and a role in it, or neither
-- (before creating their administration). Hand-written: Prisma can't express it.
ALTER TABLE "property_managers" ADD CONSTRAINT "property_managers_administration_and_role_together"
  CHECK (("administration_id" IS NULL) = ("administration_role" IS NULL));
