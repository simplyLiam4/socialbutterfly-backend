/*
  Warnings:

  - You are about to drop the `chat_rooms` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "chat_rooms" DROP CONSTRAINT "chat_rooms_eventId_fkey";

-- DropForeignKey
ALTER TABLE "messages" DROP CONSTRAINT "messages_chatRoomId_fkey";

-- DropTable
DROP TABLE "chat_rooms";

-- CreateTable
CREATE TABLE "chatrooms" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,

    CONSTRAINT "chatrooms_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "chatrooms_eventId_key" ON "chatrooms"("eventId");

-- AddForeignKey
ALTER TABLE "chatrooms" ADD CONSTRAINT "chatrooms_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_chatRoomId_fkey" FOREIGN KEY ("chatRoomId") REFERENCES "chatrooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
