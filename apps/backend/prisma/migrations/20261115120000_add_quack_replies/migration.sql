-- Replies and tombstones. Both columns are nullable without a default, so the
-- migration runs on a table that already has data without rewriting a row.

-- AlterTable
ALTER TABLE "quack" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "parentId" TEXT;

-- CreateIndex
CREATE INDEX "quack_parentId_createdAt_idx" ON "quack"("parentId", "createdAt");

-- AddForeignKey
-- RESTRICT: a quack with replies is never removed for real (docs/adr/0001).
ALTER TABLE "quack" ADD CONSTRAINT "quack_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "quack"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- A deleted quack keeps no text (docs/adr/0001). Every existing row has
-- "deletedAt" NULL, so they all pass. Prisma doesn't model CHECK constraints;
-- it lives only here.
ALTER TABLE "quack" ADD CONSTRAINT "quack_deleted_has_no_text" CHECK ("deletedAt" IS NULL OR "text" = '');
