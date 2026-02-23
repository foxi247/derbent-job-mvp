-- Add new enum values and types
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'ADMIN';

CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE');
CREATE TYPE "TopUpStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED');
CREATE TYPE "TariffKind" AS ENUM ('BASIC', 'PREMIUM', 'GOLD');
CREATE TYPE "ListingTariffStatus" AS ENUM ('ACTIVE', 'EXPIRED');

-- User balance/admin moderation fields
ALTER TABLE "User"
ADD COLUMN "balanceRub" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "isBanned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "bannedAt" TIMESTAMP(3);

CREATE INDEX "User_isBanned_idx" ON "User"("isBanned");

-- Profile расширение анкеты
ALTER TABLE "Profile"
ADD COLUMN "gender" "Gender",
ADD COLUMN "age" INTEGER,
ADD COLUMN "workCategory" TEXT,
ADD COLUMN "previousWork" TEXT;

CREATE INDEX "Profile_workCategory_idx" ON "Profile"("workCategory");
CREATE INDEX "Profile_experienceYears_idx" ON "Profile"("experienceYears");

-- Tariff plans from admin
CREATE TABLE "TariffPlan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "priceRub" INTEGER NOT NULL,
    "durationDays" INTEGER NOT NULL,
    "kind" "TariffKind" NOT NULL,
    "discountPercent" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TariffPlan_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TariffPlan_kind_sortOrder_idx" ON "TariffPlan"("kind", "sortOrder");

-- Publication + tariff relation
CREATE TABLE "ListingTariff" (
    "id" TEXT NOT NULL,
    "listingId" TEXT,
    "jobPostId" TEXT,
    "tariffPlanId" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "status" "ListingTariffStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ListingTariff_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ListingTariff_listingId_idx" ON "ListingTariff"("listingId");
CREATE INDEX "ListingTariff_jobPostId_idx" ON "ListingTariff"("jobPostId");
CREATE INDEX "ListingTariff_status_endsAt_idx" ON "ListingTariff"("status", "endsAt");

ALTER TABLE "ListingTariff" ADD CONSTRAINT "ListingTariff_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ListingTariff" ADD CONSTRAINT "ListingTariff_jobPostId_fkey" FOREIGN KEY ("jobPostId") REFERENCES "JobPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ListingTariff" ADD CONSTRAINT "ListingTariff_tariffPlanId_fkey" FOREIGN KEY ("tariffPlanId") REFERENCES "TariffPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Manual top-up requests
CREATE TABLE "TopUpRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "approverUserId" TEXT,
    "amountRub" INTEGER NOT NULL,
    "status" "TopUpStatus" NOT NULL DEFAULT 'PENDING',
    "proofText" TEXT,
    "adminNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TopUpRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TopUpRequest_userId_createdAt_idx" ON "TopUpRequest"("userId", "createdAt");
CREATE INDEX "TopUpRequest_status_expiresAt_idx" ON "TopUpRequest"("status", "expiresAt");

ALTER TABLE "TopUpRequest" ADD CONSTRAINT "TopUpRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TopUpRequest" ADD CONSTRAINT "TopUpRequest_approverUserId_fkey" FOREIGN KEY ("approverUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Payment requisites managed by admin
CREATE TABLE "AdminSettings" (
    "id" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "cardNumber" TEXT,
    "phoneNumber" TEXT,
    "recipientName" TEXT NOT NULL,
    "instructions" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminSettings_pkey" PRIMARY KEY ("id")
);
