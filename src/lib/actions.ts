"use server";

import { prisma } from "@/lib/prisma";
import {
  CalibrationTestType,
  GoalStatus,
  GoalType,
  SessionSource,
  SessionType,
  SkillTier,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const CALIBRATION_UNITS: Record<CalibrationTestType, string> = {
  MAX_SKIPS_30S: "skips",
  MAX_SKIPS_60S: "skips",
  TIME_FOR_500: "sec",
  MAX_DOUBLE_UNDERS_60S: "reps",
};

const SKILL_UNLOCK_THRESHOLD: Partial<Record<SkillTier, number>> = {
  DOUBLES: 10,
  CROSSOVERS: 10,
  TRIPLES: 3,
};

async function syncSkillLadder(
  skillAttempted: SkillTier | undefined,
  longestUnbrokenStreak: number | undefined
) {
  if (!skillAttempted || longestUnbrokenStreak == null) return;
  const threshold = SKILL_UNLOCK_THRESHOLD[skillAttempted];
  if (threshold == null || longestUnbrokenStreak < threshold) return;

  const entry = await prisma.skillLadderEntry.findUnique({
    where: { tier: skillAttempted },
  });
  if (entry && !entry.achieved) {
    await prisma.skillLadderEntry.update({
      where: { tier: skillAttempted },
      data: { achieved: true, achievedAt: new Date() },
    });
  }
}

async function upsertCalibrationTest(
  sessionId: string,
  formData: FormData
) {
  const testType = parseOptionalEnum(
    formData.get("calibrationTestType"),
    Object.values(CalibrationTestType)
  );
  const resultValueRaw = formData.get("calibrationResultValue");
  const resultValue =
    resultValueRaw && resultValueRaw !== "" ? Number(resultValueRaw) : undefined;

  if (!testType || resultValue == null || !Number.isFinite(resultValue)) {
    await prisma.calibrationTest.deleteMany({ where: { sessionId } });
    return;
  }

  await prisma.calibrationTest.upsert({
    where: { sessionId },
    update: { testType, resultValue, resultUnit: CALIBRATION_UNITS[testType] },
    create: {
      sessionId,
      testType,
      resultValue,
      resultUnit: CALIBRATION_UNITS[testType],
    },
  });
}

function parseOptionalInt(value: FormDataEntryValue | null): number | undefined {
  if (!value || value === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? Math.round(n) : undefined;
}

function parseOptionalEnum<T extends string>(
  value: FormDataEntryValue | null,
  allowed: readonly T[]
): T | undefined {
  if (!value || value === "") return undefined;
  return allowed.includes(value as T) ? (value as T) : undefined;
}

export async function createSession(formData: FormData) {
  const type = formData.get("type") as SessionType;
  const durationMin = Number(formData.get("durationMin"));
  const durationSecPart = Number(formData.get("durationSec") ?? 0);
  const durationSec = Math.round(durationMin * 60 + durationSecPart);

  const skipCount = parseOptionalInt(formData.get("skipCount"));
  const skipCountEstimated = formData.get("skipCountEstimated") === "on";
  const misses = parseOptionalInt(formData.get("misses"));
  const longestUnbrokenStreak = parseOptionalInt(
    formData.get("longestUnbrokenStreak")
  );
  const skillAttempted = parseOptionalEnum(
    formData.get("skillAttempted"),
    Object.values(SkillTier)
  );
  const rpe = parseOptionalInt(formData.get("rpe"));
  const soreness = parseOptionalInt(formData.get("soreness"));
  const notes = (formData.get("notes") as string) || undefined;
  const dateTimeRaw = formData.get("dateTime") as string;
  const source =
    parseOptionalEnum(formData.get("source"), Object.values(SessionSource)) ??
    SessionSource.MANUAL;
  const workoutId = (formData.get("workoutId") as string) || undefined;

  if (!type || !durationSec || durationSec <= 0) {
    throw new Error("Session type and a positive duration are required.");
  }

  const created = await prisma.session.create({
    data: {
      type,
      durationSec,
      skipCount,
      skipCountEstimated,
      misses,
      longestUnbrokenStreak,
      skillAttempted,
      rpe,
      soreness,
      notes,
      source,
      workoutId,
      dateTime: dateTimeRaw ? new Date(dateTimeRaw) : undefined,
    },
  });

  if (type === SessionType.CALIBRATION_TEST) {
    await upsertCalibrationTest(created.id, formData);
  }
  await syncSkillLadder(skillAttempted, longestUnbrokenStreak);

  revalidatePath("/");
  revalidatePath("/sessions");
  revalidatePath("/progress");
  redirect("/sessions");
}

export async function updateSession(id: string, formData: FormData) {
  const type = formData.get("type") as SessionType;
  const durationMin = Number(formData.get("durationMin"));
  const durationSecPart = Number(formData.get("durationSec") ?? 0);
  const durationSec = Math.round(durationMin * 60 + durationSecPart);

  const skipCount = parseOptionalInt(formData.get("skipCount"));
  const skipCountEstimated = formData.get("skipCountEstimated") === "on";
  const misses = parseOptionalInt(formData.get("misses"));
  const longestUnbrokenStreak = parseOptionalInt(
    formData.get("longestUnbrokenStreak")
  );
  const skillAttempted = parseOptionalEnum(
    formData.get("skillAttempted"),
    Object.values(SkillTier)
  );
  const rpe = parseOptionalInt(formData.get("rpe"));
  const soreness = parseOptionalInt(formData.get("soreness"));
  const notes = (formData.get("notes") as string) || null;
  const dateTimeRaw = formData.get("dateTime") as string;

  if (!type || !durationSec || durationSec <= 0) {
    throw new Error("Session type and a positive duration are required.");
  }

  await prisma.session.update({
    where: { id },
    data: {
      type,
      durationSec,
      skipCount: skipCount ?? null,
      skipCountEstimated,
      misses: misses ?? null,
      longestUnbrokenStreak: longestUnbrokenStreak ?? null,
      skillAttempted: skillAttempted ?? null,
      rpe: rpe ?? null,
      soreness: soreness ?? null,
      notes,
      dateTime: dateTimeRaw ? new Date(dateTimeRaw) : undefined,
    },
  });

  if (type === SessionType.CALIBRATION_TEST) {
    await upsertCalibrationTest(id, formData);
  } else {
    await prisma.calibrationTest.deleteMany({ where: { sessionId: id } });
  }
  await syncSkillLadder(skillAttempted, longestUnbrokenStreak);

  revalidatePath("/");
  revalidatePath("/sessions");
  revalidatePath(`/sessions/${id}`);
  revalidatePath("/progress");
  redirect(`/sessions/${id}`);
}

export async function deleteSession(id: string) {
  await prisma.session.delete({ where: { id } });
  revalidatePath("/");
  revalidatePath("/sessions");
  redirect("/sessions");
}

export async function listSessions() {
  return prisma.session.findMany({
    orderBy: { dateTime: "desc" },
    include: { workout: true },
  });
}

export async function getSession(id: string) {
  return prisma.session.findUnique({
    where: { id },
    include: { workout: true, calibrationTest: true },
  });
}

export async function listWorkouts() {
  return prisma.workout.findMany({
    orderBy: [{ isPreset: "desc" }, { createdAt: "desc" }],
  });
}

export async function getWorkout(id: string) {
  return prisma.workout.findUnique({ where: { id } });
}

export async function createCustomWorkout(formData: FormData) {
  const name = ((formData.get("name") as string) || "Custom workout").trim();
  const type = formData.get("type") as SessionType;
  const workSec = Number(formData.get("workSec"));
  const restSec = Number(formData.get("restSec") ?? 0);
  const rounds = Number(formData.get("rounds"));
  const warmupSec = Number(formData.get("warmupSec") ?? 0);
  const cooldownSec = Number(formData.get("cooldownSec") ?? 0);

  if (!type || !workSec || workSec <= 0 || !rounds || rounds <= 0) {
    throw new Error("Work duration, rounds, and type are required.");
  }

  const workout = await prisma.workout.create({
    data: {
      name,
      isPreset: false,
      type,
      workSec,
      restSec: Number.isFinite(restSec) ? restSec : 0,
      rounds,
      warmupSec: Number.isFinite(warmupSec) ? warmupSec : 0,
      cooldownSec: Number.isFinite(cooldownSec) ? cooldownSec : 0,
    },
  });

  redirect(`/workouts/${workout.id}/run`);
}

export async function getDashboardStats() {
  const settings = await prisma.userSettings.findFirst();
  const weeklyTarget = settings?.weeklySessionTarget ?? 3;

  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const [sessionsThisWeek, recentSessions] = await Promise.all([
    prisma.session.count({ where: { dateTime: { gte: startOfWeek } } }),
    prisma.session.findMany({
      orderBy: { dateTime: "desc" },
      take: 30,
    }),
  ]);

  const localDateKey = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")}`;

  let streak = 0;
  const daySet = new Set(recentSessions.map((s) => localDateKey(s.dateTime)));
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  while (daySet.has(localDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return {
    weeklyTarget,
    sessionsThisWeek,
    streak,
    totalSessions: await prisma.session.count(),
  };
}

// ---- Settings ----

export async function getUserSettings() {
  const settings = await prisma.userSettings.findFirst();
  if (settings) return settings;
  return prisma.userSettings.create({ data: { id: "default" } });
}

export async function updateUserSettings(formData: FormData) {
  const settings = await getUserSettings();
  const weeklySessionTarget = Number(formData.get("weeklySessionTarget"));
  const preferredUnits = (formData.get("preferredUnits") as string) || "metric";
  const reminderEnabled = formData.get("reminderEnabled") === "on";
  const reminderTime = (formData.get("reminderTime") as string) || null;

  await prisma.userSettings.update({
    where: { id: settings.id },
    data: {
      weeklySessionTarget:
        Number.isFinite(weeklySessionTarget) && weeklySessionTarget > 0
          ? weeklySessionTarget
          : settings.weeklySessionTarget,
      preferredUnits,
      reminderEnabled,
      reminderTime,
    },
  });

  revalidatePath("/settings");
  revalidatePath("/");
  redirect("/settings");
}

// ---- Dashboard suggestion ----

export async function getSuggestedWorkout() {
  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const [weekSessions, recentSessions, presets] = await Promise.all([
    prisma.session.findMany({ where: { dateTime: { gte: startOfWeek } } }),
    prisma.session.findMany({
      orderBy: { dateTime: "desc" },
      take: 3,
    }),
    prisma.workout.findMany({ where: { isPreset: true } }),
  ]);

  const findPreset = (name: string) => presets.find((p) => p.name === name);

  const recentSorenessValues = recentSessions
    .map((s) => s.soreness)
    .filter((s): s is number => s != null);
  const avgRecentSoreness =
    recentSorenessValues.length > 0
      ? recentSorenessValues.reduce((a, b) => a + b, 0) /
        recentSorenessValues.length
      : 0;

  if (avgRecentSoreness >= 4) {
    return {
      message:
        "Soreness has been high the last few sessions — consider a rest day or light skill practice instead of intensity.",
      workout: findPreset("Double-Under Skill Ladder"),
    };
  }

  const hasHiit = weekSessions.some((s) => s.type === "HIIT");
  const hasSteadyState = weekSessions.some((s) => s.type === "STEADY_STATE");
  const hasSkill = weekSessions.some((s) => s.type === "SKILL_PRACTICE");

  if (weekSessions.length === 0) {
    return {
      message: "No sessions yet this week — a beginner HIIT session is a good way to start.",
      workout: findPreset("Beginner HIIT"),
    };
  }

  if (!hasSteadyState) {
    return {
      message: "You haven't done a steady-state session this week — good for building aerobic base.",
      workout: findPreset("Endurance Steady-State"),
    };
  }

  if (!hasHiit) {
    return {
      message: "No HIIT yet this week — a good day to push anaerobic capacity.",
      workout: findPreset("Anaerobic Capacity Builder"),
    };
  }

  if (!hasSkill) {
    return {
      message: "You've covered cardio and intensity this week — work on double-under skill progression today.",
      workout: findPreset("Double-Under Skill Ladder"),
    };
  }

  return {
    message: "Solid week already — pick whichever session type you're most motivated for today.",
    workout: undefined,
  };
}

// ---- Skill ladder ----

export async function getSkillLadder() {
  return prisma.skillLadderEntry.findMany({ orderBy: { order: "asc" } });
}

// ---- Metrics / progress ----

export async function getMetricsData() {
  const sessions = await prisma.session.findMany({
    orderBy: { dateTime: "asc" },
    include: { calibrationTest: true },
  });

  const point = (s: (typeof sessions)[number], value: number | null) => ({
    date: s.dateTime.toISOString().slice(0, 10),
    value,
  });

  const cardioEndurance = sessions
    .filter((s) => s.calibrationTest?.testType === "TIME_FOR_500")
    .map((s) => point(s, s.calibrationTest!.resultValue));

  const anaerobicCapacity = sessions
    .filter(
      (s) =>
        s.calibrationTest?.testType === "MAX_SKIPS_30S" ||
        s.calibrationTest?.testType === "MAX_SKIPS_60S" ||
        s.calibrationTest?.testType === "MAX_DOUBLE_UNDERS_60S"
    )
    .map((s) => point(s, s.calibrationTest!.resultValue));

  const coordination = sessions
    .filter((s) => s.misses != null && s.skipCount != null && s.skipCount > 0)
    .map((s) => point(s, (s.misses! / s.skipCount!) * 100));

  const legEndurance = sessions
    .filter((s) => s.longestUnbrokenStreak != null)
    .map((s) => point(s, s.longestUnbrokenStreak));

  const recovery = sessions
    .filter((s) => s.soreness != null)
    .map((s) => point(s, s.soreness));

  return {
    cardioEndurance,
    anaerobicCapacity,
    coordination,
    legEndurance,
    recovery,
  };
}

// ---- Goals ----

export async function listGoals() {
  return prisma.goal.findMany({ orderBy: { createdAt: "desc" } });
}

export async function createGoal(formData: FormData) {
  const type = formData.get("type") as GoalType;
  const targetValue = Number(formData.get("targetValue"));
  const targetUnit = (formData.get("targetUnit") as string) || "";
  const targetDateRaw = formData.get("targetDate") as string;

  if (!type || !Number.isFinite(targetValue)) {
    throw new Error("Goal type and a numeric target are required.");
  }

  await prisma.goal.create({
    data: {
      type,
      targetValue,
      targetUnit,
      targetDate: targetDateRaw ? new Date(targetDateRaw) : undefined,
    },
  });

  revalidatePath("/goals");
  redirect("/goals");
}

export async function updateGoalStatus(id: string, status: GoalStatus) {
  await prisma.goal.update({ where: { id }, data: { status } });
  revalidatePath("/goals");
}

export async function deleteGoal(id: string) {
  await prisma.goal.delete({ where: { id } });
  revalidatePath("/goals");
}

export async function getGoalsWithProgress() {
  const [goals, stats, ladder, sessions] = await Promise.all([
    listGoals(),
    getDashboardStats(),
    getSkillLadder(),
    prisma.session.findMany({
      orderBy: { dateTime: "desc" },
      include: { calibrationTest: true },
      take: 200,
    }),
  ]);

  const latestProxyTime = sessions.find(
    (s) => s.calibrationTest?.testType === "TIME_FOR_500"
  )?.calibrationTest?.resultValue;

  const maxUnbrokenStreak = sessions.reduce(
    (max, s) =>
      s.longestUnbrokenStreak != null && s.longestUnbrokenStreak > max
        ? s.longestUnbrokenStreak
        : max,
    0
  );

  return goals.map((goal) => {
    let current = 0;
    const target = goal.targetValue;
    let progressPct = 0;
    let detail = "";

    switch (goal.type) {
      case "FREQUENCY": {
        current = stats.sessionsThisWeek;
        progressPct = Math.min(100, (current / target) * 100);
        detail = `${current} / ${target} sessions this week`;
        break;
      }
      case "STREAK": {
        current = stats.streak;
        progressPct = Math.min(100, (current / target) * 100);
        detail = `${current} / ${target} day streak`;
        break;
      }
      case "PROXY_TEST_TIME": {
        // lower is better — progress grows as latest time approaches/beats target
        if (latestProxyTime == null) {
          detail = "No 500-skip calibration test logged yet";
        } else {
          current = latestProxyTime;
          const startEstimate = Math.max(target * 1.5, target + 30);
          progressPct = Math.min(
            100,
            Math.max(
              0,
              ((startEstimate - current) / (startEstimate - target)) * 100
            )
          );
          detail = `Latest: ${current}s / target ${target}s`;
        }
        break;
      }
      case "SKILL_MILESTONE": {
        const tier = ladder.find((l) => l.tier === goal.targetUnit);
        current = tier?.achieved ? 1 : 0;
        progressPct = current ? 100 : 0;
        detail = tier
          ? `${tier.tier}: ${tier.achieved ? "achieved" : "not yet"}`
          : "Unknown skill tier";
        break;
      }
      case "UNBROKEN_STREAK": {
        current = maxUnbrokenStreak;
        progressPct = Math.min(100, (current / target) * 100);
        detail = `Best: ${current} / target ${target}`;
        break;
      }
    }

    return { ...goal, current, progressPct: Math.round(progressPct), detail };
  });
}
