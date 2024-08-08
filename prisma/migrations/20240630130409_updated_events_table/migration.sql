/*
  Warnings:

  - You are about to drop the column `listingCreatedById` on the `events` table. All the data in the column will be lost.
  - Added the required column `eventCreatedById` to the `events` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "events" DROP CONSTRAINT "events_listingCreatedById_fkey";

-- AlterTable
ALTER TABLE "events" DROP COLUMN "listingCreatedById",
ADD COLUMN     "eventCreatedById" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_eventCreatedById_fkey" FOREIGN KEY ("eventCreatedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
