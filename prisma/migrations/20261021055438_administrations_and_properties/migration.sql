-- CreateEnum
CREATE TYPE "property_type" AS ENUM ('house', 'building');

-- CreateTable
CREATE TABLE "property_administrations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "property_administrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "properties" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "property_type" "property_type" NOT NULL,
    "address_street" TEXT NOT NULL,
    "address_number" TEXT NOT NULL,
    "address_postal_code" TEXT NOT NULL,
    "address_intersection" TEXT NOT NULL,
    "administration_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "properties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "administration_assignments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "property_id" UUID NOT NULL,
    "administration_id" UUID NOT NULL,
    "started_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMPTZ,

    CONSTRAINT "administration_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "properties_administration_id_idx" ON "properties"("administration_id");

-- CreateIndex
CREATE INDEX "administration_assignments_property_id_idx" ON "administration_assignments"("property_id");

-- CreateIndex
CREATE INDEX "administration_assignments_administration_id_idx" ON "administration_assignments"("administration_id");

-- AddForeignKey
ALTER TABLE "properties" ADD CONSTRAINT "properties_administration_id_fkey" FOREIGN KEY ("administration_id") REFERENCES "property_administrations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "administration_assignments" ADD CONSTRAINT "administration_assignments_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "administration_assignments" ADD CONSTRAINT "administration_assignments_administration_id_fkey" FOREIGN KEY ("administration_id") REFERENCES "property_administrations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- At most one open (ended_at IS NULL) administration assignment per property.
-- Hand-written: Prisma can't express partial indexes in the schema.
CREATE UNIQUE INDEX "administration_assignments_one_open_per_property"
  ON "administration_assignments"("property_id")
  WHERE "ended_at" IS NULL;
