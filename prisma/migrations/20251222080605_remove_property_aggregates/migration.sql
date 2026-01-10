/*
  Warnings:

  - You are about to drop the column `basePricePerNightIdr` on the `Property` table. All the data in the column will be lost.
  - You are about to drop the column `bathrooms` on the `Property` table. All the data in the column will be lost.
  - You are about to drop the column `bedrooms` on the `Property` table. All the data in the column will be lost.
  - You are about to drop the column `beds` on the `Property` table. All the data in the column will be lost.
  - You are about to drop the column `maxGuests` on the `Property` table. All the data in the column will be lost.
  - You are about to drop the column `maxNights` on the `Property` table. All the data in the column will be lost.
  - You are about to drop the column `minNights` on the `Property` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Property_basePricePerNightIdr_idx";

-- AlterTable
ALTER TABLE "Property" DROP COLUMN "basePricePerNightIdr",
DROP COLUMN "bathrooms",
DROP COLUMN "bedrooms",
DROP COLUMN "beds",
DROP COLUMN "maxGuests",
DROP COLUMN "maxNights",
DROP COLUMN "minNights";
