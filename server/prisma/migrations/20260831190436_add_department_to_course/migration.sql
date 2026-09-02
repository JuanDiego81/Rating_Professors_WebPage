/*
  Warnings:

  - Added the required column `departmentId` to the `Course` table without a default value. This is not possible if the table is not empty.

  This dev database is reseeded from scratch by prisma/test_data.ts, so we clear
  out course-dependent rows here rather than backfilling a real departmentId.
*/
-- Clear rows that depend on Course (FK-safe order), then Course itself
TRUNCATE TABLE "Vote", "Review", "Course" CASCADE;

-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "departmentId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
