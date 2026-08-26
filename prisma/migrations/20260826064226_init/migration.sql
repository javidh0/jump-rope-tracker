-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dateTime" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" TEXT NOT NULL,
    "durationSec" INTEGER NOT NULL,
    "skipCount" INTEGER,
    "skipCountEstimated" BOOLEAN NOT NULL DEFAULT false,
    "misses" INTEGER,
    "longestUnbrokenStreak" INTEGER,
    "skillAttempted" TEXT,
    "rpe" INTEGER,
    "soreness" INTEGER,
    "notes" TEXT,
    "source" TEXT NOT NULL DEFAULT 'MANUAL',
    "workoutId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Session_workoutId_fkey" FOREIGN KEY ("workoutId") REFERENCES "Workout" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Workout" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "isPreset" BOOLEAN NOT NULL DEFAULT false,
    "workSec" INTEGER NOT NULL,
    "restSec" INTEGER NOT NULL,
    "rounds" INTEGER NOT NULL,
    "warmupSec" INTEGER NOT NULL DEFAULT 0,
    "cooldownSec" INTEGER NOT NULL DEFAULT 0,
    "type" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "CalibrationTest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "testType" TEXT NOT NULL,
    "resultValue" REAL NOT NULL,
    "resultUnit" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CalibrationTest_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Goal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "targetValue" REAL NOT NULL,
    "targetUnit" TEXT NOT NULL,
    "targetDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SkillLadderEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tier" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "unlockCriteria" TEXT NOT NULL,
    "achieved" BOOLEAN NOT NULL DEFAULT false,
    "achievedAt" DATETIME
);

-- CreateTable
CREATE TABLE "UserSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "weeklySessionTarget" INTEGER NOT NULL DEFAULT 3,
    "preferredUnits" TEXT NOT NULL DEFAULT 'metric',
    "reminderEnabled" BOOLEAN NOT NULL DEFAULT false,
    "reminderTime" TEXT,
    "wearableConnected" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Workout_name_key" ON "Workout"("name");

-- CreateIndex
CREATE UNIQUE INDEX "CalibrationTest_sessionId_key" ON "CalibrationTest"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "SkillLadderEntry_tier_key" ON "SkillLadderEntry"("tier");
