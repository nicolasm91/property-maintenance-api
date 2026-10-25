-- AlterEnum
ALTER TYPE "task_event_type" ADD VALUE 'done';

-- AlterEnum
ALTER TYPE "task_status" ADD VALUE 'done';

-- AlterTable
ALTER TABLE "properties" ADD COLUMN     "municipality_id" TEXT;

-- AlterTable
ALTER TABLE "task_events" ADD COLUMN     "rating" SMALLINT;

-- AlterTable
ALTER TABLE "tasks" ADD COLUMN     "done_at" TIMESTAMPTZ,
ADD COLUMN     "rating" SMALLINT;

-- AlterTable
ALTER TABLE "tradesmen" ADD COLUMN     "rating_average" DECIMAL(5,4),
ADD COLUMN     "rating_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "rating_sum" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "municipalities" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "search_name" TEXT NOT NULL,
    "province_id" TEXT NOT NULL,
    "province_name" TEXT NOT NULL,

    CONSTRAINT "municipalities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tradesman_municipalities" (
    "municipality_id" TEXT NOT NULL,
    "tradesman_id" UUID NOT NULL,

    CONSTRAINT "tradesman_municipalities_pkey" PRIMARY KEY ("municipality_id","tradesman_id")
);

-- CreateIndex
CREATE INDEX "municipalities_province_id_idx" ON "municipalities"("province_id");

-- CreateIndex
CREATE INDEX "tradesman_municipalities_tradesman_id_idx" ON "tradesman_municipalities"("tradesman_id");

-- CreateIndex
CREATE INDEX "properties_municipality_id_idx" ON "properties"("municipality_id");

-- AddForeignKey
ALTER TABLE "properties" ADD CONSTRAINT "properties_municipality_id_fkey" FOREIGN KEY ("municipality_id") REFERENCES "municipalities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tradesman_municipalities" ADD CONSTRAINT "tradesman_municipalities_municipality_id_fkey" FOREIGN KEY ("municipality_id") REFERENCES "municipalities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tradesman_municipalities" ADD CONSTRAINT "tradesman_municipalities_tradesman_id_fkey" FOREIGN KEY ("tradesman_id") REFERENCES "tradesmen"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Ratings are 1 to 5 stars. Hand-written: Prisma can't express check constraints.
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_rating_range" CHECK ("rating" BETWEEN 1 AND 5);
ALTER TABLE "task_events" ADD CONSTRAINT "task_events_rating_range" CHECK ("rating" BETWEEN 1 AND 5);
