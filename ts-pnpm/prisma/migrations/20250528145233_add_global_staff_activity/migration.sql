-- CreateTable
CREATE TABLE "GlobalStaffActivity" (
    "id" TEXT NOT NULL DEFAULT 'singleton_staff_activity',
    "lastActivePing" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GlobalStaffActivity_pkey" PRIMARY KEY ("id")
);
