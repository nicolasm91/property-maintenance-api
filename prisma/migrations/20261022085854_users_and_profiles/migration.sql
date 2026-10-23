-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('propertyManager', 'directClient', 'contractor', 'tradesman');

-- CreateEnum
CREATE TYPE "administration_role" AS ENUM ('admin', 'member');

-- CreateEnum
CREATE TYPE "trade" AS ENUM ('electrician', 'handyman', 'plumber', 'mason');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "auth0_sub" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "middle_name" TEXT,
    "last_name" TEXT NOT NULL,
    "role" "user_role" NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_managers" (
    "user_id" UUID NOT NULL,
    "administration_id" UUID NOT NULL,
    "administration_role" "administration_role" NOT NULL,

    CONSTRAINT "property_managers_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "companies" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contractors" (
    "user_id" UUID NOT NULL,
    "company_id" UUID NOT NULL,

    CONSTRAINT "contractors_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "tradesmen" (
    "user_id" UUID NOT NULL,
    "trades" "trade"[],
    "contractor_id" UUID,

    CONSTRAINT "tradesmen_pkey" PRIMARY KEY ("user_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_auth0_sub_key" ON "users"("auth0_sub");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "property_managers_administration_id_idx" ON "property_managers"("administration_id");

-- CreateIndex
CREATE INDEX "contractors_company_id_idx" ON "contractors"("company_id");

-- CreateIndex
CREATE INDEX "tradesmen_contractor_id_idx" ON "tradesmen"("contractor_id");

-- AddForeignKey
ALTER TABLE "property_managers" ADD CONSTRAINT "property_managers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_managers" ADD CONSTRAINT "property_managers_administration_id_fkey" FOREIGN KEY ("administration_id") REFERENCES "property_administrations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contractors" ADD CONSTRAINT "contractors_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contractors" ADD CONSTRAINT "contractors_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tradesmen" ADD CONSTRAINT "tradesmen_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tradesmen" ADD CONSTRAINT "tradesmen_contractor_id_fkey" FOREIGN KEY ("contractor_id") REFERENCES "contractors"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;
