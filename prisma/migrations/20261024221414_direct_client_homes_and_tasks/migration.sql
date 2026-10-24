-- CreateEnum
CREATE TYPE "task_status" AS ENUM ('unassigned', 'assigned', 'completed', 'cancelled', 'rejected');

-- CreateEnum
CREATE TYPE "task_event_type" AS ENUM ('created', 'assigned', 'reassigned', 'rejected', 'rescheduled', 'completed', 'cancelled');

-- AlterTable
ALTER TABLE "properties" ADD COLUMN     "direct_client_id" UUID;

-- CreateTable
CREATE TABLE "tasks" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "trade" "trade" NOT NULL,
    "status" "task_status" NOT NULL,
    "scheduled_at" TIMESTAMPTZ NOT NULL,
    "completed_at" TIMESTAMPTZ,
    "cancelled_at" TIMESTAMPTZ,
    "created_by_id" UUID NOT NULL,
    "tradesman_id" UUID,
    "property_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "task_id" UUID NOT NULL,
    "type" "task_event_type" NOT NULL,
    "actor_id" UUID NOT NULL,
    "tradesman_id" UUID,
    "reason" TEXT,
    "occurred_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tasks_created_by_id_scheduled_at_idx" ON "tasks"("created_by_id", "scheduled_at");

-- CreateIndex
CREATE INDEX "tasks_tradesman_id_scheduled_at_idx" ON "tasks"("tradesman_id", "scheduled_at");

-- CreateIndex
CREATE INDEX "tasks_property_id_idx" ON "tasks"("property_id");

-- CreateIndex
CREATE INDEX "task_events_task_id_occurred_at_idx" ON "task_events"("task_id", "occurred_at");

-- CreateIndex
CREATE INDEX "properties_direct_client_id_idx" ON "properties"("direct_client_id");

-- AddForeignKey
ALTER TABLE "properties" ADD CONSTRAINT "properties_direct_client_id_fkey" FOREIGN KEY ("direct_client_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_tradesman_id_fkey" FOREIGN KEY ("tradesman_id") REFERENCES "tradesmen"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_events" ADD CONSTRAINT "task_events_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_events" ADD CONSTRAINT "task_events_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_events" ADD CONSTRAINT "task_events_tradesman_id_fkey" FOREIGN KEY ("tradesman_id") REFERENCES "tradesmen"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- A tradesman can't have two active (not cancelled or rejected) tasks in the
-- same slot. Hand-written: Prisma can't express partial indexes in the schema.
CREATE UNIQUE INDEX "tasks_one_active_per_tradesman_slot"
  ON "tasks"("tradesman_id", "scheduled_at")
  WHERE "status" NOT IN ('cancelled', 'rejected');
