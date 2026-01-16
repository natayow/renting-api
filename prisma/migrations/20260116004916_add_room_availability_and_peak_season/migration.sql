-- CreateTable
CREATE TABLE "RoomAvailability" (
    "id" UUID NOT NULL,
    "roomId" UUID NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "RoomAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoomPeakSeasonRate" (
    "id" UUID NOT NULL,
    "roomId" UUID NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "adjustmentType" VARCHAR(20) NOT NULL,
    "adjustmentValue" INTEGER NOT NULL,
    "note" VARCHAR(200),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "RoomPeakSeasonRate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RoomAvailability_roomId_idx" ON "RoomAvailability"("roomId");

-- CreateIndex
CREATE INDEX "RoomAvailability_date_idx" ON "RoomAvailability"("date");

-- CreateIndex
CREATE INDEX "RoomAvailability_isAvailable_idx" ON "RoomAvailability"("isAvailable");

-- CreateIndex
CREATE UNIQUE INDEX "RoomAvailability_roomId_date_key" ON "RoomAvailability"("roomId", "date");

-- CreateIndex
CREATE INDEX "RoomPeakSeasonRate_roomId_idx" ON "RoomPeakSeasonRate"("roomId");

-- CreateIndex
CREATE INDEX "RoomPeakSeasonRate_startDate_endDate_idx" ON "RoomPeakSeasonRate"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "RoomPeakSeasonRate_isActive_idx" ON "RoomPeakSeasonRate"("isActive");

-- AddForeignKey
ALTER TABLE "RoomAvailability" ADD CONSTRAINT "RoomAvailability_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomPeakSeasonRate" ADD CONSTRAINT "RoomPeakSeasonRate_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;
