-- CreateTable
CREATE TABLE "ChatParticipantInfo" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "lastAccessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatParticipantInfo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ChatParticipantInfo_userId_idx" ON "ChatParticipantInfo"("userId");

-- CreateIndex
CREATE INDEX "ChatParticipantInfo_conversationId_idx" ON "ChatParticipantInfo"("conversationId");

-- CreateIndex
CREATE UNIQUE INDEX "ChatParticipantInfo_userId_conversationId_key" ON "ChatParticipantInfo"("userId", "conversationId");

-- AddForeignKey
ALTER TABLE "ChatParticipantInfo" ADD CONSTRAINT "ChatParticipantInfo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatParticipantInfo" ADD CONSTRAINT "ChatParticipantInfo_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "ChatConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
